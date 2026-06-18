// src/app/api/tailor/appointments/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { expireStaleInitiatedBookings } from '@/lib/expire-stale-payments'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await expireStaleInitiatedBookings()
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        tailorProfile: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.role !== 'TAILOR') {
      return NextResponse.json({ error: 'User is not a tailor' }, { status: 403 })
    }

    if (!user.tailorProfile) {
      return NextResponse.json([], { status: 200 })
    }

    const bookings = await prisma.booking.findMany({
      where: {
        tailorId: user.tailorProfile.id,
        status: {
          in: ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'READY_FOR_FITTING']
        }
      },
      include: {
        user: {
          select: {
            name: true
          }
        },
        availability: {
          select: {
            date: true,
            startTime: true,
            endTime: true
          }
        }
      }
    })

    const formattedAppointments = bookings
      .map((booking) => ({
      id: booking.id,
      customerName: booking.user.name || 'Unknown Customer',
      date: booking.availability.date.toISOString().split('T')[0],
      time: booking.availability.startTime.toISOString().slice(11, 16),
      service: booking.description || 'Tailoring Service',
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      }))
      .sort((left, right) => {
        const leftValue = `${left.date}T${left.time}`
        const rightValue = `${right.date}T${right.time}`
        return leftValue.localeCompare(rightValue)
      })

    return NextResponse.json(formattedAppointments)
  } catch (error) {
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
