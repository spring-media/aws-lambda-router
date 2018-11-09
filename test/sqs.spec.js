"use strict";

describe('sqs.processor', () => {

    const sqs = require('../lib/sqs');

    it('context should be passed through', () => {
        const actionSpy = jasmine.createSpy('action');

        const context = {bla: "blup"};
        const sqsCfg = {routes: [{action: actionSpy}]};
        const event = {Records: [{eventSource: 'aws:sqs', body: 'B'}]};

        sqs(sqsCfg, event, context);

        expect(actionSpy).toHaveBeenCalledWith(event.Records, context);
    });

    it('should ignore event if it is no SQS event', () => {
        const sqsCfg = {routes: [{action: () => 1}]};
        expect(sqs(sqsCfg, {})).toBe(null);
        expect(sqs(sqsCfg, {Records: 1})).toBe(null);
        expect(sqs(sqsCfg, {Records: []})).toBe(null);
    });

    it('should call action with sqs-message', () => {
        const sqsCfg = {routes: [{action: (events) => events}]};
        const event = {Records: [{eventSource: 'aws:sqs', body: 'B'}]};
        expect(sqs(sqsCfg, event)).toBe(event.Records);
    });

});
