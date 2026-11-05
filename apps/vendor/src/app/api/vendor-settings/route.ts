import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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
    const clean = (value: unknown) =>
      typeof value === "string" ? value.trim() : "";

    const storeName = clean(body.storeName);
    const storeLogo = clean(body.storeLogo);
    const storeBanner = clean(body.storeBanner);
    const description = clean(body.description);
    const taxId = clean(body.taxId);
    const businessReg = clean(body.businessReg);
    const bankName = clean(body.bankName);
    const accountName = clean(body.accountName);
    const accountNumber = clean(body.accountNumber);
    const branch = clean(body.branch);

    if (storeName && storeName.length < 2) {
      return NextResponse.json(
        { error: "Store name must be at least 2 characters." },
        { status: 400 }
      );
    }

    if (description && description.length < 10) {
      return NextResponse.json(
        { error: "Store description must be at least 10 characters." },
        { status: 400 }
      );
    }

    const isImageUrl = (value: string) =>
      !value ||
      value.startsWith("/") ||
      value.startsWith("data:image/") ||
      /^https?:\/\//i.test(value);

    if (!isImageUrl(storeLogo) || !isImageUrl(storeBanner)) {
      return NextResponse.json(
        { error: "Store logo and banner must be valid image URLs." },
        { status: 400 }
      );
    }

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

    // Keep the flag in sync when a vendor removes required details too.
    await prisma.vendor.update({
      where: { id: vendorId },
      data: { isProfileComplete: isComplete },
    });

    return NextResponse.json({ data: settings, isProfileComplete: isComplete });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
