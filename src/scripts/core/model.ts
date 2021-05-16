export type Tag = string;

export interface Post {
    title: string,
    slug: string,
    publishedAt: Date | string,
    tags: Tag[] | string,
    excerpt: string,
    body: string
}

export interface Config {
    baseUrl: string,
    siteName: string,
    devMode: boolean,
    dateTimeFormat: string,
}