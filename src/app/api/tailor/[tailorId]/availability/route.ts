import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  context: { params: Promise<{ tailorId: string }> }
) {
  try {
    const { tailorId } = await context.params
    // Get all availabilities for the tailor
    const availabilities = await prisma.availability.findMany({
      where: {
        tailorId,
        date: {
          gte: new Date() // Only future availabilities
        },
        status: 'AVAILABLE' // Only available slots
      },
      orderBy: {
        date: 'asc'
      }
    })

    // Parse recurring days from string to array
    const mappedAvailabilities = availabilities.map(availability => ({
      ...availability,
      recurringDays: availability.recurringDays ? 
        availability.recurringDays.split(',').map(Number) : 
        []
    }))

    return NextResponse.json(mappedAvailabilities)
  } catch (error) {
    console.error('Error fetching tailor availabilities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch availabilities' },
      { status: 500 }
    )
  }
} 
