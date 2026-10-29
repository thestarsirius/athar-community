// Cloudflare Worker: يستقبل النموذجين، يحفظهما في Supabase، ويرسل إشعارًا بالبريد عبر Resend.
// الأسرار تُضاف من لوحة Cloudflare ولا تُكتب هنا:
// SUPABASE_URL, SUPABASE_SERVICE_KEY, RESEND_API_KEY, NOTIFY_EMAIL, ALLOWED_ORIGIN
const TABLES = { volunteer: "volunteers", suggest: "suggestions" };

export default {
  async fetch(req, env) {
    const cors = {
      "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
    if (req.method === "OPTIONS") return new Response(null, { headers: cors });
    const kind = new URL(req.url).pathname.replace("/", "");
    if (req.method !== "POST" || !TABLES[kind]) return new Response("Not found", { status: 404, headers: cors });

    let d;
    try { d = await req.json(); } catch { return new Response("Bad request", { status: 400, headers: cors }); }
    if (d.website) return new Response("ok", { headers: cors }); // فخ للروبوتات

    const clean = {};
    for (const [k, v] of Object.entries(d)) if (k !== "website") clean[k] = String(v).slice(0, 1500);
    if (kind === "volunteer" && (!clean.name || !clean.contact || !clean.consent)) return new Response("Missing", { status: 400, headers: cors });
    if (kind === "suggest" && (!clean.title || !clean.body)) return new Response("Missing", { status: 400, headers: cors });
    delete clean.consent;

    const ins = await fetch(`${env.SUPABASE_URL}/rest/v1/${TABLES[kind]}`, {
      method: "POST",
      headers: { apikey: env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ data: clean }),
    });
    if (!ins.ok) return new Response("Save failed", { status: 500, headers: cors });

    // الإشعار لا يمنع نجاح الحفظ إن تعذّر
    const label = kind === "volunteer" ? "طلب تطوع جديد" : "اقتراح جديد";
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Athar <onboarding@resend.dev>",
        to: [env.NOTIFY_EMAIL],
        subject: `أثر: ${label}`,
        text: `${label}\nالوقت: ${new Date().toISOString()}\nالتفاصيل: ${env.ADMIN_URL || ""}`,
      }),
    }).catch(() => {});

    // إشعار جوال مجاني عبر ntfy.sh (اختياري): يلزم NTFY_TOPIC سري وطويل
    if (env.NTFY_TOPIC) await fetch(`https://ntfy.sh/${env.NTFY_TOPIC}`, { method: "POST", body: `${label} - ${env.ADMIN_URL || ""}` }).catch(() => {});

    return new Response(JSON.stringify({ ok: true }), { headers: { ...cors, "Content-Type": "application/json" } });
  },
};
