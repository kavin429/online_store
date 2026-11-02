import { NextRequest, NextResponse } from "next/server";
import { ROLES, requireRoleApi, sessionUserId } from "@online-store/auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/email";
import { normalizePromoCode } from "@/lib/promo";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await requireRoleApi(authOptions, ROLES.CUSTOMER);
    const userId = sessionUserId(session);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await req.json().catch(() => ({}))) as { code?: unknown };
    const code = normalizePromoCode(body.code);
    if (!code) {
      return NextResponse.json({ error: "Enter a promo code." }, { status: 400 });
    }

    const [user, promo] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, offersEmail: true },
      }),
      prisma.promo.findUnique({ where: { code } }),
    ]);

    if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });
    if (!user.email) {
      return NextResponse.json(
        { error: "Add an email address to your profile first." },
        { status: 400 }
      );
    }
    if (!user.offersEmail) {
      return NextResponse.json(
        { error: "Enable offer emails in Settings to receive promo codes." },
        { status: 400 }
      );
    }

    if (!promo) {
      return NextResponse.json({ error: "Invalid promo code." }, { status: 404 });
    }
    if (promo.targetType === "ALL") {
      return NextResponse.json(
        { error: "This promo is public — no email is needed." },
        { status: 400 }
      );
    }
    if (promo.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "This promo code is no longer active." },
        { status: 400 }
      );
    }

    const now = new Date();
    if (promo.startsAt && promo.startsAt > now) {
      return NextResponse.json(
        { error: "This promo code is not active yet." },
        { status: 400 }
      );
    }
    if (promo.expiresAt && promo.expiresAt < now) {
      return NextResponse.json({ error: "This promo code has expired." }, { status: 400 });
    }

    // Remember that this customer was sent this secret code.
    await prisma.promoCustomer.upsert({
      where: { promoId_userId: { promoId: promo.id, userId } },
      create: { promoId: promo.id, userId, notified: true, notifiedAt: now },
      update: { notified: true, notifiedAt: now },
    });

    const title = promo.name.trim() || "Your exclusive promo code";
    const description =
      promo.description?.trim() || "Use this code at checkout to save on your order.";
    const expiry = promo.expiresAt
      ? promo.expiresAt.toLocaleDateString("en-LK", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "No expiry";

    const delivered = await sendMail({
      to: user.email,
      subject: `${title} — ${promo.code}`,
      text: [
        `Hi ${user.name?.trim() || "there"},`,
        "",
        description,
        "",
        `Promo code: ${promo.code}`,
        `Valid until: ${expiry}`,
        promo.minOrderAmount
          ? `Minimum spend: LKR ${promo.minOrderAmount.toLocaleString()}`
          : "",
        "",
        "Enter this code on your profile to add it to your wallet.",
      ]
        .filter(Boolean)
        .join("\n"),
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#27272a">
          <h2 style="color:#a21caf">${title}</h2>
          <p>Hi ${user.name?.trim() || "there"},</p>
          <p>${description}</p>
          <p style="font-size:22px;font-weight:bold;letter-spacing:3px;color:#a21caf">${promo.code}</p>
          <p><b>Valid until:</b> ${expiry}</p>
          ${
            promo.minOrderAmount
              ? `<p><b>Minimum spend:</b> LKR ${promo.minOrderAmount.toLocaleString()}</p>`
              : ""
          }
          <p>Enter this code on your profile to add it to your wallet.</p>
        </div>
      `,
    });

    return NextResponse.json({ ok: true, delivered });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("[profile/promos/resend] failed", error);
    return NextResponse.json(
      { error: "Could not send the promo email." },
      { status: 500 }
    );
  }
}
