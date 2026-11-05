import { redirect } from "next/navigation";

// Store settings now live on the dedicated My Store page. Keep this route as
// a redirect so old links and bookmarks continue to work.
export default function SettingsPage() {
  redirect("/dashboard/store");
}
