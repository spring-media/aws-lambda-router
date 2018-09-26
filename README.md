
[![Build Status](https://travis-ci.org/spring-media/aws-lambda-router.svg?branch=master)](https://travis-ci.org/spring-media/aws-lambda-router)
[![npm version](https://badge.fury.io/js/aws-lambda-router.svg)](https://badge.fury.io/js/aws-lambda-router)
[![dependencies](https://david-dm.org/spring-media/aws-lambda-router.svg)](https://www.npmjs.com/package/aws-lambda-router)

# aws-lambda-router

A small library for [AWS Lambda](https://aws.amazon.com/lambda/details) providing routing for [API Gateway](https://aws.amazon.com/api-gateway) [Proxy Integrations](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-set-up-simple-proxy.html) and [SNS](https://aws.amazon.com/sns).

## Features

* Easy Handling of [ANY method](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-method-settings-method-request.html#setup-method-add-http-method) in API Gateways
* Simplifies writing lambda handlers (in nodejs)
* Lambda Proxy Resource support for AWS API Gateway
* Enable CORS for the requests

## Installation
Install via npm.

```
$ npm install aws-lambda-router
```

## Getting Started

This is an simple using of `aws-lambda-router` in connection with ANY method and the API Gateway proxy Intergration. The following code will response with a message when executed using the AWS API Gateway with a `GET` request  of URL path `<base-url-of-gateway/gateway-mapping/article/123`.

```js
const router = require('aws-lambda-router');

// handler for an api gateway event
exports.handler = router.handler(
{
    // for handling an http-call from an AWS Apigateway proxyIntegration we provide the following config:
    proxyIntegration: {
        routes: [
            {
                // request-path-pattern with a path variable:
                path: '/article/:id',
                method: 'GET',
                // we can use the path param 'id' in the action call:
                action: (request, context) => {
                    return "You called me with: " + request.paths.id;
                }
            }
        ]
    }
}

```

## Usage

```js
const router = require('aws-lambda-router');

exports.handler = router.handler(
    // the router-config contains configs for every type of 'processor'
{
    // for handling an http-call from an AWS Apigateway proxyIntegration we provide the following config:
    proxyIntegration: {
        // activate CORS on all http-methods (OPTIONS requests are handled automagically);
        // if set to true, these default headers will be sent on every response:
        // "Access-Control-Allow-Origin" = "'*'"
        // "Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,HEAD,PATCH'"
        // "Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
        cors: true,
        routes: [
            {
                // the request-path-pattern to match:
                path: '/graphql',
                // http method to match
                method: 'POST',
                // provide a function to be called with the propriate data
                action: (request, context) => doAnything(request.body)
            },
            {
                path: '/:id',
                method: 'DELETE',
                action: (request, context) => deleteSomething(request.paths.id)
            }
        ],
        debug: true,
        // custom mapping of thrown errors to http response code error:
        // the action can throw an object like
        // "throw {reason: 'NotFound', message: 'object id not found'}"
        // the http response then contains the configured value as response code and the message as the body
        errorMapping: {
            'NotFound': 404,
            'ServerError': 500
        }
    },
    // for handling calls initiated from AWS-SNS:
    sns: {
        routes: [
            {
                // a regex to match the content of the SNS-Subject:
                subject: /.*/,
                // Attention: the message is JSON-stringified
                action: (sns, context) => service.doSomething(JSON.parse(sns.Message))
            }
        ]
    }
});
```

### Custom response

Per default a status code 200 will be returned. This behavior can be override.

By providing body in the returned object you can modify statuscode and response headers.

```js
return {
        // Allow for custom status codes depending on execution.
        statusCode: 218,
        // Headers will merge with CORs headers when enabled.
        // Will merge with Content-Type: application/json
        headers: {
            'x-new-header': 'another-value'
        },
       // When returning a custom response object, a key of body is required
        // The value of body needs to be JSON stringified, this matches
        // the expected response for an AWS Lambda.
        body: JSON.stringify({
            foo:'bar'
        })
    };
```

## local developement

The best is to work with ```yarn link```

See here: https://yarnpkg.com/en/docs/cli/link


## Release History

* 0.4.0 now [the Context Object](https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-handler.html) pass through
* 0.3.1 proxyIntegration: avoid error if response object is not set; add some debug logging
* 0.3.0 proxyIntegration: add PATCH method; allow for custom status codes from route (thanks to [@mintuz](https://github.com/mintuz))
* 0.2.2 proxyIntegration: set correct header values now for CORS
* 0.2.1 proxyIntegration: CORS in Preflight, status code 400 for invalid body, set more CORS headers as default
* 0.2.0 Attention: breaking changes for configuration; add SNS event process
* 0.1.0 make it work now
* 0.0.1 initial release
