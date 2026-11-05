import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { COUNTRY_DIAL, validatePhoneForCountry } from "@/lib/geo";
import { normalizeEmail, signupSchema } from "@/lib/validators/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        {
          error: firstIssue?.message ?? "Please check your details.",
          fields: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const {
      name,
      email,
      phone,
      phoneCode,
      country,
      province,
      district,
      city,
      address,
      password,
      verificationMethod,
    } = parsed.data;

    const normalizedEmail = normalizeEmail(email);
    const trimmedName = name.trim();

    // Email is the account identity: block duplicates case-insensitively.
    const existingEmail = await prisma.user.findFirst({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existingEmail) {
      return NextResponse.json(
        {
          error: "This email is already registered. Please log in instead.",
          code: "EMAIL_EXISTS",
        },
        { status: 409 }
      );
    }

    // `User.name` is unique and is used as the username.
    const existingName = await prisma.user.findFirst({
      where: { name: trimmedName },
      select: { id: true },
    });

    if (existingName) {
      return NextResponse.json(
        {
          error: "This username is already taken. Please choose another one.",
          code: "USERNAME_EXISTS",
        },
        { status: 409 }
      );
    }

    // Re-check the phone on the server — never trust the browser alone.
    const checkedPhone = validatePhoneForCountry(phone, country);
    if (!checkedPhone.ok) {
      return NextResponse.json(
        { error: checkedPhone.error, code: "INVALID_PHONE" },
        { status: 400 }
      );
    }

    // The client cannot simply claim it verified: require the proof token that
    // /api/auth/verify wrote after a successful OTP check.
    const proofIdentifier =
      verificationMethod === "email"
        ? `verified:email:${normalizedEmail}`
        : `verified:phone:${checkedPhone.e164}`;

    const proof = await prisma.verificationToken.findFirst({
      where: {
        identifier: proofIdentifier,
        expires: { gt: new Date() },
      },
      select: { identifier: true },
    });

    if (!proof) {
      return NextResponse.json(
        {
          error:
            verificationMethod === "email"
              ? "Please verify your email before creating your account."
              : "Please verify your mobile number before creating your account.",
          code: "NOT_VERIFIED",
        },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: trimmedName,
        email: normalizedEmail,
        phone: checkedPhone.national,
        // Derive the prefix from the selected country so a tampered client
        // cannot store a mismatched dial code.
        phoneCode: COUNTRY_DIAL[country] ?? phoneCode ?? null,
        country,
        province,
        district,
        city,
        address: address.trim(),
        password: hashedPassword,
        // Only mark the channel verified once the proof above is confirmed.
        emailVerified: verificationMethod === "email" ? new Date() : null,
        phoneVerified: verificationMethod === "phone",
      },
    });

    // Proofs are single-use.
    await prisma.verificationToken.deleteMany({
      where: { identifier: proofIdentifier },
    });

    const { password: _pw, ...safeUser } = user;

    return NextResponse.json(
      {
        success: true,
        user: safeUser,
        message: "Account created successfully.",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.log("SIGNUP ERROR:", error);

    if (error?.code === "P2002") {
      const target = Array.isArray(error.meta?.target)
        ? error.meta.target.join(", ")
        : String(error.meta?.target ?? "");

      if (target.includes("email")) {
        return NextResponse.json(
          {
            error: "This email is already registered. Please log in instead.",
            code: "EMAIL_EXISTS",
          },
          { status: 409 }
        );
      }

      if (target.includes("name")) {
        return NextResponse.json(
          {
            error: "This username is already taken. Please choose another one.",
            code: "USERNAME_EXISTS",
          },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
