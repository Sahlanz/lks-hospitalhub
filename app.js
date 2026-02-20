require('dotenv').config();
const express = require('express');
const path = require('path');
const healthRouter = require('./routes/health');
const doctorsRouter = require('./routes/doctors');
const patientsRouter = require('./routes/patients');
const queueRouter = require('./routes/queue');
const reportRouter = require('./routes/report');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use('/health', healthRouter);
app.use('/api/doctors', doctorsRouter);
app.use('/api/patients', patientsRouter);
app.use('/api/queue', queueRouter);
app.use('/api/report', reportRouter);

app.get('/', (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/register', (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'register.html')));
app.get('/queue-monitor', (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'queue.html')));
app.get('/dashboard', (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));

app.use((req, res) =>
  res.status(404).json({ message: 'Endpoint not found' }));

require('./worker');

app.listen(PORT, () =>
  console.log(`HospitalHub running on port ${PORT}`));
