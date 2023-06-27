import {
  APIGatewayEventRequestContext,
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda'

import { HttpMethod, ProcessMethod } from './EventProcessor'
import { addCorsHeaders, CorsOptions } from './corsV2'

type ProxyIntegrationParams = {
  paths?: { [paramId: string]: string }
  routePath?: string
}

type ProxyIntegrationBody<T = unknown> = {
  body: T
}

type ErrorHandler = (
  error?: Error,
  request?: APIGatewayProxyEventV2,
  context?: APIGatewayEventRequestContext
) =>
  | Promise<APIGatewayProxyStructuredResultV2 | void>
  | APIGatewayProxyStructuredResultV2
  | void
export type ProxyIntegrationEvent<T = unknown> = Omit<
  APIGatewayProxyEventV2,
  'body'
> &
  ProxyIntegrationParams &
  ProxyIntegrationBody<T>
export type ProxyIntegrationResult = Omit<
  APIGatewayProxyStructuredResultV2,
  'statusCode'
> & { statusCode?: APIGatewayProxyStructuredResultV2['statusCode'] }

export interface ProxyIntegrationRoute {
  path: string
  method: HttpMethod
  action: (
    request: ProxyIntegrationEvent<unknown>,
    context: APIGatewayEventRequestContext
  ) =>
    | ProxyIntegrationResult
    | Promise<ProxyIntegrationResult>
    | string
    | Promise<string>
}

export type ProxyIntegrationErrorMapping = {
  [reason: string]: APIGatewayProxyStructuredResultV2['statusCode']
}

export type ProxyIntegrationError =
  | {
      statusCode: APIGatewayProxyStructuredResultV2['statusCode']
      message: string
    }
  | {
      reason: string
      message: string
    }

export interface ProxyIntegrationConfig {
  onError?: ErrorHandler
  cors?: CorsOptions | boolean
  routes: ProxyIntegrationRoute[]
  removeBasePath?: boolean
  debug?: boolean
  errorMapping?: ProxyIntegrationErrorMapping
  defaultHeaders?: APIGatewayProxyStructuredResultV2['headers']
  proxyPath?: string
}

const NO_MATCHING_ACTION = (request: ProxyIntegrationEvent) => {
  throw {
    reason: 'NO_MATCHING_ACTION',
    message: `Could not find matching action for ${request.requestContext.http.path} and method ${request.requestContext.http.method}`,
  }
}

const processActionAndReturn = async (
  actionConfig: Pick<ProxyIntegrationRoute, 'action'>,
  event: ProxyIntegrationEvent,
  context: APIGatewayEventRequestContext,
  headers: APIGatewayProxyStructuredResultV2['headers']
) => {
  const res = await actionConfig.action(event, context)
  if (!res || typeof res !== 'object' || typeof res.body !== 'string') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(res) || '{}',
    }
  }

  return {
    statusCode: 200,
    ...res,
    headers: {
      ...headers,
      ...res.headers,
    },
  }
}

export const process: ProcessMethod<
  ProxyIntegrationConfig,
  APIGatewayProxyEventV2,
  APIGatewayEventRequestContext,
  APIGatewayProxyStructuredResultV2
> = (proxyIntegrationConfig, event, context) => {
  if (proxyIntegrationConfig.debug) {
    console.log('Lambda proxyIntegrationConfig: ', proxyIntegrationConfig)
    console.log('Lambda event: ', event)
    console.log('Lambda context: ', context)
  }

  //validate config
  if (
    !Array.isArray(proxyIntegrationConfig.routes) ||
    proxyIntegrationConfig.routes.length < 1
  ) {
    throw new Error('proxyIntegration.routes must not be empty')
  }

  // detect if it's an http-call at all:
  if (!event.requestContext.http.method || !event.requestContext.http.path) {
    return null
  }

  const headers: APIGatewayProxyStructuredResultV2['headers'] =
    proxyIntegrationConfig.cors
      ? addCorsHeaders(proxyIntegrationConfig.cors, event)
      : {}

  if (event.requestContext.http.method === 'OPTIONS') {
    Object.assign(headers, proxyIntegrationConfig.defaultHeaders)
    return Promise.resolve({
      statusCode: 200,
      headers,
      body: '',
    })
  }

  Object.assign(
    headers,
    { 'Content-Type': 'application/json' },
    proxyIntegrationConfig.defaultHeaders
  )

  // assure necessary values have sane defaults:
  const errorMapping = proxyIntegrationConfig.errorMapping || {}
  errorMapping['NO_MATCHING_ACTION'] = 404

  if (proxyIntegrationConfig.proxyPath) {
    event.requestContext.http.path = (event.pathParameters || {})[
      proxyIntegrationConfig.proxyPath
    ]
    if (proxyIntegrationConfig.debug) {
      console.log(`proxy path is set: ${proxyIntegrationConfig.proxyPath}`)
      console.log(
        `proxy path with event path: ${event.requestContext.http.path}`
      )
    }
  } else {
    event.requestContext.http.path = normalizeRequestPath(
      event,
      proxyIntegrationConfig.removeBasePath
    )
  }

  try {
    const httpMethod = event.requestContext.http.method as HttpMethod
    const actionConfig = findMatchingActionConfig(
      httpMethod,
      event.requestContext.http.path,
      proxyIntegrationConfig
    ) || {
      action: NO_MATCHING_ACTION,
      routePath: undefined,
      paths: undefined,
    }

    const proxyEvent: ProxyIntegrationEvent = event

    proxyEvent.paths = actionConfig.paths
    proxyEvent.routePath = actionConfig.routePath
    if (event.body) {
      try {
        proxyEvent.body = JSON.parse(event.body)
      } catch (parseError) {
        console.log(`Could not parse body as json: ${event.body}`, parseError)
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            message: 'body is not a valid JSON',
            error: 'ParseError',
          }),
        }
      }
    }
    return processActionAndReturn(
      actionConfig,
      proxyEvent,
      context,
      headers
    ).catch(async (error) => {
      console.log('Error while handling action function.', error)
      if (proxyIntegrationConfig.onError) {
        const result = await proxyIntegrationConfig.onError(
          error,
          event,
          context
        )
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
      Promise.resolve(promise).then((result) => {
        if (result != undefined) {
          return { headers, ...result }
        }

        return convertError(error, errorMapping, headers)
      })
    }

    return convertError(error, errorMapping, headers)
  }
}

