"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = (routeConfig) => {
    const eventProcessorMapping = extractEventProcessorMapping(routeConfig);
    return async (event, context) => {
        if (routeConfig.debug) {
            console.log("Lambda invoked with request:", event);
            console.log("Lambda invoked with context:", context);
        }
        for (const [eventProcessorName, eventProcessor] of eventProcessorMapping.entries()) {
            try {
                // the contract of 'processors' is as follows:
                // - their method 'process' is called with (config, event)
                // - the method...
                //   - returns null: the processor does not feel responsible for the event
                //   - throws Error: the 'error.toString()' is taken as the error message of processing the event
                //   - returns object: this is taken as the result of processing the event
                //   - returns promise: when the promise is resolved, this is taken as the result of processing the event
                const result = eventProcessor.process(routeConfig[eventProcessorName], event, context);
                if (result) {
                    // be resilient against a processor returning a value instead of a promise:
                    return await result;
                }
                else {
                    if (routeConfig.debug) {
                        console.log("Event processor couldn't handle request.");
                    }
                }
            }
            catch (error) {
                if (error.stack) {
                    console.log(error.stack);
                }
                throw error.toString();
            }
        }
        throw 'No event processor found to handle this kind of event!';
    };
};
const extractEventProcessorMapping = (routeConfig) => {
    const processorMap = new Map();
    for (let key of Object.keys(routeConfig)) {
        if (key === 'debug')
            continue;
        try {
            processorMap.set(key, require(`./lib/${key}`));
        }
        catch (error) {
            throw new Error(`The event processor '${key}', that is mentioned in the routerConfig, cannot be instantiated (${error.toString()})`);
        }
    }
    return processorMap;
};
