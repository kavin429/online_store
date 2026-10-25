"use client";

import { useState, useEffect, useRef } from "react";
import {
  Leaf, Phone, Mail, MapPin,
  Twitter, Linkedin, Youtube, Instagram,
  Truck, RotateCcw, Lock, Send,
  ShoppingCart, FileText, Shield, Cookie, Accessibility,
} from "lucide-react";
import { Button } from "@online-store/ui/button";

/* ─────────────────────────────────────────
   DATA
───────────────────────────────────────── */
const trustItems = [
  { icon: <Leaf size={15} />, label: "100% Organic" },
  { icon: <Truck size={15} />, label: "Free Shipping ₹499+" },
  { icon: <RotateCcw size={15} />, label: "Easy Returns" },
  { icon: <Lock size={15} />, label: "Secure Checkout" },
];

const shopLinks = ["Fresh Produce", "Organic Grocery", "Seasonal Picks", "Bundle Deals", "New Arrivals"];
const helpLinks = ["Track Your Order", "Returns & Refunds", "Shipping Policy", "FAQs", "Support Center"];
const companyLinks = ["About GrowMore", "Our Story", "Careers", "Press & Media", "Contact Us"];

const socialIcons = [
  { icon: <Twitter size={14} />, label: "Twitter" },
  { icon: <Linkedin size={14} />, label: "LinkedIn" },
  { icon: <Youtube size={14} />, label: "YouTube" },
  { icon: <Instagram size={14} />, label: "Instagram" },
];

const legalLinks = [
  { icon: <FileText size={11} />, label: "Terms of Service" },
  { icon: <Shield size={11} />, label: "Privacy Policy" },
  { icon: <Cookie size={11} />, label: "Cookie Policy" },
  { icon: <Accessibility size={11} />, label: "Accessibility" },
];

/* ─────────────────────────────────────────
   ANIMATION HOOK
───────────────────────────────────────── */
function useFadeIn() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

