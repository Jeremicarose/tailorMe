import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { expireStaleInitiatedBookings } from '@/lib/expire-stale-payments'

export async function POST(request: Request) {
  try {
    await expireStaleInitiatedBookings()
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const data = await request.json()
    
    // Validate the input
    if (!data.tailorId || !data.availabilityId || !data.requestedDeliveryDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const tailor = await prisma.tailor.findUnique({
      where: { id: data.tailorId },
      select: {
        id: true,
        verificationStatus: true
      }
    })

    if (!tailor) {
      return NextResponse.json({ error: 'Tailor not found' }, { status: 404 })
    }

    if (tailor.verificationStatus !== 'VERIFIED') {
      return NextResponse.json(
        { error: 'This tailor is not yet verified for online booking' },
        { status: 403 }
      )
    }

    const booking = await prisma.$transaction(async (prisma) => {
      const reservedAvailability = await prisma.availability.updateMany({
        where: {
          id: data.availabilityId,
          tailorId: data.tailorId,
          status: 'AVAILABLE'
        },
        data: { status: 'BOOKED' }
      })

      if (reservedAvailability.count === 0) {
        throw new Error('Selected time slot is not available')
      }

      return prisma.booking.create({
        data: {
          userId: user.id,
          tailorId: data.tailorId,
          availabilityId: data.availabilityId,
          requestedDeliveryDate: new Date(data.requestedDeliveryDate),
          description: data.description,
          measurements: data.measurements || {},
          status: 'PENDING'
        }
      })
    })

    return NextResponse.json(booking)
  } catch (error) {
    if (error instanceof Error && error.message === 'Selected time slot is not available') {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      )
    }

    console.error('Error creating booking:', error)
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    await expireStaleInitiatedBookings()
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get all bookings for the user
    const bookings = await prisma.booking.findMany({
      where: {
        userId: user.id
      },
      include: {
        tailor: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        availability: true,
        messages: {
          where: {
            isRead: false,
            senderId: { not: user.id }
          },
          select: {
            id: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(bookings)
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
} 
