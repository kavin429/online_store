import { storeAuthOptions } from "@online-store/auth";

/**
 * The storefront signs in customers (and Google users) only.
 * The actual provider/role logic lives in @online-store/auth so every app
 * shares one implementation.
 */
export const authOptions = storeAuthOptions;
