import NextAuth, { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Team user lookup table — avoids repetitive if/else chains
const TEAM_USERS: Record<string, { envKey: keyof typeof env; id: string; name: string; email: string; role: string }> = {
  admin:   { envKey: "ADMIN_PASSWORD",   id: "admin-1",   name: "TrueFans Admin",         email: "admin@truefansradio.com",   role: "admin"   },
  riley:   { envKey: "RILEY_PASSWORD",   id: "riley-1",   name: "Riley (Artist Team)",     email: "riley@truefansradio.com",   role: "riley"   },
  harper:  { envKey: "HARPER_PASSWORD",  id: "harper-1",  name: "Harper (Sponsor Team)",   email: "harper@truefansradio.com",  role: "harper"  },
  elliot:  { envKey: "ELLIOT_PASSWORD",  id: "elliot-1",  name: "Elliot (Listener Team)",  email: "elliot@truefansradio.com",  role: "elliot"  },
  cassidy: { envKey: "CASSIDY_PASSWORD", id: "cassidy-1", name: "Cassidy (Review Panel)",  email: "cassidy@truefansradio.com", role: "cassidy" },
};

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
          const parsed = loginSchema.safeParse(credentials);
          if (!parsed.success) return null;

          const { username, password } = parsed.data;

          // Team user authentication
          const teamUser = TEAM_USERS[username.toLowerCase()];
          if (teamUser) {
            const expected = env[teamUser.envKey];
            if (!expected) {
              logger.error(`${teamUser.envKey} environment variable not set`);
              return null;
            }
            if (password === expected) {
              return { id: teamUser.id, name: teamUser.name, email: teamUser.email, role: teamUser.role };
            }
            return null;
          }

          // Operator login: check OrganizationUser table using shared prisma instance
          try {
            const { prisma } = await import("@/lib/db");
            const bcrypt = await import("bcryptjs");

            const orgUser = await prisma.organizationUser.findFirst({
              where: { email: username, isActive: true },
              include: { organization: { select: { id: true, name: true } } },
            });

            if (orgUser?.passwordHash) {
              const isValid = await bcrypt.compare(password, orgUser.passwordHash);
              if (isValid) {
                return {
                  id: orgUser.id,
                  name: orgUser.name,
                  email: orgUser.email,
                  role: orgUser.role === "owner" ? "admin" : orgUser.role,
                  organizationId: orgUser.organizationId,
                };
              }
            }
          } catch (dbError) {
            logger.error("Operator auth DB error", { error: dbError });
          }

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
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.organizationId = user.organizationId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
        session.user.organizationId = token.organizationId as string | undefined;
      }
      return session;
    },
    async authorized() {
      return true;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 14 * 24 * 60 * 60, // 14 days
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production"
        ? "__Secure-authjs.session-token"
        : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  trustHost: true,
  secret: env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

// Extend NextAuth types
declare module "next-auth" {
  interface User {
    role?: string;
    organizationId?: string;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      organizationId?: string;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role?: string;
    organizationId?: string;
  }
}
