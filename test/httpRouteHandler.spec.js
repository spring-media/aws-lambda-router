"use strict";

// helper for parameterized tests (http://blog.piotrturski.net/2015/04/jasmine-parameterized-tests.html)
function forEach(arrayOfArrays) {
    return {
        it: (description, testCaseFunction)=> {
            arrayOfArrays.forEach(innerArray=> {
                it(description + ' ' + JSON.stringify(innerArray), ()=> {
                    testCaseFunction.apply(this, innerArray);
                });
            });
        }
    };
}

const httpRouteHandler = require('../httpRouteHandler');

describe('routeHandler.selection', () => {
    it('should select longer match', () => {
        const actionSpy = jasmine.createSpy('action');
        httpRouteHandler.handler({
            routes: [
                {path: '/', method: 'GET', action: ()=>'/'},
                {path: '/123', method: 'POST', action: ()=>'123'},
                {path: '/123', method: 'GET', action: actionSpy}
            ]
        })({httpMethod: 'GET', path: '/123'}, {}, ()=> {
        });
        expect(actionSpy).toHaveBeenCalledWith({httpMethod: 'GET', path: '/123', paths: {}});
    });
    it('should select parameter match', () => {
        const actionSpy = jasmine.createSpy('action');
        httpRouteHandler.handler({
            routes: [
                {path: '/', method: 'GET', action: ()=>'/'},
                {path: '/123', method: 'GET', action: ()=>'123'},
                {path: '/:param', method: 'GET', action: actionSpy}
            ]
        })({httpMethod: 'GET', path: '/456'}, {}, ()=> {
        });
        expect(actionSpy).toHaveBeenCalledWith({httpMethod: 'GET', path: '/456', paths: {param: '456'}});
    });
    it('should select static match', () => {
        const actionSpy = jasmine.createSpy('action');
        httpRouteHandler.handler({
            routes: [
                {path: '/', method: 'GET', action: ()=>'/'},
                {path: '/123', method: 'GET', action: actionSpy},
                {path: '/:param', method: 'GET', action: ()=>'param'}
            ]
        })({httpMethod: 'GET', path: '/123'}, {}, ()=> {
        });
        expect(actionSpy).toHaveBeenCalledWith({httpMethod: 'GET', path: '/123', paths: {}});
    });
    it('should match urlencoded path', () => {
        const actionSpy = jasmine.createSpy('action');
        httpRouteHandler.handler({
            routes: [
                {path: '/', method: 'GET', action: ()=>'/'},
                {path: '/123', method: 'GET', action: ()=>'123'},
                {path: '/:param', method: 'GET', action: actionSpy}
            ]
        })({httpMethod: 'GET', path: '/%2Fwirtschaft%2Farticle85883...tml'}, {}, ()=> {
        });
        expect(actionSpy).toHaveBeenCalledWith({
            httpMethod: 'GET',
            path: '/%2Fwirtschaft%2Farticle85883...tml',
            paths: {param: '/wirtschaft/article85883...tml'}
        });
    });
    it('should select match containing hyphen', () => {
        const actionSpy = jasmine.createSpy('action');
        httpRouteHandler.handler({
            routes: [
                {path: '/:param', method: 'GET', action: actionSpy}
            ]
        })({httpMethod: 'GET', path: '/%2Fdeutschland-bewegt-sich%2F'}, {}, ()=> {
        });
        expect(actionSpy).toHaveBeenCalledWith({httpMethod: 'GET', path: '/%2Fdeutschland-bewegt-sich%2F', paths: {param: '/deutschland-bewegt-sich/'}});
    });
    it('should select match containing question marks and dots', () => {
        const actionSpy = jasmine.createSpy('action');
        httpRouteHandler.handler({
            routes: [
                {path: '/:param', method: 'GET', action: actionSpy}
            ]
        })({httpMethod: 'GET', path: '/%2Fboerse%2FResources%2FImages%2Fcss%2Farrows_change-2.0.1.png?rfid=2013011501'}, {}, ()=> {
        });
        expect(actionSpy).toHaveBeenCalledWith({httpMethod: 'GET', path: '/%2Fboerse%2FResources%2FImages%2Fcss%2Farrows_change-2.0.1.png?rfid=2013011501', paths: {param: '/boerse/Resources/Images/css/arrows_change-2.0.1.png?rfid=2013011501'}});
    });
    it('should add cors headers to GET request', () => {
        const callback = jasmine.createSpy('callback');
        httpRouteHandler.handler({
            routes: [{path: '/', method: 'GET', action: ()=>'/'}],
            cors: true
        })({httpMethod: 'GET', path: '/'}, {}, callback);
        expect(callback).toHaveBeenCalledWith(null, {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            body: '"/"'
        });
    })
});

