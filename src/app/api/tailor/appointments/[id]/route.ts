import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { BookingStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { canTransitionBookingStatus, getAvailabilityStatusForBookingStatus } from '@/lib/booking'


export async function PATCH(
    request: Request, 
    context: { params: Promise<{ id: string }> }
  ) {
    try {
      const { id } = await context.params
      const session = await getServerSession(authOptions)
      
      if (!session?.user?.email) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
      }
  
      // Find the tailor by email
      const tailor = await prisma.tailor.findFirst({
        where: { 
          user: {
            email: session.user.email,
            role: 'TAILOR'
          }
        },
        select: { id: true }
      })
  
      if (!tailor) {
        return NextResponse.json({ error: 'Tailor not found' }, { status: 404 })
      }
  
      const { status } = await request.json()
      const nextStatus = status as BookingStatus

      if (nextStatus !== 'ACCEPTED' && nextStatus !== 'CANCELLED') {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      }

      const updatedBooking = await prisma.$transaction(async (prisma) => {
        const existingBooking = await prisma.booking.findFirst({
          where: {
            id,
            tailorId: tailor.id
          }
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
          where: { id },
          data: { status: nextStatus }
        })
      })

      if (!updatedBooking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
      }
      
      return NextResponse.json(updatedBooking)
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Cannot move booking')) {
        return NextResponse.json({ error: error.message }, { status: 409 })
      }

      console.error('Error updating booking:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
