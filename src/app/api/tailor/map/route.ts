import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        console.log('API: Starting tailor fetch...');
        
        // Log the query we're about to make
        console.log('API: Querying tailors with coordinates...');
        
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

        console.log('API: Raw tailors from database:', JSON.stringify(tailors, null, 2));
        console.log('API: Number of tailors found:', tailors.length);

        if (tailors.length === 0) {
            console.log('API: No tailors found with coordinates');
            return NextResponse.json([]);
        }

        // Transform the data to match our interface
        const mappedTailors = tailors.map(tailor => {
            const mappedTailor = {
                id: tailor.id,
                name: tailor.user?.name || 'Unnamed Tailor',
                profileImage: tailor.user?.image,
                latitude: tailor.latitude!,
                longitude: tailor.longitude!,
                specialty: tailor.specialty,
                address: tailor.address, 
                averageRating: tailor.reviews.length > 0 
                    ? tailor.reviews.reduce((sum, review) => sum + review.rating, 0) / tailor.reviews.length 
                    : 0,
                services: tailor.services.map(service => service.name), 
                totalReviews: tailor.reviews.length,
                completionRate: tailor.completionRate || 0
            };
            console.log('API: Mapped tailor:', mappedTailor);
            return mappedTailor;
        });

        return NextResponse.json(mappedTailors);
    } catch (error) {
        console.error('API Error fetching tailors:', error);
        if (error instanceof Error) {
            console.error('API Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
        }
        return NextResponse.json({
            error: 'Failed to fetch tailors',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
