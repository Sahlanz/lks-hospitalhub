const express = require('express');
const { dynamo } = require('../services/dynamodb');
const { sendMessage } = require('../services/sqs');
const { publishMetrics } = require('../services/cloudwatch');
const { ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// GET current queue
router.get('/', async (req, res) => {
  try {
    const result = await dynamo.send(new ScanCommand({
      TableName: process.env.DYNAMODB_QUEUE
    }));
    const items = (result.Items || [])
      .filter(i => i.status !== 'completed')
      .sort((a, b) => a.queue_number - b.queue_number);
    res.json({ success: true, total: items.length, data: items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST register new patient
router.post('/register', async (req, res) => {
  try {
    const { name, dob, gender, complaint,
            doctor_id, doctor_name, id_number } = req.body;

    if (!name || !complaint || !doctor_id) {
      return res.status(400).json({
        success: false,
        message: 'Name, complaint, and doctor selection are required'
      });
    }

    const patientId = 'PAT-' + uuidv4().substring(0, 8).toUpperCase();
    const queueId = 'Q-' + uuidv4().substring(0, 6).toUpperCase();

    const currentQueue = await dynamo.send(new ScanCommand({
      TableName: process.env.DYNAMODB_QUEUE,
      FilterExpression: 'doctor_id = :did AND #s <> :completed',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: {
        ':did': doctor_id,
        ':completed': 'completed'
      }
    }));

    const queueNumber = (currentQueue.Items || []).length + 1;
    const estimatedWait = queueNumber * 10;

    const patient = {
      id: patientId,
      name, dob: dob || '',
      gender: gender || 'Unknown',
      id_number: id_number || '',
      complaint, doctor_id,
      doctor_name: doctor_name || '',
      registered_at: new Date().toISOString()
    };

    const queue_entry = {
      id: queueId,
      patient_id: patientId,
      patient_name: name,
      doctor_id,
      doctor_name: doctor_name || '',
      complaint,
      queue_number: queueNumber,
      estimated_wait: estimatedWait,
      status: 'waiting',
      created_at: new Date().toISOString()
    };

    await sendMessage(process.env.SQS_REGISTRATION_URL, { patient, queue_entry });

    await publishMetrics(queueNumber, 0, estimatedWait);

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please wait for your queue number.',
      patient_id: patientId,
      queue_number: queueNumber,
      estimated_wait_minutes: estimatedWait,
      doctor: doctor_name
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT call next patient (mark as in-progress)
router.put('/:id/call', async (req, res) => {
  try {
    await dynamo.send(new UpdateCommand({
      TableName: process.env.DYNAMODB_QUEUE,
      Key: { id: req.params.id },
      UpdateExpression: 'SET #s = :s, called_at = :t',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: {
        ':s': 'in-progress',
        ':t': new Date().toISOString()
      }
    }));
    res.json({ success: true, message: 'Patient has been called' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT complete patient visit
router.put('/:id/complete', async (req, res) => {
  try {
    await dynamo.send(new UpdateCommand({
      TableName: process.env.DYNAMODB_QUEUE,
      Key: { id: req.params.id },
      UpdateExpression: 'SET #s = :s, completed_at = :t',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: {
        ':s': 'completed',
        ':t': new Date().toISOString()
      }
    }));
    res.json({ success: true, message: 'Visit marked as completed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
