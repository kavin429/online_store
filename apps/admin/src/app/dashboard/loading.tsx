import LoadingScreen from "@online-store/ui/loading-screen";

// Shown on every dashboard page navigation while the route's data loads.
export default function DashboardLoading() {
  return <LoadingScreen fullScreen label="Loading..." />;
}