describe('routeHandler', () => {
    it('should remove basepath from root path if coming over custom domain name', ()=> {
        const actionSpy = jasmine.createSpy('action');
        const event = {httpMethod: 'GET', path: "/shortcut-itemsdev",
            headers: {Host: "api.ep.welt.de"},
            requestContext: {apiId: 'blabla'}
        };
        httpRouteHandler.handler({routes: [{method: 'GET', path: '/', action: actionSpy}]})(event, {}, ()=> {});
        expect(actionSpy).toHaveBeenCalledWith({
            httpMethod: 'GET', headers: jasmine.anything(), requestContext: jasmine.anything(), path: "/", paths:{}
        });
    });
    it('should remove basepath from multi-slash-path if coming over custom domain name', ()=> {
        const actionSpy = jasmine.createSpy('action');
        const event = {httpMethod: 'GET', path: "/shortcut-itemsdev/123/456",
            headers: {Host: "api.ep.welt.de"},
            requestContext: {apiId: 'blabla'}
        };
        httpRouteHandler.handler({routes: [{method: 'GET', path: '/123/456', action: actionSpy}]})(event, {}, ()=> {});
        expect(actionSpy).toHaveBeenCalledWith({
            httpMethod: 'GET', headers: jasmine.anything(), requestContext: jasmine.anything(), path: "/123/456", paths:{}
        });
    });
    it('should not change path if not coming over custom domain name', ()=> {
        const actionSpy = jasmine.createSpy('action');
        const event = {httpMethod: 'GET', path: "/123/456",
            headers: {Host: "blabla.execute-api.eu-central-1.amazonaws.com"},
            requestContext: {apiId: 'blabla'}
        };
        httpRouteHandler.handler({routes: [{method: 'GET', path: '/123/456', action: actionSpy}]})(event, {}, ()=> {});
        expect(actionSpy).toHaveBeenCalledWith({
            httpMethod: 'GET', headers: jasmine.anything(), requestContext: jasmine.anything(), path: "/123/456", paths:{}
        });
    });
    it('should return error for no route found', () => {
        const callback = jasmine.createSpy('callback');
        httpRouteHandler.handler({routes: []})({}, {}, callback);
        expect(callback).toHaveBeenCalledWith(null, {statusCode: 404, body: jasmine.stringMatching(/Could not find/), headers: jasmine.anything()});
    });
    forEach([
        ['GET', '/'],
        ['POST', '/'],
        ['PUT', '/'],
        ['DELETE', '/'],
        ['GET', '/abc/def'],
        ['POST', '/abc'],
        ['PUT', '/abc/def/ghi']
    ]).it('should call action for on method/staticPath', (method, path) => {
        const callback = jasmine.createSpy('callback');
        const routeConfig = {
            routes: [
                {method: method, path: path, action: ()=>({foo: 'bar'})}
            ]
        };
        httpRouteHandler.handler(routeConfig)({path: path, httpMethod: method}, {}, callback);
        expect(callback).toHaveBeenCalledWith(null, {statusCode: 200, headers: jasmine.anything(), body: JSON.stringify({foo: 'bar'})});
    });
    forEach([
        ['/:param1', '/p1', {param1: 'p1'}],
        ['/abc/:param1', '/abc/p1', {param1: 'p1'}],
        ['/abc/def/:param1', '/abc/def/p1', {param1: 'p1'}],
        ['/:param1/abc/:param2', '/p1/abc/p2', {param1: 'p1', param2: 'p2'}],
        ['/:param1/abc/def/:param2', '/p1/abc/def/p2', {param1: 'p1', param2: 'p2'}]
    ]).it('should call action with path params for method/path', (pathConfig, path, expectedPathValues) => {
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
        httpRouteHandler.handler(routeConfig)({path: path, httpMethod: 'GET'}, {}, ()=>({}));
        expect(spiedAction).toHaveBeenCalledWith({path: path, httpMethod: 'GET', paths: expectedPathValues});
    });

    it('should return error including CORS header', () => {
        const callback = jasmine.createSpy('callback');
        const routeConfig = {
            cors: true,
            routes: [
                {
                    method: 'GET',
                    path: '/',
                    action: ()=> {
                        throw {reason: 'myerror', message: 'bla'}
                    }
                }
            ],
            errorMapping: {'myerror': 501}
        };
        httpRouteHandler.handler(routeConfig)({path: '/', httpMethod: 'GET'}, {}, callback);
        expect(callback).toHaveBeenCalledWith(null, {statusCode: 501, body: 'bla', headers: {"Content-Type":"application/json", "Access-Control-Allow-Origin" : "*"}});
    });
    it('should modify incorrect error', () => {
        const incorrectError = {body: {reason: 'oops'}};
        const callback = jasmine.createSpy('callback');
        const routeConfig = {
            routes: [
                {
                    method: 'GET',
                    path: '/',
                    action: ()=> {
                        throw incorrectError
                    }
                }
            ]
        };
        httpRouteHandler.handler(routeConfig)({path: '/', httpMethod: 'GET'}, {}, callback);
        expect(callback).toHaveBeenCalledWith(null, {
            statusCode: 500,
            body: 'Generic error: ' + JSON.stringify(incorrectError)
        });
    });

    it('should return async result', (done) => {
        const callback = jasmine.createSpy('callback');
        const routeConfig = {
            routes: [
                {method: 'GET', path: '/', action: ()=>Promise.resolve({foo: 'bar'})}
            ]
        };
        const result = httpRouteHandler.handler(routeConfig)({path: '/', httpMethod: 'GET'}, {}, callback);
        result.then(
            ()=> {
                expect(callback).toHaveBeenCalledWith(null, {
                    statusCode: 200,
                    headers: jasmine.anything(),
                    body: JSON.stringify({foo: 'bar'})
                });
                done();
            }
        );
    });
    it('should return async error', (done) => {
        const callback = jasmine.createSpy('callback');
        const routeConfig = {
            routes: [
                {method: 'GET', path: '/', action: ()=>Promise.reject({reason: 'myError', message: 'doof'})}
            ],
            errorMapping: {'myError': 599}
        };
        const result = httpRouteHandler.handler(routeConfig)({path: '/', httpMethod: 'GET'}, {}, callback);
        result.then(
            ()=> {
                expect(callback).toHaveBeenCalledWith(null, {statusCode: 599, body: 'doof', headers: {"Content-Type":"application/json"}});
                done();
            }
        );
    });
});

