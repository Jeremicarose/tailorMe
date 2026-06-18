import { AvailabilityStatus, BookingStatus } from '@prisma/client'

export const PAYMENT_INITIATION_TIMEOUT_MINUTES = 15

const ALLOWED_BOOKING_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ['ACCEPTED', 'REJECTED', 'CANCELLED'],
  ACCEPTED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['READY_FOR_FITTING', 'CANCELLED'],
  READY_FOR_FITTING: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
  REJECTED: [],
}

export function canTransitionBookingStatus(
  currentStatus: BookingStatus,
  nextStatus: BookingStatus
) {
  return ALLOWED_BOOKING_TRANSITIONS[currentStatus]?.includes(nextStatus) ?? false
}

export function bookingStatusReleasesAvailability(status: BookingStatus) {
  return status === 'CANCELLED' || status === 'REJECTED'
}

export function getAvailabilityStatusForBookingStatus(status: BookingStatus): AvailabilityStatus {
  return bookingStatusReleasesAvailability(status) ? 'AVAILABLE' : 'BOOKED'
}

export function getPaymentInitiationExpiryDate(from = new Date()) {
  return new Date(from.getTime() - PAYMENT_INITIATION_TIMEOUT_MINUTES * 60 * 1000)
}
