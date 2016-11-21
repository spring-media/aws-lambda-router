
[![Build Status](https://travis-ci.org/WeltN24/aws-lambda-router.svg?branch=master)](https://travis-ci.org/WeltN24/aws-lambda-router)
[![npm version](https://badge.fury.io/js/aws-lambda-router.svg)](https://badge.fury.io/js/aws-lambda-router)
[![dependencies](https://david-dm.org/WeltN24/aws-lambda-router.svg)](https://www.npmjs.com/package/aws-lambda-router)

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
        // activate CORS on all http-methods:
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

## local developement

The best is to work with ```npm link```

See here: http://vansande.org/2015/03/20/npm-link/


## Release History

* 0.2.0 Attention: breaking changes for configuration; add SNS event process
* 0.1.0 make it work now 
* 0.0.1 initial release
