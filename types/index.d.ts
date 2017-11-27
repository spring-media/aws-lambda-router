// Type definitions for aws-lambda-router
// Project: github.com/WeltN24/aws-lambda-router

declare namespace awsLambdaRouter {
    function handler(routeConfig: RouteConfig);
    function extractEventProcessorMapping(routeConfig: RouteConfig);
}

interface ErrorMapping {
    subject: string;
    action: any;
}

interface ProxyIntegrationRoute {
    path: string;
    method: string;
    action: Function;
}

interface ProxyIntegrationConfig {
    cors: boolean;
    routes: ProxyIntegrationRoute[];
    debug?: boolean;
    errorMapping: ErrorMapping;
    defaultHeaders: string;
}

interface SnsRoute {
    subject: string;
    action: Function;
}

interface SnsConfig {
    routes: SnsRoute[];
    debug?: boolean;
}

export interface RouteConfig {
    proxyIntegration: ProxyIntegrationConfig;
    sns: SnsConfig;
}



