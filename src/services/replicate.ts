// src/services/replicate.ts
export interface ReplicateResponse {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output?: string[];
  error?: string;
  logs?: string;
}

export async function genImage(prompt: string, deployment?: string): Promise<ReplicateResponse> {
  const response = await fetch('/api/replicate-generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, deployment })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate image');
  }

  return await response.json();
}

export async function checkHealth(): Promise<{ ok: boolean; hasToken: boolean; tokenPrefix?: string }> {
  const response = await fetch('/api/health-replicate');
  return await response.json();
}
