const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    app: 'HospitalHub',
    version: process.env.APP_VERSION || '1.0.0',
    services: {
      sqs_registration: process.env.SQS_REGISTRATION_URL ? 'configured' : 'missing',
      sqs_alerts: process.env.SQS_ALERTS_URL ? 'configured' : 'missing',
      dynamodb_doctors: process.env.DYNAMODB_DOCTORS || 'missing',
      dynamodb_patients: process.env.DYNAMODB_PATIENTS || 'missing',
      dynamodb_queue: process.env.DYNAMODB_QUEUE || 'missing',
      s3_reports: process.env.S3_REPORTS_BUCKET || 'missing',
      cloudwatch: process.env.CW_NAMESPACE || 'missing'
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
