import SideNav from "@/components/Navs/SideNav";
import TopNav from "@/components/Navs/TopNav";
import ProfileCompleteGuard from "@/components/ProfileCompleteGuard";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

interface VendorSession {
  id: number;
  name: string;
  email: string;
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const vendorSessionRaw = cookieStore.get("vendor_session")?.value;

  if (!vendorSessionRaw) {
    redirect("/login");
  }

  let vendor: VendorSession;
  try {
    vendor = JSON.parse(vendorSessionRaw);
  } catch {
    redirect("/login");
  }

  const vendorInfo = prisma.vendor.findUnique({
    where: { id: vendor.id },
    select: {
      status: true,
      isProfileComplete: true,
      createdAt: true,
    },
  });

  const vendorSettings = prisma.vendorSettings.findUnique({
    where: { vendorId: vendor.id },
  });

  const [vendorData, settings] = await prisma.$transaction([vendorInfo, vendorSettings]);

  if (!vendorData) {
    redirect("/login");
  }

  if ((vendorData.status as string) === "PENDING") {
    const createdAt = new Date(vendorData.createdAt);
    const now = new Date();
    const hoursElapsed = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

    if (hoursElapsed >= 24) {
      await prisma.vendor.update({
        where: { id: vendor.id },
        data: { status: "ACTIVE" as never },
      });
      vendorData.status = "ACTIVE" as never;
    } else {
      redirect("/status/pending");
    }
  }

  if ((vendorData.status as string) === "BLOCKED") {
    redirect("/status/blocked");
  }

  if ((vendorData.status as string) === "CANCELLED") {
    redirect("/status/cancelled");
  }

  const profileComplete = vendorData.isProfileComplete || !!(
    settings?.storeName &&
    settings?.description &&
    settings?.taxId &&
    settings?.bankName &&
    settings?.accountName &&
    settings?.accountNumber
  );

  if (!profileComplete) {
    return (
      <section>
        <TopNav user={{ name: vendor.name || "Vendor" }} />
        <ProfileCompleteGuard />
        <div className="container w-full pt-4 pb-24 md:py-4">{children}</div>
      </section>
    );
  }

  const user = {
    name: vendor.name || "Vendor",
  };

  return (
    <section>
      <TopNav user={user} />
      <div className="flex min-h-screen">
        <SideNav role="vendor" />
        <div className="container w-full pt-4 pb-24 md:py-4">{children}</div>
      </div>
    </section>
  );
}
