import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

import { isAdmin } from "@/lib/auth";
// PATCH - update name/hexCode/unit/status/sortOrder (partial update)
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const id = Number(params.id);

  const data: Record<string, unknown> = {};

  if (body.name !== undefined) data.name = body.name;
  if (body.hexCode !== undefined) data.hexCode = body.hexCode;
  if (body.unit !== undefined) data.unit = body.unit;
  if (body.status !== undefined) data.status = body.status;
  if (body.sortOrder !== undefined) data.sortOrder = body.sortOrder;

  try {
    const value = await prisma.variantValue.update({
      where: { id },
      data,
    });
    return NextResponse.json(value);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

// DELETE - remove a variant value
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = Number(params.id);

  try {
    await prisma.variantValue.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}