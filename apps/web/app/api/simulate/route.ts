// API Gateway route — proxies circuit-simulation requests to the
// Simulation Service (Role 3's Qiskit/FastAPI backend).
//
// This is intentionally thin for the hackathon: validate auth, forward
// the body, forward the response. If the gateway later needs real
// orchestration (e.g. calling the AI Tutor Service too, or writing a
// submission record to Supabase), add it here — the frontend should
// only ever talk to this route, never to the simulation service directly.

import { NextRequest, NextResponse } from "next/server";
// Auth import intentionally left out for now: @supabase/ssr isn't in
// package.json until Role 5's Supabase setup lands. Once it does, add:
//   import { createServerClient } from "@supabase/ssr";
// and match whatever client helper ends up in apps/web/lib/supabase.

const SIMULATION_SERVICE_URL =
  process.env.SIMULATION_SERVICE_URL ?? "http://localhost:8001";

export async function POST(req: NextRequest) {
  // --- Auth check (wire in once Role 5's Supabase client exists) ---
  // const supabase = createServerClient(...);
  // const { data: { user } } = await supabase.auth.getUser();
  // if (!user) {
  //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const upstream = await fetch(`${SIMULATION_SERVICE_URL}/simulate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch (err) {
    console.error("Simulation service unreachable:", err);
    return NextResponse.json(
      { error: "Simulation service unavailable" },
      { status: 502 }
    );
  }
}
