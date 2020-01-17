// helper for parameterized tests (http://blog.piotrturski.net/2015/04/jasmine-parameterized-tests.html)
import {log} from "util";

function forEach(arrayOfArrays: any) {
  return {
    it: (description: string, testCaseFunction: (...args: any[]) => void | Promise<void>) => {
      arrayOfArrays.forEach((innerArray: any) => {
        it(description + ' ' + JSON.stringify(innerArray), () => {
          // @ts-ignore
          return testCaseFunction.apply(this, innerArray)
        })
      })
    }
  }
}

import { process as proxyIntegration, ProxyIntegrationConfig } from '../lib/proxyIntegration'
import { APIGatewayProxyEvent } from 'aws-lambda'

const expectedCorsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,HEAD,PATCH",
  "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token"
}

const context = {} as any

describe('proxyIntegration.routeHandler.selection', () => {
  it('should select longer match without context (for backward compatibility)', () => {
    const actionSpy = jasmine.createSpy('action')
    proxyIntegration({
      routes: [
        { path: '/', method: 'GET', action: () => '/' as any },
        { path: '/123', method: 'POST', action: () => '123' as any },
        { path: '/123', method: 'GET', action: actionSpy }
      ]
    }, { httpMethod: 'GET', path: '/123' } as APIGatewayProxyEvent, context)
    expect(actionSpy).toHaveBeenCalledWith({ httpMethod: 'GET', path: '/123', paths: {} }, jasmine.anything())
  })

  it('should select longer match', () => {
    const actionSpy = jest.fn()
    proxyIntegration({
      routes: [
        { path: '/', method: 'GET', action: () => '/' as any },
        { path: '/123', method: 'POST', action: () => '123' as any },
        { path: '/123', method: 'GET', action: actionSpy }
      ]
    }, { httpMethod: 'GET', path: '/123' } as APIGatewayProxyEvent, context)
    expect(actionSpy).toHaveBeenCalledWith({ httpMethod: 'GET', path: '/123', paths: {} }, context)
  })
  it('should select parameter match', () => {
    const actionSpy = jasmine.createSpy('action')
    proxyIntegration({
      routes: [
        { path: '/', method: 'GET', action: () => '/' as any },
        { path: '/123', method: 'GET', action: () => '123' as any },
        { path: '/:param', method: 'GET', action: actionSpy }
      ]
    }, { httpMethod: 'GET', path: '/456' } as APIGatewayProxyEvent, context)
    expect(actionSpy).toHaveBeenCalledWith({ httpMethod: 'GET', path: '/456', paths: { param: '456' } }, context)
  })
  it('should select static match', () => {
    const actionSpy = jasmine.createSpy('action')
    proxyIntegration({
      routes: [
        { path: '/', method: 'GET', action: () => '/' as any },
        { path: '/123', method: 'GET', action: actionSpy },
        { path: '/:param', method: 'GET', action: () => 'param' as any }
      ]
    }, { httpMethod: 'GET', path: '/123' } as APIGatewayProxyEvent, context)
    expect(actionSpy).toHaveBeenCalledWith({ httpMethod: 'GET', path: '/123', paths: {} }, context)
  })
  it('should match urlencoded path', () => {
    const actionSpy = jasmine.createSpy('action')
    proxyIntegration({
      routes: [
        { path: '/', method: 'GET', action: () => '/' as any },
        { path: '/123', method: 'GET', action: () => '123' as any },
        { path: '/:param', method: 'GET', action: actionSpy }
      ]
    }, { httpMethod: 'GET', path: '/%2Fwirtschaft%2Farticle85883...tml' } as APIGatewayProxyEvent, context)
    expect(actionSpy).toHaveBeenCalledWith({
      httpMethod: 'GET',
      path: '/%2Fwirtschaft%2Farticle85883...tml',
      paths: { param: '/wirtschaft/article85883...tml' }
    }, context)
  })
  it('should select match containing hyphen', () => {
    const actionSpy = jasmine.createSpy('action')
    proxyIntegration({
      routes: [
        { path: '/:param', method: 'GET', action: actionSpy }
      ]
    }, { httpMethod: 'GET', path: '/%2Fdeutschland-bewegt-sich%2F' } as APIGatewayProxyEvent, context)
    expect(actionSpy).toHaveBeenCalledWith({
      httpMethod: 'GET',
      path: '/%2Fdeutschland-bewegt-sich%2F',
      paths: { param: '/deutschland-bewegt-sich/' }
    }, context)
  })
  it('should select match containing question marks and dots', () => {
    const actionSpy = jasmine.createSpy('action')
    proxyIntegration({
      routes: [
        { path: '/:param', method: 'GET', action: actionSpy }
      ]
    }, {
      httpMethod: 'GET',
      path: '/%2Fboerse%2FResources%2FImages%2Fcss%2Farrows_change-2.0.1.png?rfid=2013011501'
    } as APIGatewayProxyEvent, context)
    expect(actionSpy).toHaveBeenCalledWith({
      httpMethod: 'GET',
      path: '/%2Fboerse%2FResources%2FImages%2Fcss%2Farrows_change-2.0.1.png?rfid=2013011501',
      paths: { param: '/boerse/Resources/Images/css/arrows_change-2.0.1.png?rfid=2013011501' }
    }, context)
  })
  it('should add cors headers to OPTIONS request', async () => {
    const result = await proxyIntegration({
      routes: [{} as any],
      cors: true
    }, { httpMethod: 'OPTIONS', path: '/' } as APIGatewayProxyEvent, context)

    expect(result).toEqual({
      statusCode: 200,
      headers: expectedCorsHeaders,
      body: ''
    })
  })

  it('should add cors headers to GET request', async () => {
    const result = await proxyIntegration({
      routes: [{ path: '/', method: 'GET', action: () => '/' as any }],
      cors: true
    }, { httpMethod: 'GET', path: '/' } as APIGatewayProxyEvent, context)

    expect(result).toEqual({
      statusCode: 200,
      headers: Object.assign({ "Content-Type": "application/json" }, expectedCorsHeaders),
      body: '"/"'
    })
  })
})

