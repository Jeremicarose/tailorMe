import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email || !session.user.role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { tailorProfile: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.role === 'TAILOR') {
      if (!user.tailorProfile) {
        return NextResponse.json({
          totalOrders: 0,
          pendingOrders: 0,
          totalRevenue: 0,
          newMessages: 0,
        })
      }

      const [totalOrders, pendingOrders, completedBookings, newMessages] = await Promise.all([
        prisma.booking.count({
          where: { tailorId: user.tailorProfile.id }
        }),
        prisma.booking.count({
          where: {
            tailorId: user.tailorProfile.id,
            status: { in: ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'READY_FOR_FITTING'] }
          }
        }),
        prisma.booking.findMany({
          where: {
            tailorId: user.tailorProfile.id,
            status: 'COMPLETED'
          },
          select: {
            measurements: true
          }
        }),
        prisma.message.count({
          where: {
            booking: { tailorId: user.tailorProfile.id },
            isRead: false,
            senderId: { not: user.id }
          }
        }),
      ])

      const totalRevenue = completedBookings.reduce((sum, booking) => {
        const price = booking.measurements && typeof booking.measurements === 'object'
          ? Number((booking.measurements as Record<string, unknown>).estimatedPrice)
          : NaN
        return sum + (Number.isFinite(price) ? price : 0)
      }, 0)

      return NextResponse.json({
        totalOrders,
        pendingOrders,
        totalRevenue,
        newMessages,
      })
    }

    if (user.role === 'CUSTOMER') {
      const [totalOrders, activeOrders, newMessages] = await Promise.all([
        prisma.booking.count({
          where: { userId: user.id }
        }),
        prisma.booking.count({
          where: {
            userId: user.id,
            status: { in: ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'READY_FOR_FITTING'] }
          }
        }),
        prisma.message.count({
          where: {
            booking: { userId: user.id },
            isRead: false,
            senderId: { not: user.id }
          }
        }),
      ])

      return NextResponse.json({
        totalOrders,
        pendingOrders: activeOrders,
        totalRevenue: 0,
        newMessages,
      })
    }

    const [totalOrders, totalUsers, totalTailors, newMessages] = await Promise.all([
      prisma.booking.count(),
      prisma.user.count(),
      prisma.tailor.count(),
      prisma.message.count({
        where: { isRead: false }
      }),
    ])

    return NextResponse.json({
      totalOrders,
      pendingOrders: totalTailors,
      totalRevenue: totalUsers,
      newMessages,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}
