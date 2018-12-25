"use strict";

function validateArguments(s3Config, event) {

    if (!Array.isArray(event.Records) || event.Records.length < 1 || event.Records[0].eventSource !== 'aws:s3') {
        console.log('Event does not look like S3');
        return false;
    }

    //validate config
    if (!Array.isArray(s3Config.routes) || s3Config.routes.length < 1) {
        throw new Error('s3Config.routes must not be empty');
    }

    //validate config
    for (const route of s3Config.routes) {
        if (!route.action) {
            throw new Error('s3Config.routes.action must not be empty');
        }
    }

    return true;

}

function matchConfigToEventValue(config, eventValue) {

    if (!config) {
        return true;
    }

    if (config instanceof RegExp) {
        if (config.test(eventValue)) {
            return true;
        }
    } else {
        if (config === eventValue) {
            return true;
        }
    }

    return false;
}

function matchObjectKeyWithPrefix(config, eventValue) {
    if (!config || eventValue.startsWith(config)) {
        return true;
    }

    return false;
}

function process(s3Config, event, context) {

    if (s3Config.debug) {
        console.log('s3:Event', JSON.stringify(event));
        console.log('s3:context', context);
    }

    if (!validateArguments(s3Config, event)) {
        return null;
    }

    const resultPromises = [];
    for (const record of event.Records) {
        for (const routeConfig of s3Config.routes) {
            const bucketNameMatched = matchConfigToEventValue(routeConfig.bucketName, record.s3.bucket.name);
            const eventNameMatched = matchConfigToEventValue(routeConfig.eventName, record.eventName);
            const objectKeyPrefixMatched = matchObjectKeyWithPrefix(routeConfig.objectKeyPrefix, record.s3.object.key);

            if (s3Config.debug) {
                console.log(`match record '${record.eventName}'/'${record.s3.bucket.name}'/'${record.s3.object.key}': bucketMatch '
                    ${bucketNameMatched}', eventMatch '${eventNameMatched}', key '${objectKeyPrefixMatched}' for route '${JSON.stringify(routeConfig)}'`);
            }

            if (bucketNameMatched && eventNameMatched && objectKeyPrefixMatched) {
                const resultPromise = routeConfig.action(record, context);
                if (resultPromise) {
                    resultPromises.push(resultPromise);
                }
                break;
            }
        }
    }
    return Promise.all(resultPromises);
}

module.exports = process;