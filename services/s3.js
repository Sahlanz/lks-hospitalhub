const { S3Client, PutObjectCommand,
        GetObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');

const client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN
  }
});

const BUCKET = process.env.S3_REPORTS_BUCKET;

async function uploadReport(key, content) {
  return client.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: JSON.stringify(content, null, 2),
    ContentType: 'application/json'
  }));
}

async function listReports() {
  const result = await client.send(new ListObjectsV2Command({
    Bucket: BUCKET,
    Prefix: 'reports/',
    MaxKeys: 20
  }));
  return (result.Contents || []).sort((a, b) =>
    new Date(b.LastModified) - new Date(a.LastModified)
  );
}

module.exports = { uploadReport, listReports };
