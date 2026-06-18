import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { BookingStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getEmailTemplate, sendEmail } from '@/utils/email'
import { authOptions } from '@/lib/auth'
import { canTransitionBookingStatus, getAvailabilityStatusForBookingStatus } from '@/lib/booking'

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { status } = await request.json()
    const nextStatus = status as BookingStatus
    if (!nextStatus) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      )
    }

    const booking = await prisma.$transaction(async (prisma) => {
      const existingBooking = await prisma.booking.findUnique({
        where: { id }
      })

      if (!existingBooking) {
        return null
      }

      if (!canTransitionBookingStatus(existingBooking.status, nextStatus)) {
        throw new Error(`Cannot move booking from ${existingBooking.status} to ${nextStatus}`)
      }

      await prisma.availability.update({
        where: { id: existingBooking.availabilityId },
        data: { status: getAvailabilityStatusForBookingStatus(nextStatus) }
      })

      return prisma.booking.update({
        where: {
          id
        },
        data: {
          status: nextStatus
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
                  name: true,
                  email: true
                }
              }
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
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    const emailTemplate = getEmailTemplate(nextStatus, {
      customer: booking.user,
      tailor: booking.tailor.user,
      availability: booking.availability,
      requestedDeliveryDate: booking.requestedDeliveryDate
    })
    await sendEmail(booking.user.email, emailTemplate)

    if (['ACCEPTED', 'REJECTED'].includes(nextStatus)) {
      const tailorTemplate = {
        subject: `Booking ${nextStatus.toLowerCase()}`,
        body: `You have ${nextStatus.toLowerCase()} the booking from ${booking.user.name} for ${new Date(booking.availability.date).toLocaleDateString()} at ${booking.availability.startTime}.`
      }
      await sendEmail(booking.tailor.user.email, tailorTemplate)
    }

    return NextResponse.json(booking)
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Cannot move booking')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      )
    }

    console.error('Error updating booking:', error)
    return NextResponse.json(
      { error: 'Failed to update booking' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const booking = await prisma.booking.findUnique({
      where: {
        id
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
                name: true,
                email: true
              }
            }
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

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(booking)
  } catch (error) {
    console.error('Error fetching booking:', error)
    return NextResponse.json(
      { error: 'Failed to fetch booking' },
      { status: 500 }
    )
  }
}
