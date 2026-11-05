"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

import {
  User,
  Mail,
  Lock,
  Phone,
  Home,
  ShieldCheck,
  Check,
  X,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@online-store/ui/button";
import { Input } from "@online-store/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@online-store/ui/select";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@online-store/ui/form";

import {
  COUNTRY_DIAL,
  GEO,
  SUPPORTED_COUNTRIES,
  phoneHint,
} from "@/lib/geo";
import { signupSchema, type SignupValues } from "@/lib/validators/auth";

type EmailStatus = "idle" | "checking" | "available" | "taken";

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const [countries, setCountries] = useState<string[]>(SUPPORTED_COUNTRIES);
  const [verificationMethod, setVerificationMethod] = useState<"email" | "phone">(
    "email"
  );
  const [verificationCode, setVerificationCode] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [emailStatus, setEmailStatus] = useState<EmailStatus>("idle");

  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    mode: "onBlur",
    defaultValues: {
      name: "",
      email: "",
      phoneCode: "+94",
      phone: "",
      country: "",
      province: "",
      district: "",
      city: "",
      address: "",
      password: "",
      confirmPassword: "",
      verificationMethod: "email",
    },
  });

  const country = form.watch("country");
  const province = form.watch("province");
  const district = form.watch("district");
  const password = form.watch("password");
  const confirmPassword = form.watch("confirmPassword");
  const emailValue = form.watch("email");
  const phoneValue = form.watch("phone");

  // Countries come from the Country table when available, with the static
  // reference data as a fallback on a fresh database.
  useEffect(() => {
    let cancelled = false;

    fetch("/api/countries")
      .then((res) => res.json())
      .then((data) => {
        if (
          !cancelled &&
          Array.isArray(data.countries) &&
          data.countries.length > 0
        ) {
          setCountries(data.countries);
        }
      })
      .catch(() => {
        /* fallback already loaded */
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Keep the dial prefix in sync with the selected country.
  useEffect(() => {
    form.setValue("phoneCode", COUNTRY_DIAL[country] ?? "", {
      shouldValidate: false,
    });
  }, [country, form]);

  const provinces = useMemo(() => Object.keys(GEO[country] ?? {}), [country]);
  const districts = useMemo(
    () => Object.keys(GEO[country]?.[province] ?? {}),
    [country, province]
  );
  const cities = useMemo(
    () => GEO[country]?.[province]?.[district] ?? [],
    [country, province, district]
  );

  const passwordChecks = [
    { label: "At least 8 characters", ok: password.length >= 8 },
    {
      label: "Contains a letter and a number",
      ok: /[A-Za-z]/.test(password) && /[0-9]/.test(password),
    },
    {
      label: "Passwords match",
      ok: password.length > 0 && password === confirmPassword,
    },
  ];

  /**
   * Checks availability before moving on. Returns true only when the address
   * is free, so the wizard cannot continue with a duplicate email.
   */
  const checkEmail = async (value: string): Promise<boolean> => {
    const email = value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailStatus("idle");
      return false;
    }

    setEmailStatus("checking");
    try {
      const res = await fetch(
        `/api/auth/check-email?email=${encodeURIComponent(email)}`
      );
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setEmailStatus("idle");
        return false;
      }

      if (data.exists) {
        setEmailStatus("taken");
        form.setError("email", {
          type: "manual",
          message: "This email is already registered. Please log in instead.",
        });
        return false;
      }

      setEmailStatus("available");
      form.clearErrors("email");
      return true;
    } catch {
      setEmailStatus("idle");
      return false;
    }
  };

  const nextStep = async () => {
    const valid = await form.trigger();
    if (!valid) return;

    const available = await checkEmail(form.getValues("email"));
    if (!available) {
      toast.error("Use a different email address to create your account.");
      return;
    }

    setStep(2);
    setCodeSent(false);
    setVerified(false);
    setVerificationCode("");
  };

  const prevStep = () => setStep(1);

  const sendVerificationCode = async () => {
    try {
      setIsSending(true);
      const values = form.getValues();
      const response = await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: verificationMethod,
          email: values.email.trim().toLowerCase(),
          phone: values.phone,
          phoneCode: values.phoneCode,
          country: values.country,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to send verification code");
        return;
      }

      setCodeSent(true);
      toast.success(data.message || "Verification code sent");
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong");
    } finally {
      setIsSending(false);
    }
  };

  const verifyCode = async () => {
    try {
      setIsVerifying(true);
      const values = form.getValues();
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: verificationMethod,
          email: values.email.trim().toLowerCase(),
          phone: values.phone,
          phoneCode: values.phoneCode,
          country: values.country,
          code: verificationCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Verification failed");
        return;
      }

      setVerified(true);
      toast.success("Verification successful");
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong");
    } finally {
      setIsVerifying(false);
    }
  };

  const onSubmit = async (values: SignupValues) => {
    // Only the final step creates the account.
    if (step !== 2) return;

    if (!verified) {
      toast.error("Please verify your account first");
      return;
    }

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          email: values.email.trim().toLowerCase(),
          name: values.name.trim(),
          address: values.address.trim(),
          verificationMethod,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Could not create your account.");

        if (data.fields?.email) {
          form.setError("email", {
            type: "server",
            message: data.fields.email[0],
          });
        }
        if (data.code === "EMAIL_EXISTS") {
          setEmailStatus("taken");
        }
        return;
      }

      setStep(3);
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 py-6 overflow-hidden bg-[#eef0fb] dark:bg-zinc-950 transition-colors">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-16 w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-fuchsia-300/50 dark:bg-fuchsia-700/25 blur-3xl" />
        <div className="absolute top-10 right-0 w-60 h-60 sm:w-80 sm:h-80 rounded-full bg-violet-300/50 dark:bg-violet-800/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-pink-300/40 dark:bg-fuchsia-900/25 blur-3xl" />
        <div className="absolute bottom-10 right-10 w-56 h-56 sm:w-72 sm:h-72 rounded-full bg-purple-300/40 dark:bg-purple-900/20 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="
          relative
          w-full
          max-w-3xl
          rounded-xl
          overflow-hidden
          border border-white/40 dark:border-fuchsia-900/30
          shadow-[0_8px_40px_rgba(168,85,247,0.2)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.5)]
          bg-white/40 dark:bg-zinc-900/60
          backdrop-blur-2xl
        "
      >
        {/* TOP */}
        <div className="px-6 sm:px-10 pt-6 sm:pt-8">
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-800 dark:text-zinc-100 text-center sm:text-left">
            Create Account
          </h1>

          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1 text-center sm:text-left">
            Join GrowMore Online Store
          </p>

          {/* PROGRESS */}
          <div className="mt-5">
            <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-1.5">
              <span>Step {step} of 3</span>
              <span>
                {step === 1
                  ? "Personal Info"
                  : step === 2
                    ? "Verification"
                    : "Complete"}
              </span>
            </div>

            <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                animate={{
                  width: step === 1 ? "33%" : step === 2 ? "66%" : "100%",
                }}
                transition={{ duration: 0.5 }}
                className="h-full bg-gradient-to-r from-fuchsia-600 to-fuchsia-500"
              />
            </div>
          </div>
        </div>

        {/* BODY */}
        <div className="px-6 sm:px-10 py-6 sm:py-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <AnimatePresence mode="wait">
                {/* STEP 1 */}
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -100, opacity: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="grid md:grid-cols-2 gap-x-6 gap-y-3">
                      <TextField
                        form={form}
                        name="name"
                        label="Username"
                        placeholder="Enter username"
                        icon={<User className="h-4 w-4" />}
                        autoComplete="username"
                      />

                      <TextField
                        form={form}
                        name="email"
                        label="Email"
                        placeholder="you@example.com"
                        icon={<Mail className="h-4 w-4" />}
                        autoComplete="email"
                        type="email"
                        onBlur={(value) => {
                          if (value.trim()) checkEmail(value);
                        }}
                        right={
                          emailStatus === "checking" ? (
                            <Loader2 className="h-4 w-4 animate-spin text-fuchsia-500" />
                          ) : emailStatus === "available" ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : emailStatus === "taken" ? (
                            <X className="h-4 w-4 text-red-500" />
                          ) : (
                            <Mail className="h-4 w-4" />
                          )
                        }
                      />

                      <SelectField
                        form={form}
                        name="country"
                        label="Country"
                        placeholder="Select country"
                        options={countries}
                        onChange={(value) => {
                          form.setValue("country", value);
                          form.setValue("province", "");
                          form.setValue("district", "");
                          form.setValue("city", "");
                        }}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-zinc-600 dark:text-zinc-400 text-xs">
                              Mobile Number
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                                  {COUNTRY_DIAL[country] || "+"}
                                </span>
                                <Input
                                  {...field}
                                  type="tel"
                                  inputMode="numeric"
                                  autoComplete="tel-national"
                                  placeholder={phoneHint(country)}
                                  onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, "");
                                    field.onChange(val);
                                    const dialDigits = (COUNTRY_DIAL[country] ?? "").replace(/\D/g, "");
                                    if (dialDigits && val.startsWith(dialDigits) && val.length > dialDigits.length) {
                                      form.setError("phone", {
                                        type: "manual",
                                        message: `Don't include the country code (${COUNTRY_DIAL[country]}) — enter only the local number.`,
                                      });
                                    } else {
                                      form.clearErrors("phone");
                                    }
                                  }}
                                  className="
                                    bg-white/60 dark:bg-zinc-800/60
                                    border border-white/60 dark:border-fuchsia-900/40
                                    rounded-full
                                    pl-16 pr-10 py-2.5
                                    h-10
                                    text-sm text-zinc-700 dark:text-zinc-200
                                    placeholder:text-zinc-400 dark:placeholder:text-zinc-500
                                    outline-none
                                    focus-visible:ring-1 focus-visible:ring-fuchsia-400 dark:focus-visible:ring-fuchsia-600
                                    focus-visible:border-fuchsia-400 dark:focus-visible:border-fuchsia-600
                                    transition-all
                                  "
                                />
                                <Phone className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                              </div>
                            </FormControl>
                            <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                              Validated for the selected country.
                            </p>
                            <FormMessage className="text-red-500 text-xs" />
                          </FormItem>
                        )}
                      />

                      <SelectField
                        form={form}
                        name="province"
                        label="Province"
                        placeholder={
                          country ? "Select province" : "Select country first"
                        }
                        options={provinces}
                        disabled={!country}
                        onChange={(value) => {
                          form.setValue("province", value);
                          form.setValue("district", "");
                          form.setValue("city", "");
                        }}
                      />

                      <SelectField
                        form={form}
                        name="district"
                        label="District"
                        placeholder={
                          province ? "Select district" : "Select province first"
                        }
                        options={districts}
                        disabled={!province}
                        onChange={(value) => {
                          form.setValue("district", value);
                          form.setValue("city", "");
                        }}
                      />

                      <SelectField
                        form={form}
                        name="city"
                        label="City"
                        placeholder={
                          district ? "Select city" : "Select district first"
                        }
                        options={cities}
                        disabled={!district}
                      />

                      <div className="md:col-span-2">
                        <TextField
                          form={form}
                          name="address"
                          label="Home Address"
                          placeholder="Enter address"
                          icon={<Home className="h-4 w-4" />}
                          autoComplete="street-address"
                        />
                      </div>

                      <PasswordField
                        form={form}
                        name="password"
                        label="Password"
                        placeholder="Create a password"
                        autoComplete="new-password"
                      />

                      <PasswordField
                        form={form}
                        name="confirmPassword"
                        label="Confirm Password"
                        placeholder="Repeat your password"
                        autoComplete="new-password"
                      />

                      <div className="md:col-span-2 rounded-xl border border-white/60 dark:border-fuchsia-900/40 bg-white/40 dark:bg-zinc-800/40 px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-1.5">
                          Password rules
                        </p>
                        <div className="grid gap-1 sm:grid-cols-3">
                          {passwordChecks.map((check) => (
                            <span
                              key={check.label}
                              className={`flex items-center gap-1.5 text-[11px] ${
                                check.ok
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-zinc-400 dark:text-zinc-500"
                              }`}
                            >
                              {check.ok ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <X className="h-3 w-3" />
                              )}
                              {check.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Bottom action row */}
                    <div className="flex flex-col sm:flex-row gap-3 mt-7">
                      {/* GOOGLE SIGNUP — fast path */}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          signIn("google", { callbackUrl: "/?loggedIn=1" })
                        }
                        className="
                          flex-1 h-11 rounded-full
                          border border-white/60 dark:border-zinc-700
                          bg-white/50 dark:bg-zinc-800/50
                          hover:bg-white/70 dark:hover:bg-zinc-800
                          text-zinc-700 dark:text-zinc-200
                          flex items-center justify-center gap-3
                          transition-all
                        "
                      >
                        <FcGoogle className="h-5 w-5" />
                        <span className="font-medium text-sm">
                          Continue with Google
                        </span>
                      </Button>

                      <Button
                        type="button"
                        variant="shoe"
                        onClick={nextStep}
                        disabled={emailStatus === "checking"}
                        className="
                          flex-1 h-11 rounded-full
                          bg-gradient-to-r from-fuchsia-600 to-fuchsia-500
                          hover:from-fuchsia-700 hover:to-fuchsia-600
                          text-white shadow-md shadow-fuchsia-500/30
                          transition-all
                        "
                      >
                        Continue
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 2 */}
                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -100, opacity: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100 mb-5">
                      Verification
                    </h2>

                    <div className="space-y-3">
                      <label className="flex items-center gap-4 border border-white/60 dark:border-fuchsia-900/40 bg-white/50 dark:bg-zinc-800/50 rounded-xl p-4 cursor-pointer hover:border-fuchsia-400 dark:hover:border-fuchsia-600 transition-colors">
                        <input
                          type="radio"
                          name="verify"
                          className="accent-fuchsia-500"
                          checked={verificationMethod === "email"}
                          onChange={() => {
                            setVerificationMethod("email");
                            form.setValue("verificationMethod", "email");
                            setCodeSent(false);
                            setVerified(false);
                          }}
                        />
                        <Mail className="text-fuchsia-500 h-4 w-4" />
                        <div>
                          <p className="text-zinc-800 dark:text-zinc-100 font-medium text-sm">
                            Verify by Email
                          </p>
                          <p className="text-zinc-500 dark:text-zinc-400 text-xs break-all">
                            Receive code on {emailValue}
                          </p>
                        </div>
                      </label>

                      {/* <label className="flex items-center gap-4 border border-white/60 dark:border-fuchsia-900/40 bg-white/50 dark:bg-zinc-800/50 rounded-xl p-4 cursor-pointer hover:border-fuchsia-400 dark:hover:border-fuchsia-600 transition-colors">
                        <input
                          type="radio"
                          name="verify"
                          className="accent-fuchsia-500"
                          checked={verificationMethod === "phone"}
                          onChange={() => {
                            setVerificationMethod("phone");
                            form.setValue("verificationMethod", "phone");
                            setCodeSent(false);
                            setVerified(false);
                          }}
                        />
                        <Phone className="text-fuchsia-500 h-4 w-4" />
                        <div>
                          <p className="text-zinc-800 dark:text-zinc-100 font-medium text-sm">
                            Verify by Phone
                          </p>
                          <p className="text-zinc-500 dark:text-zinc-400 text-xs">
                            Receive OTP on {COUNTRY_DIAL[country] || ""}{" "}
                            {phoneValue}
                          </p>
                        </div>
                      </label> */}
                    </div>

                    <div className="mt-5 flex gap-2">
                      <Button
                        type="button"
                        onClick={sendVerificationCode}
                        disabled={isSending}
                        variant="outline"
                        className="
                          h-11 rounded-full
                          border-white/60 dark:border-zinc-700
                          bg-white/50 dark:bg-zinc-800/50
                          hover:bg-white/70 dark:hover:bg-zinc-800
                          text-zinc-700 dark:text-zinc-200
                        "
                      >
                        {isSending
                          ? "Sending..."
                          : codeSent
                            ? "Resend Code"
                            : "Send Code"}
                      </Button>
                    </div>

                    {codeSent && (
                      <>
                        <div className="mt-4">
                          <Input
                            placeholder="Enter Verification Code"
                            value={verificationCode}
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            onChange={(e) =>
                              setVerificationCode(
                                e.target.value.replace(/\D/g, "").slice(0, 6)
                              )
                            }
                            className="
                              h-11 rounded-full
                              bg-white/60 dark:bg-zinc-800/60
                              border border-white/60 dark:border-fuchsia-900/40
                              text-zinc-700 dark:text-zinc-200
                              placeholder:text-zinc-400 dark:placeholder:text-zinc-500
                              focus-visible:ring-fuchsia-400 dark:focus-visible:ring-fuchsia-600
                            "
                          />
                        </div>

                        <div className="mt-3">
                          <Button
                            type="button"
                            onClick={verifyCode}
                            disabled={isVerifying || verified || !verificationCode}
                            variant="outline"
                            className="
                              h-11 px-6 rounded-full
                              border-white/60 dark:border-zinc-700
                              bg-white/50 dark:bg-zinc-800/50
                              hover:bg-white/70 dark:hover:bg-zinc-800
                              text-zinc-700 dark:text-zinc-200
                            "
                          >
                            {verified
                              ? "Verified ✓"
                              : isVerifying
                                ? "Verifying..."
                                : "Verify Code"}
                          </Button>
                        </div>
                      </>
                    )}

                    <div className="flex gap-3 mt-7">
                      <Button
                        type="button"
                        onClick={prevStep}
                        variant="outline"
                        className="
                          flex-1 h-11 rounded-full
                          border-white/60 dark:border-zinc-700
                          bg-white/50 dark:bg-zinc-800/50
                          hover:bg-white/70 dark:hover:bg-zinc-800
                          text-zinc-700 dark:text-zinc-200
                        "
                      >
                        Back
                      </Button>

                      <Button
                        type="submit"
                        variant="shoe"
                        disabled={!verified}
                        className="
                          flex-1 h-11 rounded-full
                          bg-gradient-to-r from-fuchsia-600 to-fuchsia-500
                          hover:from-fuchsia-700 hover:to-fuchsia-600
                          text-white shadow-md shadow-fuchsia-500/30
                          disabled:opacity-50
                        "
                      >
                        Verify &amp; Create
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 3 */}
                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="text-center py-6"
                  >
                    <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-fuchsia-600 to-fuchsia-500 flex items-center justify-center shadow-md shadow-fuchsia-500/30">
                      <ShieldCheck className="text-white h-8 w-8" />
                    </div>

                    <h2 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 mt-6">
                      Account Created!
                    </h2>

                    <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-sm leading-6">
                      Your account has been verified. Welcome to GrowMore.
                    </p>

                    <Link href="/login">
                      <Button
                        variant="shoe"
                        className="
                          mt-7 h-11 px-10 rounded-full
                          bg-gradient-to-r from-fuchsia-600 to-fuchsia-500
                          hover:from-fuchsia-700 hover:to-fuchsia-600
                          text-white shadow-md shadow-fuchsia-500/30
                        "
                      >
                        Go To Login
                      </Button>
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </Form>

          {step !== 3 && (
            <p className="mt-6 text-zinc-500 dark:text-zinc-400 text-sm text-center">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-fuchsia-600 dark:text-fuchsia-400 font-semibold hover:text-fuchsia-700 dark:hover:text-fuchsia-300"
              >
                Login
              </Link>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

/* ---------------- TEXT FIELD ---------------- */

function TextField({
  form,
  name,
  label,
  placeholder,
  icon,
  type = "text",
  autoComplete,
  onBlur,
  right,
}: {
  form: any;
  name: string;
  label: string;
  placeholder: string;
  icon: React.ReactNode;
  type?: string;
  autoComplete?: string;
  onBlur?: (value: string) => void;
  right?: React.ReactNode;
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-zinc-600 dark:text-zinc-400 text-xs">
            {label}
          </FormLabel>

          <FormControl>
            <div className="relative">
              <Input
                {...field}
                type={type}
                autoComplete={autoComplete}
                placeholder={placeholder}
                onBlur={(event) => {
                  field.onBlur();
                  onBlur?.(event.target.value);
                }}
                className="
                  bg-white/60 dark:bg-zinc-800/60
                  border border-white/60 dark:border-fuchsia-900/40
                  rounded-full
                  pl-4 pr-10 py-2.5
                  h-10
                  text-sm text-zinc-700 dark:text-zinc-200
                  placeholder:text-zinc-400 dark:placeholder:text-zinc-500
                  outline-none
                  focus-visible:ring-1 focus-visible:ring-fuchsia-400 dark:focus-visible:ring-fuchsia-600
                  focus-visible:border-fuchsia-400 dark:focus-visible:border-fuchsia-600
                  transition-all
                "
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500">
                {right ?? icon}
              </div>
            </div>
          </FormControl>

          <FormMessage className="text-red-500 text-xs" />
        </FormItem>
      )}
    />
  );
}

