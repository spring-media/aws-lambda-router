"use strict";

function process(sqsConfig, event, context) {
    // detect if it's an sqs-event at all:
    if (sqsConfig.debug) {
        console.log('sqs:Event', JSON.stringify(event));
        console.log('sqs:context', context);
    }

    if (!Array.isArray(event.Records) || event.Records.length < 1 || event.Records[0].eventSource !== 'aws:sqs') {
        console.log('Event does not look like SQS');
        return null;
    }

    const records = event.Records;
    const recordSourceArn = records[0].eventSourceARN;
    for (let routeConfig of sqsConfig.routes) {
        if (routeConfig.source instanceof RegExp) {
            if (routeConfig.source.test(recordSourceArn)) {
                const result = routeConfig.action(records.map(record => record.body) , context);
                return result || {};
            }
        } else {
            if (routeConfig.source === recordSourceArn) {
                const result = routeConfig.action(records.map(record => record.body) , context);
                return result || {};
            }
        }
    }

    if (sqsConfig.debug) {
        console.log(`No source-match for ${recordSourceArn}`);
    }

    return null;
}

module.exports = process;

/*
const cfgExample = {
    routes:[
        {
            source: /.*\/,
            action: (record, context) => service.import(JSON.parse(record.body), context)
        }
    ]
};
*/


/* this is an example for a standard SQS notification message:

{
    "Records": [
        {
            "messageId": "c80e8021-a70a-42c7-a470-796e1186f753",
            "receiptHandle": "AQEBJQ+/u6NsnT5t8Q/VbVxgdUl4TMKZ5FqhksRdIQvLBhwNvADoBxYSOVeCBXdnS9P+erlTtwEALHsnBXynkfPLH3BOUqmgzP25U8kl8eHzq6RAlzrSOfTO8ox9dcp6GLmW33YjO3zkq5VRYyQlJgLCiAZUpY2D4UQcE5D1Vm8RoKfbE+xtVaOctYeINjaQJ1u3mWx9T7tork3uAlOe1uyFjCWU5aPX/1OHhWCGi2EPPZj6vchNqDOJC/Y2k1gkivqCjz1CZl6FlZ7UVPOx3AMoszPuOYZ+Nuqpx2uCE2MHTtMHD8PVjlsWirt56oUr6JPp9aRGo6bitPIOmi4dX0FmuMKD6u/JnuZCp+AXtJVTmSHS8IXt/twsKU7A+fiMK01NtD5msNgVPoe9JbFtlGwvTQ==",
            "body": "{\"foo\":\"bar\"}",
            "attributes": {
                "ApproximateReceiveCount": "3",
                "SentTimestamp": "1529104986221",
                "SenderId": "594035263019",
                "ApproximateFirstReceiveTimestamp": "1529104986230"
            },
            "messageAttributes": {},
            "md5OfBody": "9bb58f26192e4ba00f01e2e7b136bbd8",
            "eventSource": "aws:sqs",
            "eventSourceARN": "arn:aws:sqs:eu-central-1:594035263019:article-import",
            "awsRegion": "eu-central-1"
        }
    ]
}

*/
