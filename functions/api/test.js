export async function onRequest(context) {
  const { env } = context;
  try {
    const { results } = await env.DB.prepare("SELECT * FROM feedback LIMIT 5").all();
    return new Response(JSON.stringify(results), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
}
