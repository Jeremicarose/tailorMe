import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const startedAt = Date.now()

  try {
    await prisma.$queryRaw`SELECT 1`

    return NextResponse.json({
      status: 'ok',
      service: 'tailor-me',
      database: 'connected',
      timestamp: new Date().toISOString(),
      responseTimeMs: Date.now() - startedAt,
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        service: 'tailor-me',
        database: 'disconnected',
        timestamp: new Date().toISOString(),
        responseTimeMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : 'Health check failed',
      },
      { status: 503 }
    )
  }
}
