const express = require('express');
const { dynamo } = require('../services/dynamodb');
const { ScanCommand } = require('@aws-sdk/lib-dynamodb');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await dynamo.send(new ScanCommand({
      TableName: process.env.DYNAMODB_DOCTORS
    }));
    res.json({ success: true, data: result.Items || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
