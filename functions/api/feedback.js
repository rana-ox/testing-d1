
/**
 * Cloudflare Pages Function: /api/feedback
 * - GET: list feedback for a page
 * - POST: create a feedback entry (validates Turnstile token if TURNSTILE_SECRET is set)
 */
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // Helper: JSON response
  const json = (obj, status = 200, headers = {}) => new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });

  if (request.method === "GET") {
    const page = url.searchParams.get("page") || "index";
    const { results } = await env.DB
      .prepare("SELECT id, username, rating, comment, created_at FROM feedback WHERE page_slug = ?1 ORDER BY created_at DESC LIMIT 100")
      .bind(page)
      .all();
    return json(results);
  }

  if (request.method === "POST") {
    let data = {};
    const ct = request.headers.get("content-type") || "";
    try {
      if (ct.includes("application/json")) {
        data = await request.json();
      } else if (ct.includes("application/x-www-form-urlencoded")) {
        const fd = await request.formData();
        data = Object.fromEntries([...fd.entries()]);
      } else {
        return json({ error: "Unsupported content type" }, 415);
      }
    } catch (e) {
      return json({ error: "Invalid body" }, 400);
    }

    const page_slug = String(data.page_slug || "index");
    const username = String(data.username || "");
    const comment = String(data.comment || "");
    const rating = Number(data.rating);

    if (!Number.isInteger(rating) || rating < 1 || rating > 5 || !comment.trim()) {
      return json({ error: "Invalid input" }, 400);
    }

    // Optional: Turnstile server-side validation
    if (env.TURNSTILE_SECRET) {
      const token = data.turnstileToken || data["cf-turnstile-response"] || null;
      if (!token) return json({ error: "Missing Turnstile token" }, 400);
      try {
        const form = new URLSearchParams({
          secret: env.TURNSTILE_SECRET,
          response: token,
          remoteip: request.headers.get("CF-Connecting-IP") || "",
        });
        const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
          method: "POST",
          body: form,
        });
        const outcome = await r.json();
        if (!outcome.success) {
          return json({ error: "Turnstile verification failed", details: outcome["error-codes"] || [] }, 400);
        }
      } catch (err) {
        return json({ error: "Turnstile verification error" }, 502);
      }
    }

    await env.DB
      .prepare("INSERT INTO feedback (page_slug, username, rating, comment) VALUES (?1, ?2, ?3, ?4)")
      .bind(page_slug, username, rating, comment)
      .run();

    return json({ ok: true });
  }

  return json({ error: "Method not allowed" }, 405, { "Allow": "GET, POST" });
}
