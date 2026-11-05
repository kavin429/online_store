export const DIAL_CODES: { dial: string; label: string }[] = [
  { dial: "+94", label: "Sri Lanka" },
  { dial: "+91", label: "India" },
  { dial: "+977", label: "Nepal" },
  { dial: "+880", label: "Bangladesh" },
  { dial: "+92", label: "Pakistan" },
  { dial: "+971", label: "UAE" },
  { dial: "+65", label: "Singapore" },
  { dial: "+60", label: "Malaysia" },
  { dial: "+44", label: "United Kingdom" },
  { dial: "+1", label: "United States" },
  { dial: "+61", label: "Australia" },
];

export const COUNTRY_DIAL: Record<string, string> = Object.fromEntries(
  DIAL_CODES.map(({ dial, label }) => [label, dial])
);

export const GEO: Record<string, Record<string, Record<string, string[]>>> = {
  "Sri Lanka": {
    "Western Province": {
      Colombo: ["Colombo", "Dehiwala", "Moratuwa", "Maharagama", "Nugegoda"],
      Gampaha: ["Gampaha", "Negombo", "Ja-Ela", "Wattala", "Kelaniya"],
      Kalutara: ["Kalutara", "Panadura", "Horana", "Beruwala"],
    },
    "Central Province": {
      Kandy: ["Kandy", "Peradeniya", "Gampola", "Katugastota"],
      Matale: ["Matale", "Dambulla", "Sigiriya", "Rattota"],
      "Nuwara Eliya": ["Nuwara Eliya", "Hatton", "Talawakele", "Ginigathhena"],
    },
    "Southern Province": {
      Galle: ["Galle", "Hikkaduwa", "Ambalangoda", "Elpitiya"],
      Matara: ["Matara", "Weligama", "Dikwella", "Akuressa"],
      Hambantota: ["Hambantota", "Tangalle", "Tissamaharama", "Beliatta"],
    },
    "Northern Province": {
      Jaffna: ["Jaffna", "Nallur", "Chavakachcheri", "Point Pedro"],
      Kilinochchi: ["Kilinochchi", "Pallai"],
      Mannar: ["Mannar", "Nanattan"],
      Mullaitivu: ["Mullaitivu", "Puthukkudiyiruppu"],
      Vavuniya: ["Vavuniya", "Cheddikulam"],
    },
    "Eastern Province": {
      Trincomalee: ["Trincomalee", "Kinniya", "Muttur"],
      Batticaloa: ["Batticaloa", "Kattankudy", "Eravur"],
      Ampara: ["Ampara", "Kalmunai", "Sainthamaruthu"],
    },
    "North Western Province": {
      Kurunegala: ["Kurunegala", "Kuliyapitiya", "Narammala", "Polgahawela"],
      Puttalam: ["Puttalam", "Chilaw", "Wennappuwa", "Dankotuwa"],
    },
    "North Central Province": {
      Anuradhapura: ["Anuradhapura", "Kekirawa", "Medawachchiya", "Thambuttegama"],
      Polonnaruwa: ["Polonnaruwa", "Hingurakgoda", "Kaduruwela"],
    },
    "Uva Province": {
      Badulla: ["Badulla", "Bandarawela", "Ella", "Haputale"],
      Monaragala: ["Monaragala", "Wellawaya", "Bibile"],
    },
    "Sabaragamuwa Province": {
      Ratnapura: ["Ratnapura", "Embilipitiya", "Balangoda", "Kuruwita"],
      Kegalle: ["Kegalle", "Mawanella", "Warakapola", "Rambukkana"],
    },
  },
  India: {
    "Tamil Nadu": {
      Chennai: ["Chennai", "Tambaram", "Avadi"],
      Coimbatore: ["Coimbatore", "Pollachi", "Tiruppur"],
      Madurai: ["Madurai", "Dindigul"],
    },
    Kerala: {
      Ernakulam: ["Kochi", "Aluva", "Perumbavoor"],
      Thiruvananthapuram: ["Thiruvananthapuram", "Attingal", "Neyyattinkara"],
    },
    Karnataka: {
      Bengaluru: ["Bengaluru", "Whitefield", "Electronic City"],
      Mysuru: ["Mysuru", "Mandya"],
    },
    Maharashtra: {
      Mumbai: ["Mumbai", "Navi Mumbai", "Thane"],
      Pune: ["Pune", "Pimpri-Chinchwad"],
    },
  },
  Nepal: {
    "Bagmati Province": {
      Kathmandu: ["Kathmandu", "Kirtipur", "Budhanilkantha"],
      Lalitpur: ["Lalitpur", "Godawari", "Bhaktapur"],
    },
    "Gandaki Province": {
      Kaski: ["Pokhara", "Lekhnath"],
    },
    "Lumbini Province": {
      Rupandehi: ["Butwal", "Bhairahawa"],
    },
  },
  Bangladesh: {
    Dhaka: {
      Dhaka: ["Dhaka", "Gazipur", "Narayanganj"],
      Tangail: ["Tangail", "Kalihati"],
    },
    Chattogram: {
      Chattogram: ["Chattogram", "Cox's Bazar", "Comilla"],
    },
  },
  Pakistan: {
    Punjab: {
      Lahore: ["Lahore", "Sheikhupura"],
      Rawalpindi: ["Rawalpindi", "Islamabad"],
    },
    Sindh: {
      Karachi: ["Karachi", "Hyderabad"],
    },
  },
  UAE: {
    "Abu Dhabi": {
      "Abu Dhabi": ["Abu Dhabi", "Al Ain"],
    },
    Dubai: {
      Dubai: ["Dubai", "Jebel Ali"],
    },
    Sharjah: {
      Sharjah: ["Sharjah", "Khor Fakkan"],
    },
  },
  Singapore: {
    "Central Region": {
      Singapore: ["Singapore", "Orchard", "Marina Bay"],
    },
    "East Region": {
      Tampines: ["Tampines", "Pasir Ris", "Bedok"],
    },
  },
  Malaysia: {
    Selangor: {
      Petaling: ["Petaling Jaya", "Subang Jaya"],
      Klang: ["Klang", "Shah Alam"],
    },
    "Kuala Lumpur": {
      "Kuala Lumpur": ["Kuala Lumpur", "Cheras"],
    },
  },
  "United Kingdom": {
    England: {
      London: ["London", "Croydon", "Ilford"],
      Manchester: ["Manchester", "Salford"],
      Birmingham: ["Birmingham", "Coventry"],
    },
    Scotland: {
      Edinburgh: ["Edinburgh", "Leith"],
      Glasgow: ["Glasgow", "Paisley"],
    },
    Wales: {
      Cardiff: ["Cardiff", "Swansea"],
    },
    "Northern Ireland": {
      Belfast: ["Belfast", "Lisburn"],
    },
  },
  "United States": {
    California: {
      "Los Angeles": ["Los Angeles", "Long Beach", "Pasadena"],
      "San Francisco": ["San Francisco", "Oakland", "San Jose"],
    },
    "New York": {
      "New York": ["New York", "Brooklyn", "Queens"],
      Buffalo: ["Buffalo", "Rochester"],
    },
    Texas: {
      Houston: ["Houston", "Sugar Land"],
      Dallas: ["Dallas", "Fort Worth"],
    },
  },
  Australia: {
    "New South Wales": {
      Sydney: ["Sydney", "Newcastle", "Parramatta"],
    },
    Victoria: {
      Melbourne: ["Melbourne", "Geelong"],
    },
    Queensland: {
      Brisbane: ["Brisbane", "Gold Coast"],
    },
  },
};

