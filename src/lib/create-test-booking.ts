const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function createTestBooking() {
    try {
        // Find a tailor
        const tailor = await prisma.user.findFirst({
            where: {
                role: 'TAILOR',
                email: 'valinearose@gmail.com'
            },
            include: { tailorProfile: true}
        })

        // Find a customer
        const customer = await prisma.user.findFirst({
            where: {role: 'CUSTOMER'}
        })

        if (!tailor || !customer) {
            console.error('Could not find tailor or customer')
            console.log('Tailor:', tailor)
            console.log('Customer:', customer)
            return
        }

        // Ensure tailor has a profile
        let tailorProfile = tailor.tailorProfile
        if (!tailorProfile) {
            console.error('Tailor profile not found')
            return
        }

        // Create a booking
        const booking = await prisma.booking.create({
            data: {
                userId: customer.id,
                tailorId: tailorProfile.id,
                date: new Date(),
                status: 'PENDING'
            }, 
            include: {
                user: true,
                tailor: true
            }
        })

        console.log('Test booking created:', JSON.stringify(booking, null, 2))
    } catch (error) {
        console.error('Error in createTestBooking:', error)
    } finally {
        await prisma.$disconnect()
    }
}

// Run the function
createTestBooking()