"use strict";

const NO_MATCHING_ACTION = request => {
    throw {
        reason: 'NO_MATCHING_ACTION',
        message: `Could not find matching action for ${request.path} and method ${request.httpMethod}`
    }
};

function route(proxyIntegrationConfig, event) {
    // detect if it's an http-call at all:
    if (!event.httpMethod) {
        return null;
    }
    const headers = Object.assign({
        'Content-Type': 'application/json'
    }, proxyIntegrationConfig.defaultHeaders);
    if (proxyIntegrationConfig.cors) {
        headers["Access-Control-Allow-Origin"] = "*";
    }
    // assure necessary values have sane defaults:
    event.path = event.path || '';
    const errorMapping = proxyIntegrationConfig.errorMapping || {};
    errorMapping['NO_MATCHING_ACTION'] = 404;
    proxyIntegrationConfig.routes = proxyIntegrationConfig.routes || [];
    // ugly hack: if host is from 'Custom Domain Name Mapping', then event.path has the value '/basepath/resource-path/';
    // if host is from amazonaws.com, then event.path is just '/resource-path':
    const apiId = event.requestContext ? event.requestContext.apiId : null; // the apiId that is the first part of the amazonaws.com-host
    if ((apiId && event.headers && event.headers.Host && event.headers.Host.substring(0, apiId.length) != apiId)) {
        // remove first path element:
        const groups = /\/[^\/]+(.*)/.exec(event.path) || [null, null];
        event.path = groups[1] || '/';
    }

    try {
        const actionConfig = findMatchingActionConfig(event.httpMethod, event.path, proxyIntegrationConfig) || {action: NO_MATCHING_ACTION};
        event.paths = actionConfig.paths;
        if (event.body) {
            event.body = JSON.parse(event.body);
        }
        return Promise.resolve(actionConfig.action(event)).then(res => {
            return {statusCode: 200, headers: headers, body: JSON.stringify(res)};
        }).catch(err => {
            return convertError(err, errorMapping, headers);
        });
    } catch (error) {
        console.log('Error while evaluating matching action handler', error);
        return Promise.resolve(convertError(error, errorMapping, headers));
    }
}


function convertError(error, errorMapping, headers) {
    if (typeof error.reason === 'string' && typeof error.message === 'string' && errorMapping && errorMapping[error.reason]) {
        return {statusCode: errorMapping[error.reason], body: error.message, headers: headers};
    }
    return {statusCode: 500, body: `Generic error: ${JSON.stringify(error)}`};
}

function findMatchingActionConfig(httpMethod, httpPath, routeConfig) {
    const paths = {};
    const matchingMethodRoutes = routeConfig.routes.filter(route => route.method == httpMethod);
    for (let route of matchingMethodRoutes) {
        if (routeConfig.debug) {
            console.log(`Examining route ${route.path} to match ${httpPath}`);
        }
        const pathPartNames = extractPathNames(route.path);
        const pathValues = extractPathValues(route.path, httpPath);
        if (pathValues && pathPartNames) {
            for (let ii = 0; ii < pathValues.length; ii++) {
                paths[pathPartNames[ii]] = decodeURIComponent(pathValues[ii]);
            }
            if (routeConfig.debug) {
                console.log(`Found matching route ${route.path} with paths`, paths);
            }
            return {action: route.action, paths: paths};
        }
    }
    if (routeConfig.debug) {
        console.log(`No match for ${httpPath}`);
    }

    return null;
}

function extractPathValues(pathExpression, httpPath) {
    const pathValueRegex = new RegExp('^' + pathExpression.replace(/:[\w]+/g, "([^/]+)") + '$');
    const pathValues = pathValueRegex.exec(httpPath);
    return pathValues && pathValues.length > 0 ? pathValues.slice(1) : null;
}

function extractPathNames(pathExpression) {
    const pathNameRegex = new RegExp('^' + pathExpression.replace(/:[\w.]+/g, ":([\\w]+)") + '$');
    const pathNames = pathNameRegex.exec(pathExpression);
    return pathNames && pathNames.length > 0 ? pathNames.slice(1) : null;
}

module.exports = route;