import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
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

    const tailors = await prisma.tailor.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phoneNumber: true
          }
        },
        services: {
          select: {
            name: true
          }
        }
      },
      orderBy: [
        { verificationStatus: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json(tailors)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch tailor verification list' },
      { status: 500 }
    )
  }
}
