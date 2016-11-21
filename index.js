"use strict";

function handler(routeConfig) {
    const eventProcessorMapping = extractEventProcessorMapping(routeConfig);
    return (event, context, callback) => {
        for (const eventProcessorName of eventProcessorMapping.keys()) {

            try {
                // the contract of 'processors' is as follows:
                // - their method 'process' is called with (config, event)
                // - the method...
                //   - returns null: the processor does not feel responsible for the event
                //   - throws Error: the 'error.toString()' is taken as the error message of processing the event
                //   - returns object: this is taken as the result of processing the event
                //   - returns promise: when the promise is resolved, this is taken as the result of processing the event
                const result = eventProcessorMapping.get(eventProcessorName)(routeConfig[eventProcessorName], event);
                if (result) {
                    // be resilient against a processor returning a value instead of a promise:
                    return Promise.resolve(result)
                        .then(result => callback(null, result))
                        .catch(error => {
                            console.log(error.stack);
                            callback(error.toString());
                        });
                }
            } catch (error) {
                if (error.stack) {
                    console.log(error.stack);
                }
                callback(error.toString());
                return;
            }
        }
        callback('No event processor found to handle this kind of event!');
    }
}

function extractEventProcessorMapping(routeConfig) {
    const processorMap = new Map();
    for (let key of Object.keys(routeConfig)) {
        try {
            processorMap.set(key, require(`./lib/${key}`));
        } catch (error) {
            throw new Error(`The event processor '${key}', that is mentioned in the routerConfig, cannot be instantiated (${error.toString()})`);
        }
    }
    return processorMap;
}

module.exports = {handler: handler};
