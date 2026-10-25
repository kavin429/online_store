import webpush from "web-push";
import { prisma } from "@/lib/prisma";

type PushPayload = {
  title: string;
  body: string;
  url?: string;
};

let pushConfigured = false;

function isPushConfigured() {
  if (pushConfigured) return true;

  const subject = process.env.VAPID_SUBJECT;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!subject || !publicKey || !privateKey) return false;

  try {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    pushConfigured = true;
    return true;
  } catch (error) {
    console.error("Push notification configuration error:", error);
    return false;
  }
}

export async function sendPushToUser(userId: number, payload: PushPayload) {
  if (!isPushConfigured()) return;

  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } });
  if (subscriptions.length === 0) return;

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          JSON.stringify(payload),
        );
      } catch (error) {
        const statusCode =
          typeof error === "object" && error !== null && "statusCode" in error
            ? Number(error.statusCode)
            : null;

        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription
            .delete({ where: { id: subscription.id } })
            .catch(() => undefined);
        } else {
          console.error(`Push failed for user ${userId}:`, error);
        }
      }
    }),
  );
}

export async function sendPushToUsers(userIds: number[], payload: PushPayload) {
  if (userIds.length === 0 || !isPushConfigured()) return;
  await Promise.all(userIds.map((userId) => sendPushToUser(userId, payload)));
}

export async function sendPushToAdmin(payload: PushPayload) {
  if (!isPushConfigured()) return;

  const subscriptions = await prisma.adminPushSubscription.findMany();
  if (subscriptions.length === 0) return;

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          JSON.stringify(payload),
        );
      } catch (error) {
        const statusCode =
          typeof error === "object" && error !== null && "statusCode" in error
            ? Number(error.statusCode)
            : null;

        if (statusCode === 404 || statusCode === 410) {
          await prisma.adminPushSubscription
            .delete({ where: { id: subscription.id } })
            .catch(() => undefined);
        } else {
          console.error("Admin push failed:", error);
        }
      }
    }),
  );
}
