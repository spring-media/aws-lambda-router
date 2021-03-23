
# AWS Lambda Router [![Build Status](https://travis-ci.com/spring-media/aws-lambda-router.svg?branch=master)](https://travis-ci.com/spring-media/aws-lambda-router)

[![codecov](https://codecov.io/gh/spring-media/aws-lambda-router/branch/master/graph/badge.svg)](https://codecov.io/gh/spring-media/aws-lambda-router) [![npm version](https://badge.fury.io/js/aws-lambda-router.svg)](https://badge.fury.io/js/aws-lambda-router) [![dependencies](https://david-dm.org/spring-media/aws-lambda-router.svg)](https://www.npmjs.com/package/aws-lambda-router)



A small library for [AWS Lambda](https://aws.amazon.com/lambda/details) providing routing for [API Gateway](https://aws.amazon.com/api-gateway), [Proxy Integrations](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-set-up-simple-proxy.html), [SNS](https://aws.amazon.com/sns)  and [S3 Events](https://docs.aws.amazon.com/AmazonS3/latest/dev/notification-content-structure.html). 

## Features

* Easy Handling of [ANY method](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-method-settings-method-request.html#setup-method-add-http-method) in API Gateways
* Simplifies writing lambda handlers (in nodejs > 8)
* Lambda Proxy Resource support for AWS API Gateway
* Enable CORS for requests
* No external dependencies - well, almost, only types of [aws-lambda](https://www.npmjs.com/package/@types/aws-lambda) :-)
* Currently there are four `processors` (callers for Lambda) implemented: 
    * API Gateway ANY method (called proxyIntegration)
    * SNS
    * SQS
    * S3
* Compatibility with Typescript >= 3.5


## Installation

Install via npm

```
$ npm install aws-lambda-router
```
or yarn

```
$ yarn add aws-lambda-router
```

## Getting Started

This is a simple example of `aws-lambda-router` in conjunction with ANY method and the API Gateway proxy integration. The following code will respond with a message when executed using an AWS API Gateway with a `GET` request on URL path `<base-url-of-gateway>/gateway-mapping/article/123`. The corresponding AWS API Gateway Resource is `/article/{articleId}`.

```js
import * as router from 'aws-lambda-router'

export const handler = router.handler({
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
            },
            {
                // request-path-pattern with a path variable in Open API style:
                path: '/section/{id}',
                method: 'GET',
                // we can use the path param 'id' in the action call:
                action: (request, context) => {
                    return "You called me with: " + request.paths.id;
                }
            }
        ]
    }
})
```

## Proxy path support (work in progress)

The proxy integration usually works using a path configured in the API gateway. For example: `/article/{id}`.

If you use the WIP *proxy path support*, the complete path will be used to match a route config in `proxyIntegration`. This can be used to build an [Simple Proxy with API Gateway](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-create-api-as-simple-proxy-for-http.html)

Example:
* Resource in API Gateway : /{proxy+} [see Proxy Integration with a Proxy Resource](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-set-up-simple-proxy.html)
* Method: ANY

With the lambda configuration shown below the following paths are matched:
*  _api-gateway-host_/article/list
*  _api-gateway-host_/api/json/v1/schema

```js
const router = require('aws-lambda-router');

exports.handler = router.handler({
    proxyIntegration: {
        proxyPath: proxy,
        routes: [
            {
                path: '/article/list',
                method: 'GET',
                action: (request, context) => {
                    return "You called me with: " + request.path;
                }
            },
            {
                path: '/api/json/v1/schema',
                method: 'GET',
                action: (request, context) => {
                    return "You called me with: " + request.path;
                }
            }
        ]
    }
})
```

Typescript example:

```ts
import * as router from 'aws-lambda-router'
import { ProxyIntegrationEvent } from 'aws-lambda-router/lib/proxyIntegration'

export const handler = router.handler({
    proxyIntegration: {
        routes: [
            {
                path: '/saveExample',
                method: 'POST',
                // request.body needs type assertion, because it defaults to type unknown (user input should be checked):
                action: (request, context) => {
                    const { text } = request.body as { text: string }
                    return `You called me with: ${text}`
                }
            },
            {
                path: '/saveExample2',
                method: 'POST',
                // it's also possible to set a type (no type check):
                action: (request: ProxyIntegrationEvent<{ text: string }>, context) => {
                    return `You called me with: ${request.body.text}`
                }
            }
        ]
    }
}
```

## Enable CORS 

To activate CORS on all http methods (OPTIONS requests are handled automatically) you only need to set the parameter `cors` to `true` on the `proxyIntegration` rule. 

See the following example:  


<details>
  <summary>Default CORS example</summary>

```js
import * as router from 'aws-lambda-router'

export const handler = router.handler({
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
})
```  

</details>

If CORS is activated, these default headers will be sent on every response:  
    
    "Access-Control-Allow-Origin" = "'*'"
    "Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,HEAD,PATCH'"
    "Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"

### Customizing CORS

To customize CORS for all routes pass any of the following options to the `proxyIntegration` `cors` property.  If a property is not set then it will default to the above default CORS headers.

* `origin`: Configures the **Access-Control-Allow-Origin** CORS header. Possible values:
  - `Boolean` - set `origin` to `true` to reflect the request origin or set it to `false` to disable CORS.
  - `String` - set `origin` to a specific origin. For example if you set it to `"http://example.com"` only requests from "http://example.com" will be allowed.
  - `RegExp` - set `origin` to a regular expression pattern which will be used to test the request origin. If it's a match, the request origin will be reflected. For example the pattern `/example\.com$/` will reflect any request that is coming from an origin ending with "example.com".
  - `Array` - set `origin` to an array of valid origins. Each origin can be a `String` or a `RegExp`. For example `["http://example1.com", /\.example2\.com$/]` will accept any request from "http://example1.com" or from a subdomain of "example2.com".
  - `Function` - set `origin` to a function to be evaluated.  The function will get passed the `APIGatewayProxyEvent` and must return the allowed origin or `false` 
* `methods`: Configures the **Access-Control-Allow-Methods** CORS header. Expects a comma-delimited string (ex: 'GET,PUT,POST') or an array (ex: `['GET', 'PUT', 'POST']`).
* `allowedHeaders`: Configures the **Access-Control-Allow-Headers** CORS header. Expects a comma-delimited string (ex: 'Content-Type,Authorization') or an array (ex: `['Content-Type', 'Authorization']`). If not specified, defaults to reflecting the headers specified in the request's **Access-Control-Request-Headers** header.
* `exposedHeaders`: Configures the **Access-Control-Expose-Headers** CORS header. Expects a comma-delimited string (ex: 'Content-Range,X-Content-Range') or an array (ex: `['Content-Range', 'X-Content-Range']`). If not specified, no custom headers are exposed.
* `credentials`: Configures the **Access-Control-Allow-Credentials** CORS header. Set to `true` to pass the header, otherwise it is omitted.
* `maxAge`: Configures the **Access-Control-Max-Age** CORS header. Set to an integer to pass the header, otherwise it is omitted.


<details>
  <summary>Customize CORS example</summary>

```js
import * as router from 'aws-lambda-router'

export const handler = router.handler({
    // for handling an http-call from an AWS Apigateway proxyIntegration we provide the following config:
    proxyIntegration: {
        cors: {
          origin: 'https://test.example.com', // Only allow CORS request from this url
          methods: ['GET', 'POST', 'PUT']     // Only allow these HTTP methods to make requests
        },
        routes: [
            {
                path: '/graphql',
                method: 'POST',
                // provide a function to be called with the appropriate data
                action: (request, context) => doAnything(request.body)
            }
        ]
    }
})
```  

</details>

## Error mapping / handling

```js
import * as router from 'aws-lambda-router'

export const handler = router.handler({
    // for handling an http-call from an AWS Apigateway proxyIntegration we provide the following config:
    proxyIntegration: {
        routes: [
            {
                path: '/graphql',
                method: 'POST',
                action: (request, context) => doThrowAnException(request.body)
            }
        ],
        debug: true,
        errorMapping: {
            'NotFound': 404,
            'MyCustomError': 429,
            'ServerError': 500
        }
    }
})

function doThrowAnException(body) {
    throw {reason: 'MyCustomError', message: 'Throw an error for this example'}
}
``` 

With the key word `errorMapping` shown in the example above you can adjust the assignment of thrown errors to http response code error.
The action can throw an object like

    "throw {reason: 'NotFound', message: 'object id not found'}"

and the http response then contains the configured value as response code and the message as the body.

###  Genereric error handler for proxyIntegration

Also there is implemented an generic error handler. The idea is to have a place for handling error logging and also return custom error messages.

<details>
  <summary>Generic error handling example</summary>

```js
onError: (error, event, context) => {
    // Global exceptions goes here, works for sns, s3 and sqs should end up here aswell
    console.log(error)
},
proxyIntegration: {
    onError: (error, request, context) => {
        // proxy integration exceptions goes here
        console.log('Error', error, request, context)
    },
    routes: ...
}

// Also support returning a response:
proxyIntegration: {
    onError: async (error) => {
        console.log('Error', error)
        await someAsyncMethod();
        return {
           statusCode: 401,
           body: Not allowed
        }
    },
    routes: ...
}
```
</details>

For more examples please look into the [tests](test/proxyIntegration.test.ts) of proxyIntegration.

## SNS to Lambda Integrations

SNS Event Structure: https://docs.aws.amazon.com/sns/latest/dg/sns-message-and-json-formats.html

For handling calls in Lambdas initiated from AWS-SNS you can use the following code snippet:

<details>
  <summary>SNS to Lambda example</summary>

```js
import * as router from 'aws-lambda-router'

export const handler = router.handler({
    sns: {
        routes: [
            {
                // a regex to match the content of the SNS-Subject:
                subject: /.*/,
                // Attention: the message is JSON-stringified
                action: (sns, context, records) => service.doSomething(JSON.parse(sns.Message))
            }
        ]
    }
})
```

</details>

The *records* parameter contains `SNSEventRecord[]`. An exampe event structure can be found [here](lib/event-examples/sns.json). For example you can parse now the  [message attributes of the SNS](https://docs.aws.amazon.com/sns/latest/dg/sns-message-attributes.html) or reads the topic arn of SNS. 

## SQS to Lambda Integrations

For handling calls in Lambdas initiated from AWS-SQS you can use the following code snippet:

<details>
  <summary>SQS to Lambda example</summary>

```js
import * as router from 'aws-lambda-router'

export const handler = router.handler({
    sqs: {
        routes: [
            {
                // match complete SQS ARN:
                source: 'arn:aws:sqs:us-west-2:594035263019:aticle-import',
                // Attention: the messages Array is JSON-stringified
                action: (messages, context, records) => messages.forEach(message => console.log(JSON.parse(message)))
            },
            {
                // a regex to match the source SQS ARN:
                source: /.*notification/,
                // Attention: the messages array is JSON-stringified
                action: (messages, context, records) => service.doNotify(messages)
            }
        ]
    }
})
```

</details>

An SQS message always contains an array of records. In each SQS record there is the message in the body JSON key. 
The `action` method gets all body elements from the router as an array.

If more than one route matches, only the **first** is used!

The *records* parameter contains the complete array of records, which handled by aws-lambda-router. An exampe can be found [here](lib/event-examples/sqs.json). This gives you the possibility to read metadata from the event. For example, you can parse the [message attributes of the SQS](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-message-attributes.html) and use them for further processing. 

## S3 to Lambda Integrations


Lambdas can be triggered by S3 events. The router now supports these events.
With the router it is very easy and flexible to connect a lambda to different s3 sources (different buckets). The following configurations are available:

- bucketName: By specifying a fixed _bucketName_ all s3 records with this bucket name are forwarded to a certain action. Instead of a fixed bucket a _RegExp_ is also possible.
- eventName: By configuring the [S3 event name](https://docs.aws.amazon.com/AmazonS3/latest/dev/NotificationHowTo.html#supported-notification-event-types) the routing can be further restricted. A _RegExp_ is also possible here.
- objectKeyPrefix: fixed string as an prefix of an object key (but not an RegExp). Is useful if you want to organize your bucket in subfolder. 

A combination of bucketName, eventName and objectKeyPrefix is possible. If no _bucketName_, _eventName_ and _objectKeyPrefix_ is configured, all records of s3 events are forwarded to the action.

The action method will be called with the records of the [S3Event Structure](https://docs.aws.amazon.com/AmazonS3/latest/dev/notification-content-structure.html)

The following examples demonstrates the most use cases:

<details>
  <summary>S3 to Lambda example</summary>

```js
import * as router from 'aws-lambda-router'

export const handler = router.handler({
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
})
```
</details>

Per s3 event there can be several records per event. The action methods are called one after the other record. The result of the action method is an array with objects insides.

### Custom response

Per default a status code 200 will be returned. This behavior can be overridden.

By providing a body property in the returned object you can modify the status code and response headers.

<details>
  <summary>Response example</summary>
  
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
    }
```

</details>


## Local developement

The best is to work with ```yarn link```

See here: https://yarnpkg.com/en/docs/cli/link

## Releasing

It's simple. 

Increase version in **package.json** (using [semantic version syntax](https://semver.org/)). After than create an new tag in github (with description, can be the same as of the release history below) with the same version (like v0.98.9). Our build pipeline at [Travis CI](https://travis-ci.com/spring-media/aws-lambda-router) will be started and release an new version at [NPM Repository](https://www.npmjs.com/package/aws-lambda-router).

Thats all.

## Release History

see [CHANGELOG.md](CHANGELOG.md)
