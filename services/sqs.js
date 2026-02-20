const { SQSClient, SendMessageCommand,
        ReceiveMessageCommand, DeleteMessageCommand,
        GetQueueAttributesCommand } = require('@aws-sdk/client-sqs');

const client = new SQSClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN
  }
});

async function sendMessage(queueUrl, body) {
  return client.send(new SendMessageCommand({
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify(body)
  }));
}

async function receiveMessages(queueUrl, max = 10) {
  const result = await client.send(new ReceiveMessageCommand({
    QueueUrl: queueUrl,
    MaxNumberOfMessages: max,
    WaitTimeSeconds: 5
  }));
  return result.Messages || [];
}

async function deleteMessage(queueUrl, receiptHandle) {
  return client.send(new DeleteMessageCommand({
    QueueUrl: queueUrl,
    ReceiptHandle: receiptHandle
  }));
}

async function getQueueDepth(queueUrl) {
  const result = await client.send(new GetQueueAttributesCommand({
    QueueUrl: queueUrl,
    AttributeNames: ['ApproximateNumberOfMessages']
  }));
  return parseInt(result.Attributes.ApproximateNumberOfMessages || '0');
}

module.exports = { sendMessage, receiveMessages, deleteMessage, getQueueDepth };
