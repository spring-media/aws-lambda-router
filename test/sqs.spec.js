"use strict";

describe('sqs.processor', () => {

    const sqs = require('../dist/lib/sqs').process;

    it('context should be passed through', () => {
        const actionSpy = jasmine.createSpy('action');

        const context = {bla: "blup"};
        const sqsCfg = {routes: [{source: /.*/, action: actionSpy}]};
        const event = {Records: [{eventSource: 'aws:sqs', body: 'B'}]};

        sqs(sqsCfg, event, context);

        expect(actionSpy).toHaveBeenCalledWith([event.Records[0].body], context);
    });

    it('should ignore event if it is no SQS event', () => {
        const sqsCfg = {routes: [{source: /.*/, action: () => 1}]};
        expect(sqs(sqsCfg, {})).toBe(null);
        expect(sqs(sqsCfg, {Records: 1})).toBe(null);
        expect(sqs(sqsCfg, {Records: []})).toBe(null);
    });

    it('should match null source for ".*"', () => {
        const sqsCfg = {routes: [{source: /.*/, action: () => 1}]};
        expect(sqs(sqsCfg, {Records: [{eventSource: 'aws:sqs', eventSourceARN: null}]})).toBe(1);
    });

    it('should match empty subject for ".*"', () => {
        const sqsCfg = {routes: [{subject: /.*/, action: () => 1}]};
        expect(sqs(sqsCfg, {Records: [{eventSource: 'aws:sqs', body: 'B'}]})).toBe(1);
    });

    it('should match source for "/porter/"', () => {
        const sqsCfg = {routes: [{source: /porter/, action: () => 1}]};
        expect(sqs(sqsCfg, {Records: [{eventSource: 'aws:sqs', eventSourceARN: 'importer'}]})).toBe(1);
    });

    it('should call action with sqs-message', () => {
        const sqsCfg = {routes: [{source: /porter/, action: (events) => events}]};
        const event = {Records: [{eventSource: 'aws:sqs', eventSourceARN: 'importer', body: 'B'}]};

        expect(sqs(sqsCfg, event)).toEqual([event.Records[0].body]);
    });

    it('should call first action with matching subject', () => {
        const sqsCfg = {
            routes: [
                {source: /^123$/, action: () => 1},
                {source: /123/, action: () => 2},
                {source: /1234/, action: () => 3}
            ]
        };
        const event = {Records: [{eventSource: 'aws:sqs', eventSourceARN: '1234', body: 'B'}]};
        expect(sqs(sqsCfg, event)).toBe(2);
    });

    it('should match complete source', () => {
        const sqsCfg = {routes: [{source: 'aws:123:importer', action: () => 1}]};
        expect(sqs(sqsCfg, {Records: [{eventSource: 'aws:sqs', eventSourceARN: 'aws:123:importer'}]})).toBe(1);
    });

    it('should not throw error on missing source', () => {
        const sqsCfg = {routes: [{action: () => 1}]};
        sqs(sqsCfg, {Records: [{eventSource: 'aws:sqs', eventSourceARN: 'importer'}]});
    });

    it('should fail on missing action', () => {
        const sqsCfg = {routes: [{source: /.*/}]};
        try {
            sqs(sqsCfg, {Records: [{eventSource: 'aws:sqs', eventSourceARN: 'importer'}]});
            fail();
        } catch (e) {
        }
    });

});