const normalizeRequestPath = (
  event: APIGatewayProxyEventV2,
  removeBasePath: boolean = true
): string => {
  if (isLocalExecution(event)) {
    return event.requestContext.http.path
  }
  // ugly hack: if host is from API-Gateway 'Custom Domain Name Mapping', then event.path has the value '/basepath/resource-path/'
  // if host is from amazonaws.com, then event.path is just '/resource-path':
  const apiId = event.requestContext ? event.requestContext.apiId : null // the apiId that is the first part of the amazonaws.com-host
  if (
    apiId &&
    event.headers &&
    event.headers.Host &&
    event.headers.Host.substring(0, apiId.length) !== apiId &&
    removeBasePath
  ) {
    // remove first path element:
    const groups = /\/[^\/]+(.*)/.exec(event.requestContext.http.path) || [
      null,
      null,
    ]
    return groups[1] || '/'
  }

  return event.requestContext.http.path
}

const hasReason = (error: any): error is { reason: string } =>
  typeof error.reason === 'string'
const hasStatus = (error: any): error is { statusCode: number } =>
  typeof error.statusCode === 'number'

const convertError = (
  error: ProxyIntegrationError | Error,
  errorMapping?: ProxyIntegrationErrorMapping,
  headers?: APIGatewayProxyStructuredResultV2['headers']
) => {
  if (hasReason(error) && errorMapping && errorMapping[error.reason]) {
    return {
      statusCode: errorMapping[error.reason],
      body: JSON.stringify({ message: error.message, error: error.reason }),
      headers,
    }
  } else if (hasStatus(error)) {
    return {
      statusCode: error.statusCode,
      body: JSON.stringify({ message: error.message, error: error.statusCode }),
      headers: addCorsHeaders({}, {} as APIGatewayProxyEventV2),
    }
  }
  try {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'ServerError',
        message: `Generic error:${JSON.stringify(error)}`,
      }),
      headers: addCorsHeaders({}, {} as APIGatewayProxyEventV2),
    }
  } catch (stringifyError) {}

  return {
    statusCode: 500,
    body: JSON.stringify({ error: 'ServerError', message: 'Generic error' }),
  }
}

const findMatchingActionConfig = (
  httpMethod: HttpMethod,
  httpPath: string,
  routeConfig: ProxyIntegrationConfig
): (ProxyIntegrationRoute & ProxyIntegrationParams) | null => {
  const paths: ProxyIntegrationParams['paths'] = {}
  const matchingMethodRoutes = routeConfig.routes.filter(
    (route) => route.method === httpMethod
  )
  for (const route of matchingMethodRoutes) {
    if (routeConfig.debug) {
      console.log(`Examining route ${route.path} to match ${httpPath}`)
    }
    const pathPartNames = extractPathNames(route.path)
    const pathValues = extractPathValues(route.path, httpPath)
    if (pathValues && pathPartNames) {
      for (let ii = 0 ii < pathValues.length ii++) {
        paths[pathPartNames[ii]] = decodeURIComponent(pathValues[ii])
      }
      if (routeConfig.debug) {
        console.log(`Found matching route ${route.path} with paths`, paths)
      }
      return {
        ...route,
        routePath: route.path,
        paths,
      }
    }
  }
  if (routeConfig.debug) {
    console.log(`No match for ${httpPath}`)
  }

  return null
}

const extractPathValues = (pathExpression: string, httpPath: string) => {
  const pathExpressionPattern = pathExpression.replace(
    /{[\w]+}|:[\w]+/g,
    '([^/]+)'
  )
  const pathValueRegex = new RegExp(`^${pathExpressionPattern}$`)
  const pathValues = pathValueRegex.exec(httpPath)
  return pathValues && pathValues.length > 0 ? pathValues.slice(1) : null
}

const extractPathNames = (pathExpression: string) => {
  const pathExpressionPattern = pathExpression.replace(
    /{[\w.]+}|:[\w.]+/g,
    '[:{]([\\w]+)}?'
  )
  const pathNameRegex = new RegExp(`^${pathExpressionPattern}$`)
  const pathNames = pathNameRegex.exec(pathExpression)
  return pathNames && pathNames.length > 0 ? pathNames.slice(1) : null
}

const isLocalExecution = (event: APIGatewayProxyEventV2) => {
  return (
    event.headers &&
    event.headers.Host &&
    (event.headers.Host.startsWith('localhost') ||
      event.headers.Host.startsWith('127.0.0.1'))
  )
}
