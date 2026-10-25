export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startCustomerWatcher } = await import("@/lib/customerWatcher");
    await startCustomerWatcher();
  }
}
