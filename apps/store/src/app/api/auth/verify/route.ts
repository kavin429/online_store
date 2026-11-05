import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { normalizePhone } from "@/lib/sms";
import { validatePhoneForCountry } from "@/lib/geo";
import { normalizeEmail } from "@/lib/validators/auth";

/** How long the signup form has to finish after verifying, in milliseconds. */
const VERIFICATION_PROOF_TTL = 15 * 60 * 1000;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, email, phone, phoneCode, country, code } = body;

    if (!code) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    let identifier: string;
    let proofIdentifier: string;

    if (type === "email") {
      if (!email) {
        return NextResponse.json({ error: "Email is required" }, { status: 400 });
      }
      // Must match the identifier created by send-verification.
      const normalizedEmail = normalizeEmail(String(email));
      identifier = `email:${normalizedEmail}`;
      proofIdentifier = `verified:email:${normalizedEmail}`;
    } else if (type === "phone" || type === "sms") {
      if (!phone) {
        return NextResponse.json({ error: "Phone is required" }, { status: 400 });
      }

      // Prefer the country-aware normalisation so the identifier matches the
      // one produced by send-verification and by the signup endpoint.
      let normalized: string;
      if (country) {
        const checked = validatePhoneForCountry(String(phone), String(country));
        if (!checked.ok) {
          return NextResponse.json({ error: checked.error }, { status: 400 });
        }
        normalized = checked.e164;
      } else {
        normalized = normalizePhone(String(phone), phoneCode);
      }

      if (!normalized) {
        return NextResponse.json(
          { error: "Invalid phone number" },
          { status: 400 }
        );
      }
      identifier = `phone:${normalized}`;
      proofIdentifier = `verified:phone:${normalized}`;
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    const token = await prisma.verificationToken.findFirst({
      where: {
        identifier,
        token: String(code).trim(),
      },
    });

    if (!token) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      );
    }

    if (token.expires < new Date()) {
      await prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: token.identifier,
            token: token.token,
          },
        },
      });
      return NextResponse.json(
        { error: "Verification code expired. Please request a new one." },
        { status: 400 }
      );
    }

    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: token.identifier,
          token: token.token,
        },
      },
    });

    // Leave a short-lived proof that this address/number was verified. The
    // signup endpoint requires it before it will trust `verificationMethod`.
    await prisma.verificationToken.deleteMany({
      where: { identifier: proofIdentifier },
    });
    await prisma.verificationToken.create({
      data: {
        identifier: proofIdentifier,
        token: randomUUID(),
        expires: new Date(Date.now() + VERIFICATION_PROOF_TTL),
      },
    });

    return NextResponse.json({ success: true, verified: true });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
