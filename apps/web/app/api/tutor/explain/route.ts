import { NextRequest, NextResponse } from 'next/server'

const TUTOR_SERVICE_URL = process.env.AI_TUTOR_SERVICE_URL ?? 'http://localhost:8001'

export async function POST(req: NextRequest) {
    let body: unknown
    try {
        body = await req.json()
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    try {
        const upstream = await fetch(`${TUTOR_SERVICE_URL}/api/tutor/explain`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        })

        const data = await upstream.json()
        return NextResponse.json(data, { status: upstream.status })
    } catch (err) {
        console.error('Tutor service unreachable:', err)
        return NextResponse.json({ error: 'Tutor service unavailable' }, { status: 502 })
    }
}
