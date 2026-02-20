import NextAuth, { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

// Define the credentials schema
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

/**
 * NextAuth.js v5 Configuration
 *
 * IMPORTANT: In production, replace this with a proper database-backed authentication
 * This is a simple credentials provider for development/demo purposes
 *
 * For production, consider:
 * - Database adapter (Prisma adapter with User/Account/Session models)
 * - OAuth providers (Google, GitHub, etc.)
 * - Magic link authentication
 * - Two-factor authentication
 */
export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          // Validate credentials
          const parsed = loginSchema.safeParse(credentials);
          if (!parsed.success) {
            return null;
          }

          const { username, password } = parsed.data;

          // SECURITY: All passwords MUST be set via environment variables
          // No default passwords allowed in production

          // Admin user access
          if (username === "admin") {
            if (!env.ADMIN_PASSWORD) {
              logger.error("ADMIN_PASSWORD environment variable not set");
              return null;
            }
            if (password === env.ADMIN_PASSWORD) {
              return {
                id: "admin-1",
                name: "TrueFans Admin",
                email: "admin@truefansradio.com",
                role: "admin",
              };
            }
          }

          // Riley team access
          if (username === "riley") {
            if (!env.RILEY_PASSWORD) {
              logger.error("RILEY_PASSWORD environment variable not set");
              return null;
            }
            if (password === env.RILEY_PASSWORD) {
              return {
                id: "riley-1",
                name: "Riley (Artist Team)",
                email: "riley@truefansradio.com",
                role: "riley",
              };
            }
          }

          // Harper team access
          if (username === "harper") {
            if (!env.HARPER_PASSWORD) {
              logger.error("HARPER_PASSWORD environment variable not set");
              return null;
            }
            if (password === env.HARPER_PASSWORD) {
              return {
                id: "harper-1",
                name: "Harper (Sponsor Team)",
                email: "harper@truefansradio.com",
                role: "harper",
              };
            }
          }

          // Elliot team access
          if (username === "elliot") {
            if (!env.ELLIOT_PASSWORD) {
              logger.error("ELLIOT_PASSWORD environment variable not set");
              return null;
            }
            if (password === env.ELLIOT_PASSWORD) {
              return {
                id: "elliot-1",
                name: "Elliot (Listener Team)",
                email: "elliot@truefansradio.com",
                role: "elliot",
              };
            }
          }

          // Cassidy team access
          if (username === "cassidy") {
            if (!env.CASSIDY_PASSWORD) {
              logger.error("CASSIDY_PASSWORD environment variable not set");
              return null;
            }
            if (password === env.CASSIDY_PASSWORD) {
              return {
                id: "cassidy-1",
                name: "Cassidy (Review Panel)",
                email: "cassidy@truefansradio.com",
                role: "cassidy",
              };
            }
          }

          // Invalid credentials
          return null;
        } catch (error) {
          logger.error("Auth error", { error });
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login", // Redirect errors to login page instead of using default error page
  },
  callbacks: {
    async jwt({ token, user }) {
      // Add user role to JWT token
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // Add user role to session
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
      }
      return session;
    },
    async authorized() {
      // All pages are public — auth is optional for role-based UI
      return true;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 14 * 24 * 60 * 60, // 14 days
  },
  secret: env.NEXTAUTH_SECRET,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

// Extend NextAuth types
declare module "next-auth" {
  interface User {
    role?: string;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role?: string;
  }
}
