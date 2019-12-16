import { process as sns, SnsConfig, SnsEvent } from '../lib/sns'

describe('sns.processor', () => {
  const context = {} as any

    it('context should be pass through', () => {
        const actionSpy = jasmine.createSpy('action');

        const context = {bla: "blup"} as any
        const snsCfg: SnsConfig = {routes: [{subject: /.*/, action: actionSpy}]}
        const event = {Records: [{Sns: {Subject: 'S', Message: 'M'}}]} as SnsEvent

        sns(snsCfg, event, context);

        expect(actionSpy).toHaveBeenCalledWith(event.Records[0].Sns, context);
    });

    it('should ignore event if it is no SNS event', () => {
        const snsCfg = {routes: [{subject: /.*/, action: () => 1}]};
        expect(sns(snsCfg, {} as any, context)).toBe(null);
        expect(sns(snsCfg, {Records: 1 as any}, context)).toBe(null);
        expect(sns(snsCfg, {Records: []}, context)).toBe(null);
    });

    it('should match empty subject for ".*"', () => {
        const snsCfg = {routes: [{subject: /.*/, action: () => 1}]};
        expect(sns(snsCfg, {Records: [{Sns: {}} as any]}, context)).toBe(1);
    });

    it('should match null subject for ".*"', () => {
        const snsCfg = {routes: [{subject: /.*/, action: () => 1}]};
        expect(sns(snsCfg, {Records: [{Sns: {Subject: null}} as any]}, context)).toBe(1);
    });

    it('should match subject for "/ubjec/"', () => {
        const snsCfg = {routes: [{subject: /ubjec/, action: () => 1}]};
        expect(sns(snsCfg, {Records: [{Sns: {Subject: 'Subject'}} as any]}, context)).toBe(1);
    });

    it('should call action with sns-message', () => {
        const snsCfg = {routes: [{subject: /.*/, action: (sns: any) => sns}]};
        const event = {Records: [{Sns: {Subject: 'S', Message: 'M'}}]} as SnsEvent
        expect(sns(snsCfg, event, context)).toBe(event.Records[0].Sns);
    });

    it('should call first action with matching subject', () => {
        const snsCfg = {
            routes: [
                {subject: /^123$/, action: () => 1},
                {subject: /123/, action: () => 2}
            ]
        };
        const event = {Records: [{Sns: {Subject: '1234', Message: 'M'}}]} as SnsEvent
        expect(sns(snsCfg, event, context)).toBe(2);
    });

    it('should not fail on missing subject', () => {
        const snsCfg = {routes: [{action: () => 1}]} as any
        sns(snsCfg, {Records: [{Sns: {Subject: 'Subject'}}]} as SnsEvent, context);
    });

    it('should fail on missing action', () => {
        const snsCfg = {routes: [{subject: /.*/}]} as any
        expect(() => sns(snsCfg, {Records: [{Sns: {Subject: 'Subject'}}]} as SnsEvent, context)).toThrow()
    });

});
