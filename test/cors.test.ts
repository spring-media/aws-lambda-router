
import { addCorsHeaders, CorsOptions } from '../lib/cors';
import { APIGatewayProxyEvent } from 'aws-lambda'

describe('CORS', () => {
  it('should return an empty headers object when cors option is set to false', () => {
    const headers = addCorsHeaders(false, {} as APIGatewayProxyEvent)
    expect(headers).toEqual({})
  })

  it('should return the default headers when cors options is set to true', () => {
    const headers = addCorsHeaders(true, {} as APIGatewayProxyEvent)
    expect(headers).toEqual({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,HEAD,PATCH',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'
    })
  })

  describe('option methods', () => {
    it('should update Access-Control-Allow-Methods header when passed a string', () => {
      const headers = addCorsHeaders({
        methods: 'GET,POST'
      }, {} as APIGatewayProxyEvent)
      expect(headers).toEqual({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'
      })
    })
    it('should update Access-Control-Allow-Methods header when passed an array', () => {
      const headers = addCorsHeaders({
        methods: ['GET','POST','PUT']
      }, {} as APIGatewayProxyEvent)
      expect(headers).toEqual({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PUT',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'
      })
    })
  })

  describe('option credentials', () => {
    it('should add Access-Control-Allow-Credentials', () => {
      const headers = addCorsHeaders({
        credentials: true
      }, {} as APIGatewayProxyEvent)
      expect(headers).toEqual({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,HEAD,PATCH',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Credentials': 'true'        
      })
    })
  })

  describe('option maxAge', () => {
    it('should add Access-Control-Max-Age', () => {
      const headers = addCorsHeaders({
        maxAge: 1000
      }, {} as APIGatewayProxyEvent)
      expect(headers).toEqual({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,HEAD,PATCH',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Max-Age': '1000'        
      })
    })
  })

  describe('option exposedHeaders', () => {
    it('should update Access-Control-Expose-Headers header when passed a string', () => {
      const headers = addCorsHeaders({
        exposedHeaders: 'Header1,Header2'
      }, {} as APIGatewayProxyEvent)
      expect(headers).toEqual({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,HEAD,PATCH',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Expose-Headers': 'Header1,Header2'
      })
    })
    it('should update Access-Control-Expose-Headers header when passed an array', () => {
      const headers = addCorsHeaders({
        exposedHeaders: ['Header1','Header2']
      }, {} as APIGatewayProxyEvent)
      expect(headers).toEqual({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,HEAD,PATCH',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Expose-Headers': 'Header1,Header2'
      })
    })
  })

  describe('option allowedHeaders', () => {
    it('should update Access-Control-Allow-Headers header when passed a string', () => {
      const headers = addCorsHeaders({
        allowedHeaders: 'Header1,Header2'
      }, {} as APIGatewayProxyEvent)
      expect(headers).toEqual({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,HEAD,PATCH',
        'Access-Control-Allow-Headers': 'Header1,Header2'
      })
    })
    it('should update Access-Control-Allow-Headers header when passed an array', () => {
      const headers = addCorsHeaders({
        allowedHeaders: ['Header1','Header2']
      }, {} as APIGatewayProxyEvent)
      expect(headers).toEqual({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,HEAD,PATCH',
        'Access-Control-Allow-Headers': 'Header1,Header2'
      })
    })
  })

  describe('option origin', () => {
    it('should set Access-Control-Allow-Origin header to \'*\' when passed a \'*\'', () => {
      const headers = addCorsHeaders({
        origin: '*'
      }, {} as APIGatewayProxyEvent)
      expect(headers).toEqual({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,HEAD,PATCH',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'
      })
    })
    it('should update Access-Control-Allow-Origin header when passed a single string value', () => {
      const headers = addCorsHeaders({
        origin: 'https://example.com'
      }, {} as APIGatewayProxyEvent)
      expect(headers).toEqual({
        'Access-Control-Allow-Origin': 'https://example.com',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,HEAD,PATCH',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Vary': 'Origin'
      })
    })
    it('should update Access-Control-Allow-Origin header when passed an array of string values', () => {
      const headers = addCorsHeaders({
        origin: ['https://example.com', 'https://hostname.com']
      }, {
        headers: {
          origin: 'https://example.com'
        } as any
      } as APIGatewayProxyEvent)
      expect(headers).toEqual({
        'Access-Control-Allow-Origin': 'https://example.com',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,HEAD,PATCH',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Vary': 'Origin'
      })
    })
    it('should set Access-Control-Allow-Origin header to false when passed an array of string values that don\'t match the origin', () => {
      const headers = addCorsHeaders({
        origin: ['https://example.com', 'https://hostname.com']
      }, {
        headers: {
          origin: 'https://notallowed.com'
        } as any
      } as APIGatewayProxyEvent)
      expect(headers).toEqual({
        'Access-Control-Allow-Origin': false,
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,HEAD,PATCH',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Vary': 'Origin'
      })
    })
    it('should set Access-Control-Allow-Origin header when passed a single Regexp value that is allowed', () => {
      const headers = addCorsHeaders({
        origin: /example\.com$/
      }, {
        headers: {
          origin: 'https://example.com'
        } as any
      } as APIGatewayProxyEvent)
      expect(headers).toEqual({
        'Access-Control-Allow-Origin': 'https://example.com',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,HEAD,PATCH',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Vary': 'Origin'
      })
    })
    it('should set Access-Control-Allow-Origin header to false when passed a single Regexp value that does not match', () => {
      const headers = addCorsHeaders({
        origin: /example\.com$/
      }, {
        headers: {
          origin: 'https://noteallowed.com'
        } as any
      } as APIGatewayProxyEvent)
      expect(headers).toEqual({
        'Access-Control-Allow-Origin': false,
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,HEAD,PATCH',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Vary': 'Origin'
      })
    })
    it('should set Access-Control-Allow-Origin header to the origin when passed a single Regexp value that does match', () => {
      const headers = addCorsHeaders({
        origin: /example\.com$/
      }, {
        headers: {
          origin: 'https://test.example.com'
        } as any
      } as APIGatewayProxyEvent)
      expect(headers).toEqual({
        'Access-Control-Allow-Origin': 'https://test.example.com',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,HEAD,PATCH',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Vary': 'Origin'
      })
    })
    it('should set Access-Control-Allow-Origin header when passed a function as the origin', () => {
      const headers = addCorsHeaders({
        origin(event: APIGatewayProxyEvent) {
          if (event.headers.origin === 'https://test.example.com'){
            return event.headers.origin
          }
          return false
        }
      }, {
        headers: {
          origin: 'https://test.example.com'
        } as any} as APIGatewayProxyEvent)
      expect(headers).toEqual({
        'Access-Control-Allow-Origin': 'https://test.example.com',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,HEAD,PATCH',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Vary': 'Origin'
      })
    })
    it('should set Access-Control-Allow-Origin header to false when passed a function as the origin and it does not match', () => {
      const headers = addCorsHeaders({
        origin(event: APIGatewayProxyEvent) {
          if (event.headers.origin === 'https://test.example.com') {
            return event.headers.origin
          }
          return false
        }
      }, {
        headers: {
          origin: 'https://not-allowed-origin.com'
        } as any} as APIGatewayProxyEvent)
      expect(headers).toEqual({
        'Access-Control-Allow-Origin': false,
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,HEAD,PATCH',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Vary': 'Origin'
      })
    })

    it('should set Access-Control-Allow-Origin header to the origin when passed an array or either Regexp or String value that does match origin', () => {
      const headers = addCorsHeaders({
        origin: [ /example\.com$/, 'http://test.com' ]
      } as CorsOptions, {
        headers: {
          origin: 'https://test.example.com'
        } as any
      } as APIGatewayProxyEvent)
      expect(headers).toEqual({
        'Access-Control-Allow-Origin': 'https://test.example.com',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,HEAD,PATCH',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Vary': 'Origin'
      })
    })
  })

  describe('setting and overriding multiple options', () => {
    const headers = addCorsHeaders({
      origin: [ /example\.com$/, 'http://test.com' ],
      methods: 'GET,POST',
      allowedHeaders: 'AllowedHeader1',
      exposedHeaders: ['Header1','Header2'],
      credentials: true,
      maxAge: 8600
    } as CorsOptions, {
      headers: {        origin: 'https://test.example.com',
      } as any
    } as APIGatewayProxyEvent)
    expect(headers).toEqual({
      'Access-Control-Allow-Origin': 'https://test.example.com',
      'Access-Control-Allow-Methods': 'GET,POST',
      'Access-Control-Allow-Headers': 'AllowedHeader1',
      'Vary': 'Origin',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '8600',
      'Access-Control-Expose-Headers': 'Header1,Header2'
    })


  })
})
