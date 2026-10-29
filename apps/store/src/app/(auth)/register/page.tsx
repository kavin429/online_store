"use client";

import { useState } from "react";
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
  MapPin,
  Home,
  ShieldCheck,
} from "lucide-react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@online-store/ui/button";
import { Input } from "@online-store/ui/input";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@online-store/ui/form";
import { useRouter } from "next/navigation";
/* ---------------- SCHEMA ---------------- */

const formSchema = z
  .object({
    name: z.string().min(3, "Username is too short"),
    email: z.string().email("Invalid email"),
    phone: z.string().min(8, "Invalid phone number"),
    country: z.string().min(1, "Country required"),
    province: z.string().min(1, "Province required"),
    district: z.string().min(1, "District required"),
    city: z.string().min(1, "City required"),
    address: z.string().min(5, "Address required"),
    password: z.string().min(6, "Password too short"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const router = useRouter();
  const [verificationMethod, setVerificationMethod] = useState<"email" | "phone">("email");
  const [verificationCode, setVerificationCode] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [verified, setVerified] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      country: "",
      province: "",
      district: "",
      city: "",
      address: "",
      password: "",
      confirmPassword: "",
    },
  });

  const nextStep = async () => {
    const valid = await form.trigger();
    if (!valid) return;
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
          email: values.email,
          phone: values.phone,
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
          email: values.email,
          phone: values.phone,
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

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (step === 2 && !verified) {
      toast.error("Please verify your account first");
      return;
    }

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error);
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
                      <CustomField form={form} name="name" label="Username" placeholder="Enter username" icon={<User className="h-4 w-4" />} />
                      <CustomField form={form} name="email" label="Email" placeholder="Enter email" icon={<Mail className="h-4 w-4" />} />
                      <CustomField form={form} name="phone" label="Phone" placeholder="Enter phone" icon={<Phone className="h-4 w-4" />} />
                      <CustomField form={form} name="country" label="Country" placeholder="Country" icon={<MapPin className="h-4 w-4" />} />
                      <CustomField form={form} name="province" label="Province" placeholder="Province" icon={<MapPin className="h-4 w-4" />} />
                      <CustomField form={form} name="district" label="District" placeholder="District" icon={<MapPin className="h-4 w-4" />} />
                      <CustomField form={form} name="city" label="City" placeholder="City" icon={<MapPin className="h-4 w-4" />} />

                      <div className="md:col-span-2">
                        <CustomField form={form} name="address" label="Home Address" placeholder="Enter address" icon={<Home className="h-4 w-4" />} />
                      </div>

                      <CustomField form={form} name="password" type="password" label="Password" placeholder="Enter password" icon={<Lock className="h-4 w-4" />} />
                      <CustomField form={form} name="confirmPassword" type="password" label="Confirm Password" placeholder="Confirm password" icon={<Lock className="h-4 w-4" />} />
                    </div>

                    {/* Bottom action row */}
                    <div className="flex flex-col sm:flex-row gap-3 mt-7">
                      {/* GOOGLE SIGNUP — fast path */}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => signIn("google", { callbackUrl: "/?loggedIn=1" })}
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
                        <span className="font-medium text-sm">Continue with Google</span>
                      </Button>

                      <Button
                        type="button"
                        variant="shoe"
                        onClick={nextStep}
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
                          onChange={() => setVerificationMethod("email")}
                        />
                        <Mail className="text-fuchsia-500 h-4 w-4" />
                        <div>
                          <p className="text-zinc-800 dark:text-zinc-100 font-medium text-sm">
                            Verify by Email
                          </p>
                          <p className="text-zinc-500 dark:text-zinc-400 text-xs">
                            Receive code on {form.getValues("email")}
                          </p>
                        </div>
                      </label>

                      <label className="flex items-center gap-4 border border-white/60 dark:border-fuchsia-900/40 bg-white/50 dark:bg-zinc-800/50 rounded-xl p-4 cursor-pointer hover:border-fuchsia-400 dark:hover:border-fuchsia-600 transition-colors">
                        <input 
                          type="radio" 
                          name="verify" 
                          className="accent-fuchsia-500" 
                          checked={verificationMethod === "phone"}
                          onChange={() => setVerificationMethod("phone")}
                        />
                        <Phone className="text-fuchsia-500 h-4 w-4" />
                        <div>
                          <p className="text-zinc-800 dark:text-zinc-100 font-medium text-sm">
                            Verify by Phone
                          </p>
                          <p className="text-zinc-500 dark:text-zinc-400 text-xs">
                            Receive OTP on {form.getValues("phone")}
                          </p>
                        </div>
                      </label>
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
                        {isSending ? "Sending..." : codeSent ? "Resend Code" : "Send Code"}
                      </Button>
                    </div>

                    {codeSent && (
                      <>
                        <div className="mt-4">
                          <Input
                            placeholder="Enter Verification Code"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value)}
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
                            {verified ? "Verified ✓" : isVerifying ? "Verifying..." : "Verify Code"}
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
                        Verify & Create
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

/* ---------------- CUSTOM FIELD ---------------- */

function CustomField({
  form,
  name,
  label,
  placeholder,
  icon,
  type = "text",
}: any) {
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
                placeholder={placeholder}
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
                {icon}
              </div>
            </div>
          </FormControl>

          <FormMessage className="text-red-500 text-xs" />
        </FormItem>
      )}
    />
  );
}
