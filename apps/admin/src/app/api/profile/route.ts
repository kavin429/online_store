import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { adminAuthOptions, ROLES } from "@online-store/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function currentAdmin() {
  const session = await getServerSession(adminAuthOptions);
  if (!session?.user || session.user.role !== ROLES.ADMIN) return null;

  return {
    session,
    id: Number(session.user.id),
    email: session.user.email ?? "",
    name: session.user.name ?? "Admin",
  };
}

export async function GET() {
  const admin = await currentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!Number.isInteger(admin.id) || admin.id <= 0) {
    return NextResponse.json({
      profile: {
        id: 0,
        name: admin.name,
        email: admin.email,
        createdAt: null,
        readOnly: true,
      },
    });
  }

  const record = await prisma.admin.findUnique({
    where: { id: admin.id },
    select: { id: true, name: true, email: true, createdAt: true },
  });

  if (!record) {
    return NextResponse.json({
      profile: {
        id: 0,
        name: admin.name,
        email: admin.email,
        createdAt: null,
        readOnly: true,
      },
    });
  }

  return NextResponse.json({ profile: { ...record, readOnly: false } });
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await currentAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!Number.isInteger(admin.id) || admin.id <= 0) {
      return NextResponse.json(
        {
          error:
            "The bootstrap administrator is configured through environment variables and cannot be edited here.",
        },
        { status: 400 }
      );
    }

    const body = (await req.json().catch(() => ({}))) as { name?: unknown };
    const name = String(body.name ?? "").trim();
    if (!name) {
      return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
    }

    const profile = await prisma.admin.update({
      where: { id: admin.id },
      data: { name },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    return NextResponse.json({ profile: { ...profile, readOnly: false } });
  } catch (error) {
    console.error("[admin/profile] PATCH failed", error);
    return NextResponse.json({ error: "Could not save your profile." }, { status: 500 });
  }
}
