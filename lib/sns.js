"use strict";

function process(snsConfig, event, context) {
    // detect if it's an sns-event at all:
    if (snsConfig.debug) {
        console.log('sns:Event', JSON.stringify(event));
        console.log('sns:context', context);
    }

    if (!Array.isArray(event.Records) || event.Records.length<1 || !event.Records[0].Sns) {
        console.log('Event does not look like SNS');
        return null;
    }

    const sns = event.Records[0].Sns;
    for (let routeConfig of snsConfig.routes) {
        if (routeConfig.subject instanceof RegExp) {
            if (routeConfig.subject.test(sns.Subject)) {
                const result = routeConfig.action(sns, context);
                return result || {};
            }
        } else {
            console.log(`SNS-Route with subject-regex '${routeConfig.subject}' is not a Regex; it is ignored!`);
        }
    }

    if (snsConfig.debug) {
        console.log(`No subject-match for ${sns.Subject}`);
    }

    return null;
}

module.exports = process;

/*
const cfgExample = {
    routes:[
        {
            subject: /.*\/,
            action: sns => articleService.invalidate(JSON.parse(sns.Message).escenicId)
        }
    ]
};
*/


/* this is an example for a standard SNS notification message:

{
    "Records": [
        {
            "EventSource": "aws:sns",
            "EventVersion": "1.0",
            "EventSubscriptionArn": "arn:aws:sns:eu-west-1:933782373565:production-escenic-updates:2fdd994c-f2b7-4c2f-a2f9-da83b590e0fc",
            "Sns": {
                "Type": "Notification",
                "MessageId": "0629603b-448e-5366-88b4-309d651495c5",
                "TopicArn": "arn:aws:sns:eu-west-1:933782373565:production-escenic-updates",
                "Subject": null,
                "Message": "{\"escenicId\":\"159526803\",\"model\":\"news\",\"status\":\"draft\"}",
                "Timestamp": "2016-11-16T08:56:58.227Z",
                "SignatureVersion": "1",
                "Signature": "dtXM9BlAJJhYkVObnKmzY012kjgl4uYHEPQ1DLUalBHnPNzkDf12YeVcvHmq0SF6QbdgGwSYw0SgtsOkBiW3WSxVosqEb5xKUWIbQhlXwKdZnzekUigsgl3d231RP+9U2Cvd4QUc6klH5P+CuQM/F70LBIIv74UmR2YNMaxWxrv7Q+ETmz/TF6Y5v8Ip3+GLikbu6wQ/F5g3IHO2Lm7cLpV/74odm48SQxoolh94TdgvtYaUnxNjFVlF8Js8trbRkr7DYTogh73cTwuR77Mo+K9GlYn53txiMW5rMl3KhVdw4U3L190gtBJVwgHbqcB60pmNdEAE9f4bEOohizfPhg==",
                "SigningCertUrl": "https://sns.eu-west-1.amazonaws.com/SimpleNotificationService-b95095beb82e8f6a046b3aafc7f4149a.pem",
                "UnsubscribeUrl": "https://sns.eu-west-1.amazonaws.com/?Action=Unsubscribe&SubscriptionArn=arn:aws:sns:eu-west-1:933782373565:production-escenic-updates:2fdd994c-f2b7-4c2f-a2f9-da83b590e0fc",
                "MessageAttributes": {}
            }
        }
    ]
}

*/