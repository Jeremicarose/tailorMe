import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
    try {        
        const tailors = await prisma.tailor.findMany({
            where: {
                latitude: {not: null},
                longitude: { not: null}
            },
            include: {
                user: {
                                    /**
                 * Select specific fields from the user table.
                 * - name: The name of the tailor.
                 * - image: The profile image of the tailor.
                 */
                select: {
                    name: true, // Tailor's name
                    image: true // Tailor's profile image
                }
                },
                reviews: {
                    select: {
                        rating: true
                    }
                },
                services: {
                    select: {
                        name: true
                    }
                }
            }
        })

        if (tailors.length === 0) {
            return NextResponse.json([]);
        }

        const mappedTailors = tailors.map(tailor => ({
            id: tailor.id,
            name: tailor.user?.name || 'Unnamed Tailor',
            profileImage: tailor.user?.image,
            latitude: tailor.latitude!,
            longitude: tailor.longitude!,
            specialty: tailor.specialty,
            address: tailor.address, 
            verificationStatus: tailor.verificationStatus,
            portfolioApproved: tailor.portfolioApproved,
            averageRating: tailor.reviews.length > 0 
                ? tailor.reviews.reduce((sum, review) => sum + review.rating, 0) / tailor.reviews.length 
                : 0,
            services: tailor.services.map(service => service.name), 
            totalReviews: tailor.reviews.length,
            completionRate: tailor.completionRate || 0
        }))

        mappedTailors.sort((left, right) => {
            const leftScore = left.verificationStatus === 'VERIFIED' ? 1 : 0
            const rightScore = right.verificationStatus === 'VERIFIED' ? 1 : 0

            if (leftScore !== rightScore) {
                return rightScore - leftScore
            }

            return right.averageRating - left.averageRating
        })

        return NextResponse.json(mappedTailors);
    } catch (error) {
        return NextResponse.json({
            error: 'Failed to fetch tailors',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
