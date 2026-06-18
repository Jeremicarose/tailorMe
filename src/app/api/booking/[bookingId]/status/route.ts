import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function PATCH(
  request: Request,
  context: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await context.params
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    
    // Validate the input
    if (!data.status) {
      return NextResponse.json(
        { error: 'Missing status' },
        { status: 400 }
      )
    }

    // Update the booking status
    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: data.status },
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
        }
      }
    })

    // Send email notification
    const emailTemplate = getEmailTemplate(booking)
    if (emailTemplate) {
      await resend.emails.send({
        from: 'TailorMe <notifications@tailorme.com>',
        to: [booking.user.email],
        subject: emailTemplate.subject,
        html: emailTemplate.body
      })
    }

    return NextResponse.json(booking)
  } catch (error) {
    console.error('Error updating booking status:', error)
    return NextResponse.json(
      { error: 'Failed to update booking status' },
      { status: 500 }
    )
  }
}

function getEmailTemplate(booking: any) {
  const templates = {
    ACCEPTED: {
      subject: 'Your booking has been accepted!',
      body: `
        <h1>Booking Accepted</h1>
        <p>Hello ${booking.user.name},</p>
        <p>${booking.tailor.user.name} has accepted your booking request.</p>
        <p>They will start working on your order soon.</p>
      `
    },
    REJECTED: {
      subject: 'Booking Update: Request Declined',
      body: `
        <h1>Booking Declined</h1>
        <p>Hello ${booking.user.name},</p>
        <p>Unfortunately, ${booking.tailor.user.name} is unable to accept your booking at this time.</p>
        <p>Please try booking another time slot or contact them directly.</p>
      `
    },
    IN_PROGRESS: {
      subject: 'Work has started on your order!',
      body: `
        <h1>Order In Progress</h1>
        <p>Hello ${booking.user.name},</p>
        <p>${booking.tailor.user.name} has started working on your order.</p>
        <p>They will notify you when it's ready for fitting.</p>
      `
    },
    READY_FOR_FITTING: {
      subject: 'Your order is ready for fitting!',
      body: `
        <h1>Ready for Fitting</h1>
        <p>Hello ${booking.user.name},</p>
        <p>Your order is ready for fitting! Please contact ${booking.tailor.user.name} to schedule your fitting appointment.</p>
      `
    },
    COMPLETED: {
      subject: 'Your order is complete!',
      body: `
        <h1>Order Complete</h1>
        <p>Hello ${booking.user.name},</p>
        <p>Your order has been completed! You can now pick up your items from ${booking.tailor.user.name}.</p>
        <p>We hope you're satisfied with the service. Please consider leaving a review!</p>
      `
    }
  }

  return templates[booking.status as keyof typeof templates]
} 
