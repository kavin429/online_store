import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, email, phone, code } = body;

    if (!code) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    let identifier: string;
    if (type === "email") {
      if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });
      identifier = `email:${email}`;
    } else if (type === "phone" || type === "sms") {
      if (!phone) return NextResponse.json({ error: "Phone is required" }, { status: 400 });
      identifier = `phone:${phone}`;
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    const token = await prisma.verificationToken.findFirst({
      where: {
        identifier,
        token: code,
      },
    });

    if (!token) {
      return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
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
      return NextResponse.json({ error: "Verification code expired" }, { status: 400 });
    }

    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: token.identifier,
          token: token.token,
        },
      },
    });

    return NextResponse.json({ success: true, verified: true });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
