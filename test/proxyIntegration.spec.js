"use strict";

// helper for parameterized tests (http://blog.piotrturski.net/2015/04/jasmine-parameterized-tests.html)
function forEach(arrayOfArrays) {
    return {
        it: (description, testCaseFunction) => {
            arrayOfArrays.forEach(innerArray => {
                it(description + ' ' + JSON.stringify(innerArray), (done) => {
                    testCaseFunction.apply(this, innerArray.concat(done));
                });
            });
        }
    };
}

const proxyIntegration = require('../lib/proxyIntegration');
const expectedCorsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,HEAD,PATCH",
    "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token"
};

describe('proxyIntegration.routeHandler.selection', () => {
    it('should select longer match without context (for backward compatibility)', () => {
        const actionSpy = jasmine.createSpy('action');
        proxyIntegration({
            routes: [
                {path: '/', method: 'GET', action: () => '/'},
                {path: '/123', method: 'POST', action: () => '123'},
                {path: '/123', method: 'GET', action: actionSpy}
            ]
        }, {httpMethod: 'GET', path: '/123'}, () => {
        });
        expect(actionSpy).toHaveBeenCalledWith({httpMethod: 'GET', path: '/123', paths: {}}, jasmine.anything());
    });

    it('should select longer match', () => {
        const actionSpy = jasmine.createSpy('action');
        proxyIntegration({
            routes: [
                {path: '/', method: 'GET', action: () => '/'},
                {path: '/123', method: 'POST', action: () => '123'},
                {path: '/123', method: 'GET', action: actionSpy}
            ]
        }, {httpMethod: 'GET', path: '/123'}, {}, () => {
        });
        expect(actionSpy).toHaveBeenCalledWith({httpMethod: 'GET', path: '/123', paths: {}}, {});
    });
    it('should select parameter match', () => {
        const actionSpy = jasmine.createSpy('action');
        proxyIntegration({
            routes: [
                {path: '/', method: 'GET', action: () => '/'},
                {path: '/123', method: 'GET', action: () => '123'},
                {path: '/:param', method: 'GET', action: actionSpy}
            ]
        }, {httpMethod: 'GET', path: '/456'}, {}, () => {
        });
        expect(actionSpy).toHaveBeenCalledWith({httpMethod: 'GET', path: '/456', paths: {param: '456'}}, {});
    });
    it('should select static match', () => {
        const actionSpy = jasmine.createSpy('action');
        const context = {};
        proxyIntegration({
            routes: [
                {path: '/', method: 'GET', action: () => '/'},
                {path: '/123', method: 'GET', action: actionSpy},
                {path: '/:param', method: 'GET', action: () => 'param'}
            ]
        }, {httpMethod: 'GET', path: '/123'}, context, () => {
        });
        expect(actionSpy).toHaveBeenCalledWith({httpMethod: 'GET', path: '/123', paths: {}}, context);
    });
    it('should match urlencoded path', () => {
        const actionSpy = jasmine.createSpy('action');
        const context = {};
        proxyIntegration({
            routes: [
                {path: '/', method: 'GET', action: () => '/'},
                {path: '/123', method: 'GET', action: () => '123'},
                {path: '/:param', method: 'GET', action: actionSpy}
            ]
        }, {httpMethod: 'GET', path: '/%2Fwirtschaft%2Farticle85883...tml'}, context, () => {
        });
        expect(actionSpy).toHaveBeenCalledWith({
            httpMethod: 'GET',
            path: '/%2Fwirtschaft%2Farticle85883...tml',
            paths: {param: '/wirtschaft/article85883...tml'}
        }, context);
    });
    it('should select match containing hyphen', () => {
        const actionSpy = jasmine.createSpy('action');
        const context = {};
        proxyIntegration({
            routes: [
                {path: '/:param', method: 'GET', action: actionSpy}
            ]
        }, {httpMethod: 'GET', path: '/%2Fdeutschland-bewegt-sich%2F'}, context, () => {
        });
        expect(actionSpy).toHaveBeenCalledWith({
            httpMethod: 'GET',
            path: '/%2Fdeutschland-bewegt-sich%2F',
            paths: {param: '/deutschland-bewegt-sich/'}
        }, context);
    });
    it('should select match containing question marks and dots', () => {
        const actionSpy = jasmine.createSpy('action');
        const context = {};
        proxyIntegration({
            routes: [
                {path: '/:param', method: 'GET', action: actionSpy}
            ]
        }, {
            httpMethod: 'GET',
            path: '/%2Fboerse%2FResources%2FImages%2Fcss%2Farrows_change-2.0.1.png?rfid=2013011501'
        }, context, () => {
        });
        expect(actionSpy).toHaveBeenCalledWith({
            httpMethod: 'GET',
            path: '/%2Fboerse%2FResources%2FImages%2Fcss%2Farrows_change-2.0.1.png?rfid=2013011501',
            paths: {param: '/boerse/Resources/Images/css/arrows_change-2.0.1.png?rfid=2013011501'}
        }, context);
    });
    it('should add cors headers to OPTIONS request', (done) => {
        proxyIntegration({
            routes: [{}],
            cors: true
        }, {httpMethod: 'OPTIONS', path: '/'}).then(result => {
            expect(result).toEqual({
                statusCode: 200,
                headers: expectedCorsHeaders,
                body: ''
            });
            done();
        });
    });
    it('should add cors headers to GET request', (done) => {
        proxyIntegration({
            routes: [{path: '/', method: 'GET', action: () => '/'}],
            cors: true
        }, {httpMethod: 'GET', path: '/'}).then(result => {
            expect(result).toEqual({
                statusCode: 200,
                headers: Object.assign({"Content-Type": "application/json"}, expectedCorsHeaders),
                body: '"/"'
            });
            done();
        });
    })
});

