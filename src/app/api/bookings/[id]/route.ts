import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { getEmailTemplate, sendEmail } from '@/utils/email';
import { Booking, Prisma } from '@prisma/client';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { status } = await request.json();
    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    // Update booking status
    const booking = await prisma.booking.update({
      where: {
        id: params.id
      },
      data: {
        status
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
    });

    // Send email notification
    const emailTemplate = getEmailTemplate(status, {
      customer: booking.user,
      tailor: booking.tailor.user,
      availability: booking.availability,
      requestedDeliveryDate: booking.requestedDeliveryDate
    });
    await sendEmail(booking.user.email, emailTemplate);

    // Send notification to tailor as well for certain statuses
    if (['ACCEPTED', 'REJECTED'].includes(status)) {
      const tailorTemplate = {
        subject: `Booking ${status.toLowerCase()}`,
        body: `You have ${status.toLowerCase()} the booking from ${booking.user.name} for ${new Date(booking.availability.date).toLocaleDateString()} at ${booking.availability.startTime}.`
      };
      await sendEmail(booking.tailor.user.email, tailorTemplate);
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error('Error updating booking:', error);
    return NextResponse.json(
      { error: 'Failed to update booking' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: {
        id: params.id
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        tailor: {
          select: {
            name: true,
            email: true,
            id: true
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
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error('Error fetching booking:', error);
    return NextResponse.json(
      { error: 'Failed to fetch booking' },
      { status: 500 }
    );
  }
} 