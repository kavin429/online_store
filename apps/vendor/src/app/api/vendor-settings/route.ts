import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    let vendorId: number | null = null;
    const vendorSession = req.cookies.get("vendor_session")?.value;
    if (vendorSession) {
      try {
        const session = JSON.parse(vendorSession);
        vendorId = session.id;
      } catch {}
    }

    if (!vendorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await prisma.vendorSettings.findUnique({ where: { vendorId } });

    return NextResponse.json({ data: settings });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    let vendorId: number | null = null;
    const vendorSession = req.cookies.get("vendor_session")?.value;
    if (vendorSession) {
      try {
        const session = JSON.parse(vendorSession);
        vendorId = session.id;
      } catch {}
    }

    if (!vendorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { storeName, storeLogo, storeBanner, description, taxId, businessReg, bankName, accountName, accountNumber, branch } = body;

    const settings = await prisma.vendorSettings.upsert({
      where: { vendorId },
      create: {
        vendorId,
        storeName,
        storeLogo,
        storeBanner,
        description,
        taxId,
        businessReg,
        bankName,
        accountName,
        accountNumber,
        branch,
      },
      update: {
        storeName,
        storeLogo,
        storeBanner,
        description,
        taxId,
        businessReg,
        bankName,
        accountName,
        accountNumber,
        branch,
      },
    });

    const isComplete = !!(
      storeName &&
      description &&
      taxId &&
      bankName &&
      accountName &&
      accountNumber
    );

    if (isComplete) {
      await prisma.vendor.update({
        where: { id: vendorId },
        data: { isProfileComplete: true },
      });
    }

    return NextResponse.json({ data: settings, isProfileComplete: isComplete });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
