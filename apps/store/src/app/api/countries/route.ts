import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SUPPORTED_COUNTRIES } from "@/lib/geo";

export async function GET() {
  try {
    const rows = await prisma.country.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { name: true },
    });
    const supported = new Set(SUPPORTED_COUNTRIES);
    const fromDb = rows.map((row) => row.name).filter((name) => supported.has(name));
    const countries = Array.from(new Set([...fromDb, ...SUPPORTED_COUNTRIES]));

    return NextResponse.json({ countries });
  } catch (error) {
    console.error("FETCH COUNTRIES ERROR:", error);
    return NextResponse.json({ countries: SUPPORTED_COUNTRIES });
  }
}
