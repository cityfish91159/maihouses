// src/services/replicate.ts
export interface ReplicateResponse {
  ok?: boolean;
  id: string;
  status?: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output?: string[] | string;
  error?: string;
  logs?: string;
  metrics?: any;
}

export async function genImage(prompt: string, deployment?: string): Promise<string[]> {
  const response = await fetch('/api/replicate-generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, deployment })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate image');
  }

  const data: ReplicateResponse = await response.json();
  
  // 常見輸出：data.output 是圖片 URL 陣列
  if (Array.isArray(data.output)) {
    return data.output;
  } else if (typeof data.output === 'string') {
    return [data.output];
  }
  return [];
}

export async function checkHealth(): Promise<{ 
  ok: boolean; 
  hasToken: boolean; 
  hasDeployment: boolean;
  tokenPrefix?: string;
  deployment?: string;
}> {
  const response = await fetch('/api/health-replicate');
  return await response.json();
}
