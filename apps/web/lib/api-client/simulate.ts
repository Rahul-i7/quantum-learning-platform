import { Gate } from "@/lib/store/circuit-store";

// lib/api-client/simulate.ts
export async function runCircuit(circuit: { num_qubits: number; gates: Gate[] }) {
  const res = await fetch("/api/simulate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(circuit),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error ?? `Request failed: ${res.status}`);
  }

  return res.json(); // shape TBD — log this first response and adjust your result-display component to match
}