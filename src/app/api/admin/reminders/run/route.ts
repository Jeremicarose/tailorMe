import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { sendEmail } from '@/utils/email'
import { ReminderRunStatus, ReminderTriggerType } from '@prisma/client'

const APPOINTMENT_REMINDER_WINDOW_HOURS = 24
const DELIVERY_REMINDER_WINDOW_DAYS = 2
const REMINDER_REPEAT_HOURS = 12

export async function GET() {
  try {
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

    const runs = await prisma.reminderRun.findMany({
      orderBy: {
        startedAt: 'desc'
      },
      take: 20
    })

    return NextResponse.json(runs)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch reminder history' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  let reminderRunId: string | null = null
  let appointmentRemindersSent = 0
  let deliveryRemindersSent = 0
  let appointmentRemindersDue = 0
  let deliveryRemindersDue = 0
  let totalBookingsScanned = 0

  try {
    const session = await getServerSession(authOptions)
    const url = new URL(request.url)
    const token = url.searchParams.get('token')
    const dryRun = url.searchParams.get('dryRun') === 'true'
    const cronToken = process.env.REMINDER_RUNNER_TOKEN

    const isAdmin = !!session?.user?.email && !!session.user.role
    const isTokenAuthorized = !!cronToken && token === cronToken

    if (!isAdmin && !isTokenAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let triggeredBy: string | null = null
    if (isAdmin) {
      const user = await prisma.user.findUnique({
        where: { email: session!.user!.email! }
      })

      if (!user || user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      triggeredBy = user.email
    }

    reminderRunId = (
      await prisma.reminderRun.create({
        data: {
          triggerType: isAdmin ? ReminderTriggerType.ADMIN : ReminderTriggerType.TOKEN,
          status: ReminderRunStatus.RUNNING,
          triggeredBy
        }
      })
    ).id

    const now = new Date()
    const appointmentUpperBound = new Date(now.getTime() + APPOINTMENT_REMINDER_WINDOW_HOURS * 60 * 60 * 1000)
    const deliveryUpperBound = new Date(now.getTime() + DELIVERY_REMINDER_WINDOW_DAYS * 24 * 60 * 60 * 1000)
    const reminderRepeatBoundary = new Date(now.getTime() - REMINDER_REPEAT_HOURS * 60 * 60 * 1000)

    const bookings = await prisma.booking.findMany({
      where: {
        status: {
          in: ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'READY_FOR_FITTING']
        }
      },
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        },
        tailor: {
          include: {
            user: {
              select: {
                email: true,
                name: true
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

    totalBookingsScanned = bookings.length

    for (const booking of bookings) {
      const shouldSendAppointmentReminder =
        booking.availability.startTime >= now &&
        booking.availability.startTime <= appointmentUpperBound &&
        (!booking.lastAppointmentReminderSentAt || booking.lastAppointmentReminderSentAt < reminderRepeatBoundary)

      const shouldSendDeliveryReminder =
        booking.requestedDeliveryDate >= now &&
        booking.requestedDeliveryDate <= deliveryUpperBound &&
        (!booking.lastDeliveryReminderSentAt || booking.lastDeliveryReminderSentAt < reminderRepeatBoundary)

      if (shouldSendAppointmentReminder) {
        appointmentRemindersDue += 1

        if (dryRun) {
          continue
        }

        await Promise.all([
          sendEmail(booking.user.email, {
            subject: 'Upcoming Fitting Reminder',
            body: `Hello ${booking.user.name || 'there'},\n\nThis is a reminder that your appointment with ${booking.tailor.user.name || 'your tailor'} is scheduled for ${new Date(booking.availability.startTime).toLocaleString()}.\n\nPlease check your dashboard for details.`
          }),
          sendEmail(booking.tailor.user.email, {
            subject: 'Upcoming Customer Appointment',
            body: `Hello ${booking.tailor.user.name || 'there'},\n\nThis is a reminder that your appointment with ${booking.user.name || 'your customer'} is scheduled for ${new Date(booking.availability.startTime).toLocaleString()}.\n\nPlease check your dashboard for details.`
          }),
        ])

        await prisma.booking.update({
          where: { id: booking.id },
          data: { lastAppointmentReminderSentAt: now }
        })

        appointmentRemindersSent += 1
      }

      if (shouldSendDeliveryReminder) {
        deliveryRemindersDue += 1

        if (dryRun) {
          continue
        }

        await Promise.all([
          sendEmail(booking.user.email, {
            subject: 'Delivery Date Reminder',
            body: `Hello ${booking.user.name || 'there'},\n\nYour booking with ${booking.tailor.user.name || 'your tailor'} has an expected delivery date of ${booking.requestedDeliveryDate.toLocaleDateString()}.\n\nPlease review your dashboard for the latest status.`
          }),
          sendEmail(booking.tailor.user.email, {
            subject: 'Delivery Deadline Reminder',
            body: `Hello ${booking.tailor.user.name || 'there'},\n\nBooking ${booking.id} for ${booking.user.name || 'your customer'} is expected by ${booking.requestedDeliveryDate.toLocaleDateString()}.\n\nPlease review your dashboard for details.`
          }),
        ])

        await prisma.booking.update({
          where: { id: booking.id },
          data: { lastDeliveryReminderSentAt: now }
        })

        deliveryRemindersSent += 1
      }
    }

    await prisma.reminderRun.update({
      where: { id: reminderRunId },
      data: {
        status: dryRun ? ReminderRunStatus.DRY_RUN : ReminderRunStatus.SUCCESS,
        totalBookingsScanned,
        appointmentRemindersDue,
        appointmentRemindersSent,
        deliveryRemindersDue,
        deliveryRemindersSent,
        completedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      dryRun,
      totalBookingsScanned,
      appointmentRemindersDue,
      appointmentRemindersSent,
      deliveryRemindersDue,
      deliveryRemindersSent
    })
  } catch (error) {
    if (reminderRunId) {
      await prisma.reminderRun.update({
        where: { id: reminderRunId },
        data: {
          status: ReminderRunStatus.FAILED,
          totalBookingsScanned,
          appointmentRemindersDue,
          appointmentRemindersSent,
          deliveryRemindersDue,
          deliveryRemindersSent,
          errorMessage: error instanceof Error ? error.message : 'Failed to run reminders',
          completedAt: new Date()
        }
      }).catch(() => null)
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to run reminders' },
      { status: 500 }
    )
  }
}
