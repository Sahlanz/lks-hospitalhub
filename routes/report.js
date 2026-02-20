const express = require('express');
const { dynamo } = require('../services/dynamodb');
const { uploadReport, listReports } = require('../services/s3');
const { ScanCommand } = require('@aws-sdk/lib-dynamodb');
const router = express.Router();

router.post('/generate', async (req, res) => {
  try {
    const [patientsRes, queueRes] = await Promise.all([
      dynamo.send(new ScanCommand({ TableName: process.env.DYNAMODB_PATIENTS })),
      dynamo.send(new ScanCommand({ TableName: process.env.DYNAMODB_QUEUE }))
    ]);

    const patients = patientsRes.Items || [];
    const queue = queueRes.Items || [];
    const completed = queue.filter(q => q.status === 'completed');
    const waiting = queue.filter(q => q.status === 'waiting');
    const inProgress = queue.filter(q => q.status === 'in-progress');

    const report = {
      generated_at: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
      summary: {
        total_patients_registered: patients.length,
        total_queue_entries: queue.length,
        completed_visits: completed.length,
        waiting: waiting.length,
        in_progress: inProgress.length
      },
      patients: patients.slice(0, 50)
    };

    const key = `reports/daily-${report.date}-${Date.now()}.json`;
    await uploadReport(key, report);

    res.json({
      success: true,
      message: 'Daily report generated and saved to S3',
      report_key: key,
      summary: report.summary
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/list', async (req, res) => {
  try {
    const files = await listReports();
    res.json({ success: true, total: files.length, data: files });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
