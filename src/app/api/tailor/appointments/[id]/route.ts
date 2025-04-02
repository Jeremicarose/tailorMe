import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from "/Users/jeremicarose/Documents/tailor-me/src/lib/prisma"


export async function PATCH(
    request: Request, 
    { params }: { params: { id: string } }
  ) {
    try {
      const session = await getServerSession()
      
      if (!session?.user?.email) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
      }
  
      // Find the tailor by email
      const tailor = await prisma.tailor.findFirst({
        where: { 
          user: {
            email: session.user.email,
            role: 'TAILOR'
          }
        },
        select: { id: true }
      })
  
      if (!tailor) {
        return NextResponse.json({ error: 'Tailor not found' }, { status: 404 })
      }
  
      const { status } = await request.json()
  
      // Validate status
      if (!['CONFIRMED', 'CANCELLED'].includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      }
  
      // Update the booking
      const updatedBooking = await prisma.booking.update({
        where: { 
          id: params.id,
          tailorId: tailor.id
        },
        data: { status }
      })
  
      return NextResponse.json(updatedBooking)
    } catch (error) {
      console.error('Error updating booking:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }