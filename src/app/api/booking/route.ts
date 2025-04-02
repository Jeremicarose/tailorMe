import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await getServerSession()
    
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

    // Check if the availability slot exists and is available
    const availability = await prisma.availability.findFirst({
      where: {
        id: data.availabilityId,
        status: 'AVAILABLE'
      }
    })

    if (!availability) {
      return NextResponse.json(
        { error: 'Selected time slot is not available' },
        { status: 400 }
      )
    }

    // Create the booking and update availability status in a transaction
    const booking = await prisma.$transaction(async (prisma) => {
      // Update availability status
      await prisma.availability.update({
        where: { id: data.availabilityId },
        data: { status: 'BOOKED' }
      })

      // Create the booking
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
    console.error('Error creating booking:', error)
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession()
    
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
        availability: true
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