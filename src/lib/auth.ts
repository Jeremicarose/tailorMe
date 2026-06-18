import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import type { User } from "@/types/user";

function normalizeUnavailableDates(value: unknown): string[] | null {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      return Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === "string")
        : null;
    } catch {
      return null;
    }
  }

  return null;
}

// Authentication utility functions
export const authUtils = {
  // Hash password securely
  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  },

  // Compare plain text password with hashed password
  async comparePassword(
    plainPassword: string, 
    hashedPassword: string
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  },

  // Validate email format
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Validate password strength
  isStrongPassword(password: string): boolean {
    // At least 8 characters, one uppercase, one lowercase, one number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    return passwordRegex.test(password);
  }
};

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "Email" },
        password: { label: "Password", type: "password", placeholder: "Password" }
      },
      async authorize(credentials) {
        // Validate input credentials
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }
      
        // Validate email format
        if (!authUtils.isValidEmail(credentials.email)) {
          throw new Error("Invalid email format");
        }
      
        try {
          // Find user by email with tailor profile
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: {
              // Use the correct relation name from your Prisma schema
              // This might be 'tailorProfile' or 'Tailor' depending on your schema
              tailorProfile: {
                include: {
                  services: true
                }
              }
            }
          });
      
          // Check user existence and password
          if (!user || !user.password) {
            throw new Error("Invalid credentials");
          }
      
          // Verify password
          const isPasswordValid = await authUtils.comparePassword(
            credentials.password, 
            user.password
          );
      
          if (!isPasswordValid) {
            throw new Error("Invalid credentials");
          }
      
          // Prepare user object for session
          return {
            id: user.id,
            email: user.email,
            role: user.role || UserRole.CUSTOMER,
            phoneNumber: user.phoneNumber,
            // Use the correct property name from your Prisma schema
            tailorProfile: user.tailorProfile ? {
              id: user.tailorProfile.id,
              specialty: user.tailorProfile.specialty,
              bio: user.tailorProfile.bio,
              location: user.tailorProfile.location,
              services: user.tailorProfile.services.map(service => ({
                id: service.id,
                name: service.name,
                description: service.description,
                price: service.price
              })),
              availabilityStatus: user.tailorProfile.availability ?? undefined,
              maxDailyBookings: user.tailorProfile.maxDailyBookings,
              bookingNoticePeriod: user.tailorProfile.bookingNoticePeriod,
              unavailableDates: normalizeUnavailableDates(user.tailorProfile.unavailableDates)
            } : undefined
          } as User;
        } catch {
          return null;
        }
      }
    })
  ],
  
  callbacks: {
    // Extend session with additional user information
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as UserRole;
      session.user.phoneNumber = token.phoneNumber as string | null;
      session.user.tailorProfile = token.tailorProfile;

      return session;
    },

    // Extend token with additional user information
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.phoneNumber = user.phoneNumber;
        token.tailorProfile = user.tailorProfile;
      }

      // Handle manual session update (e.g., profile updates)
      if (trigger === 'update' && session) {
        // Merge the updated session data with existing token
        token = { ...token, ...session.user };
      }

      return token;
    }
  },

  // Configure session management
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // Custom pages
  pages: {
    signIn: "/login",
    signOut: "/login",
    error: "/login", // Error code passed in query string as ?error=
  },
  // JWT encryption settings
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // Debug options (remove in production)
  debug: process.env.NODE_ENV === 'development'
};

// Utility function to register a new user
export async function registerUser(userData: {
  email: string;
  password: string;
  role?: UserRole;
  phoneNumber?: string;
}) {
  // Validate input
  if (!authUtils.isValidEmail(userData.email)) {
    throw new Error("Invalid email format");
  }

  if (!authUtils.isStrongPassword(userData.password)) {
    throw new Error("Password does not meet strength requirements");
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: userData.email }
  });

  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  // Hash password
  const hashedPassword = await authUtils.hashPassword(userData.password);

  // Create user
  return prisma.user.create({
    data: {
      email: userData.email,
      password: hashedPassword,
      role: userData.role || UserRole.CUSTOMER,
      phoneNumber: userData.phoneNumber
    }
  });
}
