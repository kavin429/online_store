import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomInt } from "crypto";
import { sendMail } from "@/lib/email";
import { sendSms, normalizePhone } from "@/lib/sms";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, email, phone } = body;

    if (type === "email") {
      if (!email) {
        return NextResponse.json({ error: "Email is required" }, { status: 400 });
      }

      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: { email },
      });
      if (existingUser) {
        return NextResponse.json({ error: "User already exists" }, { status: 400 });
      }

      const code = randomInt(100000, 999999).toString();
      const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await prisma.verificationToken.deleteMany({
        where: { identifier: `email:${email}` },
      });

      await prisma.verificationToken.create({
        data: {
          identifier: `email:${email}`,
          token: code,
          expires,
        },
      });

      const sent = await sendMail({
        to: email,
        subject: "Your verification code",
        text: `Your verification code is ${code}. It expires in 10 minutes.`,
        html: `<p>Your verification code is <strong>${code}</strong>. It expires in 10 minutes.</p>`,
      });

      if (!sent) {
        return NextResponse.json({ error: "Failed to send verification email. Please try again." }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: "Verification code sent to email" });
    } else if (type === "phone" || type === "sms") {
      if (!phone) {
        return NextResponse.json({ error: "Phone is required" }, { status: 400 });
      }

      const normalized = normalizePhone(phone);
      if (!normalized) {
        return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
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
        return NextResponse.json({ error: "Failed to send SMS. Please try again or use email verification." }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: "Verification code sent to phone" });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
