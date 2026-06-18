import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { initiateMpesaPayment } from '@/lib/mpesa'
import { expireStaleInitiatedBookings } from '@/lib/expire-stale-payments'

export const dynamic = 'force-dynamic'

export async function POST(
  request: Request,
  context: { params: Promise<{ bookingId: string }> }
) {
  try {
    await expireStaleInitiatedBookings()
    const { bookingId } = await context.params
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

    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        userId: user.id
      }
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (booking.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Only pending bookings can start payment' },
        { status: 409 }
      )
    }

    if (booking.paymentStatus === 'INITIATED' || booking.paymentStatus === 'PAID') {
      return NextResponse.json(
        { error: 'Payment has already been started for this booking' },
        { status: 409 }
      )
    }

    const body = await request.json()
    const phoneNumber = typeof body.phoneNumber === 'string' ? body.phoneNumber : ''
    const amount = Number(body.amount)

    if (!phoneNumber || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: 'Phone number and amount are required' },
        { status: 400 }
      )
    }

    try {
      const paymentResponse = await initiateMpesaPayment({
        bookingId,
        phoneNumber,
        amount,
      })

      const updatedBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: {
          paymentStatus: 'INITIATED',
          paymentMethod: 'MPESA',
          paymentAmount: amount,
          paymentReference: paymentResponse.CheckoutRequestID,
          paymentMerchantRequestId: paymentResponse.MerchantRequestID,
          paymentRequestedAt: new Date(),
          paymentFailureReason: null,
        }
      })

      return NextResponse.json({
        booking: updatedBooking,
        payment: paymentResponse,
        status: 'INITIATED',
      })
    } catch (error) {
      await prisma.$transaction(async (prisma) => {
        await prisma.booking.update({
          where: { id: bookingId },
          data: {
            status: 'CANCELLED',
            paymentStatus: 'FAILED',
            paymentMethod: 'MPESA',
            paymentAmount: amount,
            paymentFailureReason: error instanceof Error ? error.message : 'Payment initiation failed'
          }
        })

        await prisma.availability.update({
          where: { id: booking.availabilityId },
          data: { status: 'AVAILABLE' }
        })
      })

      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Payment initiation failed' },
        { status: 502 }
      )
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to start payment' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ bookingId: string }> }
) {
  try {
    await expireStaleInitiatedBookings()
    const { bookingId } = await context.params
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

    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        userId: user.id
      }
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (booking.paymentStatus === 'PAID') {
      return NextResponse.json(
        { error: 'Paid bookings cannot be cancelled from the payment flow' },
        { status: 409 }
      )
    }

    await prisma.$transaction(async (prisma) => {
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: 'CANCELLED',
          paymentStatus: 'CANCELLED',
          paymentFailureReason: 'Payment flow cancelled by user'
        }
      })

      await prisma.availability.update({
        where: { id: booking.availabilityId },
        data: { status: 'AVAILABLE' }
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to cancel payment flow' },
      { status: 500 }
    )
  }
}
