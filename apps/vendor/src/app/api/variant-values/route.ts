import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET - list all variant values (optionally filtered by variantTypeId)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const variantTypeId = searchParams.get("variantTypeId");

  const values = await prisma.variantValue.findMany({
    where: variantTypeId ? { variantTypeId: Number(variantTypeId) } : undefined,
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json(values);
}

// POST - create a new variant value
export async function POST(req: Request) {
  const body = await req.json();

  if (!body.name || !body.variantTypeId) {
    return NextResponse.json(
      { error: "name and variantTypeId are required" },
      { status: 400 }
    );
  }

  const value = await prisma.variantValue.create({
    data: {
      name: body.name,
      hexCode: body.hexCode ?? null,
      unit: body.unit ?? null,
      variantTypeId: Number(body.variantTypeId),
      sortOrder: body.sortOrder ?? 0,
      status: body.status ?? "active",
    },
  });

  return NextResponse.json(value);
}