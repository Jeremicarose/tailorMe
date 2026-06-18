import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { TailorVerificationStatus } from '@prisma/client'

export async function PATCH(
  request: Request,
  context: { params: Promise<{ tailorId: string }> }
) {
  try {
    const { tailorId } = await context.params
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const nextStatus = String(body.verificationStatus || '').toUpperCase()
    const verificationNotes = typeof body.verificationNotes === 'string' ? body.verificationNotes : null
    const portfolioApproved = typeof body.portfolioApproved === 'boolean' ? body.portfolioApproved : undefined

    if (!['PENDING', 'VERIFIED', 'REJECTED'].includes(nextStatus)) {
      return NextResponse.json({ error: 'Invalid verification status' }, { status: 400 })
    }

    const updatedTailor = await prisma.tailor.update({
      where: { id: tailorId },
      data: {
        verificationStatus: nextStatus as TailorVerificationStatus,
        verificationReviewedAt: new Date(),
        verificationNotes,
        ...(portfolioApproved !== undefined ? { portfolioApproved } : {}),
      }
    })

    return NextResponse.json(updatedTailor)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to review tailor verification' },
      { status: 500 }
    )
  }
}
