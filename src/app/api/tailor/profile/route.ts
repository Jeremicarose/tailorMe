import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { AvailabilityStatus, Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { Session } from 'next-auth'

function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string')
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown
      return Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === 'string')
        : []
    } catch {
      return []
    }
  }

  return []
}

function normalizeAvailabilityStatus(value: unknown): AvailabilityStatus | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  const normalized = value.toUpperCase()
  if (normalized === 'OPEN' || normalized === 'LIMITED' || normalized === 'CLOSED') {
    return normalized as AvailabilityStatus
  }

  return undefined
}

function normalizeVerificationStatus(value: unknown): TailorVerificationStatus | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  const normalized = value.toUpperCase()
  if (
    normalized === 'UNVERIFIED' ||
    normalized === 'PENDING' ||
    normalized === 'VERIFIED' ||
    normalized === 'REJECTED'
  ) {
    return normalized as TailorVerificationStatus
  }

  return undefined
}

type TailorVerificationStatus = 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED'

function serializeTailorProfile(
  tailorProfile: {
    id: string
    userId: string
    specialty: string | null
    bio: string | null
    location: string | null
    availability: AvailabilityStatus | null
    verificationStatus: TailorVerificationStatus
    verificationSubmittedAt: Date | null
    verificationReviewedAt: Date | null
    verificationNotes: string | null
    identityDocumentUrl: string | null
    businessName: string | null
    yearsOfExperience: number | null
    portfolioApproved: boolean
    maxDailyBookings: number
    bookingNoticePeriod: string
    unavailableDates: Prisma.JsonValue | null
    services: {
      id: string
      name: string
      description: string | null
      price: number
      tailorId: string
      createdAt: Date
      updatedAt: Date
    }[]
    user: {
      phoneNumber: string | null
      image: string | null
      name?: string | null
      email?: string | null
    }
  }
) {
  return {
    id: tailorProfile.id,
    userId: tailorProfile.userId,
    specialty: tailorProfile.specialty,
    bio: tailorProfile.bio,
    location: tailorProfile.location,
    availabilityStatus: tailorProfile.availability ?? 'OPEN',
    verificationStatus: tailorProfile.verificationStatus,
    verificationSubmittedAt: tailorProfile.verificationSubmittedAt,
    verificationReviewedAt: tailorProfile.verificationReviewedAt,
    verificationNotes: tailorProfile.verificationNotes,
    identityDocumentUrl: tailorProfile.identityDocumentUrl,
    businessName: tailorProfile.businessName,
    yearsOfExperience: tailorProfile.yearsOfExperience,
    portfolioApproved: tailorProfile.portfolioApproved,
    maxDailyBookings: tailorProfile.maxDailyBookings,
    bookingNoticePeriod: tailorProfile.bookingNoticePeriod,
    unavailableDates: parseStringArray(tailorProfile.unavailableDates),
    services: tailorProfile.services,
    phoneNumber: tailorProfile.user.phoneNumber,
    profileImage: tailorProfile.user.image,
  }
}

// GET: Retrieve tailor profile
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions) as Session | null

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user || user.role !== 'TAILOR') {
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
    return NextResponse.json(serializeTailorProfile(tailorProfile))
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
      where: { email: session.user.email }
    })

    if (!user || user.role !== 'TAILOR') {
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
    const body = await request.json()
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
      profileImage,
      businessName,
      yearsOfExperience,
      identityDocumentUrl,
      verificationStatus,
      verificationNotes
    } = body as Record<string, unknown>

    // Update user profile if phone number or profile image is provided
    if (typeof phoneNumber === 'string' || typeof profileImage === 'string') {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          ...(typeof phoneNumber === 'string' ? { phoneNumber } : {}),
          ...(typeof profileImage === 'string' ? { image: profileImage } : {})
        }
      })
    }

    // Prepare update data
    const updateData: Prisma.TailorUpdateInput = {
      ...(typeof specialty === 'string' ? { specialty: specialty.trim() || null } : {}),
      ...(typeof bio === 'string' ? { bio: bio.trim() || null } : {}),
      ...(typeof location === 'string' ? { location: location.trim() || null } : {}),
      ...(typeof maxDailyBookings === 'number' ? { maxDailyBookings } : {}),
      ...(typeof bookingNoticePeriod === 'string' ? { bookingNoticePeriod } : {}),
      ...(typeof businessName === 'string' ? { businessName: businessName.trim() || null } : {}),
      ...(typeof yearsOfExperience === 'number' ? { yearsOfExperience } : {}),
      ...(typeof identityDocumentUrl === 'string' ? { identityDocumentUrl: identityDocumentUrl.trim() || null } : {}),
      ...(typeof verificationNotes === 'string' ? { verificationNotes } : {}),
      ...(unavailableDates !== undefined ? { unavailableDates: parseStringArray(unavailableDates) } : {}),
    }

    const normalizedAvailabilityStatus = normalizeAvailabilityStatus(availabilityStatus)
    if (normalizedAvailabilityStatus) {
      updateData.availability = normalizedAvailabilityStatus
    }

    const normalizedVerificationStatus = normalizeVerificationStatus(verificationStatus)
    if (normalizedVerificationStatus) {
      updateData.verificationStatus = normalizedVerificationStatus
      if (normalizedVerificationStatus === 'PENDING') {
        updateData.verificationSubmittedAt = new Date()
      }
    }

    if (Array.isArray(services)) {
      updateData.services = {
        deleteMany: {},
        create: services.flatMap((service) => {
          if (!service || typeof service !== 'object') {
            return []
          }

          const value = service as Record<string, unknown>
          const price = Number(value.price)
          if (typeof value.name !== 'string' || !value.name.trim() || Number.isNaN(price)) {
            return []
          }

          return [{
            name: value.name.trim(),
            description: typeof value.description === 'string' ? value.description : null,
            price,
          }]
        })
      }
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

    return NextResponse.json(serializeTailorProfile(updatedProfile))
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
