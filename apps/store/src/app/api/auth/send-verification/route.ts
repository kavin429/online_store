import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomInt } from "crypto";
import { sendMail } from "@/lib/email";
import { sendSms, normalizePhone } from "@/lib/sms";
import { validatePhoneForCountry } from "@/lib/geo";
import { emailSchema, normalizeEmail } from "@/lib/validators/auth";
import { otpEmailTemplate } from "@/lib/email-templates";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, email, phone, phoneCode, country } = body;

    if (type === "email") {
      const normalizedEmail = normalizeEmail(String(email ?? ""));
      const validEmail = emailSchema.safeParse(normalizedEmail);

      if (!validEmail.success) {
        return NextResponse.json(
          { error: validEmail.error.issues[0]?.message ?? "Enter a valid email" },
          { status: 400 }
        );
      }

      // Check if user already exists (case-insensitive)
      const existingUser = await prisma.user.findFirst({
        where: { email: normalizedEmail },
        select: { id: true },
      });
      if (existingUser) {
        return NextResponse.json(
          { error: "This email is already registered. Please log in instead." },
          { status: 409 }
        );
      }

      const code = randomInt(100000, 999999).toString();
      const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await prisma.verificationToken.deleteMany({
        where: { identifier: `email:${normalizedEmail}` },
      });

      await prisma.verificationToken.create({
        data: {
          identifier: `email:${normalizedEmail}`,
          token: code,
          expires,
        },
      });

      const { subject, text, html } = otpEmailTemplate({
        code,
        expiresInMinutes: 10,
      });

      const sent = await sendMail({
        to: normalizedEmail,
        subject,
        text,
        html,
      });

      console.log(`[send-verification] email to=${normalizedEmail} sent=${sent}`);

      if (!sent) {
        return NextResponse.json(
          { error: "Failed to send verification email. Please try again." },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Verification code sent to email",
      });
    }

    if (type === "phone" || type === "sms") {
      if (!phone) {
        return NextResponse.json({ error: "Phone is required" }, { status: 400 });
      }

      // Validate against the selected country when the client sent one.
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

      const code = randomInt(100000, 999999).toString();
      const expires = new Date(Date.now() + 10 * 60 * 1000);

      await prisma.verificationToken.deleteMany({
        where: { identifier: `phone:${normalized}` },
      });

      await prisma.verificationToken.create({
        data: {
          identifier: `phone:${normalized}`,
          token: code,
          expires,
        },
      });

      const sent = await sendSms({
        to: normalized,
        body: `Your GrowMore verification code is ${code}. It expires in 10 minutes.`,
      });

      if (!sent) {
        return NextResponse.json(
          {
            error:
              "Failed to send SMS. Please try again or use email verification.",
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Verification code sent to phone",
      });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
