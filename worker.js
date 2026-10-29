// Cloudflare Worker: يستقبل النموذجين، يحفظهما في Supabase، ويرسل إشعارًا بالبريد (Resend) وإشعار جوال اختياري (ntfy).
// الأسرار تُضاف من لوحة Cloudflare ولا تُكتب هنا:
// SUPABASE_URL, SUPABASE_SERVICE_KEY, RESEND_API_KEY, NOTIFY_EMAIL, ALLOWED_ORIGIN, ADMIN_URL, NTFY_TOPIC (اختياري)
const TABLES = { volunteer: "volunteers", suggest: "suggestions" };

export default {
  async fetch(req, env) {
    const origin = String(env.ALLOWED_ORIGIN || "").trim().replace(/\/+$/, "");
    const cors = {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json",
    };
    const out = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: cors });
    try {
      if (req.method === "OPTIONS") return new Response(null, { headers: cors });
      const kind = new URL(req.url).pathname.replace(/^\/+|\/+$/g, "");
      if (req.method !== "POST" || !TABLES[kind]) return out({ error: "not_found" }, 404);

      let d;
      try { d = await req.json(); } catch { return out({ error: "bad_json" }, 400); }
      if (d.website) return out({ ok: true }); // فخ للروبوتات

      const clean = {};
      for (const [k, v] of Object.entries(d)) if (k !== "website") clean[k] = String(v).slice(0, 1500);
      if (kind === "volunteer" && (!clean.name || !clean.contact || !clean.consent)) return out({ error: "missing_fields" }, 400);
      if (kind === "suggest" && (!clean.title || !clean.body)) return out({ error: "missing_fields" }, 400);
      delete clean.consent;

      for (const n of ["SUPABASE_URL", "SUPABASE_SERVICE_KEY"]) if (!env[n]) return out({ error: "server_config_missing_" + n }, 500);
      const key = env.SUPABASE_SERVICE_KEY;
      const headers = { apikey: key, "Content-Type": "application/json", Prefer: "return=minimal" };
      if (key.startsWith("eyJ")) headers.Authorization = `Bearer ${key}`; // المفاتيح القديمة فقط (JWT)
      const ins = await fetch(`${String(env.SUPABASE_URL).replace(/\/+$/, "")}/rest/v1/${TABLES[kind]}`, {
        method: "POST", headers, body: JSON.stringify({ data: clean }),
      });
      if (!ins.ok) return out({ error: "db_save_failed", db_status: ins.status }, 500);

      // الإشعارات لا تمنع نجاح الحفظ إن تعذّرت
      const label = kind === "volunteer" ? "طلب تطوع جديد" : "اقتراح جديد";
      if (env.RESEND_API_KEY && env.NOTIFY_EMAIL) await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "Athar <onboarding@resend.dev>", to: [env.NOTIFY_EMAIL], subject: `أثر: ${label}`,
          text: `${label}\nالوقت: ${new Date().toISOString()}\nالتفاصيل: ${env.ADMIN_URL || ""}`,
        }),
      }).catch(() => {});
      if (env.NTFY_TOPIC) await fetch(`https://ntfy.sh/${env.NTFY_TOPIC}`, { method: "POST", body: `${label} - ${env.ADMIN_URL || ""}` }).catch(() => {});

      return out({ ok: true });
    } catch (e) {
      return out({ error: "server_exception" }, 500); // يصل المتصفح برمز 500 بدل انقطاع الاتصال
    }
  },
};
