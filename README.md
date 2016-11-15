
[![Build Status](https://travis-ci.org/serverless/serverless.svg?branch=master)](https://travis-ci.org/serverless/serverless)
[![npm version](https://badge.fury.io/js/aws-lambda-router.svg)](https://badge.fury.io/js/aws-lambda-router)


## aws-lambda-router

A small library providing routing for AWS ApiGateway ```any``` method

## Install

```
$ npm install aws-lambda-router
```

## Usage

```js
const httpRouteHandler = require('aws-lambda-router');

exports.handler = httpRouteHandler.handler({
    cors: true,
    routes: [
        {
            path: '/graphql',
            method: 'POST',
            action: request=>doAnything(request.body)
        },
        {
            path: '/article/{id}',
            method: 'GET',
            action: request=>getArticleInfo(request.body)
        },
        {
            path: '/:sourcepath',
            method: 'DELETE',
            action: request=>deleteSourcepath(request.paths.sourcepath)
        }
    ],
    debug: true,
    errorMapping: {
        'NotFound': 404,
        'RequestError': 500
    }
});
```

## Publish a new version to npmjs.org




## local developement

The best is to work with ```npm link```

See here: http://vansande.org/2015/03/20/npm-link/


## Release History

* 0.0.2 make it work now 
* 0.0.1 initial release
