import { Context, SNSEvent, SNSMessage, SNSEventRecord } from 'aws-lambda'
import { ProcessMethod } from './EventProcessor'

export type SnsEvent = SNSEvent

export interface SnsRoute {
  subject: RegExp
  action: (sns: SNSMessage, context: Context, records: SNSEventRecord[]) => Promise<any> | any
}

export interface SnsConfig {
  routes: SnsRoute[];
  debug?: boolean;
}

export const process: ProcessMethod<SnsConfig, SnsEvent, Context, any> = (snsConfig, event, context) => {
  // detect if it's an sns-event at all:
  if (snsConfig.debug) {
    console.log('sns:Event', JSON.stringify(event))
    console.log('sns:context', context)
  }

  if (!Array.isArray(event.Records) || event.Records.length < 1 || !event.Records[0].Sns) {
    console.log('Event does not look like SNS')
    return null
  }

  const sns = event.Records[0].Sns
  for (const routeConfig of snsConfig.routes) {
    if (routeConfig.subject instanceof RegExp) {
      if (routeConfig.subject.test(sns.Subject)) {
        const result = routeConfig.action(sns, context, event.Records)
        return result || {}
      }
    } else {
      console.log(`SNS-Route with subject-regex '${routeConfig.subject}' is not a Regex; it is ignored!`)
    }
  }

  if (snsConfig.debug) {
    console.log(`No subject-match for ${sns.Subject}`)
  }

  return null
}

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
            "Signature": "dtXM9BlAJJhYkVObnKgHbqcB60pmNdEAE9f4bEOohizfPhg==",
            "SigningCertUrl": "https://sns.eu-west-1.amazonaws.com/SimpleNotificationService-b95095beb82e8f6a046b3aafc7f4149a.pem",
            "UnsubscribeUrl": "https://sns.eu-west-1.amazonaws.com/?Action=Unsubscribe&SubscriptionArn=arn:aws:sns:eu-west-1:933782373565:production-escenic-updates:2fdd994c-f2b7-4c2f-a2f9-da83b590e0fc",
            "MessageAttributes": '{
                  "stringAttribute": {
                      "Type": "String",
                      "Value": "stringvalue"
                  },
                  "binaryAttribute": {
                      "Type": "Binary",
                      "Value": "Ym9udmFsdWU="
                  },
                  "arrayAttribute": {
                      "Type": "String",
                      "Value": "[\"value1\", \"value2\"]"
                  }
            }'
          }
      }
  ]
}

*/
