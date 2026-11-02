import { randomInt } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { ROLES, requireRoleApi, sessionUserId } from "@online-store/auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/email";

export const dynamic = "force-dynamic";

const OTP_TTL_MS = 10 * 60 * 1000;
const OPEN_ORDER_STATUSES = ["PENDING", "CONFIRMED", "SHIPPED"] as const;

function identifierFor(userId: number) {
  return `delete-account:${userId}`;
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireRoleApi(authOptions, ROLES.CUSTOMER);
    const userId = sessionUserId(session);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await req.json().catch(() => ({}))) as {
      action?: unknown;
      code?: unknown;
    };
    const action = String(body.action ?? "");

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });
    if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });

    if (action === "send") {
      if (!user.email) {
        return NextResponse.json(
          { error: "Add an email address to your profile before deleting your account." },
          { status: 400 }
        );
      }

      const code = String(randomInt(100000, 1000000));
      const hashed = await bcrypt.hash(code, 10);
      const identifier = identifierFor(userId);

      await prisma.verificationToken.deleteMany({ where: { identifier } });
      await prisma.verificationToken.create({
        data: {
          identifier,
          token: hashed,
          expires: new Date(Date.now() + OTP_TTL_MS),
        },
      });

      const delivered = await sendMail({
        to: user.email,
        subject: "Confirm deletion of your Online Store account",
        text: [
          `Hi ${user.name?.trim() || "there"},`,
          "",
          "We received a request to permanently delete your Online Store account.",
          `Your confirmation code is: ${code}`,
          "",
          "This code expires in 10 minutes. If you did not request this, ignore this email.",
        ].join("\n"),
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.6;color:#27272a">
            <h2 style="color:#b91c1c">Delete your account?</h2>
            <p>Hi ${user.name?.trim() || "there"},</p>
            <p>We received a request to permanently delete your Online Store account.</p>
            <p style="font-size:26px;font-weight:bold;letter-spacing:6px">${code}</p>
            <p>This code expires in 10 minutes. If you did not request this, ignore this email.</p>
          </div>
        `,
      });

      if (!delivered && process.env.NODE_ENV === "production") {
        return NextResponse.json(
          { error: "We could not send the confirmation email. Please try again later." },
          { status: 503 }
        );
      }

      return NextResponse.json({
        ok: true,
        delivered,
        // Local development fallback so account deletion is testable without SMTP.
        devCode: delivered ? undefined : code,
      });
    }

    if (action === "verify") {
      const code = String(body.code ?? "").trim();
      if (!/^\d{6}$/.test(code)) {
        return NextResponse.json(
          { error: "Enter the 6-digit code from your email." },
          { status: 400 }
        );
      }

      const identifier = identifierFor(userId);
      const record = await prisma.verificationToken.findFirst({
        where: { identifier },
        orderBy: { expires: "desc" },
      });

      if (!record || record.expires < new Date()) {
        return NextResponse.json(
          { error: "That code has expired. Please request a new one." },
          { status: 400 }
        );
      }

      const valid = await bcrypt.compare(code, record.token);
      if (!valid) {
        return NextResponse.json({ error: "Incorrect code. Please try again." }, { status: 400 });
      }

      const openOrders = await prisma.order.count({
        where: { userId, status: { in: [...OPEN_ORDER_STATUSES] } },
      });
      if (openOrders > 0) {
        return NextResponse.json(
          {
            error:
              "You still have open orders. Please wait for them to be delivered or cancel them first.",
          },
          { status: 400 }
        );
      }

      const orders = await prisma.order.findMany({
        where: { userId },
        select: { id: true },
      });
      const orderIds = orders.map((order) => order.id);

      await prisma.$transaction(async (tx) => {
        if (orderIds.length > 0) {
          await tx.payoutItem.deleteMany({ where: { orderId: { in: orderIds } } });
          await tx.promoUsage.deleteMany({
            where: { OR: [{ userId }, { orderId: { in: orderIds } }] },
          });
          await tx.order.deleteMany({ where: { userId } });
        }

        await tx.review.deleteMany({ where: { userId } });
        await tx.verificationToken.deleteMany({ where: { identifier } });
        await tx.user.delete({ where: { id: userId } });
      });

      if (user.email) {
        await sendMail({
          to: user.email,
          subject: "Your Online Store account has been deleted",
          text: "Your Online Store account and its data have been permanently deleted.",
        });
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("[profile/delete] failed", error);
    return NextResponse.json(
      { error: "Could not complete account deletion." },
      { status: 500 }
    );
  }
}
