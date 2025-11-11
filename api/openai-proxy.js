module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return res.status(500).json({ error: 'Missing OPENAI_API_KEY' });
  }

  // 測試：先回傳簡單訊息確認 function 能執行
  return res.status(200).json({ 
    message: 'API endpoint is working',
    hasKey: !!key,
    keyPrefix: key ? key.substring(0, 10) + '...' : 'none'
  });
};
