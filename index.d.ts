// Type definitions for aws-lambda-router
// Project: github.com/WeltN24/aws-lambda-router

export function handler(routeConfig: RouteConfig): any;

interface ProxyIntegrationRoute {
    path: string;
    method: string;
    action?: (request: any) => any;
}

interface ProxyIntegrationConfig {
    cors: boolean;
    routes: ProxyIntegrationRoute[];
    debug?: boolean;
    errorMapping?: any;
    defaultHeaders?: string;
}

interface SnsRoute {
    subject: any;
    action?: (sns: any) => any;
}

interface SnsConfig {
    routes: SnsRoute[];
    debug?: boolean;
}

export interface RouteConfig {
    proxyIntegration: ProxyIntegrationConfig;
    sns: SnsConfig;
}
