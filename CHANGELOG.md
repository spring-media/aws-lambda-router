### 0.10.0 (March 23, 2021)
  * adding generic and proxyIntegration errorHandler (#60) (thanks to [@swaner](https://github.com/swaner))
  * fix: logging statements (#59) (thanks to [@snorberhuis](https://github.com/snorberhuis))
  * build: updates build nodeJS version to 10

### 0.9.1 (September 11, 2020)
  * proxyIntegration: Allow defaultHeaders to be added to the OPTIONS request (#53) (thanks again to [@TerryMooreII](https://github.com/TerryMooreII) and [LiveOakLabs](https://github.com/LiveOakLabs))

### 0.9.0 (September 01, 2020)
  * proxyIntegration: Adds customizable CORS configurations (#52) (thanks to [@TerryMooreII](https://github.com/TerryMooreII) and [LiveOakLabs](https://github.com/LiveOakLabs))

### 0.8.4 (August 01, 2020)
   * proxyIntegration: expose route path (#49) (thanks to [@evgenykireev](https://github.com/evgenykireev))

### 0.8.3 (May 07, 2020)
   * added records to the SQS (#43) and SNS (#44) action for further processing

### 0.8.2 (January 28, 2020)
   * added support for Open API parameter definitions e.g.: /section/{id}

### 0.8.1 (January 24, 2020)
   * fix: changed ProxyIntegrationEvent body type to be generic but defaults to unknown
   * fix: changed @types/aws-lambda from devDependency to dependency
   * **breaking**: error response objects (thrown or rejected) now need to set `statusCode` instead of `status` (consistent with response)

### 0.7.1 (January 22, 2020)
   * code style cleanup
   * fix: hosted package on npmjs should now worked

### 0.7.0 (January 17, 2020)
   * migrate to typescript
   * using @types/aws-lambda typings
   * proxyIntegration: cors is now optional (default: false)
   * removed use of aws lambda handler callback function (using Promise instead)
   * experimental _proxy path support_ (thanks to [@swaner](https://github.com/swaner))

### 0.6.2 (May 03, 2019)
  * take away old gulp dependency to run tests, works now with scripts in package.json
  * normalize request path to start from local host (thanks to [@napicella](https://github.com/napicella))

### 0.6.1 (January 02, 2019)
  * s3: fix: aggregate result promises to one promise; 
  * s3: s3Route interface

### 0.6.0 (December 24, 2018)
  * new feature: S3 routes available. 

### 0.5.0 (November 18, 2018)
  * new feature: SQS route integration now available; 
  * bugfix: SNS integration now works with Array of message instead of single message

### 0.4.0 (September 13, 2018)
  * now [the Context Object](https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-handler.html) pass through

### 0.3.1 (August 28, 2018) 
  * proxyIntegration: avoid error if response object is not set
  * add some debug logging

### 0.3.0 (August 28, 2018)
  * proxyIntegration: add PATCH method;
  * allow for custom status codes from route (thanks to [@mintuz](https://github.com/mintuz))

### 0.2.3 (October 13, 2017)
  * better errorhandling (from PR #3)

### 0.2.2 (November 25, 2016)
  * proxyIntegration: set correct header values now for CORS

### 0.2.1 (November 25, 2016)
  * proxyIntegration: CORS in Preflight, status code 400 for invalid body, set more CORS headers as default

### 0.2.0 (November 21, 2016) 
  * *Attention*: breaking changes for configuration;
  * add SNS event process

### 0.1.0 (November 15, 2016)
  * make it work now

### 0.0. (September 29, 2016)
  *  initial release