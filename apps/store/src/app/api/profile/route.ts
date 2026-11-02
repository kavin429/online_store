import { NextRequest, NextResponse } from "next/server";
import { ROLES, requireRoleApi, sessionUserId } from "@online-store/auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await requireRoleApi(authOptions, ROLES.CUSTOMER);
    const userId = sessionUserId(session);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        phoneCode: true,
        dateOfBirth: true,
        offersEmail: true,
        offersSms: true,
        createdAt: true,
      },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("[profile] GET failed", error);
    return NextResponse.json({ error: "Could not load your profile." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireRoleApi(authOptions, ROLES.CUSTOMER);
    const userId = sessionUserId(session);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

    const name = String(body.name ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const phoneCode = String(body.phoneCode ?? "").trim();
    const offersEmail = Boolean(body.offersEmail);
    const offersSms = Boolean(body.offersSms);

    if (!name) {
      return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
    }
    if (!/^\d{6,12}$/.test(phone)) {
      return NextResponse.json(
        { error: "Enter a valid phone number (digits only)." },
        { status: 400 }
      );
    }
    if (phoneCode && !/^\+\d{1,4}$/.test(phoneCode)) {
      return NextResponse.json({ error: "Invalid dialling code." }, { status: 400 });
    }

    let dateOfBirth: Date | null = null;
    if (body.dateOfBirth) {
      dateOfBirth = new Date(String(body.dateOfBirth));
      if (Number.isNaN(dateOfBirth.getTime())) {
        return NextResponse.json({ error: "Invalid date of birth." }, { status: 400 });
      }
    }

    const nameTaken = await prisma.user.findFirst({
      where: { name, NOT: { id: userId } },
      select: { id: true },
    });
    if (nameTaken) {
      return NextResponse.json(
        { error: "That name is already in use. Please choose another." },
        { status: 409 }
      );
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        phone,
        phoneCode: phoneCode || null,
        dateOfBirth,
        offersEmail,
        offersSms,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        phoneCode: true,
        dateOfBirth: true,
        offersEmail: true,
        offersSms: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("[profile] PATCH failed", error);
    return NextResponse.json({ error: "Could not save your profile." }, { status: 500 });
  }
}
