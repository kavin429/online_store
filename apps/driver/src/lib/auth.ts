import { getServerSession } from "next-auth";
import { driverAuthOptions, ROLES } from "@online-store/auth";
import { prisma } from "@/lib/prisma";

export const authOptions = driverAuthOptions;

export async function getDriverSession() {
  return getServerSession(driverAuthOptions);
}

export async function currentDriver() {
  const session = await getDriverSession();
  if (!session?.user || session.user.role !== ROLES.DRIVER) return null;

  const id = Number(session.user.id);
  if (!Number.isInteger(id) || id <= 0) return null;

  // Re-check the database so a driver blocked by an admin loses access even
  // while an older JWT session is still alive.
  const record = await prisma.driver.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      status: true,
    },
  });

  if (!record || record.status === "BLOCKED") return null;

  return {
    session,
    id: record.id,
    name: record.name ?? "Driver",
    email: record.email ?? record.username,
  };
}
