import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation Schema
const TailorProfileSchema = z.object({
    name: z.string().optional(),
    phoneNumber: z.string().optional(),
    speciality: z.string().optional(),
    bio: z.string().optional(),
    location: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    profileImage: z.string().optional()
})

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ tailorId: string }> }
) {
    try{
       const { tailorId } = await context.params
       const tailorDetails = await prisma.tailor.findUnique({
        where: { id: tailorId},
        include: {
          user: true,
          services: true,
          reviews: {
            include: {
              reviewer: {
                select: {
                  name: true,
                  image: true
                }
              }
            },
            take: 5
          },
          availabilities: {
            where: {
              status: 'AVAILABLE',
              date: { gte: new Date()}
            },
            orderBy: {
              date: 'asc'
            }
          }
        }
       })
       if (!tailorDetails) {
        return NextResponse.json({ error: 'Tailor not found'}, {status: 404})
       }

       const transformedTailor = {
        ...tailorDetails,
        name: tailorDetails.user.name || 'Unamed Tailor',
        email: tailorDetails.user.email || 'N/A',
        profileImage: tailorDetails.user.image || '/default-avatar.png',
        contactNumber: (tailorDetails.user as any).phoneNumber ?? 'N/A',
        averageRating: tailorDetails.averageRating || 0,
        distance: 0,
        specialty: tailorDetails.specialty || 'General Tailoring',
        bio: tailorDetails.bio || 'No bio available',
        services: tailorDetails.services.map(service => service.name),
        completionRate: tailorDetails.completionRate || 0,
        verificationStatus: tailorDetails.verificationStatus,
        verificationNotes: tailorDetails.verificationNotes,
        businessName: tailorDetails.businessName,
        yearsOfExperience: tailorDetails.yearsOfExperience,
        portfolioApproved: tailorDetails.portfolioApproved,
        availability: tailorDetails.availabilities.map(avail =>
          `${avail.startTime.toLocaleString()} - ${avail.endTime.toLocaleString()}`
        ) || [],

       }
        return NextResponse.json(transformedTailor)
    } catch (error) {
      console.error('Server-side tailor fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch tailor details'}, { status: 500})
    }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ tailorId: string }> }
) {
  try {
    const { tailorId } = await context.params
    // parse and validate request body
    const body = await request.json()
    const validatedData = TailorProfileSchema.parse(body)

    // update User profile
    const updatedUser = await prisma.user.update({
      where: { id: tailorId },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.phoneNumber && { phoneNumber: validatedData.phoneNumber }),
        ...(validatedData.profileImage && { image: validatedData.profileImage })
      }
    })

    // Update of Create Tailor profile
    const updatedTailor = await prisma.tailor.upsert({
      where: { userId: tailorId },
      update: {
        specialty: validatedData.speciality,
        bio: validatedData.bio,
        location: validatedData.location,
        latitude: validatedData.latitude,
        longitude: validatedData.longitude
      },
      create: {
        userId: tailorId,
        specialty: validatedData.speciality,
        bio: validatedData.bio,
        location: validatedData.location,
        latitude: validatedData.latitude,
        longitude: validatedData.longitude
      }
    })

    return NextResponse.json({
      user: updatedUser,
      tailor: updatedTailor
    }, { status: 200 })
  } catch (error) {
    console.error('Profile update error:', error)

    // ZOd validationerror handling
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid input',
        details: error.errors
      }, { status: 400})
    }

    return NextResponse.json({
      error: 'Failed to update profile'
    }, {status: 500})
  }
}
