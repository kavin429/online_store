"use client"

import { Card, CardContent } from "@online-store/ui/card";
import { Button } from "@online-store/ui/button";
import { Input } from "@online-store/ui/input";
import { Textarea } from "@online-store/ui/textarea";
import { Label } from "@online-store/ui/label";
import { Checkbox } from "@online-store/ui/checkbox";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Globe,
  Instagram,
  Youtube,
} from "lucide-react";

export default function ContactPage() {
  const contactInfo = [
    {
      title: "Customer Support",
      value: "+94 77 123 4567",
      icon: Phone,
    },
    {
      title: "Email Address",
      value: "support@growmore.com",
      icon: Mail,
    },
    {
      title: "Office Location",
      value: "Colombo, Sri Lanka",
      icon: MapPin,
    },
    {
      title: "Working Hours",
      value: "Mon - Sat : 8AM - 8PM",
      icon: Clock,
    },
  ];

  const socials = [Globe, Instagram, Youtube];

  return (
    <div className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-white font-body">
      <div className="grid lg:grid-cols-2 min-h-screen">
        {/* LEFT PANEL - LIGHT */}
        <div className="relative flex flex-col justify-between p-10 md:p-16 bg-gradient-to-br from-fuchsia-50 via-white to-fuchsia-50 dark:from-zinc-950 dark:via-black dark:to-zinc-950">
          <div className="absolute top-10 right-10 w-16 h-16 rounded-2xl bg-fuchsia-200/60 dark:bg-fuchsia-900/30 rotate-12" />

          <div className="relative z-10 max-w-lg">
            <h1 className="font-display md:text-6xl font-bold leading-[1.05] mb-4">
              Contact
              <span className="text-fuchsia-500"> Me.</span>
            </h1>

            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3 text-sm">
              I will read every message myself and I&apos;m not going to let any
              of them slip through. Send me anything you need help with —
              orders, products, or partnerships — and I&apos;ll reply personally.
            </p>

            <p className="text-zinc-500 dark:text-zinc-500 text-sm leading-relaxed mb-10">
              I need your{" "}
              <span className="font-semibold text-fuchsia-600 dark:text-fuchsia-400">
                name
              </span>{" "}
              and{" "}
              <span className="font-semibold text-fuchsia-600 dark:text-fuchsia-400">
                email address
              </span>
              , but you won&apos;t receive anything besides my reply.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              {contactInfo.map((item, index) => {
                const Icon = item.icon;
                return (
                  <Card
                    key={index}
                    className="border-fuchsia-100 dark:border-zinc-800 hover:border-fuchsia-300 dark:hover:border-fuchsia-700 transition-all"
                  >
                    <CardContent className="flex items-start gap-3 p-4">
                      <div className="w-9 h-9 shrink-0 rounded-xl bg-fuchsia-100 dark:bg-fuchsia-900/40 flex items-center justify-center">
                        <Icon
                          size={18}
                          className="text-fuchsia-600 dark:text-fuchsia-400"
                        />
                      </div>

                      <div>
                        <h3 className="font-display font-semibold text-sm">
                          {item.title}
                        </h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {item.value}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          <div className="relative z-10 mt-5 pt-8 border-t border-fuchsia-100 dark:border-zinc-800">
            <p className="font-display text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-600 mb-3">
              Social Media Serenity
            </p>
            <div className="flex gap-3">
              {socials.map((Icon, i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-full bg-fuchsia-100 dark:bg-zinc-900 border border-fuchsia-200 dark:border-zinc-800 flex items-center justify-center hover:bg-fuchsia-500 hover:text-white transition-colors cursor-pointer"
                >
                  <Icon size={18} strokeWidth={2} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL - DARK FORM */}
        <div className="relative flex items-center justify-center p-10 md:p-16 bg-zinc-900/90 dark:bg-zinc-100/90 overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_bottom_left,rgba(217,70,239,0.4),transparent_50%)]" />
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-fuchsia-600/20 rounded-full blur-3xl" />

          <div className="relative z-10 w-full max-w-md">
            <h2 className="font-display text-lg font-semibold text-white dark:text-black">
              Send Me A Message
            </h2>
            <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
              Fill out the form and I&apos;ll get back to you personally, as
              quickly as I can.
            </p>

            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-display block text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-2">
                    First Name
                  </Label>
                  <Input
                    type="text"
                    placeholder="Enter first name"
                    className="w-full px-4 py-3 bg-zinc-900 dark:bg-zinc-100 border border-zinc-800 dark:border-zinc-200 text-white dark:text-black placeholder-zinc-400 outline-none focus:border-fuchsia-500 transition-colors text-sm"
                  />
                </div>
                <div>
                  <label className="font-display block text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-2">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    className="w-full px-4 py-3 bg-zinc-900 dark:bg-zinc-100 border border-zinc-800 dark:border-zinc-200 text-white dark:text-black placeholder-zinc-400 outline-none focus:border-fuchsia-500 transition-colors text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="font-display block text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-2">
                  Subject
                </label>
                <Input
                  type="text"
                  placeholder="What's this about?"
                  className="w-full px-4 py-3 bg-zinc-900 dark:bg-zinc-100 border border-zinc-800 dark:border-zinc-200 text-white dark:text-black placeholder-zinc-400 outline-none focus:border-fuchsia-500 transition-colors text-sm"/>
              </div>

              <div>
                <Label className="font-display block text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-2">
                  Message
                </Label>
                <textarea
                  rows={5}
                  placeholder="Write your message here..."
                  className="w-full px-4 py-3 rounded-md bg-zinc-900 dark:bg-zinc-100 border border-zinc-800 dark:border-zinc-200 text-white dark:text-black placeholder-zinc-600 outline-none resize-none focus:border-fuchsia-500 transition-colors text-sm"
                />
              </div>

              <Label className="flex items-center gap-2 text-xs text-zinc-500 cursor-pointer">
                <Input
                  type="checkbox"
                  className="w-4 h-4 rounded accent-fuchsia-500"
                />
                Send me your newsletter
              </Label>

              <Button variant="shoe" className="w-full">
                Send Message
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}