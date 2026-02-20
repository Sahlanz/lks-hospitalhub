require('dotenv').config();
const { dynamo } = require('./services/dynamodb');
const { receiveMessages, deleteMessage, getQueueDepth } = require('./services/sqs');
const { publishMetrics } = require('./services/cloudwatch');
const { PutCommand } = require('@aws-sdk/lib-dynamodb');

const REGISTRATION_URL = process.env.SQS_REGISTRATION_URL;
const PATIENTS_TABLE = process.env.DYNAMODB_PATIENTS;
const QUEUE_TABLE = process.env.DYNAMODB_QUEUE;

let patientsServed = 0;

async function processRegistrations() {
  try {
    const messages = await receiveMessages(REGISTRATION_URL);

    for (const msg of messages) {
      const data = JSON.parse(msg.Body);

      await dynamo.send(new PutCommand({
        TableName: PATIENTS_TABLE,
        Item: data.patient
      }));

      await dynamo.send(new PutCommand({
        TableName: QUEUE_TABLE,
        Item: data.queue_entry
      }));

      await deleteMessage(REGISTRATION_URL, msg.ReceiptHandle);
      patientsServed++;
      console.log(`[Worker] Registered patient ${data.patient.id}`);
    }
  } catch (err) {
    console.error('[Worker] Error processing registrations:', err.message);
  }
}

async function publishSystemMetrics() {
  try {
    const queueDepth = await getQueueDepth(REGISTRATION_URL);
    const avgWait = Math.floor(Math.random() * 15) + 5;
    await publishMetrics(queueDepth, patientsServed, avgWait);
  } catch (err) {
    console.error('[Worker] Error publishing metrics:', err.message);
  }
}

async function run() {
  console.log('[Worker] HospitalHub Worker started');
  setInterval(processRegistrations, 5000);
  setInterval(publishSystemMetrics, 30000);
}

run();
