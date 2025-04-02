import { NextResponse } from 'next/server'
import { prisma } from "/Users/jeremicarose/Documents/tailor-me/src/lib/prisma"
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const { name, email, password, role } = await request.json()

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' }, 
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role
      }
    })

    return NextResponse.json({ user: newUser }, { status: 201 })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'An error occurred during signup' }, 
      { status: 500 }
    )
  }
}