/* ---------------- PASSWORD FIELD ---------------- */

function PasswordField({
  form,
  name,
  label,
  placeholder,
  autoComplete,
}: {
  form: any;
  name: string;
  label: string;
  placeholder: string;
  autoComplete?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-zinc-600 dark:text-zinc-400 text-xs">
            {label}
          </FormLabel>

          <FormControl>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
              <Input
                {...field}
                type={visible ? "text" : "password"}
                autoComplete={autoComplete}
                placeholder={placeholder}
                className="
                  bg-white/60 dark:bg-zinc-800/60
                  border border-white/60 dark:border-fuchsia-900/40
                  rounded-full
                  pl-11 pr-11 py-2.5
                  h-10
                  text-sm text-zinc-700 dark:text-zinc-200
                  placeholder:text-zinc-400 dark:placeholder:text-zinc-500
                  outline-none
                  focus-visible:ring-1 focus-visible:ring-fuchsia-400 dark:focus-visible:ring-fuchsia-600
                  focus-visible:border-fuchsia-400 dark:focus-visible:border-fuchsia-600
                  transition-all
                "
              />
              <button
                type="button"
                onClick={() => setVisible((value) => !value)}
                aria-label={visible ? "Hide password" : "Show password"}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-fuchsia-500 dark:text-zinc-500 dark:hover:text-fuchsia-400 transition-colors"
              >
                {visible ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </FormControl>

          <FormMessage className="text-red-500 text-xs" />
        </FormItem>
      )}
    />
  );
}

/* ---------------- SELECT FIELD ---------------- */

function SelectField({
  form,
  name,
  label,
  placeholder,
  options,
  disabled,
  onChange,
}: {
  form: any;
  name: string;
  label: string;
  placeholder: string;
  options: string[];
  disabled?: boolean;
  onChange?: (value: string) => void;
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-zinc-600 dark:text-zinc-400 text-xs">
            {label}
          </FormLabel>

          <Select
            value={field.value || undefined}
            onValueChange={(value) => {
              field.onChange(value);
              onChange?.(value);
            }}
            disabled={disabled}
          >
            <FormControl>
              <SelectTrigger
                className="
                  h-10 rounded-full
                  bg-white/60 dark:bg-zinc-800/60
                  border border-white/60 dark:border-fuchsia-900/40
                  text-sm text-zinc-700 dark:text-zinc-200
                  focus:ring-1 focus:ring-fuchsia-400 dark:focus:ring-fuchsia-600
                  data-[placeholder]:text-zinc-400 dark:data-[placeholder]:text-zinc-500
                "
              >
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <FormMessage className="text-red-500 text-xs" />
        </FormItem>
      )}
    />
  );
}
