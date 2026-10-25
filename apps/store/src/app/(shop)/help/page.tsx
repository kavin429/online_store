"use client"

import { Card } from "@online-store/ui/card";
import { Button } from "@online-store/ui/button";
import {
  Package,
  CreditCard,
  RefreshCw,
  User,
  Store,
  Wrench,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";

export default function HelpPage() {
  const helpCards = [
    {
      title: "Track Your Orders",
      description:
        "View live order updates, shipping progress, and delivery details anytime.",
      icon: Package,
    },
    {
      title: "Payments & Billing",
      description:
        "Get help with online payments, invoices, refunds, and checkout issues.",
      icon: CreditCard,
    },
    {
      title: "Returns & Refunds",
      description:
        "Easy product return requests and fast refund support for customers.",
      icon: RefreshCw,
    },
    {
      title: "Account Support",
      description:
        "Manage profile settings, passwords, wishlist, and saved addresses.",
      icon: User,
    },
    {
      title: "Seller Assistance",
      description:
        "Support for vendors, inventory management, and store partnerships.",
      icon: Store,
    },
    {
      title: "Technical Help",
      description:
        "Need website or app support? Our technical team is ready to help.",
      icon: Wrench,
    },
  ];

  const faqs = [
    {
      question: "How can I track my order?",
      answer:
        "Go to your orders page and click on the tracking section to see delivery updates.",
    },
    {
      question: "How do refunds work?",
      answer:
        "Refunds are processed after product verification and usually arrive within 3-7 business days.",
    },
    {
      question: "Can I cancel an order?",
      answer: "Yes, orders can be cancelled before shipping confirmation.",
    },
    {
      question: "How can I contact support?",
      answer: "Use the contact form or live chat available below.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-fuchsia-50 via-white to-amber-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-black text-zinc-900 dark:text-white font-body">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,fuchsia,transparent_40%)] opacity-10" />

        <div className="max-w-7xl mx-auto px-6 py-24 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-fuchsia-100 dark:bg-fuchsia-900/40 text-fuchsia-600 dark:text-fuchsia-300 text-sm font-semibold mb-6 font-display">
            GrowMore Solutions Support Center
          </div>

          <h1 className="font-display text-5xl md:text-6xl font-bold leading-tight mb-6">
            How Can We
            <span className="text-fuchsia-500"> Help You?</span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg text-zinc-600 dark:text-zinc-300 mb-10">
            Welcome to the GrowMore Solutions Help Center. We provide modern ecommerce support for customers, sellers, and businesses using our online store platform.
          </p>

          {/* SEARCH BAR */}
          <Card className="max-w-2xl mx-auto flex items-center border border-fuchsia-200 dark:border-zinc-700 shadow-lg overflow-hidden p-0">
            <input
              type="text"
              placeholder="Search help topics..."
              className="w-full px-6 py-5 bg-transparent outline-none text-base"
            />

            <Button
              variant="shoe"
              className="font-display rounded-none px-8 py-5 h-full font-semibold"
            >
              Search
            </Button>
          </Card>
        </div>
      </section>

      {/* HELP CARDS */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {helpCards.map((item, index) => {
            const Icon = item.icon;
            return (
              <Card
                key={index}
                className="group border-fuchsia-100 dark:border-zinc-800 p-8 shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-2xl bg-fuchsia-100 dark:bg-fuchsia-900/40 flex items-center justify-center mb-6">
                  <Icon
                    size={26}
                    strokeWidth={2}
                    className="text-fuchsia-600 dark:text-fuchsia-400"
                  />
                </div>

                <h3 className="font-display text-2xl font-semibold mb-3 group-hover:text-fuchsia-500 transition-colors">
                  {item.title}
                </h3>

                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {item.description}
                </p>

                <button className="font-display mt-6 text-fuchsia-500 font-semibold hover:underline">
                  Learn More →
                </button>
              </Card>
            );
          })}
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="font-display text-4xl font-bold mb-4">
            Frequently Asked Questions
          </h2>

          <p className="text-zinc-600 dark:text-zinc-400">
            Quick answers for our customers and sellers.
          </p>
        </div>

        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <Card
              key={index}
              className="border-fuchsia-100 dark:border-zinc-800 p-6 shadow-sm"
            >
              <h3 className="font-display text-xl font-semibold mb-3 text-fuchsia-500">
                {faq.question}
              </h3>

              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {faq.answer}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* CONTACT SECTION */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <Card className="bg-gradient-to-r from-fuchsia-500 via-amber-500 to-fuchsia-600 p-10 md:p-16 text-white shadow-2xl">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="font-display text-4xl font-bold mb-5">
                Still Need Assistance?
              </h2>

              <p className="text-fuchsia-100 text-lg leading-relaxed mb-8">
                Our GrowMore Solutions support team is available to help customers with orders, payments, product issues, and technical support.
              </p>

              <div className="space-y-4 text-lg">
                <div className="flex items-center gap-3">
                  <Mail size={20} strokeWidth={2} />
                  <span>support@growmore.com</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone size={20} strokeWidth={2} />
                  <span>+94 77 123 4567</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin size={20} strokeWidth={2} />
                  <span>Colombo, Sri Lanka</span>
                </div>
              </div>
            </div>

            <Card className="bg-white/10 backdrop-blur-xl border border-white/20 p-8">
              <div className="space-y-5">
                <input
                  type="text"
                  placeholder="Your Name"
                  className="w-full px-5 py-4 rounded-2xl bg-white/10 border border-white/20 placeholder:text-fuchsia-100 outline-none"
                />

                <input
                  type="email"
                  placeholder="Email Address"
                  className="w-full px-5 py-4 rounded-2xl bg-white/10 border border-white/20 placeholder:text-fuchsia-100 outline-none"
                />

                <textarea
                  rows={5}
                  placeholder="How can we help you?"
                  className="w-full px-5 py-4 rounded-2xl bg-white/10 border border-white/20 placeholder:text-fuchsia-100 outline-none resize-none"
                />

                <Button
                  variant="default"
                  className="font-display w-full bg-white text-fuchsia-600 hover:bg-fuchsia-50 transition-colors font-bold py-4 rounded-2xl"
                >
                  Send Message
                </Button>
              </div>
            </Card>
          </div>
        </Card>
      </section>
    </div>
  );
}