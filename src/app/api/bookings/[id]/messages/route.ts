import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

async function getAuthorizedBooking(bookingId: string, email: string) {
  const user = await prisma.user.findUnique({
    where: { email }
  })

  if (!user) {
    return { user: null, booking: null }
  }

  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      OR: [
        { userId: user.id },
        { tailor: { userId: user.id } }
      ]
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      tailor: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }
    }
  })

  return { user, booking }
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { user, booking } = await getAuthorizedBooking(id, session.user.email)
    if (!user || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    await prisma.message.updateMany({
      where: {
        bookingId: id,
        senderId: { not: user.id },
        isRead: false
      },
      data: {
        isRead: true
      }
    })

    const messages = await prisma.message.findMany({
      where: { bookingId: id },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    return NextResponse.json(messages)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

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

    const { user, booking } = await getAuthorizedBooking(id, session.user.email)
    if (!user || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    const body = await request.json()
    const content = typeof body.content === 'string' ? body.content.trim() : ''

    if (!content) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 })
    }

    const message = await prisma.message.create({
      data: {
        bookingId: id,
        senderId: user.id,
        content,
        isRead: false
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    })

    return NextResponse.json(message)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send message' },
      { status: 500 }
    )
  }
}