describe('proxyIntegration.routeHandler', () => {
    it('call with context', () => {
        const actionSpy = jasmine.createSpy('action');
        const event = {
            httpMethod: 'GET', path: "/shortcut-itemsdev",
            headers: {Host: "api.ep.welt.de"},
            requestContext: {apiId: 'blabla'}
        };
        const context = {
            awsRequestId: "ab-dc",
            functionName: "name"
        };

        proxyIntegration({
            routes: [{
                method: 'GET',
                path: '/',
                action: actionSpy
            }]
        }, event, context, () => {
        });

        expect(actionSpy).toHaveBeenCalledWith({
            httpMethod: 'GET', headers: jasmine.anything(), requestContext: jasmine.anything(), path: "/", paths: {}
        }, context);
    });

    it('should remove basepath from root path if coming over custom domain name', () => {
        const actionSpy = jasmine.createSpy('action');
        const context = {};
        const event = {
            httpMethod: 'GET', path: "/shortcut-itemsdev",
            headers: {Host: "api.ep.welt.de"},
            requestContext: {apiId: 'blabla'}
        };
        proxyIntegration({
            routes: [{
                method: 'GET',
                path: '/',
                action: actionSpy
            }]
        }, event, context, () => {
        });
        expect(actionSpy).toHaveBeenCalledWith({
            httpMethod: 'GET', headers: jasmine.anything(), requestContext: jasmine.anything(), path: "/", paths: {}
        }, context);
    });
    it('should remove basepath from multi-slash-path if coming over custom domain name', () => {
        const actionSpy = jasmine.createSpy('action');
        const context = {};
        const event = {
            httpMethod: 'GET', path: "/shortcut-itemsdev/123/456",
            headers: {Host: "api.ep.welt.de"},
            requestContext: {apiId: 'blabla'}
        };
        proxyIntegration({
            routes: [{
                method: 'GET',
                path: '/123/456',
                action: actionSpy
            }]
        }, event, context, () => {
        });
        expect(actionSpy).toHaveBeenCalledWith({
            httpMethod: 'GET',
            headers: jasmine.anything(),
            requestContext: jasmine.anything(),
            path: "/123/456",
            paths: {}
        }, context);
    });
    it('should not change path if not coming over custom domain name', () => {
        assertPathIsUnchanged("blabla.execute-api.eu-central-1.amazonaws.com");
    });
    it('should not change path if coming over localhost', () => {
        assertPathIsUnchanged("localhost");
    });
    it('should return 400 for an invalid body', (done) => {
        proxyIntegration({routes: [{}]}, {httpMethod: 'GET', path: '/', body: '{keinJson'}).then(result => {
            expect(result).toEqual({
                statusCode: 400,
                body: JSON.stringify({"message":"body is not a valid JSON","error":"ParseError"}),
                headers: jasmine.anything()
            });
            done();
        });
    });
    it('should return error for no process found', (done) => {
        proxyIntegration({routes: [{}]}, {httpMethod: 'GET', path: '/'}).then(result => {
            expect(result).toEqual({
                statusCode: 404,
                body: jasmine.stringMatching(/Could not find/),
                headers: jasmine.anything()
            });
            done();
        });
    });
    it('should return null if it is not an http request', () => {
        const result = proxyIntegration({routes: [{}]}, {});
        expect(result).toBe(null);
    });
    forEach([
        ['GET', '/'],
        ['POST', '/'],
        ['PUT', '/'],
        ['DELETE', '/'],
        ['GET', '/abc/def'],
        ['POST', '/abc'],
        ['PUT', '/abc/def/ghi']
    ]).it('should call action for on method/staticPath', (method, path, done) => {
        const callback = jasmine.createSpy('callback');
        const routeConfig = {
            routes: [
                {method: method, path: path, action: () => ({foo: 'bar'})}
            ]
        };
        proxyIntegration(routeConfig, {path: path, httpMethod: method}).then(result=>{
            expect(result).toEqual({
                statusCode: 200,
                headers: jasmine.anything(),
                body: JSON.stringify({foo: 'bar'})
            });
            done();
        });
    });
    forEach([
        ['/:param1', '/p1', {param1: 'p1'}],
        ['/abc/:param1', '/abc/p1', {param1: 'p1'}],
        ['/abc/def/:param1', '/abc/def/p1', {param1: 'p1'}],
        ['/:param1/abc/:param2', '/p1/abc/p2', {param1: 'p1', param2: 'p2'}],
        ['/:param1/abc/def/:param2', '/p1/abc/def/p2', {param1: 'p1', param2: 'p2'}]
    ]).it('should call action with path params for method/path', (pathConfig, path, expectedPathValues, done) => {
        const spiedAction = jasmine.createSpy('action').and.returnValue({foo: 'bar'});
        const routeConfig = {
            routes: [
                {
                    method: 'GET',
                    path: pathConfig,
                    action: spiedAction
                }
            ]
        };
        proxyIntegration(routeConfig, {path: path, httpMethod: 'GET'}).then(()=>{
            expect(spiedAction).toHaveBeenCalledWith({path: path, httpMethod: 'GET', paths: expectedPathValues}, undefined);
            done();
        });
    });


    it('should return default headers', (done) => {
        const routeConfig = {
            defaultHeaders: {'a': '1', 'b': '2'},
            routes: [
                {
                    method: 'GET',
                    path: '/',
                    action: () => ({})
                }
            ]
        };
        proxyIntegration(routeConfig, {path: '/', httpMethod: 'GET'}).then(result => {
            expect(result).toEqual({
                statusCode: 200,
                headers: {"Content-Type": "application/json", "a": "1", "b": "2"},
                body: "{}"
            });
            done();
        });
    });


    it('should return error headers', (done) => {
        const routeConfig = {
            routes: [
                {
                    method: 'GET',
                    path: '/',
                    action: () => (Promise.resolve())
                }
            ]
        };
        proxyIntegration(routeConfig, {path: '/', httpMethod: 'GET'}).then(result => {
            expect(result).toEqual({
                statusCode: 200,
                headers: {"Content-Type": "application/json"},
                body: "{}"
            });
            done();
        });
    });

    it('should return error including CORS header', (done) => {
        const routeConfig = {
            cors: true,
            routes: [
                {
                    method: 'GET',
                    path: '/',
                    action: () => {
                        throw {reason: 'myerror', message: 'bla'}
                    }
                }
            ],
            errorMapping: {'myerror': 501}
        };
        proxyIntegration(routeConfig, {path: '/', httpMethod: 'GET'}).then(result => {
            expect(result).toEqual({
                statusCode: 501,
                body: '{"message":"bla","error":"myerror"}',
                headers: Object.assign({"Content-Type": "application/json"}, expectedCorsHeaders)
            });
            done();
        });
    });
    it('should modify incorrect error', (done) => {
        const incorrectError = {body: {reason: 'oops'}};
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
        };
        proxyIntegration(routeConfig, {path: '/', httpMethod: 'GET'}).then(result => {
            expect(result).toEqual({
                statusCode: 500,
                body: JSON.stringify({error: "ServerError", message: "Generic error:" + JSON.stringify(incorrectError) }),
                headers: expectedCorsHeaders
            });
            done();
        });
    });
    it('should pass through error statuscode', (done) => {
        const statusCodeError = {status: 666, message: {reason: 'oops'}};
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
        };
        proxyIntegration(routeConfig, {path: '/', httpMethod: 'GET'}).then(result => {
            expect(result).toEqual({
                statusCode: 666,
                body: '{"message":{"reason":"oops"},"error":666}',
                headers: expectedCorsHeaders
            });
            done();
        });
    });
});

