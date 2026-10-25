import type { NextAuthOptions } from "next-auth";
import type { Adapter } from "next-auth/adapters";
import type { Provider } from "next-auth/providers/index";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@online-store/db";
import { ROLES, type Role } from "./types";

export interface AuthOptionsInput {
  /** Roles that are allowed to sign in on this app. */
  roles: Role[];
  /** Path of the sign-in page for this app. */
  signInPage: string;
  /** Enable the Google OAuth provider (store only). */
  google?: boolean;
  /** Use the Prisma adapter. Required for OAuth account linking. */
  usePrismaAdapter?: boolean;
  /** Session lifetime in seconds. Defaults to 24h. */
  maxAge?: number;
}

const VENDOR_AUTO_ACTIVATE_HOURS = 24;

async function verifyPassword(plain: string, hash: string | null) {
  if (!hash) return false;
  return bcrypt.compare(plain, hash);
}

type AuthorizeResult = {
  id: string;
  name?: string | null;
  email?: string | null;
  role: Role;
};

/**
 * Resolves a sign-in attempt against the identity tables that belong to the
 * roles this app allows. Order matters: CUSTOMER -> VENDOR -> ADMIN.
 */
async function authorize(
  identifier: string,
  password: string,
  roles: Role[]
): Promise<AuthorizeResult | null> {
  if (roles.includes(ROLES.CUSTOMER)) {
    const user = await prisma.user.findFirst({
      where: { OR: [{ email: identifier }, { phone: identifier }] },
    });

    if (user && (await verifyPassword(password, user.password))) {
      if (user.status === "BLOCKED") return null;
      return {
        id: String(user.id),
        name: user.name,
        email: user.email,
        role: ROLES.CUSTOMER,
      };
    }
  }

  if (roles.includes(ROLES.VENDOR)) {
    const vendor = await prisma.vendor.findFirst({
      where: { OR: [{ email: identifier }, { name: identifier }] },
    });

    if (vendor && (await verifyPassword(password, vendor.password))) {
      if (vendor.status === "BLOCKED" || vendor.status === "CANCELLED") {
        return null;
      }

      if (vendor.status === "PENDING") {
        const hoursElapsed =
          (Date.now() - new Date(vendor.createdAt).getTime()) / (1000 * 60 * 60);

        if (hoursElapsed < VENDOR_AUTO_ACTIVATE_HOURS) return null;

        await prisma.vendor.update({
          where: { id: vendor.id },
          data: { status: "ACTIVE" },
        });
      }

      return {
        id: String(vendor.id),
        name: vendor.name,
        email: vendor.email,
        role: ROLES.VENDOR,
      };
    }
  }

  if (roles.includes(ROLES.ADMIN)) {
    const admin = await prisma.admin.findUnique({
      where: { email: identifier },
    });

    if (admin && (await verifyPassword(password, admin.password))) {
      return {
        id: String(admin.id),
        name: admin.name,
        email: admin.email,
        role: ROLES.ADMIN,
      };
    }

    // Bootstrap fallback: the env-configured administrator account.
    const envUser = process.env.NEXT_PUBLIC_ADMIN_USERNAME;
    const envPass = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

    if (
      envUser &&
      envPass &&
      identifier.toLowerCase() === envUser.toLowerCase() &&
      password === envPass
    ) {
      return {
        id: "0",
        name: "Admin",
        email: envUser,
        role: ROLES.ADMIN,
      };
    }
  }

  return null;
}

/**
 * Builds the NextAuth configuration for one app. Every app uses the same
 * secret, so a session issued anywhere is verifiable everywhere - the
 * per-app middleware is what enforces the role boundary.
 */
export function buildAuthOptions(input: AuthOptionsInput): NextAuthOptions {
  const providers: Provider[] = [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        name: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const identifier =
          credentials?.email?.trim() || credentials?.name?.trim() || "";
        const password = credentials?.password || "";

        if (!identifier || !password) return null;

        return authorize(identifier, password, input.roles);
      },
    }),
  ];

  if (input.google) {
    providers.push(
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID ?? "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      })
    );
  }

  return {
    adapter: input.usePrismaAdapter
      ? (PrismaAdapter(prisma) as unknown as Adapter)
      : undefined,

    session: {
      strategy: "jwt",
      maxAge: input.maxAge ?? 60 * 60 * 24,
    },

    pages: {
      signIn: input.signInPage,
      error: input.signInPage,
    },

    providers,

    callbacks: {
      async jwt({ token, user }) {
        if (user) {
          token.id = user.id;
          token.role = user.role ?? ROLES.CUSTOMER;
        }
        return token;
      },
      async session({ session, token }) {
        if (session.user) {
          session.user.id = (token.id as string) ?? "";
          session.user.role = token.role ?? ROLES.CUSTOMER;
        }
        return session;
      },
    },

    secret: process.env.NEXTAUTH_SECRET,
  };
}

/** The store app: customers (and Google sign-in). */
export const storeAuthOptions: NextAuthOptions = buildAuthOptions({
  roles: [ROLES.CUSTOMER],
  signInPage: "/login",
  google: true,
  usePrismaAdapter: true,
});

/** The vendor app: vendors only. */
export const vendorAuthOptions: NextAuthOptions = buildAuthOptions({
  roles: [ROLES.VENDOR],
  signInPage: "/login",
});

/** The admin app: admins only. */
export const adminAuthOptions: NextAuthOptions = buildAuthOptions({
  roles: [ROLES.ADMIN],
  signInPage: "/login",
});
