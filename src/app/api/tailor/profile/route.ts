import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { Prisma } from "@prisma/client"
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { Session } from 'next-auth'

// GET: Retrieve tailor profile
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions) as Session | null

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { 
        email: session.user.email,
        role: 'TAILOR' 
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'Not a tailor' }, { status: 403 })
    }

    // Find the tailor profile
    const tailorProfile = await prisma.tailor.findUnique({
      where: { userId: user.id },
      include: {
        services: true,
        user: {
          select: {
            phoneNumber: true,
            image: true
          }
        }
      }
    })

    if (!tailorProfile) {
      return NextResponse.json({ error: 'Tailor profile not found' }, { status: 404 })
    }

    // Return the tailor profile
    return NextResponse.json({
      id: tailorProfile.id,
      userId: tailorProfile.userId,
      specialty: tailorProfile.specialty,
      bio: tailorProfile.bio,
      location: tailorProfile.location,
      availabilityStatus: tailorProfile.availabilityStatus,
      maxDailyBookings: tailorProfile.maxDailyBookings,
      bookingNoticePeriod: tailorProfile.bookingNoticePeriod,
      unavailableDates: tailorProfile.unavailableDates ? JSON.parse(tailorProfile.unavailableDates) : [],
      services: tailorProfile.services,
      phoneNumber: tailorProfile.user.phoneNumber,
      profileImage: tailorProfile.user.image
    })
  } catch (error) {
    console.error('Error fetching tailor profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Update tailor profile
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions) as Session | null

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Find the tailor
    const user = await prisma.user.findUnique({
      where: { 
        email: session.user.email,
        role: 'TAILOR' 
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'Not a tailor' }, { status: 403 })
    }

    // Ensure tailor profile exists
    let tailorProfile = await prisma.tailor.findUnique({
      where: { userId: user.id }
    })

    if (!tailorProfile) {
      tailorProfile = await prisma.tailor.create({
        data: { 
          userId: user.id,
          specialty: null,
          bio: null,
          location: null
        }
      })
    }

    // Parse the request body
    const { 
      specialty, 
      bio, 
      location, 
      services, 
      availabilityStatus, 
      maxDailyBookings, 
      bookingNoticePeriod, 
      unavailableDates,
      phoneNumber,
      profileImage
    } = await request.json()

    // Update user profile if phone number or profile image is provided
    if (phoneNumber || profileImage) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          ...(phoneNumber && { phoneNumber }),
          ...(profileImage && { image: profileImage })
        }
      })
    }

    // Prepare update data
    const updateData: Prisma.TailorUpdateInput = {
      specialty,
      bio,
      location,
      // Remove direct availability assignment
      ...(maxDailyBookings !== undefined && { maxDailyBookings }),
      ...(bookingNoticePeriod !== undefined && { bookingNoticePeriod }),
      unavailableDates: unavailableDates ? JSON.stringify(unavailableDates) : null,
      services: {
        // Delete existing services
        deleteMany: {},
        // Create new services
        create: services?.map((service: any) => ({
          name: service.name,
          description: service.description ?? null,
          price: service.price ? String(service.price) : null
        })) || []
      }
    }

    // Conditionally add availabilityStatus if it's provided
    if (availabilityStatus) {
      updateData.availabilityStatus = availabilityStatus.toUpperCase() as Prisma.EnumAvailabilityStatusFieldUpdateOperationsInput
    }

    // Update tailor profile
    const updatedProfile = await prisma.tailor.update({
      where: { id: tailorProfile.id },
      data: updateData,
      include: {
        services: true,
        user: true
      }
    })

    console.log('Updated Tailor Profile:', {
      id: updatedProfile.id,
      specialty: updatedProfile.specialty,
      availabilityStatus: updatedProfile.availabilityStatus,
      services: updatedProfile.services
    })

    // Prepare response
    return NextResponse.json({
      id: updatedProfile.id,
      specialty: updatedProfile.specialty,
      bio: updatedProfile.bio,
      location: updatedProfile.location,
      services: updatedProfile.services,
      availabilityStatus: updatedProfile.availabilityStatus,
      maxDailyBookings: updatedProfile.maxDailyBookings,
      bookingNoticePeriod: updatedProfile.bookingNoticePeriod,
      unavailableDates: updatedProfile.unavailableDates ? 
        JSON.parse(updatedProfile.unavailableDates) : 
        [],
      user: {
        name: updatedProfile.user.name,
        email: updatedProfile.user.email,
        phoneNumber: updatedProfile.user.phoneNumber,
        image: updatedProfile.user.image
      }
    })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}