/**
 * Cloudflare Pages Function: /api/feedback
 * - GET: list feedback for a page
 * - POST: create a feedback entry
 */
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // Helper: JSON response
  const json = (obj, status = 200, headers = {}) =>
    new Response(JSON.stringify(obj), {
      status,
      headers: { "Content-Type": "application/json", ...headers },
    });

  try {
    // GET /api/feedback?page=slug
    if (request.method === "GET") {
      const page = url.searchParams.get("page") || "index";
      const { results } = await env.DB
        .prepare(
          "SELECT id, username, rating, comment, created_at FROM feedback WHERE page_slug = ?1 ORDER BY created_at DESC LIMIT 100"
        )
        .bind(page)
        .all();

      return json(results);
    }

    // POST /api/feedback
    if (request.method === "POST") {
      let data = {};
      const ct = request.headers.get("content-type") || "";

      if (ct.includes("application/json")) {
        data = await request.json();
      } else if (ct.includes("application/x-www-form-urlencoded")) {
        const fd = await request.formData();
        data = Object.fromEntries([...fd.entries()]);
      } else {
        return json({ error: "Unsupported content type" }, 415);
      }

      const page_slug = String(data.page_slug || "index");
      const username = String(data.username || "");
      const comment = String(data.comment || "");
      const rating = Number(data.rating);

      // Validate input
      if (!Number.isInteger(rating) || rating < 1 || rating > 5 || !comment.trim()) {
        return json({ error: "Invalid input" }, 400);
      }

      // Insert into D1
      await env.DB
        .prepare(
          "INSERT INTO feedback (page_slug, username, rating, comment) VALUES (?1, ?2, ?3, ?4)"
        )
        .bind(page_slug, username, rating, comment)
        .run();

      return json({ ok: true });
    }

    // Method not allowed
    return json({ error: "Method not allowed" }, 405, { Allow: "GET, POST" });
  } catch (err) {
    // Catch SQL or runtime errors
    return json({ error: "Server error", details: err.message }, 500);
  }
}
