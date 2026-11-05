"use client";

import { motion } from "framer-motion";
import { Truck, RotateCcw, ShieldCheck, Headphones } from "lucide-react";

const features = [
  {
    icon: Truck,
    title: "Free Delivery",
    description: "On orders above ₹499",
  },
  {
    icon: RotateCcw,
    title: "Easy Returns",
    description: "7-day hassle-free returns",
  },
  {
    icon: ShieldCheck,
    title: "Secure Payment",
    description: "100% protected checkout",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "We're always here to help",
  },
];

export default function FeaturesStrip() {
  return (
    <section className="relative px-4 py-10 sm:px-8 lg:px-16">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl border border-fuchsia-100 bg-gradient-to-br from-fuchsia-50 via-white to-fuchsia-50 p-3 shadow-xl shadow-fuchsia-500/10 dark:border-white/10 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900 dark:shadow-fuchsia-500/5 sm:p-4">
        {/* Soft glow */}
        <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-fuchsia-300/30 blur-3xl dark:bg-fuchsia-600/20" />

        <div className="relative grid grid-cols-2 gap-2 lg:grid-cols-4 lg:gap-0">
          {features.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`group flex flex-col items-center gap-3 rounded-2xl p-4 text-center transition-colors hover:bg-white/70 dark:hover:bg-white/5 sm:flex-row sm:text-left lg:rounded-none lg:p-5 ${
                  index !== 0
                    ? "lg:border-l lg:border-fuchsia-100 dark:lg:border-white/10"
                    : ""
                }`}
              >
                <div className="relative shrink-0">
                  <div className="absolute inset-0 rounded-2xl bg-fuchsia-500 opacity-0 blur-lg transition-opacity duration-300 group-hover:opacity-40" />
                  <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-purple-600 shadow-md shadow-fuchsia-500/30 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
                    <Icon className="h-6 w-6 text-white" strokeWidth={1.75} />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 sm:text-base">
                    {item.title}
                  </h3>
                  <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400 sm:text-sm">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}