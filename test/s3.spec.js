"use strict";

function createTestEvent(eventName, bucketName, objectKey) {
    return {
        Records: [
            {
                eventSource: 'aws:s3',
                eventName: eventName,
                s3: {
                    bucket: {
                        name: bucketName
                    },
                    object: {
                        key: objectKey
                    }
                }
            }
        ]
    };
}

function singleEvent(eventName, bucketName, key) {
    return {
                eventSource: 'aws:s3',
                eventName: eventName,
                s3: {
                    bucket: {
                        name: bucketName
                    },
                    object: {
                        key: key
                    }
                }
    };
}

function createTwoEvents(eventName, bucketName, eventName2, bucketName2) {
    return {
        Records: [
            {
                eventSource: 'aws:s3',
                eventName: eventName,
                s3: {
                    bucket: {
                        name: bucketName
                    },
                    object: {
                        key: 'key'
                    }
                }
            },
            {
                eventSource: 'aws:s3',
                eventName: eventName2,
                s3: {
                    bucket: {
                        name: bucketName2
                    },
                    object: {
                        key: 'key2'
                    }
                }
            }
        ]
    };
}

const s3 = require('../dist/lib/s3').process;
describe('s3.processor', () => {

    const context = {bla: "blup"};

    it('eventName/bucketName: two events in one record', () => {
        const actionSpy = jasmine.createSpy('action');

        const s3Cfg = {routes: [{eventName: /.*/, bucketName: 'buckettest2', action: actionSpy}]};

        const eventFixture = createTwoEvents('ObjectCreated:Put', 'buckettest', 'ObjectCreated:Post', 'buckettest2');

        s3(s3Cfg, eventFixture, context);

        expect(actionSpy).toHaveBeenCalledWith(eventFixture.Records[1], context);
    });

    it('eventName/bucketName: regex event name with fix bucket name should match', () => {
        const actionSpy = jasmine.createSpy('action');

        const s3Cfg = {routes: [{eventName: /.*/, bucketName: 'buckettest', action: actionSpy}]};

        const eventFixture = createTestEvent('ObjectCreated:Put', 'buckettest', 'key/path/to/file.jpg');

        s3(s3Cfg, eventFixture, context);

        expect(actionSpy).toHaveBeenCalledWith(eventFixture.Records[0], context);
    });

    it('eventName/bucketName: regex bucket name with fix event name should match', () => {
        const actionSpy = jasmine.createSpy('action');

        const s3Cfg = {routes: [{eventName: 'ObjectCreated:Put', bucketName: /.*/, action: actionSpy}]};

        const eventFixture = createTestEvent('ObjectCreated:Put', 'buckettest', 'key/path/to/file.jpg');

        s3(s3Cfg, eventFixture, context);

        expect(actionSpy).toHaveBeenCalledWith(eventFixture.Records[0], context);
    });


    it('eventName/bucketName: regex bucket all over should match', () => {
        const actionSpy = jasmine.createSpy('action');

        const s3Cfg = {routes: [{eventName: /.*/, bucketName: /.*/, action: actionSpy}]};

        const eventFixture = createTestEvent('ObjectCreated:Put', 'buckettest', 'key/path/to/file.jpg');

        s3(s3Cfg, eventFixture, context);

        expect(actionSpy).toHaveBeenCalledWith(eventFixture.Records[0], context);
    });

    it('eventName/bucketName: exact name should match', () => {
        const actionSpy = jasmine.createSpy('action');

        const s3Cfg = {routes: [{eventName: 'ObjectCreated:Put', bucketName: 'buckettest', action: actionSpy}]};

        const eventFixture = createTestEvent('ObjectCreated:Put', 'buckettest', 'key/path/to/file.jpg');

        s3(s3Cfg, eventFixture, context);

        expect(actionSpy).toHaveBeenCalledWith(eventFixture.Records[0], context);
    });

    it('eventName/bucketName: not match, because bucket not match', () => {
        const actionSpy = jasmine.createSpy('action');

        const s3Cfg = {routes: [{eventName: 'ObjectCreated:Put', bucketName: 'buckettest', action: actionSpy}]};

        const eventFixture = createTestEvent('ObjectCreated:Put', 'wrong', 'key/path/to/file.jpg');

        s3(s3Cfg, eventFixture, context);

        expect(actionSpy).not.toHaveBeenCalled();
    });

    it('eventName/bucketName: not match, because event not match', () => {
        const actionSpy = jasmine.createSpy('action');

        const s3Cfg = {routes: [{eventName: 'ObjectCreated:Put', bucketName: 'buckettest', action: actionSpy}]};

        const eventFixture = createTestEvent('wrong', 'buckettest', 'key/path/to/file.jpg');

        s3(s3Cfg, eventFixture, context);

        expect(actionSpy).not.toHaveBeenCalled();
    });

    it('eventName: exact name should match', () => {
        const actionSpy = jasmine.createSpy('action');

        const s3Cfg = {routes: [{eventName: 'ObjectCreated:Put', action: actionSpy}]};

        const eventFixture = createTestEvent('ObjectCreated:Put', 'buckettest', 'key/path/to/file.jpg');

        s3(s3Cfg, eventFixture, context);

        expect(actionSpy).toHaveBeenCalledWith(eventFixture.Records[0], context);
    });

    it('eventName: regex name should match', () => {
        const actionSpy = jasmine.createSpy('action');

        const s3Cfg = {routes: [{eventName: /ObjectCreated:.*/, action: actionSpy}]};

        const eventFixture = createTestEvent('ObjectCreated:Put', 'buckettest', 'key/path/to/file.jpg');

        s3(s3Cfg, eventFixture, context);

        expect(actionSpy).toHaveBeenCalledWith(eventFixture.Records[0], context);
    });

    it('eventName: regex name should not match', () => {
        const actionSpy = jasmine.createSpy('action');

        const s3Cfg = {routes: [{eventName: /ObjectRestore:.*/, action: actionSpy}]};

        const eventFixture = createTestEvent('ObjectCreated:Put', 'buckettest', 'key/path/to/file.jpg');

        s3(s3Cfg, eventFixture, context);

        expect(actionSpy).not.toHaveBeenCalled();
    });

    it('bucketname: exact name should match', () => {
        const actionSpy = jasmine.createSpy('action');

        const s3Cfg = {routes: [{bucketName: 'buckettest', action: actionSpy}]};

        const eventFixture = createTestEvent('ObjectCreated:Put', 'buckettest', 'key/path/to/file.jpg');

        s3(s3Cfg, eventFixture, context);

        expect(actionSpy).toHaveBeenCalledWith(eventFixture.Records[0], context);
    });

    it('bucketname: regex not match', () => {
        const actionSpy = jasmine.createSpy('action');

        const s3Cfg = {routes: [{bucketName: /bucket.*/, action: actionSpy}]};

        const eventFixture = createTestEvent('ObjectCreated:Put', 'buck-wrong', 'key/path/to/file.jpg');

        s3(s3Cfg, eventFixture, context);

        expect(actionSpy).not.toHaveBeenCalled();
    });

    it('action should not call if bucket name no match', () => {
        const actionSpy = jasmine.createSpy('action');

        const s3Cfg = {routes: [{bucketName: 'buckettest', action: actionSpy}]};

        const eventFixture = createTestEvent('ObjectCreated:Put', 'wrong-bucket', 'key/path/to/file.jpg');

        s3(s3Cfg, eventFixture, context);

        expect(actionSpy).not.toHaveBeenCalled();
    });

    it('action should call if no bucket or event is specified', () => {
        const actionSpy = jasmine.createSpy('action');

        const s3Cfg = {routes: [{action: actionSpy}]};

        const eventFixture = createTestEvent('ObjectCreated:Put', 'wrong-bucket', 'key/path/to/file.jpg');

        s3(s3Cfg, eventFixture, context);

        expect(actionSpy).toHaveBeenCalledWith(eventFixture.Records[0], context);
    });

    it('object key prefix with bucket name should match', () => {
        const actionSpy = jasmine.createSpy('action');

        const s3Cfg = {routes: [{objectKeyPrefix: 'upload', bucketName: 'test', action: actionSpy}]};

        const eventFixture = createTestEvent('ObjectCreated:Put', 'test', 'upload/file.jpg');

        s3(s3Cfg, eventFixture, context);

        expect(actionSpy).toHaveBeenCalledWith(eventFixture.Records[0], context);
    });

    it('object key prefix should match', () => {
        const actionSpy = jasmine.createSpy('action');

        const s3Cfg = {routes: [{objectKeyPrefix: 'upload', action: actionSpy}]};

        const eventFixture = createTestEvent('ObjectCreated:Put', 'bucket', 'upload/file.jpg');

        s3(s3Cfg, eventFixture, context);

        expect(actionSpy).toHaveBeenCalledWith(eventFixture.Records[0], context);
    });

    it('object key prefix not should match', () => {
        const actionSpy = jasmine.createSpy('action');

        const s3Cfg = {routes: [{objectKeyPrefix: '/upload', action: actionSpy}]};

        const eventFixture = createTestEvent('ObjectCreated:Put', 'bucket', 'upload/file.jpg');

        s3(s3Cfg, eventFixture, context);

        expect(actionSpy).not.toHaveBeenCalled();
    });


    it('object key prefix wih more then one route', () => {
        const actionSpyDpa = jasmine.createSpy('action');
        const actionSpyAfp = jasmine.createSpy('action');
        const actionSpyRtr = jasmine.createSpy('action');

        const s3Cfg = {routes: [
            {objectKeyPrefix: 'dpa', action: actionSpyDpa},
            {objectKeyPrefix: 'afp', action: actionSpyAfp},
            {objectKeyPrefix: 'rtr', action: actionSpyRtr}
            ]};

        const eventFixture1 = singleEvent('ObjectCreated:Put', 'bucket', 'rtr/file.jpg');
        const eventFixture2 = singleEvent('ObjectCreated:Put', 'bucket', 'afp/file.jpg');
        const eventFixture3 = singleEvent('ObjectCreated:Put', 'bucket', 'rtr/file.jpg');
        const eventFixture4 = singleEvent('ObjectCreated:Put', 'bucket', 'dpa/file.jpg');
        const records = []
        records.push(eventFixture1, eventFixture2, eventFixture3, eventFixture4);

        s3(s3Cfg, { Records: records}, context);

        expect(actionSpyDpa).toHaveBeenCalledTimes(1);
        expect(actionSpyDpa).toHaveBeenCalledWith(eventFixture4, context);

        expect(actionSpyAfp).toHaveBeenCalledTimes(1);
        expect(actionSpyAfp).toHaveBeenCalledWith(eventFixture2, context);

        expect(actionSpyRtr).toHaveBeenCalledTimes(2);
    });

    it('should ignore event if it is no S3 event', () => {
        const s3Cfg = {routes: [{subject: /.*/, action: () => 1}]};
        expect(s3(s3Cfg, {})).toBe(null);
        expect(s3(s3Cfg, {Records: 1})).toBe(null);
        expect(s3(s3Cfg, {Records: []})).toBe(null);
    });

    it('should call first action with matching bucketname', () => {
        const actionSpy1 = jasmine.createSpy('action');
        const actionSpy2 = jasmine.createSpy('action');

        const s3Cfg = {
            routes: [
                {bucketName: 'buckettest', action: actionSpy1},
                {bucketName: 'buckettest', action: actionSpy2}
            ]
        };
        const event = createTestEvent('ObjectCreated:Put', 'buckettest', 'key/path/to/file.jpg');

        s3(s3Cfg, event, context);

        expect(actionSpy1).toHaveBeenCalledWith(event.Records[0], context);
        expect(actionSpy2).not.toHaveBeenCalled();
    });


    it('should fail on missing action', () => {
        const s3Cfg = {routes: [{bucketName: 'buckettest'}]};
        const eventFixture = createTestEvent('ObjectCreated:Put', 'bucket', 'key/path/to/file.jpg');
        try {
            s3(s3Cfg, eventFixture);
            fail();
        } catch (e) {
        }
    });

    it('should fail on missing routes', () => {
        const s3Cfg = {routes: []};
        const eventFixture = createTestEvent('ObjectCreated:Put', 'bucket', 'key/path/to/file.jpg');
        try {
            s3(s3Cfg, eventFixture);
            fail();
        } catch (e) {
            console.log(e);
        }
    });

});
