import { APIGatewayEventRequestContext, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

import { HttpMethod, ProcessMethod } from './EventProcessor'
import { addCorsHeaders, CorsOptions } from './cors';

type ProxyIntegrationParams = {
  paths?: { [paramId: string]: string }
  routePath?: string
}

type ProxyIntegrationBody<T = unknown> = {
  rawBody?: T
  body: T
}

type ErrorHandler = (error?: Error, request?: APIGatewayProxyEvent, context?: APIGatewayEventRequestContext) => Promise<APIGatewayProxyResult | void> | APIGatewayProxyResult | void
export type ProxyIntegrationEvent<T = unknown> = Omit<APIGatewayProxyEvent, 'body'> & ProxyIntegrationParams & ProxyIntegrationBody<T>
export type ProxyIntegrationResult = Omit<APIGatewayProxyResult, 'statusCode'> & { statusCode?: APIGatewayProxyResult['statusCode'] }

export interface ProxyIntegrationRoute {
  path: string
  method: HttpMethod
  action: (
    request: ProxyIntegrationEvent<unknown>,
    context: APIGatewayEventRequestContext
  ) => ProxyIntegrationResult | Promise<ProxyIntegrationResult> | string | Promise<string>
}

export type ProxyIntegrationErrorMapping = {
  [reason: string]: APIGatewayProxyResult['statusCode']
}

export type ProxyIntegrationError = {
  statusCode: APIGatewayProxyResult['statusCode'],
  message: string
} | {
  reason: string,
  message: string
}

export interface ProxyIntegrationConfig {
  onError?: ErrorHandler
  cors?: CorsOptions | boolean
  routes: ProxyIntegrationRoute[],
  removeBasePath?: boolean,
  debug?: boolean
  errorMapping?: ProxyIntegrationErrorMapping
  defaultHeaders?: APIGatewayProxyResult['headers']
  proxyPath?: string
}

const NO_MATCHING_ACTION = (request: ProxyIntegrationEvent) => {
  throw {
    reason: 'NO_MATCHING_ACTION',
    message: `Could not find matching action for ${request.path} and method ${request.httpMethod}`
  }
}

const processActionAndReturn = async (actionConfig: Pick<ProxyIntegrationRoute, 'action'>, event: ProxyIntegrationEvent,
  context: APIGatewayEventRequestContext, headers: APIGatewayProxyResult['headers']) => {

  const res = await actionConfig.action(event, context)
  if (!res || typeof res !== 'object' || typeof res.body !== 'string') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(res) || '{}'
    }
  }

  return {
    statusCode: 200,
    ...res,
    headers: {
      ...headers,
      ...res.headers
    }
  }
}

export const process: ProcessMethod<ProxyIntegrationConfig, APIGatewayProxyEvent, APIGatewayEventRequestContext, APIGatewayProxyResult> =
  (proxyIntegrationConfig, event, context) => {

    if (proxyIntegrationConfig.debug) {
      console.log('Lambda proxyIntegrationConfig: ', proxyIntegrationConfig)
      console.log('Lambda event: ', event)
      console.log('Lambda context: ', context)
    }

    //validate config
    if (!Array.isArray(proxyIntegrationConfig.routes) || proxyIntegrationConfig.routes.length < 1) {
      throw new Error('proxyIntegration.routes must not be empty')
    }

    // detect if it's an http-call at all:
    if (!event.httpMethod || !event.path) {
      return null
    }

    const headers: APIGatewayProxyResult['headers'] = proxyIntegrationConfig.cors ? addCorsHeaders(proxyIntegrationConfig.cors, event) : {};

    if (event.httpMethod === 'OPTIONS') {
      Object.assign(headers, proxyIntegrationConfig.defaultHeaders)
      return Promise.resolve({
        statusCode: 200,
        headers,
        body: ''
      })
    }

    Object.assign(headers, { 'Content-Type': 'application/json' }, proxyIntegrationConfig.defaultHeaders)

    // assure necessary values have sane defaults:
    const errorMapping = proxyIntegrationConfig.errorMapping || {}
    errorMapping['NO_MATCHING_ACTION'] = 404

    if (proxyIntegrationConfig.proxyPath) {
      event.path = (event.pathParameters || {})[proxyIntegrationConfig.proxyPath]
      if (proxyIntegrationConfig.debug) {
        console.log(`proxy path is set: ${proxyIntegrationConfig.proxyPath}`)
        console.log(`proxy path with event path: ${event.path}`)
      }
    } else {
      event.path = normalizeRequestPath(event, proxyIntegrationConfig.removeBasePath)
    }

    try {
      const httpMethod = event.httpMethod as HttpMethod;
      const actionConfig = findMatchingActionConfig(httpMethod, event.path, proxyIntegrationConfig) || {
        action: NO_MATCHING_ACTION,
        routePath: undefined,
        paths: undefined
      }

      const proxyEvent: ProxyIntegrationEvent = event

      proxyEvent.paths = actionConfig.paths
      proxyEvent.routePath = actionConfig.routePath
      if (event.body) {
        try {
          proxyEvent.rawBody = event.body
          proxyEvent.body = JSON.parse(event.body)
        } catch (parseError) {
          console.log(`Could not parse body as json: ${event.body}`, parseError)
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ message: 'body is not a valid JSON', error: 'ParseError' })
          }
        }
      }
      return processActionAndReturn(actionConfig, proxyEvent, context, headers).catch(async (error) => {
        console.log('Error while handling action function.', error)
        if (proxyIntegrationConfig.onError) {
          const result = await proxyIntegrationConfig.onError(error, event, context)
          if (result != undefined) {
            return { headers, ...result }
          }
        }

        return convertError(error, errorMapping, headers)
      })
    } catch (error) {
      console.log('Error while evaluating matching action handler', error)

      if (proxyIntegrationConfig.onError) {
        const promise = proxyIntegrationConfig.onError(error, event, context)
        Promise.resolve(promise).then(result => {
          if (result != undefined) {
            return { headers, ...result }
          }

          return convertError(error, errorMapping, headers)
        })
      }

      return convertError(error, errorMapping, headers)
    }
  }

