import { prisma } from '@/lib/prisma'
import { getPaymentInitiationExpiryDate } from '@/lib/booking'

export async function expireStaleInitiatedBookings() {
  const staleBookings = await prisma.booking.findMany({
    where: {
      paymentStatus: 'INITIATED',
      paymentRequestedAt: {
        lt: getPaymentInitiationExpiryDate()
      }
    },
    select: {
      id: true,
      availabilityId: true
    }
  })

  if (staleBookings.length === 0) {
    return 0
  }

  await prisma.$transaction(async (prisma) => {
    for (const booking of staleBookings) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: 'CANCELLED',
          paymentStatus: 'FAILED',
          paymentFailureReason: 'Payment initiation expired before confirmation'
        }
      })

      await prisma.availability.update({
        where: { id: booking.availabilityId },
        data: { status: 'AVAILABLE' }
      })
    }
  })

  return staleBookings.length
}
