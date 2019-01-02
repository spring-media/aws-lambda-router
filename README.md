
[![Build Status](https://travis-ci.org/spring-media/aws-lambda-router.svg?branch=master)](https://travis-ci.org/spring-media/aws-lambda-router)
[![npm version](https://badge.fury.io/js/aws-lambda-router.svg)](https://badge.fury.io/js/aws-lambda-router)
[![dependencies](https://david-dm.org/spring-media/aws-lambda-router.svg)](https://www.npmjs.com/package/aws-lambda-router)

# aws-lambda-router

A small library for [AWS Lambda](https://aws.amazon.com/lambda/details) providing routing for [API Gateway](https://aws.amazon.com/api-gateway),
[Proxy Integrations](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-set-up-simple-proxy.html), [SNS](https://aws.amazon.com/sns) 
and [S3 Events](https://docs.aws.amazon.com/AmazonS3/latest/dev/notification-content-structure.html). 

## Features

* Easy Handling of [ANY method](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-method-settings-method-request.html#setup-method-add-http-method) in API Gateways
* Simplifies writing lambda handlers (in nodejs)
* Lambda Proxy Resource support for AWS API Gateway
* Enable CORS for requests
* No external dependencies
* Currently there are four `processors` (callers for Lambda) implemented: API Gateway ANY method (called proxyIntegration), SNS, SQS and S3. 

## Installation
Install via npm

```
$ npm install aws-lambda-router
```
or yarn

```
$ yarn install aws-lambda-router
```

## Getting Started

This is a simple example of `aws-lambda-router` in conjunction with ANY method and the API Gateway proxy integration. The following code will respond with a message when executed using an AWS API Gateway with a `GET` request on URL path `<base-url-of-gateway>/gateway-mapping/article/123`.

```js
const router = require('aws-lambda-router');

// handler for an api gateway event
exports.handler = router.handler({
    // for handling an http-call from an AWS API Gateway proxyIntegration we provide the following config:
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


## Enable CORS 

To activate CORS on all http methods (OPTIONS requests are handled automatically) you only need to set the parameter `cors` to `true` on the `proxyIntegration` rule. 

See the following example:  


```js
const router = require('aws-lambda-router');

exports.handler = router.handler({
    // for handling an http-call from an AWS Apigateway proxyIntegration we provide the following config:
    proxyIntegration: {
        cors: true,
        routes: [
            {
                path: '/graphql',
                method: 'POST',
                // provide a function to be called with the appropriate data
                action: (request, context) => doAnything(request.body)
            }
        ]
    }
});
```  

If CORS is activated, these default headers will be sent on every response:  
    
    "Access-Control-Allow-Origin" = "'*'"
    "Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,HEAD,PATCH'"
    "Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"


## Errormapping

```js
const router = require('aws-lambda-router');

exports.handler = router.handler({
    // for handling an http-call from an AWS Apigateway proxyIntegration we provide the following config:
    proxyIntegration: {
        routes: [
            {
                path: '/graphql',
                method: 'POST',
                action: (request, context) => doAnything(request.body)
            }
        ],
        debug: true,
        errorMapping: {
            'NotFound': 404,
            'ServerError': 500
        }
    }
});
``` 

With the key word `errorMapping` shown in the example above you can custom mapping of thrown errors to http response code error.
The action can throw an object like

    "throw {reason: 'NotFound', message: 'object id not found'}"

and the http response then contains the configured value as response code and the message as the body.
        

## SNS to Lambda Integrations

SNS Event Structure: https://docs.aws.amazon.com/sns/latest/dg/sns-message-and-json-formats.html

For handling calls in Lambdas initiated from AWS-SNS you can use the following code snippet:

```js
const router = require('aws-lambda-router');

exports.handler = router.handler({
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

## SQS to Lambda Integrations

For handling calls in Lambdas initiated from AWS-SQS you can use the following code snippet:

```js
const router = require('aws-lambda-router');

exports.handler = router.handler({
    sqs: {
        routes: [
            {
                // match complete SQS ARN:
                source: 'arn:aws:sqs:us-west-2:594035263019:aticle-import',
                // Attention: the messages Array is JSON-stringified
                action: (messages, context) => messages.forEach(message => console.log(JSON.parse(message)))
            },
            {
                // a regex to match the source SQS ARN:
                source: /.*notification/,
                // Attention: the messages array is JSON-stringified
                action: (messages, context) => service.doNotify(messages)
            }
        ]
    }
});
```

An SQS message always contains an array of records. In each SQS record there is the message in the body JSON key. 
The `action` method gets all body elements from the router as an array.

If more than one route matches, only the **first** is used!

## S3 to Lambda Integrations


Lambdas can be triggered by S3 events. The router now supports these events.
With the router it is very easy and flexible to connect a lambda to different s3 sources (different buckets). The following configurations are available:

- bucketName: By specifying a fixed _bucketName_ all s3 records with this bucket name are forwarded to a certain action. Instead of a fixed bucket a _RegExp_ is also possible.
- eventName: By configuring the [S3 event name](https://docs.aws.amazon.com/AmazonS3/latest/dev/NotificationHowTo.html#supported-notification-event-types) the routing can be further restricted. A _RegExp_ is also possible here.
- objectKeyPrefix: fixed string as an prefix of an object key (but not an RegExp). Is useful if you want to organize your bucket in subfolder. 

A combination of bucketName, eventName and objectKeyPrefix is possible. If no _bucketName_, _eventName_ and _objectKeyPrefix_ is configured, all records of s3 events are forwarded to the action.

The action method will be called with the records of the [S3Event Structure](https://docs.aws.amazon.com/AmazonS3/latest/dev/notification-content-structure.html)

The following examples demonstrates the most use cases:

```js
const router = require('aws-lambda-router');

exports.handler = router.handler({
    s3: {
        routes: [
            {
                //match every s3 record to this action 
                action: (record, context) => console.log(record.s3.object.key, record.eventName)
            },
            {
                //match s3 events which created, bucket name is whitelisted here
                eventName: 'ObjectCreated:Put',
                action: (record, context) => console.log(record.s3.object.key, record.eventName)
            },
            {
                //event name is an regex: match 'ObjectCreated:Put' or 'ObjectCreated:Copy'
                eventName: /ObjectCreated:*/,
                action: (record, context) => console.log(record.s3.object.key, record.eventName)
            },
            {
                //exact name of bucket 'myBucket', event name is whitelisted and will not be checked
                bucketName: 'myBucket',
                action: (record, context) => console.log(record.s3.object.key, record.eventName)
            },
            {
                //regex of bucket name (all buckets started with 'bucket-dev-' will be machted
                bucketName: /^bucket-dev-.*/,
                action: (record, context) => console.log(record.s3.object.key, record.eventName)
            },
            { 
                //action only will be called if bucket and event matched to the given regex
                bucketName: /bucket-dev-.*/,
                eventName: /ObjectCreated:*/,
                action: (record, context) => console.log(event.s3.object.key, record.eventName)
            },
            { 
                //action only will be called if bucket and event matched to the given fixed string
                bucketName: 'bucket',
                eventName: 'ObjectRemoved:Delete',
                action: (record, context) => console.log(event.s3.object.key, record.eventName)
            },
            { 
                //match if s3 events comes from Bucket 'bucket' with event 'ObjectRemoved:Delete' 
                // and the object key starts with /upload
                objectKeyPrefix: '/upload',
                bucketName: 'bucket',
                eventName: 'ObjectRemoved:Delete',
                action: (record, context) => console.log(record.s3.object.key, record.eventName)
            }
        ],
        debug: true
    }
});
```

Per s3 event there can be several records per event. The action methods are called one after the other record. The result of the action method is an array with objects insides.

### Custom response

Per default a status code 200 will be returned. This behavior can be overridden.

By providing a body property in the returned object you can modify the status code and response headers.

```js
return {
        // Allow for custom status codes depending on execution.
        statusCode: 218,
        // Headers will merge with CORS headers when enabled.
        // Will merge with Content-Type: application/json
        headers: {
            'x-new-header': 'another-value'
        },
        // When returning a custom response object, a key of body is required
        // The value of body needs to be JSON stringified, this matches
        // the expected response for an AWS Lambda.
        body: JSON.stringify({
            foo: 'bar'
        })
    };
```

## Local developement

The best is to work with ```yarn link```

See here: https://yarnpkg.com/en/docs/cli/link


## Release History

* 0.6.1 s3: fix: aggregate result promises to one promise; fix: s3Route interface
* 0.6.0 new feature: S3 routes available. 
* 0.5.0 new feature: SQS route integration now available; bugfix: SNS integration now works woth Array of message instead of single message
* 0.4.0 now [the Context Object](https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-handler.html) pass through
* 0.3.1 proxyIntegration: avoid error if response object is not set; add some debug logging
* 0.3.0 proxyIntegration: add PATCH method; allow for custom status codes from route (thanks to [@mintuz](https://github.com/mintuz))
* 0.2.2 proxyIntegration: set correct header values now for CORS
* 0.2.1 proxyIntegration: CORS in Preflight, status code 400 for invalid body, set more CORS headers as default
* 0.2.0 Attention: breaking changes for configuration; add SNS event process
* 0.1.0 make it work now
* 0.0.1 initial release
