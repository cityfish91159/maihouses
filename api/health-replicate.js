// api/health-replicate.js
import { enforceCors } from './lib/cors';

function getHeaderValue(headerValue) {
  if (typeof headerValue === 'string') return headerValue;
  if (Array.isArray(headerValue) && headerValue.length > 0) return headerValue[0];
  return '';
}

export default async function handler(req, res) {
  if (!enforceCors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const response = {
    ok: true,
    hasToken: !!process.env.REPLICATE_API_TOKEN,
    hasDeployment: !!process.env.REPLICATE_DEPLOYMENT,
  };

  const systemApiKey = process.env.SYSTEM_API_KEY;
  const requestSystemKey = getHeaderValue(req.headers['x-system-key']);
  const canViewInternalDetails = Boolean(systemApiKey && requestSystemKey === systemApiKey);

  if (!canViewInternalDetails) {
    return res.status(200).json(response);
  }

  return res.status(200).json({
    ...response,
    deployment: process.env.REPLICATE_DEPLOYMENT ? 'configured' : 'missing',
  });
}
