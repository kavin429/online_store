import LoadingScreen from "@online-store/ui/loading-screen";

// Shown on the very first load / initial route while the app boots.
export default function RootLoading() {
  return <LoadingScreen fullScreen label="Loading..." />;
}
