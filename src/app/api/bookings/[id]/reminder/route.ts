import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { sendEmail } from '@/utils/email'

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
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
        id,
        OR: [
          { userId: user.id },
          { tailor: { userId: user.id } }
        ]
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
            startTime: true
          }
        }
      }
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    const body = await request.json().catch(() => ({}))
    const target = body.target === 'TAILOR' ? 'TAILOR' : 'CUSTOMER'

    const recipient = target === 'TAILOR' ? booking.tailor.user : booking.user
    const counterpart = target === 'TAILOR' ? booking.user : booking.tailor.user

    await sendEmail(recipient.email, {
      subject: 'Booking Reminder',
      body: `Hello ${recipient.name || 'there'},\n\nThis is a reminder regarding booking ${booking.id} with ${counterpart.name || 'your counterpart'}.\n\nAppointment Date: ${new Date(booking.availability.date).toLocaleDateString()}\nTime: ${booking.availability.startTime}\nStatus: ${booking.status}\n\nPlease review your dashboard for details.`
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send reminder' },
      { status: 500 }
    )
  }
}
