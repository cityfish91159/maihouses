export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  try {
    return new Response(JSON.stringify({ ok: true, hello: 'world', runtime: 'edge' }), {
      headers: { 'content-type': 'application/json' },
      status: 200,
    });
  } catch (e) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: String(e && e.message ? e.message : e),
      }),
      {
        headers: { 'content-type': 'application/json' },
        status: 500,
      }
    );
  }
}