describe('proxyIntegration.routeHandler', () => {
  it('call with context', () => {
    const actionSpy = jasmine.createSpy('action')
    const event = {
      httpMethod: 'GET',
      path: "/shortcut-itemsdev",
      headers: { Host: "api.ep.welt.de" },
      requestContext: { apiId: 'blabla' }
    }
    const context = {
      awsRequestId: "ab-dc",
      functionName: "name"
    }

    proxyIntegration({
      routes: [{
        method: 'GET',
        path: '/',
        action: actionSpy
      }]
    }, event as any, context as any)

    expect(actionSpy).toHaveBeenCalledWith({
      httpMethod: 'GET', headers: jasmine.anything(), requestContext: jasmine.anything(), path: "/", paths: {}
    }, context)
  })

  it('should remove basepath from root path if coming over custom domain name', () => {
    const actionSpy = jasmine.createSpy('action')
    const event = {
      httpMethod: 'GET', path: "/shortcut-itemsdev",
      headers: { Host: "api.ep.welt.de" },
      requestContext: { apiId: 'blabla' }
    }
    proxyIntegration({
      routes: [{
        method: 'GET',
        path: '/',
        action: actionSpy
      }]
    }, event as any, context)
    expect(actionSpy).toHaveBeenCalledWith({
      httpMethod: 'GET', headers: jasmine.anything(), requestContext: jasmine.anything(), path: "/", paths: {}
    }, context)
  })
  it('should remove basepath from multi-slash-path if coming over custom domain name', () => {
    const actionSpy = jasmine.createSpy('action')
    const event = {
      httpMethod: 'GET', path: "/shortcut-itemsdev/123/456",
      headers: { Host: "api.ep.welt.de" },
      requestContext: { apiId: 'blabla' }
    }
    proxyIntegration({
      routes: [{
        method: 'GET',
        path: '/123/456',
        action: actionSpy
      }]
    }, event as any, context)
    expect(actionSpy).toHaveBeenCalledWith({
      httpMethod: 'GET',
      headers: jasmine.anything(),
      requestContext: jasmine.anything(),
      path: "/123/456",
      paths: {}
    }, context)
  })
  it('should not change path if not coming over custom domain name', async () => {
    await assertPathIsUnchanged("blabla.execute-api.eu-central-1.amazonaws.com")
  })
  it('should not change path if coming over localhost', async () => {
    await assertPathIsUnchanged("localhost")
  })
  it('should return 400 for an invalid body', async () => {
    const result = await proxyIntegration({ routes: [{} as any] },
      { httpMethod: 'GET', path: '/', body: '{keinJson' } as APIGatewayProxyEvent, context)
    expect(result).toEqual({
      statusCode: 400,
      body: JSON.stringify({ "message": "body is not a valid JSON", "error": "ParseError" }),
      headers: jasmine.anything()
    })
  })
  it('should return error for no process found', async () => {
    const result = await proxyIntegration({ routes: [{} as any] }, { httpMethod: 'GET', path: '/' } as APIGatewayProxyEvent, context)

    expect(result).toEqual({
      statusCode: 404,
      body: jasmine.stringMatching(/Could not find/),
      headers: jasmine.anything()
    })
  })
  it('should return null if it is not an http request', () => {
    const result = proxyIntegration({ routes: [{} as any] }, {} as any, context)
    expect(result).toBe(null)
  })
  forEach([
    ['GET', '/'],
    ['POST', '/'],
    ['PUT', '/'],
    ['DELETE', '/'],
    ['GET', '/abc/def'],
    ['POST', '/abc'],
    ['PUT', '/abc/def/ghi']
  ]).it('should call action for on method/staticPath', async (method: string, path: string) => {
    const routeConfig: ProxyIntegrationConfig = {
      routes: [
        { method, path, action: () => ({ foo: 'bar' }) as any }
      ]
    }
    const result = await proxyIntegration(routeConfig, { path, httpMethod: method } as APIGatewayProxyEvent, context)
    expect(result).toEqual({
      statusCode: 200,
      headers: jasmine.anything(),
      body: JSON.stringify({ foo: 'bar' })
    })
  })
  forEach([
    ['/:param1', '/p1', { param1: 'p1' }],
    ['/abc/:param1', '/abc/p1', { param1: 'p1' }],
    ['/abc/def/:param1', '/abc/def/p1', { param1: 'p1' }],
    ['/:param1/abc/:param2', '/p1/abc/p2', { param1: 'p1', param2: 'p2' }],
    ['/:param1/abc/def/:param2', '/p1/abc/def/p2', { param1: 'p1', param2: 'p2' }]
  ]).it('should call action with path params for method/path', async (pathConfig, path, expectedPathValues) => {
    const spiedAction = jasmine.createSpy('action').and.returnValue({ foo: 'bar' })
    const routeConfig: ProxyIntegrationConfig = {
      routes: [
        {
          method: 'GET',
          path: pathConfig,
          action: spiedAction
        }
      ]
    }
    await proxyIntegration(routeConfig, { path, httpMethod: 'GET' } as APIGatewayProxyEvent, context)
    expect(spiedAction).toHaveBeenCalledWith({ path, httpMethod: 'GET', paths: expectedPathValues }, context)
  })


  it('should return default headers', async () => {
    const routeConfig: ProxyIntegrationConfig = {
      defaultHeaders: { 'a': '1', 'b': '2' },
      routes: [
        {
          method: 'GET',
          path: '/',
          action: () => ({}) as any
        }
      ]
    }
    const result = await proxyIntegration(routeConfig, { path: '/', httpMethod: 'GET' } as APIGatewayProxyEvent, context)
    expect(result).toEqual({
      statusCode: 200,
      headers: { "Content-Type": "application/json", "a": "1", "b": "2" },
      body: "{}"
    })
  })


  it('should return error headers', async () => {
    const routeConfig = {
      routes: [
        {
          method: 'GET',
          path: '/',
          action: (): any => (Promise.resolve())
        }
      ]
    }
    const result = await proxyIntegration(routeConfig, { path: '/', httpMethod: 'GET' } as APIGatewayProxyEvent, context)
    expect(result).toEqual({
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: "{}"
    })
  })

  it('should return error including CORS header', async () => {
    const routeConfig = {
      cors: true,
      routes: [
        {
          method: 'GET',
          path: '/',
          action: () => {
            throw { reason: 'myerror', message: 'bla' }
          }
        }
      ],
      errorMapping: { 'myerror': 501 }
    }
    const result = await proxyIntegration(routeConfig, { path: '/', httpMethod: 'GET' } as APIGatewayProxyEvent, context)
    expect(result).toEqual({
      statusCode: 501,
      body: '{"message":"bla","error":"myerror"}',
      headers: Object.assign({ "Content-Type": "application/json" }, expectedCorsHeaders)
    })
  })
  it('should modify incorrect error', async () => {
    const incorrectError = { body: { reason: 'oops' } }
    const routeConfig = {
      routes: [
        {
          method: 'GET',
          path: '/',
          action: () => {
            throw incorrectError
          }
        }
      ]
    }
    const result = await proxyIntegration(routeConfig, { path: '/', httpMethod: 'GET' } as APIGatewayProxyEvent, context)
    expect(result).toEqual({
      statusCode: 500,
      body: JSON.stringify({ error: "ServerError", message: "Generic error:" + JSON.stringify(incorrectError) }),
      headers: expectedCorsHeaders
    })
  })

  it('should pass through error statuscode', async () => {
    const statusCodeError = { status: 666, message: { reason: 'oops' } }
    const routeConfig = {
      routes: [
        {
          method: 'GET',
          path: '/',
          action: () => {
            throw statusCodeError
          }
        }
      ]
    }
    const result = await proxyIntegration(routeConfig, { path: '/', httpMethod: 'GET' } as APIGatewayProxyEvent, context)
    expect(result).toEqual({
      statusCode: 666,
      body: '{"message":{"reason":"oops"},"error":666}',
      headers: expectedCorsHeaders
    })
  })
})

