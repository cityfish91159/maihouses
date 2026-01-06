// src/services/detection.ts
import { MODE_CONFIGS, type DetectionMode } from '../lib/detection-labels';

export interface DetectionBox {
  x: number; // 0-1 比例
  y: number;
  w: number;
  h: number;
  label: string;
  score: number;
  mode?: DetectionMode;
}

interface RawDetection {
  box?: [number, number, number, number];
  label?: string;
  score?: number;
}

export interface DetectionResult {
  ok: boolean;
  id: string;
  output: RawDetection[] | unknown;
  mode: DetectionMode;
  boxes?: DetectionBox[];
}

export async function detectObjects(
  imageUrl: string,
  mode: DetectionMode = 'general'
): Promise<DetectionResult> {
  const config = MODE_CONFIGS[mode];
  
  const response = await fetch('/api/replicate-detect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image: imageUrl,
      labels: config.labels,
      mode: mode
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Detection failed');
  }

  const result = await response.json();
  
  // 轉換輸出為標準化 boxes（假設輸出格式為 YOLO）
  if (result.output && result.output.length > 0) {
    result.boxes = convertOutputToBoxes(result.output, mode);
  }

  return result;
}

export async function visualizeDetections(
  imageUrl: string,
  boxes: DetectionBox[],
  mode: DetectionMode = 'general'
): Promise<Blob> {
  const response = await fetch('/api/visualize-detections', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image: imageUrl,
      boxes: boxes,
      mode: mode
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Visualization failed');
  }

  return await response.blob();
}

// 轉換模型輸出為標準化 boxes
function convertOutputToBoxes(output: RawDetection[] | unknown, mode: DetectionMode): DetectionBox[] {
  // 根據不同模型格式進行轉換
  // 這裡假設是 Grounding DINO 格式
  if (Array.isArray(output)) {
    return output.map((det: RawDetection) => ({
      x: det.box?.[0] || 0,
      y: det.box?.[1] || 0,
      w: det.box?.[2] || 0,
      h: det.box?.[3] || 0,
      label: det.label || 'object',
      score: det.score || 0,
      mode: mode
    }));
  }
  return [];
}

export async function checkDetectionHealth(): Promise<{
  ok: boolean;
  hasToken: boolean;
  hasDeployment: boolean;
}> {
  const response = await fetch('/api/health-replicate');
  return await response.json();
}
