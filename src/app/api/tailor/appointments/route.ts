// src/app/api/tailor/appointments/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from "/Users/jeremicarose/Documents/tailor-me/src/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession()
    
    console.log('Session:', JSON.stringify(session, null, 2))
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        tailorProfile: true
      }
    })

    console.log('User:', JSON.stringify(user, null, 2))

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if the user is a tailor
    if (user.role !== 'TAILOR') {
      return NextResponse.json({ error: 'User is not a tailor' }, { status: 403 })
    }

    // If no tailor profile exists, create one
    let tailorProfile = user.tailorProfile
    if (!tailorProfile) {
      tailorProfile = await prisma.tailor.create({
        data: {
          userId: user.id,
          specialty: 'General Tailoring',
          bio: 'Professional Tailor',
          location: 'Not Specified'
        }
      })
      console.log('Created new tailor profile:', JSON.stringify(tailorProfile, null, 2))
    }

    // Fetch bookings for this tailor
    const bookings = await prisma.booking.findMany({
      where: {
        tailorId: tailorProfile.id,
        status: {
          in: ['PENDING', 'CONFIRMED']
        }
      },
      include: {
        user: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        date: 'asc'
      }
    })

    console.log('Bookings:', JSON.stringify(bookings, null, 2))

    // Transform the data to match the frontend interface
    const formattedAppointments = bookings.map(booking => ({
      id: booking.id,
      customerName: booking.user.name || 'Unknown Customer',
      date: booking.date.toISOString().split('T')[0],
      time: booking.date.toISOString().split('T')[1].slice(0, 5),
      service: 'Tailoring Service', 
      status: booking.status
    }))

    return NextResponse.json(formattedAppointments)
  } catch (error) {
    console.error('Error fetching appointments:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}