/* ─────────────────────────────────────────
   LINK COLUMN
───────────────────────────────────────── */
function LinkColumn({ title, links, delay = 0 }: { title: string; links: string[]; delay?: number }) {
  const { ref, visible } = useFadeIn();
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(22px)",
        transition: `opacity 0.55s ${delay}ms ease, transform 0.55s ${delay}ms ease`,
      }}
    >
      <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-fuchsia-500 mb-[18px]">
        {title}
      </p>
      <ul className="list-none p-0 m-0">
        {links.map((label: string) => (
          <li key={label} className="mb-[11px]">
            <a
              href="#"
              className="text-[13px] text-gray-500 dark:text-gray-400 no-underline transition-colors duration-[180ms] hover:text-fuchsia-500 dark:hover:text-fuchsia-400"
            >
              {label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
export default function GrowMoreFooter() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const brandFade = useFadeIn();
  const newsletterFade = useFadeIn();
  const appFade = useFadeIn();
  const bottomFade = useFadeIn();

  const subscribe = () => {
    if (email.trim()) { setSubscribed(true); setEmail(""); }
  };

  return (
    <>
      {/* ── Global CSS (animations only) ── */}
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; transition: none !important; }
        }
        @keyframes leafFloat {
          0%, 100% { transform: rotate(-12deg) translateY(0px); }
          50%       { transform: rotate(6deg)  translateY(-3px); }
        }
        @keyframes subtlePulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.65; }
        }
        @keyframes fadeInTrust {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .gm-leaf-icon { animation: leafFloat 5s ease-in-out infinite; display: inline-block; }
        .gm-pulse     { animation: subtlePulse 2.5s ease-in-out infinite; }
      `}</style>

      {/* ── Trust Bar ── */}
      <div className="bg-fuchsia-50 dark:bg-fuchsia-950 border-t border-fuchsia-100 dark:border-fuchsia-900 px-8 py-[14px]">
        <div className="max-w-[1100px] mx-auto grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
          {trustItems.map(({ icon, label }, i) => (
            <div
              key={label}
              className="flex items-center gap-[10px]"
              style={{ opacity: 0, animation: `fadeInTrust 0.5s ${i * 80}ms ease forwards` }}
            >
              <div className="w-9 h-9 rounded-full border border-fuchsia-100 dark:border-fuchsia-800 flex items-center justify-center text-fuchsia-500 dark:text-fuchsia-400 shrink-0 bg-fuchsia-50 dark:bg-fuchsia-900">
                {icon}
              </div>
              <span className="text-xs font-semibold text-fuchsia-700 dark:text-fuchsia-300">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Wave (trust → footer, seamless) ── */}
      <div className="bg-fuchsia-50 dark:bg-fuchsia-950 leading-none -mb-[2px]">
        <svg viewBox="0 0 1440 54" preserveAspectRatio="none" className="w-full h-[16px] block">
          <defs>
            <linearGradient id="waveGrad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgb(253 244 255)" className="dark:[stop-color:rgb(74_4_78)]" />
              <stop offset="100%" stopColor="rgb(255 255 255)" className="dark:[stop-color:rgb(9_9_11)]" />
            </linearGradient>
          </defs>
          <path
            d="M0,28 C200,52 380,4 600,28 C820,52 1040,6 1200,24 C1320,36 1390,18 1440,28 L1440,54 L0,54 Z"
            fill="url(#waveGrad)"
          />
          <path
            d="M0,38 C240,18 480,50 720,30 C960,12 1200,46 1440,34 L1440,54 L0,54 Z"
            fill="white"
            fillOpacity="0.6"
            className="dark:fill-[rgb(9,9,11)]"
          />
        </svg>
      </div>

      {/* ── Main Footer ── */}
      <footer className="bg-white dark:bg-zinc-950 px-8">
        <div className="max-w-[1100px] mx-auto">

          {/* Grid */}
          <div
            className="grid gap-10 pt-[10px] pb-12"
            style={{ gridTemplateColumns: "2.2fr 1fr 1fr 1fr 1.5fr" }}
          >

            {/* ── Brand ── */}
            <div
              ref={brandFade.ref}
              style={{
                opacity: brandFade.visible ? 1 : 0,
                transform: brandFade.visible ? "translateY(0)" : "translateY(24px)",
                transition: "opacity 0.6s ease, transform 0.6s ease",
              }}
            >
              {/* Logo */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-[13px] bg-gradient-to-br from-fuchsia-700 to-[#1a3a2a] flex items-center justify-center relative shrink-0 shadow-[0_4px_16px_rgba(192,36,237,0.25)]">
                  <span className="gm-leaf-icon text-fuchsia-200">
                    <Leaf size={20} />
                  </span>
                  <span className="gm-pulse absolute -top-[3px] -right-[3px] w-[9px] h-[9px] rounded-full bg-fuchsia-400 border-2 border-white dark:border-zinc-950" />
                </div>
                <div>
                  <p className="text-[22px] font-extrabold tracking-tight leading-none m-0 text-gray-900 dark:text-white">
                    Grow<span className="text-fuchsia-500">More</span>
                  </p>
                  <p className="text-[9px] tracking-[0.2em] uppercase text-fuchsia-400 font-bold mt-[3px] mb-0">
                    Online Store
                  </p>
                </div>
              </div>

              <p className="text-[13px] leading-[1.75] text-gray-400 dark:text-gray-500 max-w-[270px] mb-[18px]">
                Farm-fresh organic produce, groceries, and everyday essentials — grown with care, delivered with love.
              </p>

              <div className="mb-5">
                {[
                  { icon: <Phone size={12} />, text: "+91 1800 000 000" },
                  { icon: <Mail size={12} />, text: "hello@growmore.in" },
                  { icon: <MapPin size={12} />, text: "Bengaluru, Karnataka 560001" },
                ].map(({ icon, text }) => (
                  <a
                    key={text}
                    className="flex items-center gap-2 text-[12.5px] text-gray-400 dark:text-gray-500 cursor-pointer transition-colors duration-[180ms] hover:text-fuchsia-500 dark:hover:text-fuchsia-400 mb-2 no-underline"
                  >
                    {icon} {text}
                  </a>
                ))}
              </div>

              <div className="flex gap-2">
                {socialIcons.map(({ icon, label }) => (
                  <button
                    key={label}
                    aria-label={label}
                    className="w-9 h-9 rounded-[9px] border border-gray-200 dark:border-zinc-700 flex items-center justify-center text-gray-400 dark:text-gray-500 cursor-pointer bg-transparent transition-all duration-200 hover:bg-fuchsia-50 dark:hover:bg-fuchsia-950 hover:border-fuchsia-300 dark:hover:border-fuchsia-700 hover:text-fuchsia-500 dark:hover:text-fuchsia-400 hover:-translate-y-[2px]"
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Columns ── */}
            <LinkColumn title="Shop" links={shopLinks} delay={60} />
            <LinkColumn title="Help" links={helpLinks} delay={120} />
            <LinkColumn title="Company" links={companyLinks} delay={180} />

            {/* ── Newsletter ── */}
            <div
              ref={newsletterFade.ref}
              style={{
                opacity: newsletterFade.visible ? 1 : 0,
                transform: newsletterFade.visible ? "translateY(0)" : "translateY(22px)",
                transition: "opacity 0.55s 240ms ease, transform 0.55s 240ms ease",
              }}
            >
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-fuchsia-500 mb-[18px]">
                Stay Updated
              </p>
              <p className="text-[12.5px] text-gray-400 dark:text-gray-500 leading-[1.7] mb-[14px]">
                Weekly deals, seasonal drops, and organic tips — straight to your inbox.
              </p>

              {subscribed ? (
                <div className="rounded-[10px] bg-fuchsia-50 dark:bg-fuchsia-950 border border-fuchsia-100 dark:border-fuchsia-900 px-4 py-3 text-[13px] text-fuchsia-700 dark:text-fuchsia-300 text-center">
                  ✓ You&apos;re subscribed!
                </div>
              ) : (
                <>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && subscribe()}
                    className="w-full box-border px-[13px] py-[10px] rounded-[10px] border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900 text-[13px] text-gray-900 dark:text-gray-100 outline-none mb-2 transition-colors duration-200 focus:border-fuchsia-300 dark:focus:border-fuchsia-700 focus:bg-white dark:focus:bg-zinc-800 placeholder:text-fuchsia-300 dark:placeholder:text-fuchsia-800 font-[inherit]"
                  />
                  <Button
                    onClick={subscribe}
                    variant="shoe"
                    className="w-full py-[10px] rounded-[10px]  text-[13px] font-semibold border-none flex items-center justify-center gap-[7px] cursor-pointer transition-all duration-200 hover:scale-[1.02]"
                  >
                    <Send size={12} /> Subscribe
                  </Button>
                  <p className="text-[10.5px] text-fuchsia-300 dark:text-fuchsia-800 mt-2">
                    No spam. Unsubscribe anytime.
                  </p>
                </>
              )}
            </div>
          </div>

          {/* ── App Strip ── */}
          <div
            ref={appFade.ref}
            className="rounded-[12px] border border-fuchsia-100 dark:border-fuchsia-900 bg-fuchsia-50 dark:bg-fuchsia-950 px-6 py-4 flex items-center justify-between gap-4 mb-7 flex-wrap"
            style={{
              opacity: appFade.visible ? 1 : 0,
              transform: appFade.visible ? "translateY(0)" : "translateY(16px)",
              transition: "opacity 0.5s 0.3s ease, transform 0.5s 0.3s ease",
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-[38px] h-[38px] rounded-[10px] shrink-0 bg-fuchsia-100 dark:bg-fuchsia-900 flex items-center justify-center text-fuchsia-500 dark:text-fuchsia-400">
                <ShoppingCart size={17} />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-gray-800 dark:text-gray-100 m-0">
                  Shop smarter on the app
                </p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-[2px] mb-0">
                  Exclusive app-only deals every week
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {[{ label: "App Store" }, { label: "Google Play" }].map(({ label }) => (
                <button
                  key={label}
                  className="flex items-center gap-[7px] px-[14px] py-2 rounded-[9px] border border-gray-200 dark:border-zinc-700 bg-transparent text-[11px] font-medium text-gray-700 dark:text-gray-300 cursor-pointer transition-all duration-200 hover:border-fuchsia-300 dark:hover:border-fuchsia-700 hover:bg-fuchsia-50 dark:hover:bg-fuchsia-950 hover:scale-[1.03]"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Divider wave into bottom bar ── */}
          <div className="leading-none -mx-8 overflow-hidden">
            <svg viewBox="0 0 1440 18" preserveAspectRatio="none" className="w-full h-[18px] block">
              <path
                d="M0,9 C360,18 720,0 1080,10 C1260,14 1380,5 1440,9 L1440,18 L0,18 Z"
                fill="rgb(249 250 251)"
                className="dark:fill-zinc-900"
              />
            </svg>
          </div>

          {/* ── Bottom Bar ── */}
          <div
            ref={bottomFade.ref}
            className="bg-gray-50 dark:bg-zinc-900 -mx-8 px-8 py-[14px] flex items-center justify-between flex-wrap gap-3"
            style={{
              opacity: bottomFade.visible ? 1 : 0,
              transition: "opacity 0.5s 0.4s ease",
            }}
          >
            <span className="text-[11px] text-gray-400 dark:text-gray-500">
              © {new Date().getFullYear()} GrowMore Technologies Pvt. Ltd. All rights reserved.
            </span>
            <div className="flex flex-wrap gap-5">
              {legalLinks.map(({ icon, label }) => (
                <a
                  key={label}
                  href="#"
                  className="flex items-center gap-[5px] text-[11px] text-gray-400 dark:text-gray-500 no-underline transition-colors duration-[180ms] hover:text-fuchsia-500 dark:hover:text-fuchsia-400"
                >
                  {icon} {label}
                </a>
              ))}
            </div>
          </div>

        </div>
      </footer>


    </>
  );
}