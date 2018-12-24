// Type definitions for aws-lambda-router
// Project: github.com/spring-media/aws-lambda-router

export function handler(routeConfig: RouteConfig): any;

export interface ProxyIntegrationRoute {
    path: string;
    method: string;
    action: (request: any, context: any) => any;
}

export interface ProxyIntegrationConfig {
    cors: boolean;
    routes: ProxyIntegrationRoute[];
    debug?: boolean;
    errorMapping?: any;
    defaultHeaders?: string;
}

export interface SnsRoute {
    subject: RegExp;
    action: (sns: any, context: any) => any;
}

export interface SnsConfig {
    routes: SnsRoute[];
    debug?: boolean;
}

export interface SqsRoute {
    source: string | RegExp;
    action: (messages: any[], context: any) => any;
}

export interface SqsConfig {
    routes: SqsRoute[];
    debug?: boolean;
}

export interface S3Route {
    bucketName?: string | RegExp;
    eventName?: string | RegExp;
    objectKeyPrefix?: string;
    action: (s3Record: any, context: any) => any;
}

export interface S3Config {
    routes: S3Route[];
    debug?: boolean;
}

export interface RouteConfig {
    proxyIntegration?: ProxyIntegrationConfig;
    sns?: SnsConfig;
    sqs?: SqsConfig;
    s3?: S3Config;
}
