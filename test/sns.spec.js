"use strict";

describe('sns.processor', () => {

    const sns = require('../lib/sns');

    it('context should be pass through', () => {
        const actionSpy = jasmine.createSpy('action');

        const context = {bla: "blup"};
        const snsCfg = {routes: [{subject: /.*/, action: actionSpy}]};
        const event = {Records: [{Sns: {Subject: 'S', Message: 'M'}}]};

        sns(snsCfg, event, context);

        expect(actionSpy).toHaveBeenCalledWith(event.Records[0].Sns, context);
    });

    it('should ignore event if it is no SNS event', () => {
        const snsCfg = {routes: [{subject: /.*/, action: () => 1}]};
        expect(sns(snsCfg, {})).toBe(null);
        expect(sns(snsCfg, {Records: 1})).toBe(null);
        expect(sns(snsCfg, {Records: []})).toBe(null);
    });

    it('should match empty subject for ".*"', () => {
        const snsCfg = {routes: [{subject: /.*/, action: () => 1}]};
        expect(sns(snsCfg, {Records: [{Sns: {}}]})).toBe(1);
    });

    it('should match null subject for ".*"', () => {
        const snsCfg = {routes: [{subject: /.*/, action: () => 1}]};
        expect(sns(snsCfg, {Records: [{Sns: {Subject: null}}]})).toBe(1);
    });

    it('should match subject for "/ubjec/"', () => {
        const snsCfg = {routes: [{subject: /ubjec/, action: () => 1}]};
        expect(sns(snsCfg, {Records: [{Sns: {Subject: 'Subject'}}]})).toBe(1);
    });

    it('should call action with sns-message', () => {
        const snsCfg = {routes: [{subject: /.*/, action: (sns) => sns}]};
        const event = {Records: [{Sns: {Subject: 'S', Message: 'M'}}]};
        expect(sns(snsCfg, event)).toBe(event.Records[0].Sns);
    });

    it('should call first action with matching subject', () => {
        const snsCfg = {
            routes: [
                {subject: /^123$/, action: () => 1},
                {subject: /123/, action: () => 2}
            ]
        };
        const event = {Records: [{Sns: {Subject: '1234', Message: 'M'}}]};
        expect(sns(snsCfg, event)).toBe(2);
    });


});
