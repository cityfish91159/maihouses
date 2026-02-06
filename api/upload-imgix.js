// api/upload-imgix.js
// 上傳圖片到 imgix (透過 S3 或 返回 base64)

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST' });
  }

  try {
    const { imageData } = req.body || {};

    if (!imageData) {
      return res.status(400).json({ error: 'Missing imageData' });
    }

    // 檢查環境變數
    const imgixDomain = process.env.IMGIX_DOMAIN || 'maihouses.imgix.net';
    const s3Bucket = process.env.AWS_S3_BUCKET;
    const s3Region = process.env.AWS_S3_REGION || 'us-east-1';
    // nosemgrep: generic.secrets.security.detected-aws-access-key
    const awsAccessKey = process.env.AWS_ACCESS_KEY_ID;
    // nosemgrep: generic.secrets.security.detected-aws-secret-key
    const awsSecretKey = process.env.AWS_SECRET_ACCESS_KEY;

    // 生成唯一檔名
    const filename = `uploads/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.png`;

    // 如果有 S3 設定，上傳到 S3
    if (s3Bucket && awsAccessKey && awsSecretKey) {
      try {
        // 使用 AWS SDK v3 (Vercel 相容)
        const s3Client = new S3Client({
          region: s3Region,
          credentials: {
            accessKeyId: awsAccessKey,
            secretAccessKey: awsSecretKey,
          },
        });

        // 從 base64 轉 buffer
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        // 上傳到 S3
        const command = new PutObjectCommand({
          Bucket: s3Bucket,
          Key: filename,
          Body: buffer,
          ContentType: 'image/png',
          ACL: 'public-read',
        });

        await s3Client.send(command);

        // 返回 imgix URL
        const imgixURL = `https://${imgixDomain}/${filename}`;

        return res.status(200).json({
          success: true,
          url: imgixURL,
          filename: filename,
          method: 's3',
        });
      } catch (s3Error) {
        console.error('S3 upload error:', s3Error);
        // S3 失敗時降級到 base64
      }
    }

    // 如果沒有 S3 或上傳失敗，返回 base64 data URL (適合開發/測試)
    return res.status(200).json({
      success: true,
      url: imageData,
      filename: 'inline-base64',
      method: 'base64',
      warning: '建議設定 S3 以獲得更好的效能和穩定性',
    });
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({
      error: 'Upload failed',
      details: err.message,
    });
  }
}
