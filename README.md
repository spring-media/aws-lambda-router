
[![Build Status](https://travis-ci.org/spring-media/aws-lambda-router.svg?branch=master)](https://travis-ci.org/spring-media/aws-lambda-router)
[![npm version](https://badge.fury.io/js/aws-lambda-router.svg)](https://badge.fury.io/js/aws-lambda-router)
[![dependencies](https://david-dm.org/spring-media/aws-lambda-router.svg)](https://www.npmjs.com/package/aws-lambda-router)

## aws-lambda-router

A small library providing routing for AWS ApiGateway Proxy Integrations and SNS...

## Install

```
$ npm install aws-lambda-router
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
        // "Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,HEAD'"
        // "Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
        cors: true,
        routes: [
            {
                // the request-path-pattern to match:
                path: '/graphql',
                // http method to match
                method: 'POST',
                // provide a function to be called with the propriate data
                action: request=>doAnything(request.body)
            },
            {
                // request-path-pattern with a path variable:
                path: '/article/:id',
                method: 'GET',
                // we can use the path param 'id' in the action call:
                action: request=>getSomething(request.paths.id)
            },
            {
                path: '/:id',
                method: 'DELETE',
                action: request=>deleteSomething(request.paths.id)
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
                action: sns => service.doSomething(JSON.parse(sns.Message))
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

The best is to work with ```npm link```

See here: http://vansande.org/2015/03/20/npm-link/


## Release History

* 0.3.0 proxyIntegration: allow for custom status codes from route (thanks to [@mintuz](https://github.com/mintuz))
* 0.2.2 proxyIntegration: set correct header values now for CORS
* 0.2.1 proxyIntegration: CORS in Preflight, status code 400 for invalid body, set more CORS headers as default
* 0.2.0 Attention: breaking changes for configuration; add SNS event process
* 0.1.0 make it work now
* 0.0.1 initial release
