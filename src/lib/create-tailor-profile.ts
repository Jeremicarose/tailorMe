import { PrismaClient, Prisma } from '@prisma/client'
import axios from 'axios'

const prisma = new PrismaClient()

// Interface for Tailor Profile Data
interface TailorProfileData {
  userId: string
  specialty?:string
  bio?: string
  location?: string
  latitude?: number
  longitude?: number
  profileImage?: string
  phoneNumber?: string
}

// Geocoding function to convert address to coordinates
async function geocodeAddress(address: string): Promise<{latitude: number, longitude: number} | null> {
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: address,
        format: 'json',
        limit: 1
      }
    })

    if (response.data && response.data.length > 0) {
      return {
        latitude: parseFloat(response.data[0].lat),
        longitude: parseFloat(response.data[0].lon)
      }
    }
    return null
  } catch (error) {
    console.error('Geocoding error:', error)
    return null
  }
}

// Create or Update Tailor Profile
export async function createOrUpdateTailorProfile(data: TailorProfileData) {
  try {
    // Validate required fields
    if (!data.userId) {
      throw new Error('User ID is required')
    }

    // If address is provided but no coordinates, attempt to geocode
    if(data.location && (!data.latitude || !data.longitude)) {
      const coordinates = await geocodeAddress(data.location)
      if (coordinates) {
        data.latitude = coordinates.latitude
        data.longitude = coordinates.longitude
      }
    }

    // Upsert Tailor Profile
    const tailorProfile = await prisma.tailor.upsert({
      where: { userId: data.userId },
      update: {
        specialty: data.specialty,
        bio: data.bio,
        location: data.location,
        latitude: data.latitude,
        longitude: data.longitude
      },
      create: {
        userId: data.userId,
        specialty: data.specialty || 'General Tailoring',
        bio: data.bio || 'Professional Tailor',
        location: data.location || 'Not Specified',
        latitude: data.latitude,
        longitude: data.longitude
      }
    })

    // Update User Profile if phone number is provided
    if (data.phoneNumber) {
      await prisma.user.update({
        where: { id: data.userId },
        data: {
          phoneNumber: data.phoneNumber,
          ...(data.profileImage && { image: data.profileImage })
        } as Prisma.UserUpdateInput
      })
    }

    return tailorProfile
  } catch (error) {
    console.error('Error creating/updating tailor profile:', error)
    throw error
  }
}

// Get Tailor Profile
export async function getTailorProfile(userId: string) {
  try {
    return await prisma.tailor.findUnique({
      where: { userId: userId},
      include: {
        user: true,
        services: true
      }
    })
  } catch (error) {
    console.error('Error fetchning tailor profile', error)
    throw error
  }
}

// Ensure all Tailor users have a profile
export async function ensureTailorProfiles() {
  try{
    const tailorsWithoutProfile = await prisma.user.findMany({
      where: {
        role: 'TAILOR',
        tailorProfile: null
      }
    })

    console.log(`Found ${tailorsWithoutProfile.length} tailors without profile`)

    for (const user of tailorsWithoutProfile){
      try {
        await createOrUpdateTailorProfile({
          userId: user.id,
          specialty: 'General Tailoring',
          bio: 'Professional Tailor',
          location: 'Not Specified'
        })
        console.log(`Created default profile for tailor: ${user.email}`)
      } catch (error) {
        console.error(`Error creating default profile for ${user.email}`)
      }
    }
  } catch (error) {
    console.error(`Error in ensureTailorProfiles:`, error)
  }finally {
    await prisma.$disconnect()
  }
}

// Example usage
export async function updateTailorProfileExample() {
  try {
    const updatedProfile = await createOrUpdateTailorProfile({
      userId: 'user_id_here',
      specialty: 'Wedding Dresses',
      bio: 'Specializing in custom weeding attire',
      location: 'Nairobi, Kenya',
      latitude: -1.2921,
      longitude: 36.8219,
      phoneNumber: '+245712355678',
      profileImage: '/path/to/profile/image.jpg'
    })
    console.log('Profile updated:', updatedProfile)
  }catch (error) {
    console.error('Profile update failed', error)
  }
}

export default prisma