describe('proxyIntegration.proxyPath', () => {

  it('single proxy path', async () => {
    const spiedAction = jasmine.createSpy('action').and.returnValue({ })
    const routeConfig: ProxyIntegrationConfig = {
      proxyPath: 'apiPath',
      routes: [
        {
          method: 'GET',
          path: '/article/list',
          action: spiedAction
        }
      ]
    }

    const result = await proxyIntegration(routeConfig, { resource: "/{apiPath+}",
                        path: "/article/list",
                        pathParameters: { apiPath: "/article/list" },
                        httpMethod: 'GET' } as any, context)

    expect(spiedAction).toHaveBeenCalledWith({ resource: "/{apiPath+}", paths: {}, path: "/article/list", httpMethod: 'GET', pathParameters: { apiPath: "/article/list" } }, context)
    expect(result).toEqual({
      statusCode: 200,
      body: '{}',
      headers: Object.assign({ "Content-Type": "application/json" })
    })

  })

  it('multiple proxy path', async () => {
    const articleAction = jasmine.createSpy('action').and.returnValue({ })
    const sectionAction = jasmine.createSpy('action').and.returnValue({ })
    const routeConfig: ProxyIntegrationConfig = {
      proxyPath: 'apiPath',
      routes: [
        {
          method: 'GET',
          path: '/article/list',
          action: articleAction
        },
        {
          method: 'GET',
          path: '/section/list',
          action: sectionAction
        }
      ]
    }
    await proxyIntegration(routeConfig, { resource: "/{apiPath+}",
      path: "/article/list",
      pathParameters: { apiPath: "/article/list" },
      httpMethod: 'GET' } as any, context)
    expect(articleAction).toHaveBeenCalledWith({ resource: "/{apiPath+}", paths: {}, path: "/article/list", httpMethod: 'GET', pathParameters: { apiPath: "/article/list" } }, context)
    expect(sectionAction).not.toHaveBeenCalled()

    await proxyIntegration(routeConfig, { resource: "/{apiPath+}",
      path: "/section/list",
      pathParameters: { apiPath: "/section/list" },
      httpMethod: 'GET' } as any, context)
    expect(sectionAction).toHaveBeenCalledWith({ resource: "/{apiPath+}", paths: {}, path: "/section/list", httpMethod: 'GET', pathParameters: { apiPath: "/section/list" } }, context)

  })
})

