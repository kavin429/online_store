import twilio from "twilio";

type SmsPayload = {
  to: string;
  body: string;
};

let client: ReturnType<typeof twilio> | null = null;

function getClient() {
  if (client) return client;

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) return null;

  client = twilio(accountSid, authToken);
  return client;
}

export function normalizePhone(phone: string) {
  const value = phone.trim();
  const countryCode = (process.env.DEFAULT_COUNTRY_CODE || "").replace(/\D/g, "");

  if (value.startsWith("+")) {
    return `+${value.slice(1).replace(/\D/g, "")}`;
  }

  const digits = value.replace(/\D/g, "");

  if (!digits) return "";
  if (digits.startsWith("00")) return `+${digits.slice(2)}`;

  if (!countryCode) return `+${digits}`;
  if (digits.startsWith("0")) return `+${countryCode}${digits.slice(1)}`;
  if (digits.startsWith(countryCode)) return `+${digits}`;

  return `+${countryCode}${digits}`;
}

export function normalizeSender(sender: string) {
  return normalizePhone(sender);
}

export async function sendSms({ to, body }: SmsPayload) {
  const rawFrom = process.env.TWILIO_FROM_NUMBER;
  const smsClient = getClient();

  if (!smsClient || !rawFrom) {
    console.error("SMS not configured: missing Twilio environment variables.");
    return false;
  }

  const from = normalizeSender(rawFrom);
  const recipient = normalizePhone(to);

  if (!recipient) {
    console.error("SMS skipped: recipient phone number is empty.");
    return false;
  }

  try {
    await smsClient.messages.create({ from, to: recipient, body });
    return true;
  } catch (error) {
    console.error(`SMS failed for ${to}:`, error);
    return false;
  }
}
