import * as gulp from 'gulp';
import * as path from 'path';
import * as del from 'del';
import BS from 'browser-sync';
import scss from 'gulp-sass';

import {Config} from "./src/core/model";
import FilesSource from "./src/core/FilesSource";
import TemplateCompiler from "./src/core/TemplateCompiler";
const browserSync = BS.create();

import configJson from './config.json';
import SampleGenerator from './src/core/SampleGenerator';

const config = Object.assign(configJson, {devMode: true}) as Config;

const argv = require('minimist')(process.argv.slice(2));

class SiteGenerator {
    get outputDirectory() {
        return config.devMode ? './dev' : './docs';
    }

    get postsDirPath() {
        return path.join(__dirname, config.devMode ? 'posts-dev' : 'posts');
    }

    clean(done) {
        del.sync([this.outputDirectory])
        done();
    }

    cleanPosts(done) {
        del.sync(`${this.postsDirPath}/*`);
        done();
    }

    generatePages() {
        const dataSource = new FilesSource(config, this.postsDirPath);
        dataSource.loadData();

        const compiler = new TemplateCompiler(dataSource)
        return gulp.src('./src/templates/pages/**/*.pug')
            .pipe(compiler.pug())
            .pipe(gulp.dest(this.outputDirectory))
            .pipe(browserSync.stream());
    }

    generateCss() {
        return gulp.src('./src/scss/main.scss')
            .pipe(scss())
            .pipe(gulp.dest(this.outputDirectory))
            .pipe(browserSync.stream());
    }

    generateJs() {
        return gulp.src('./src/js/*.js')
            .pipe(gulp.dest(this.outputDirectory))
            .pipe(browserSync.stream());
    }

    dev(done) {
        browserSync.init({
            server: {
                baseDir: this.outputDirectory
            }
        });

        gulp.watch('./src/scss/**/*.scss', gulp.series('generateCss'));
        gulp.watch('./src/js/**/*.js', gulp.series('generateJs'));
        gulp.watch('./src/templates/**/*.pug', gulp.series('generatePages'));
        done();
    }

    generateSamplePosts(done) {
        const numberOfPosts = Number(argv['numberOfPosts']) || 10;

        let outDirPath = this.postsDirPath;
        const outDir = argv['outDir'];
        if (outDir) {
            outDirPath = path.resolve(__dirname, outDir);
        }

        const generator = new SampleGenerator();
        generator.generateMarkdownPostsAndSave(numberOfPosts, outDirPath);

        done();
    }

    onProd(done) {
        config.devMode = false;

        done();
    }

    onDev(done) {
        config.devMode = true;
        config.baseUrl = '';

        done();
    }

    initTasks() {
        gulp.task('prod', this.onProd.bind(this));
        gulp.task('dev', this.onDev.bind(this));
        gulp.task('clean', this.clean.bind(this));
        gulp.task('cleanPosts', this.cleanPosts.bind(this));
        gulp.task('generatePages', this.generatePages.bind(this));
        gulp.task('generateCss', this.generateCss.bind(this));
        gulp.task('generateJs', this.generateJs.bind(this));
        gulp.task('generateSamplePosts', this.generateSamplePosts.bind(this));
        gulp.task('build', gulp.series('clean', 'generatePages', 'generateCss', 'generateJs'));
        gulp.task('serve', gulp.series('build', this.dev.bind(this)));
    }
}

new SiteGenerator().initTasks();
