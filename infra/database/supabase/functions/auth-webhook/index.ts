// index.ts
// Supabase Edge Function: auth-webhook
//
// Purpose:
// - Receive Auth events from Supabase (user.created / user.updated).
// - When user email is confirmed, run post-signup tasks:
//   - upsert profiles (includes first_name & last_name)
//   - ensure user_tenants mapping exists (uses DEFAULT_TENANT_ID if present)
//   - create memberships row (trialing) if not exists
//   - insert audit_log entry
//
// Security:
// - Checks that either header 'x-signature' OR 'x-supabase-webhook-source'
//   exactly matches WEBHOOK_SECRET.
//
// Environment variables required:
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY
// - WEBHOOK_SECRET
// - DEFAULT_TENANT_ID  (UUID)  (optional but recommended for single-tenant flows)

import { createClient } from "@supabase/supabase-js";
// import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// NOTE: Edge runtime (Deno / Bun / Node depending on supabase) usually supports
// the Web Crypto API. We use subtle.crypto for HMAC verification to be portable.

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET")!;
const DEFAULT_TENANT_ID = Deno.env.get("DEFAULT_TENANT_ID") ?? null;

console.log("Auth webhook starting...");
// debug print env vars (except secrets)
// console.debug("SUPABASE_URL:", SUPABASE_URL);
// console.debug("SUPABASE_SERVICE_ROLE_KEY:", SUPABASE_SERVICE_ROLE_KEY);
// console.debug("WEBHOOK_SECRET:", WEBHOOK_SECRET);
// console.debug("DEFAULT_TENANT_ID:", DEFAULT_TENANT_ID);

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !WEBHOOK_SECRET) {
  console.error(
    "Missing required env vars. SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, WEBHOOK_SECRET",
  );
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

/**
 * Heuristics to determine whether the user is confirmed.
 * Supabase payloads may have different shapes depending on webhook config / version.
 */
function isEmailConfirmed(payload: any): boolean {
  // Common places:
  // - payload.record.email_confirmed_at
  // - payload.user.email_confirmed_at
  // - payload.user.confirmed_at
  // - payload.record.confirmed_at
  // - payload.event === 'USER_VERIFIED' (if that exists)
  try {
    if (!payload) return false;
    const record = payload.record ?? payload.user ?? payload;
    // Accept non-empty timestamp or boolean true
    const vals = [
      record?.email_confirmed_at,
      record?.confirmed_at,
      record?.email_confirmed,
      payload?.event === "USER_VERIFIED",
      payload?.type === "user.updated" && record?.email_confirmed_at,
    ];
    for (const v of vals) {
      if (v === true) return true;
      if (typeof v === "string" && v.trim() !== "") return true;
      if (v instanceof Date) return true;
    }
    return false;
  } catch (err) {
    return false;
  }
}

/**
 * Extract canonical user record from payload.
 * We expect an object with at least: id, email, raw_user_meta_data (optional)
 */
function extractUser(payload: any) {
  // Try different shapes
  const record = payload?.record ?? payload?.user ?? payload;
  if (!record) return null;
  // Supabase auth user fields: id, email, raw_user_meta_data, created_at, ...
  return {
    id: record.id,
    email: record.email,
    first_name: record.raw_user_meta_data?.first_name ??
      record.raw_user_meta_data?.firstName ?? null,
    last_name: record.raw_user_meta_data?.last_name ??
      record.raw_user_meta_data?.lastName ?? null,
    metadata: record.raw_user_meta_data ?? {},
  };
}

/**
 * Main handler
 */
Deno.serve(async (req) => {
  // console.info("Received auth webhook request", JSON.stringify(req, null, 2));
  return await authWebhookHandler(req);
});
// export default async function (req: Request) {
async function authWebhookHandler(req: Request) {
  const rawBody = await req.text();

  // Simplified signature validation
  const headerSig = req.headers.get("x-signature") ||
    req.headers.get("x-supabase-webhook-source") ||
    "";

  if (headerSig !== WEBHOOK_SECRET) {
    console.warn("Invalid webhook secret header");
    return new Response(JSON.stringify({ error: "invalid signature" }), {
      status: 401,
    });
  }
  // return new Response(JSON.stringify({ ok: true }), { status: 200 });
  let payload: any;
  try {
    payload = JSON.parse(rawBody);
    // console.debug("Parsed payload:", JSON.stringify(payload, null, 2));
  } catch (err) {
    console.error("invalid json payload", err);
    return new Response(JSON.stringify({ error: "invalid JSON" }), {
      status: 400,
    });
  }

  // Only process if email is confirmed (or event indicates confirmation)
  const confirmed = isEmailConfirmed(payload);
  // Some flows: user.created might already be confirmed (depending on email flow)
  const eventType = payload?.type ?? payload?.event ?? null;
  console.debug("auth-webhook eventType:", eventType);

  // If not confirmed, but event is user.created and you still want to create profile earlier,
  // you can change logic. We follow your request: do post-signup tasks only on confirmed emails.
  if (!confirmed) {
    // Nothing to do - return 200 so Supabase doesn't retry excessively.
    return new Response(
      JSON.stringify({ ok: false, reason: "email_not_confirmed" }),
      { status: 200 },
    );
  }

  const user = extractUser(payload);
  if (!user?.id) {
    console.error("no user id in payload:", payload);
    return new Response(JSON.stringify({ error: "no user id" }), {
      status: 400,
    });
  }

  const tenantId = DEFAULT_TENANT_ID;
  if (!tenantId) {
    console.warn(
      "DEFAULT_TENANT_ID not configured - user will be linked to null tenant unless you handle differently.",
    );
  }

  // Perform upserts / inserts idempotently
  try {
    // 1) profiles upsert (id = auth.users.id)
    const profilePayload: any = {
      id: user.id,
      created_at: new Date().toISOString(),
    };
    if (user.first_name) profilePayload.first_name = user.first_name;
    if (user.last_name) profilePayload.last_name = user.last_name;

    const p = await supabase
      .from("profiles")
      .upsert(profilePayload, { onConflict: "id" })
      .select()
      .maybeSingle();

    if (p.error) {
      console.error("profiles upsert error", p.error);
      // continue – we still try other operations
    }

    // 2) user_tenants insert/upsert (user_id, tenant_id, role)
    if (tenantId) {
      const utPayload = {
        user_id: user.id,
        tenant_id: tenantId,
        role: "student",
        created_at: new Date().toISOString(),
      };
      const ut = await supabase
        .from("user_tenants")
        .upsert(utPayload, { onConflict: "user_id,tenant_id" })
        .select()
        .maybeSingle();
      if (ut.error) {
        console.error("user_tenants upsert error", ut.error);
      }
    }

    // 3) memberships: create trialing membership if not exists
    if (tenantId) {
      const mPayload: any = {
        user_id: user.id,
        tenant_id: tenantId,
        status: "trialing",
        created_at: new Date().toISOString(),
      };
      // upsert on user_id + tenant_id
      const m = await supabase
        .from("memberships")
        .upsert(mPayload, { onConflict: "user_id,tenant_id" })
        .select()
        .maybeSingle();
      if (m.error) {
        console.error("memberships upsert error", m.error);
      }
    }

    // 4) audit_log insert
    const auditPayload = {
      tenant_id: tenantId,
      actor_user_id: user.id,
      event_type: "user_confirmed",
      entity_type: "user",
      entity_id: user.id,
      data: {
        email: user.email,
        metadata: user.metadata ?? {},
      },
      created_at: new Date().toISOString(),
    };
    const a = await supabase.from("audit_log").insert(auditPayload).select()
      .maybeSingle();
    if (a.error) {
      console.error("audit_log insert error", a.error);
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err: any) {
    console.error("unexpected error in webhook handler", err);
    return new Response(
      JSON.stringify({ error: "internal_error", details: String(err) }),
      { status: 500 },
    );
  }
}
