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
        }
    ],
    debug: true,
    errorMapping: {
        'NotFound': 404,
        'RequestError': 500
    }
});
```

## Tests

  npm test

## Release History

* 0.0.1 Initial release