export const SUPPORTED_COUNTRIES = Object.keys(GEO);

type PhoneRule = {
  min: number;
  max: number;
  example: string;
};

export const PHONE_RULES: Record<string, PhoneRule> = {
  "Sri Lanka": { min: 9, max: 9, example: "77 123 4567" },
  India: { min: 10, max: 10, example: "98765 43210" },
  Nepal: { min: 10, max: 10, example: "98 1234 5678" },
  Bangladesh: { min: 10, max: 10, example: "1712 345678" },
  Pakistan: { min: 10, max: 10, example: "300 1234567" },
  UAE: { min: 9, max: 9, example: "50 123 4567" },
  Singapore: { min: 8, max: 8, example: "8123 4567" },
  Malaysia: { min: 9, max: 10, example: "12 345 6789" },
  "United Kingdom": { min: 10, max: 10, example: "7700 900123" },
  "United States": { min: 10, max: 10, example: "202 555 0123" },
  Australia: { min: 9, max: 9, example: "412 345 678" },
};

export type PhoneValidation =
  | { ok: true; national: string; e164: string }
  | { ok: false; error: string };


export function validatePhoneForCountry(
  phone: string,
  country: string
): PhoneValidation {
  const raw = (phone ?? "").trim();
  const rule = PHONE_RULES[country];
  const dial = (COUNTRY_DIAL[country] ?? "").replace(/\D/g, "");

  if (!raw) {
    return { ok: false, error: "Mobile number is required." };
  }

  let digits = raw.replace(/\D/g, "");
  if (!digits) {
    return { ok: false, error: "Enter a valid mobile number." };
  }

  if (raw.startsWith("+")) {
    if (!dial) {
      return { ok: false, error: "Select a country for your mobile number." };
    }
    if (!digits.startsWith(dial)) {
      return {
        ok: false,
        error: `A ${country} number must start with ${COUNTRY_DIAL[country]}.`,
      };
    }
    digits = digits.slice(dial.length);
  } else {
    if (digits.startsWith("0")) {
      digits = digits.slice(1);
    } else if (dial && digits.startsWith(dial) && digits.length > (rule?.max ?? 15)) {
      digits = digits.slice(dial.length);
    }
  }

  if (!rule) {
    if (digits.length < 6 || digits.length > 15) {
      return { ok: false, error: "Enter a valid mobile number." };
    }
    return {
      ok: true,
      national: digits,
      e164: `+${dial}${digits}`,
    };
  }

  if (digits.length < rule.min || digits.length > rule.max) {
    const expected =
      rule.min === rule.max ? `${rule.min}` : `${rule.min}–${rule.max}`;
    return {
      ok: false,
      error: `Enter a valid ${country} mobile number (${expected} digits, e.g. ${rule.example}).`,
    };
  }

  return {
    ok: true,
    national: digits,
    e164: `+${dial}${digits}`,
  };
}

export function phoneHint(country: string) {
  const dial = COUNTRY_DIAL[country];
  const rule = PHONE_RULES[country];
  if (!dial || !rule) return "Select a country first";
  return `${dial} ${rule.example}`;
}
