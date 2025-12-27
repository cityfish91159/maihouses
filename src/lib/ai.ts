// 根據部署環境自動選擇 API 端點
const getApiEndpoint = () => {
  // Vercel 環境：使用相對路徑
  if (window.location.hostname.includes('vercel.app')) {
    return '/api/openai-proxy';
  }
  // GitHub Pages 環境：使用 Vercel 的完整網址
  if (window.location.hostname.includes('github.io')) {
    return 'https://maihouses.vercel.app/api/openai-proxy';
  }
  // 本地開發：預設用 Vercel
  return 'https://maihouses.vercel.app/api/openai-proxy';
};

export async function chat(messages: {role:'system'|'user'|'assistant';content:string}[]) {
  const endpoint = getApiEndpoint();
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ model: 'gpt-4o-mini', messages })
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json(); // 使用時 data.choices[0].message.content 取回覆
}