describe('proxyIntegration.routeHandler.returnvalues', () => {
    it('should return async result with custom response object', (done) => {

        const customBody = {
            statusCode: 201,
            headers: {
                'x-test-header': 'x-value'
            },
            body: JSON.stringify({foo: 'bar'})
        };

        const routeConfig = {
            routes: [
                {method: 'GET', path: '/', action: () => Promise.resolve(customBody)}
            ]
        };
        proxyIntegration(routeConfig, {path: '/', httpMethod: 'GET'}).then(res => {
            expect(res).toEqual({
                statusCode: 201,
                headers: {
                    'x-test-header': 'x-value',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({foo: 'bar'})
            });
            done();
        });
    });

    it('should return async result', (done) => {
        const routeConfig = {
            routes: [
                {method: 'GET', path: '/', action: () => Promise.resolve({foo: 'bar'})}
            ]
        };
        proxyIntegration(routeConfig, {path: '/', httpMethod: 'GET'}).then(res => {
            expect(res).toEqual({
                statusCode: 200,
                headers: jasmine.anything(),
                body: JSON.stringify({foo: 'bar'})
            });
            done();
        });
    });
    it('should return async error', (done) => {
        const routeConfig = {
            routes: [
                {method: 'GET', path: '/', action: () => Promise.reject({reason: 'myError', message: 'doof'})}
            ],
            errorMapping: {'myError': 599}
        };
        proxyIntegration(routeConfig, {path: '/', httpMethod: 'GET'}).then(result => {
            expect(result).toEqual({
                statusCode: 599,
                body: '{"message":"doof","error":"myError"}',
                headers: {"Content-Type": "application/json"}
            });
            done();
        });
    });
});

function assertPathIsUnchanged(hostname) {
    const actionSpy = jasmine.createSpy('action');
    const context = {};
    const event = {
        httpMethod: 'GET', path: "/123/456",
        headers: {Host: hostname},
        requestContext: {apiId: 'blabla'}
    };
    proxyIntegration({
        routes: [{
            method: 'GET',
            path: '/123/456',
            action: actionSpy
        }]
    }, event, context, () => {
    });
    expect(actionSpy).toHaveBeenCalledWith({
        httpMethod: 'GET',
        headers: jasmine.anything(),
        requestContext: jasmine.anything(),
        path: "/123/456",
        paths: {}
    }, context);
}

