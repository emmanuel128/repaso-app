// index.ts
// Supabase Edge Function: auth-webhook
//
// Triggers:
// - Database Webhook on auth.users (INSERT, UPDATE)
//
// Responsibilities:
// - On INSERT: create profile + tenant mapping immediately
// - On UPDATE: run post-confirm logic only when email gets confirmed
//
// Security:
// - Validates static webhook secret via header
//
// Required env vars:
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY
// - WEBHOOK_SECRET
// - DEFAULT_TENANT_ID (optional)

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET")!;
const DEFAULT_TENANT_ID = Deno.env.get("DEFAULT_TENANT_ID") ?? null;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

Deno.serve(async (req) => {
  return await handler(req);
});

async function handler(req: Request): Promise<Response> {
  // --- 1) Static secret validation
  const signature = req.headers.get("x-signature") ??
    req.headers.get("x-supabase-webhook-source") ??
    "";

  if (signature !== WEBHOOK_SECRET) {
    console.warn("auth-webhook: invalid webhook secret");
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
    });
  }

  // --- 2) Parse payload
  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
    });
  }

  const eventType = payload?.type ?? payload?.event;
  const record = payload?.record;

  console.debug("payload received", payload);
  if (!record?.id) {
    console.warn("auth-webhook: missing record.id");
    return new Response(JSON.stringify({ ok: true, skip: true }), {
      status: 200,
    });
  }

  const userId = record.id;

  // --- 3) Determine event intent
  const isInsert = eventType === "INSERT" ||
    eventType === "user.created";

  const emailConfirmed = !!record.email_confirmed_at ||
    !!record.confirmed_at ||
    record.email_confirmed === true;

  const isConfirmedUpdate =
    (eventType === "UPDATE" || eventType === "user.updated") &&
    emailConfirmed;

  if (!isInsert && !isConfirmedUpdate) {
    // Ignore noise updates
    return new Response(JSON.stringify({ ok: true, ignored: true }), {
      status: 200,
    });
  }

  // --- 4) Extract metadata
  const meta = record.raw_user_meta_data ?? {};
  const firstName = meta.first_name ?? meta.firstName ?? null;
  const lastName = meta.last_name ?? meta.lastName ?? null;
  const email = record.email ?? null;

  // --- 5) Build queries (idempotent)
  const queries: Promise<any>[] = [];

  // profiles (always on INSERT)
  if (isInsert) {
    queries.push(
      (async () =>
        await supabase
          .from("profiles")
          .upsert(
            {
              id: userId,
              first_name: firstName,
              last_name: lastName,
            },
            { onConflict: "id" },
          ).throwOnError())(),
    );
  }

  // tenant-related tables only if tenant configured
  if (DEFAULT_TENANT_ID) {
    // user_tenants (INSERT only)
    if (isInsert) {
      queries.push(
        (async () =>
          await supabase
            .from("user_tenants")
            .upsert(
              {
                user_id: userId,
                tenant_id: DEFAULT_TENANT_ID,
                role: "student",
              },
              { onConflict: "user_id,tenant_id" },
            ).throwOnError())(),
      );
    }

    // memberships (only when confirmed)
    if (isConfirmedUpdate || (isInsert && emailConfirmed)) {
      queries.push(
        (async () =>
          await supabase
            .from("memberships")
            .upsert(
              {
                user_id: userId,
                tenant_id: DEFAULT_TENANT_ID,
                status: "trialing",
              },
              { onConflict: "user_id,tenant_id" },
            ).throwOnError())(),
      );

      // audit_log (idempotent via DB constraint recommended)
      queries.push(
        (async () =>
          await supabase.from("audit_log").insert({
            tenant_id: DEFAULT_TENANT_ID,
            actor_user_id: userId,
            event_type: "user_confirmed",
            entity_type: "user",
            entity_id: userId,
            data: { email },
          }).throwOnError())(),
      );
    }
  }

  // --- 6) Execute queries in parallel
  const results = await Promise.allSettled(queries);

  const errors = results
    .filter((r) => r.status === "rejected")
    .map((r: any) => r.reason);

  if (errors.length > 0) {
    console.error("auth-webhook partial failure", errors);
    // Still return 200 to avoid webhook retry storm
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}
