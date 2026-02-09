const utf8Encoder = new TextEncoder();
const utf8Decoder = new TextDecoder();

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }

  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

export function encodeSharedReportPayload(payload: unknown): string {
  const json = JSON.stringify(payload);
  const base64 = bytesToBase64(utf8Encoder.encode(json));
  return encodeURIComponent(base64);
}

export function decodeSharedReportPayload<T>(encodedPayload: string): T | null {
  try {
    const base64 = decodeURIComponent(encodedPayload);
    const bytes = base64ToBytes(base64);
    const json = utf8Decoder.decode(bytes);
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}
