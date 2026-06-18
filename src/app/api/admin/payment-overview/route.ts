import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { expireStaleInitiatedBookings } from '@/lib/expire-stale-payments'

export async function GET() {
  try {
    await expireStaleInitiatedBookings()
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const bookings = await prisma.booking.findMany({
      where: {
        paymentStatus: {
          in: ['INITIATED', 'FAILED', 'CANCELLED']
        }
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        tailor: {
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(bookings)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch payment overview' },
      { status: 500 }
    )
  }
}