const normalizeRequestPath = (event: APIGatewayProxyEvent, removeBasePath: boolean = true): string => {
  if (isLocalExecution(event)) {
    return event.path
  }
  // ugly hack: if host is from API-Gateway 'Custom Domain Name Mapping', then event.path has the value '/basepath/resource-path/'
  // if host is from amazonaws.com, then event.path is just '/resource-path':
  const apiId = event.requestContext ? event.requestContext.apiId : null // the apiId that is the first part of the amazonaws.com-host
  if ((apiId && event.headers && event.headers.Host && event.headers.Host.substring(0, apiId.length) !== apiId)
    && removeBasePath) {
    // remove first path element:
    const groups = /\/[^\/]+(.*)/.exec(event.path) || [null, null]
    return groups[1] || '/'
  }

  return event.path
}

const hasReason = (error: any): error is { reason: string } => typeof error.reason === 'string'
const hasStatus = (error: any): error is { statusCode: number } => typeof error.statusCode === 'number'

const convertError = (error: ProxyIntegrationError | Error, errorMapping?: ProxyIntegrationErrorMapping, headers?: APIGatewayProxyResult['headers']) => {
  if (hasReason(error) && errorMapping && errorMapping[error.reason]) {
    return {
      statusCode: errorMapping[error.reason],
      body: JSON.stringify({ message: error.message, error: error.reason }),
      headers
    }
  } else if (hasStatus(error)) {
    return {
      statusCode: error.statusCode,
      body: JSON.stringify({ message: error.message, error: error.statusCode }),
      headers: addCorsHeaders({}, {} as APIGatewayProxyEvent)
    }
  }
  try {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'ServerError', message: `Generic error:${JSON.stringify(error)}` }),
      headers: addCorsHeaders({}, {} as APIGatewayProxyEvent)
    }
  } catch (stringifyError) { }

  return {
    statusCode: 500,
    body: JSON.stringify({ error: 'ServerError', message: 'Generic error' })
  }
}

const findMatchingActionConfig = (httpMethod: HttpMethod, httpPath: string, routeConfig: ProxyIntegrationConfig):
  ProxyIntegrationRoute & ProxyIntegrationParams | null => {

  const paths: ProxyIntegrationParams['paths'] = {}
  const matchingMethodRoutes = routeConfig.routes.filter(route => route.method === httpMethod)
  for (const route of matchingMethodRoutes) {
    if (routeConfig.debug) {
      console.log(`Examining route ${route.path} to match ${httpPath}`)
    }
    const pathPartNames = extractPathNames(route.path)
    const pathValues = extractPathValues(route.path, httpPath)
    if (pathValues && pathPartNames) {
      for (let ii = 0; ii < pathValues.length; ii++) {
        paths[pathPartNames[ii]] = decodeURIComponent(pathValues[ii])
      }
      if (routeConfig.debug) {
        console.log(`Found matching route ${route.path} with paths`, paths)
      }
      return {
        ...route,
        routePath: route.path,
        paths
      }
    }
  }
  if (routeConfig.debug) {
    console.log(`No match for ${httpPath}`)
  }

  return null
}

const extractPathValues = (pathExpression: string, httpPath: string) => {
  const pathExpressionPattern = pathExpression.replace(/{[\w]+}|:[\w]+/g, '([^/]+)')
  const pathValueRegex = new RegExp(`^${pathExpressionPattern}$`)
  const pathValues = pathValueRegex.exec(httpPath)
  return pathValues && pathValues.length > 0 ? pathValues.slice(1) : null
}

const extractPathNames = (pathExpression: string) => {
  const pathExpressionPattern = pathExpression.replace(/{[\w.]+}|:[\w.]+/g, '[:{]([\\w]+)}?')
  const pathNameRegex = new RegExp(`^${pathExpressionPattern}$`)
  const pathNames = pathNameRegex.exec(pathExpression)
  return pathNames && pathNames.length > 0 ? pathNames.slice(1) : null
}

const isLocalExecution = (event: ProxyIntegrationEvent) => {
  return event.headers
    && event.headers.Host
    && (event.headers.Host.startsWith('localhost') || event.headers.Host.startsWith('127.0.0.1'))
}
