import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the tailor profile
    const tailor = await prisma.tailor.findFirst({
      where: {
        user: {
          email: session.user.email
        }
      }
    })

    if (!tailor) {
      return NextResponse.json({ error: 'Tailor profile not found' }, { status: 404 })
    }

    // Get all availabilities for the tailor
    const availabilities = await prisma.availability.findMany({
      where: {
        tailorId: tailor.id,
        date: {
          gte: new Date() // Only future availabilities
        }
      },
      orderBy: {
        date: 'asc'
      }
    })

    return NextResponse.json(availabilities)
  } catch (error) {
    console.error('Error fetching availabilities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch availabilities' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tailor = await prisma.tailor.findFirst({
      where: {
        user: {
          email: session.user.email
        }
      }
    })

    if (!tailor) {
      return NextResponse.json({ error: 'Tailor profile not found' }, { status: 404 })
    }

    const data = await request.json()
    
    // Validate the input
    if (!data.date || !data.startTime || !data.endTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Convert recurring days array to string
    const recurringDaysString = data.recurringDays ? data.recurringDays.join(',') : ''

    // Create the availability
    const availability = await prisma.availability.create({
      data: {
        tailorId: tailor.id,
        date: new Date(data.date),
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        isRecurring: data.isRecurring || false,
        recurringDays: recurringDaysString,
        status: 'AVAILABLE'
      }
    })

    // If it's recurring, create additional slots
    if (data.isRecurring && data.recurringDays?.length > 0) {
      const futureSlots = generateRecurringSlots(
        data.date,
        data.startTime,
        data.endTime,
        data.recurringDays,
        4 // Generate for next 4 weeks
      )

      await prisma.availability.createMany({
        data: futureSlots.map(slot => ({
          tailorId: tailor.id,
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          isRecurring: true,
          recurringDays: recurringDaysString,
          status: 'AVAILABLE'
        }))
      })
    }

    return NextResponse.json(availability)
  } catch (error) {
    console.error('Error creating availability:', error)
    return NextResponse.json(
      { error: 'Failed to create availability' },
      { status: 500 }
    )
  }
}

function generateRecurringSlots(
  baseDate: string,
  startTime: string,
  endTime: string,
  recurringDays: number[],
  weeks: number
) {
  const slots = []
  const start = new Date(baseDate)
  
  for (let week = 1; week <= weeks; week++) {
    for (const day of recurringDays) {
      const date = new Date(start)
      date.setDate(date.getDate() + (day - start.getDay()) + (week * 7))
      
      const slotStart = new Date(new Date(startTime).setDate(date.getDate()))
      const slotEnd = new Date(new Date(endTime).setDate(date.getDate()))
      
      slots.push({
        date,
        startTime: slotStart,
        endTime: slotEnd
      })
    }
  }
  
  return slots
} 