
import { NextRequest, NextResponse } from "next/server";

const SIMULATION_SERVICE_URL =
  process.env.SIMULATION_SERVICE_URL ?? "http://localhost:8000";

export async function POST(req: NextRequest) {
 

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