describe('proxyIntegration.routeHandler.returnvalues', () => {
  it('should return async result with custom response object', async () => {

    const customBody = {
      statusCode: 201,
      headers: {
        'x-test-header': 'x-value'
      },
      body: JSON.stringify({ foo: 'bar' })
    }

    const routeConfig = {
      routes: [
        { method: 'GET', path: '/', action: () => Promise.resolve(customBody) }
      ]
    }
    const result = await proxyIntegration(routeConfig, { path: '/', httpMethod: 'GET' } as APIGatewayProxyEvent, context)
    expect(result).toEqual({
      statusCode: 201,
      headers: {
        'x-test-header': 'x-value',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ foo: 'bar' })
    })
  })

  it('should return async result', async () => {
    const routeConfig = {
      routes: [
        { method: 'GET', path: '/', action: () => Promise.resolve({ foo: 'bar' } as any) }
      ]
    }
    const result = await proxyIntegration(routeConfig, { path: '/', httpMethod: 'GET' } as APIGatewayProxyEvent, context)
    expect(result).toEqual({
      statusCode: 200,
      headers: jasmine.anything(),
      body: JSON.stringify({ foo: 'bar' })
    })
  })

  it('should return async error', async () => {
    const routeConfig = {
      routes: [
        { method: 'GET', path: '/', action: () => Promise.reject({ reason: 'myError', message: 'doof' }) }
      ],
      errorMapping: { 'myError': 599 }
    }
    const result = await proxyIntegration(routeConfig, { path: '/', httpMethod: 'GET' } as APIGatewayProxyEvent, context)
    expect(result).toEqual({
      statusCode: 599,
      body: '{"message":"doof","error":"myError"}',
      headers: { "Content-Type": "application/json" }
    })
  })
})

const assertPathIsUnchanged = async (hostname: string) => {
  const actionSpy = jasmine.createSpy('action')
  const event = {
    httpMethod: 'GET', path: "/123/456",
    headers: { Host: hostname },
    requestContext: { apiId: 'blabla' }
  }
  await proxyIntegration({
    routes: [{
      method: 'GET',
      path: '/123/456',
      action: actionSpy
    }]
  }, event as any, context)
  expect(actionSpy).toHaveBeenCalledWith({
    httpMethod: 'GET',
    headers: jasmine.anything(),
    requestContext: jasmine.anything(),
    path: "/123/456",
    paths: {}
  }, context)
}

