export async function chat(messages: {role:'system'|'user'|'assistant';content:string}[]) {
  const res = await fetch('/api/openai-proxy', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ model: 'gpt-4o-mini', messages })
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json(); // 使用時 data.choices[0].message.content 取回覆
}
