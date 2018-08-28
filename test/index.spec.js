"use strict";

const proxyquire = require('proxyquire').noCallThru();

describe('processor.configuration', () => {
    const router = proxyquire('../index', {
        './lib/lib1': () => null,
        './lib/lib2': () => Promise.resolve(2)
    });

    it('should throw error if processor does not exist', () => {
        expect(() => router.handler({
            lib1: {},
            lib99: {}
        })).toThrowError(/lib99.*cannot be instantiated/);
    });
    it('should call callback with first non-null result', done => {
        const handler = router.handler({
            lib1: {},
            lib2: {}
        });
        const cb = jasmine.createSpy('cb');
        handler({}, {}, cb).then(() => {
                expect(cb).toHaveBeenCalledWith(null, 2);
                done();
            }
        );
    });
    it('should call callback with error if no processor feels responsible', () => {
        const cb = jasmine.createSpy('cb');
        const lazyRouter = proxyquire('../index', {
            './lib/lib1': () => null,
            './lib/lib2': () => null
        });
        lazyRouter.handler({
            lib1: {},
            lib2: {}
        })({}, {}, cb);
        expect(cb).toHaveBeenCalledWith(jasmine.stringMatching(/^No event processor found/));
    });

});

describe('processor.results', () => {
    it('SYNC should call callback synchronous with result', (done) => {
        const router = proxyquire('../index', {
            './lib/lib1': () => 'syncresult'
        });
        const cb = jasmine.createSpy('cb');
        router.handler({
            lib1: {}
        })({}, {}, cb).then(()=>{
            expect(cb).toHaveBeenCalledWith(null, 'syncresult');
            done();
        });
    });
    it('ASYNC should call callback async with errormessage', done => {
        const router = proxyquire('../index', {
            './lib/lib1': () => Promise.reject(new Error('asyncError'))
        });
        const handler = router.handler({
            lib1: {}
        });
        const callback = jasmine.createSpy('callback');
        const newVar2 = handler({}, {}, callback);
        newVar2.then(() => {
                expect(callback).toHaveBeenCalledWith('Error: asyncError');
                done();
            }
        );
    });
    it('should call callback synchronous with errormessage', () => {
        const router = proxyquire('../index', {
            './lib/lib1': () => {throw new Error('myerror');}
        });
        const callback = jasmine.createSpy('callback');
        router.handler({
            lib1: {}
        })({}, {}, callback);
        expect(callback).toHaveBeenCalledWith('Error: myerror');
    });
    it('should call callback async with result', done => {
        const router = proxyquire('../index', {
            './lib/lib1': () => Promise.resolve('asyncresult')
        });
        const cb = jasmine.createSpy('cb');
        const handler = router.handler({
            lib1: {}
        });
        handler({}, {}, cb).then(() => {
                expect(cb).toHaveBeenCalledWith(null, 'asyncresult');
                done();
            }
        );
    });
});

