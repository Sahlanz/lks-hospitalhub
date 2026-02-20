const { CloudWatchClient,
        PutMetricDataCommand } = require('@aws-sdk/client-cloudwatch');

const client = new CloudWatchClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN
  }
});

const NAMESPACE = process.env.CW_NAMESPACE || 'HospitalHub/Metrics';

async function publishMetrics(queueDepth, patientsServed, avgWaitTime) {
  try {
    await client.send(new PutMetricDataCommand({
      Namespace: NAMESPACE,
      MetricData: [
        {
          MetricName: 'QueueDepth',
          Value: queueDepth,
          Unit: 'Count',
          Timestamp: new Date()
        },
        {
          MetricName: 'PatientsServed',
          Value: patientsServed,
          Unit: 'Count',
          Timestamp: new Date()
        },
        {
          MetricName: 'AvgWaitTimeMinutes',
          Value: avgWaitTime,
          Unit: 'Count',
          Timestamp: new Date()
        }
      ]
    }));
    console.log('[CloudWatch] Metrics published successfully');
  } catch (err) {
    console.error('[CloudWatch] Failed to publish metrics:', err.message);
  }
}

module.exports = { publishMetrics };
