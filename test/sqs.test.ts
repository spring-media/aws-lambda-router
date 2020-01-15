import { process as sqs, SqsEvent } from '../lib/sqs'

describe('sqs.processor', () => {
  const context = {} as any

    it('context should be passed through', () => {
        const actionSpy = jasmine.createSpy('action')

        const context = {bla: "blup"} as any
        const sqsCfg = {routes: [{source: /.*/, action: actionSpy}]}
        const event = {Records: [{eventSource: 'aws:sqs', body: 'B'}]} as SqsEvent

        sqs(sqsCfg, event, context)

        expect(actionSpy).toHaveBeenCalledWith([event.Records[0].body], context)
    })

    it('should ignore event if it is no SQS event', () => {
        const sqsCfg = {routes: [{source: /.*/, action: () => 1}]}
        expect(sqs(sqsCfg, {} as any, context)).toBe(null)
        expect(sqs(sqsCfg, {Records: 1 as any}, context)).toBe(null)
        expect(sqs(sqsCfg, {Records: []}, context)).toBe(null)
    })

    it('should match null source for ".*"', () => {
        const sqsCfg = {routes: [{source: /.*/, action: () => 1}]}
        expect(sqs(sqsCfg, {Records: [{eventSource: 'aws:sqs', eventSourceARN: null}]} as any, context)).toBe(1)
    })

    it('should match empty subject for ".*"', () => {
        const sqsCfg = {routes: [{subject: /.*/, action: () => 1}]} as any
        expect(sqs(sqsCfg, {Records: [{eventSource: 'aws:sqs', body: 'B'}]} as SqsEvent, context)).toBe(1)
    })

    it('should match source for "/porter/"', () => {
        const sqsCfg = {routes: [{source: /porter/, action: () => 1}]}
        expect(sqs(sqsCfg, {Records: [{eventSource: 'aws:sqs', eventSourceARN: 'importer'}]} as SqsEvent, context)).toBe(1)
    })

    it('should call action with sqs-message', () => {
        const sqsCfg = {routes: [{source: /porter/, action: (events: any) => events}]}
        const event = {Records: [{eventSource: 'aws:sqs', eventSourceARN: 'importer', body: 'B'}]} as SqsEvent

        expect(sqs(sqsCfg, event, context)).toEqual([event.Records[0].body])
    })

    it('should call first action with matching subject', () => {
        const sqsCfg = {
            routes: [
                {source: /^123$/, action: () => 1},
                {source: /123/, action: () => 2},
                {source: /1234/, action: () => 3}
            ]
        }
        const event = {Records: [{eventSource: 'aws:sqs', eventSourceARN: '1234', body: 'B'}]} as SqsEvent
        expect(sqs(sqsCfg, event, context)).toBe(2)
    })

    it('should match complete source', () => {
        const sqsCfg = {routes: [{source: 'aws:123:importer', action: () => 1}]}
        expect(sqs(sqsCfg, {Records: [{eventSource: 'aws:sqs', eventSourceARN: 'aws:123:importer'}]} as SqsEvent, context)).toBe(1)
    })

    it('should not throw error on missing source', () => {
        const sqsCfg = {routes: [{action: () => 1}]} as any
        sqs(sqsCfg, {Records: [{eventSource: 'aws:sqs', eventSourceARN: 'importer'}]} as SqsEvent, context)
    })

    it('should fail on missing action', () => {
        const sqsCfg = {routes: [{source: /.*/}]} as any
        expect(() => sqs(sqsCfg, {Records: [{eventSource: 'aws:sqs', eventSourceARN: 'importer'}]} as SqsEvent, context)).toThrow()
    })

})
