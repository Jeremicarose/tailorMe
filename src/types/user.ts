import { UserRole } from "@prisma/client";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  phoneNumber?: string | null;
  tailorProfile?: {
    id: string;
    specialty?: string | null;
    bio?: string | null;
    location?: string | null;
    services?: {
      id: string;
      name: string;
      description?: string | null;
      price: number;
    }[];
    availabilityStatus?: string;
    maxDailyBookings?: number;
    bookingNoticePeriod?: string;
    unavailableDates?: string[] | null;
  };
}

// Extend NextAuth types to include our custom User type
declare module "next-auth" {
  interface Session {
    user: User;
  }
  
  interface JWT {
    id: string;
    role: UserRole;
    phoneNumber?: string | null;
    tailorProfile?: User['tailorProfile'];
  }
}
