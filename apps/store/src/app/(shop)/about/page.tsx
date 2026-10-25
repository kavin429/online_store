"use client"

import { Card } from "@online-store/ui/card";
import { Button } from "@online-store/ui/button";
import { Rocket, Handshake, Globe2 } from "lucide-react";

export default function AboutPage() {
  const stats = [
    {
      number: "10K+",
      label: "Happy Customers",
    },
    {
      number: "5K+",
      label: "Products Available",
    },
    {
      number: "99%",
      label: "Customer Satisfaction",
    },
    {
      number: "24/7",
      label: "Support Service",
    },
  ];

  const values = [
    {
      icon: Rocket,
      title: "Innovation",
      description:
        "We continuously improve our ecommerce platform with modern technologies and user-friendly experiences.",
    },
    {
      icon: Handshake,
      title: "Customer First",
      description:
        "Every service and product is designed to provide the best shopping experience for our customers.",
    },
    {
      icon: Globe2,
      title: "Growth & Impact",
      description:
        "GrowMore Solutions supports businesses and customers by building reliable digital commerce solutions.",
    },
  ];

  const team = [
    {
      name: "John Fernando",
      role: "Founder & CEO",
      image:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1200&auto=format&fit=crop",
    },
    {
      name: "Amanda Silva",
      role: "Marketing Director",
      image:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1200&auto=format&fit=crop",
    },
    {
      name: "Michael Perera",
      role: "Lead Developer",
      image:
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=1200&auto=format&fit=crop",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-fuchsia-50 via-white to-amber-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-black text-zinc-900 dark:text-white overflow-hidden font-body">
      {/* HERO SECTION */}
      <section className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,fuchsia,transparent_40%)] opacity-10" />

        <div className="max-w-7xl mx-auto px-6 py-24 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* LEFT CONTENT */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-fuchsia-100 dark:bg-fuchsia-900/40 text-fuchsia-600 dark:text-fuchsia-300 text-sm font-semibold mb-6 font-display">
                About GrowMore Solutions
              </div>

              <h1 className="font-display text-5xl md:text-7xl font-bold leading-tight mb-6">
                Building Modern
                <span className="text-fuchsia-500"> Ecommerce</span>
              </h1>

              <p className="text-lg text-zinc-600 dark:text-zinc-300 leading-relaxed mb-8 max-w-xl">
                GrowMore Solutions is a modern ecommerce company focused on delivering premium online shopping experiences, innovative digital commerce solutions, and customer-focused services.
              </p>

              <div className="flex flex-wrap gap-4">
                <Button variant="shoe"
                className="font-display transition-colors text-white px-8 py-4 rounded-2xl font-semibold shadow-lg">
                  Explore Store
                </Button>

                <Button variant="outline"
                className="font-display border border-fuchsia-300 hover:bg-fuchsia-100 dark:hover:bg-zinc-800 transition-colors px-8 py-4 rounded-2xl font-semibold">
                  Contact Us
                </Button>
              </div>
            </div>

            {/* RIGHT IMAGE */}
            <div className="relative">
              <div className="absolute -top-10 -left-10 w-48 h-48 bg-fuchsia-400/20 rounded-full blur-3xl" />

              <img
                src="https://images.unsplash.com/photo-1556740749-887f6717d7e4?q=80&w=1200&auto=format&fit=crop"
                alt="About GrowMore"
                className="rounded-[10px] shadow-2xl w-full h-[550px] object-cover relative z-10"
              />

              <Card className="absolute bottom-8 left-8 bg-white dark:bg-zinc-900 shadow-2xl p-6 z-20 max-w-xs">
                <div className="font-display text-2xl font-bold text-fuchsia-500 mb-2">
                  Since 2024
                </div>

                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-sm">
                  Delivering innovative online shopping experiences for customers worldwide.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* STATS SECTION */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((item, index) => (
            <Card
              key={index}
              className="bg-white dark:bg-zinc-900 border border-fuchsia-100 dark:border-zinc-800 p-8 text-center shadow-lg hover:shadow-2xl transition-all"
            >
              <div className="font-display text-2xl md:text-3xl font-bold text-fuchsia-500 mb-3">
                {item.number}
              </div>

              <p className="text-zinc-600 dark:text-zinc-400 font-medium">
                {item.label}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* OUR STORY */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <img
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200&auto=format&fit=crop"
              alt="Our Story"
              className="rounded-[10px] shadow-2xl w-full h-[500px] object-cover"
            />
          </div>

          <div>
            <div className="font-display text-fuchsia-500 font-semibold text-lg mb-4">
              OUR STORY
            </div>

            <h2 className="font-display text-4xl md:text-5xl font-bold leading-tight mb-6">
              Empowering Businesses Through Technology
            </h2>

            <p className="text-zinc-600 dark:text-zinc-400 text-lg leading-relaxed mb-6">
              GrowMore Solutions started with a vision to create a modern and reliable ecommerce platform where customers can shop confidently and businesses can grow digitally.
            </p>

            <p className="text-zinc-600 dark:text-zinc-400 text-lg leading-relaxed mb-8">
              Today, we continue to expand our product collections, improve customer experiences, and innovate digital commerce solutions with passion and dedication.
            </p>

            <Button variant="shoe">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* VALUES SECTION */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <div className="font-display text-fuchsia-500 font-semibold text-lg mb-4">
            OUR VALUES
          </div>

          <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
            What Makes Us Different
          </h2>

          <p className="max-w-3xl mx-auto text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
            We believe in innovation, trust, customer satisfaction, and building long-term digital commerce success.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {values.map((value, index) => {
            const Icon = value.icon;
            return (
              <Card
                key={index}
                className="border-fuchsia-100 dark:border-zinc-800  p-8 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-2xl bg-fuchsia-100 dark:bg-fuchsia-900/40 flex items-center justify-center mb-6">
                  <Icon
                    size={26}
                    strokeWidth={2}
                    className="text-fuchsia-600 dark:text-fuchsia-400"
                  />
                </div>

                <h3 className="font-display text-2xl font-semibold mb-4">
                  {value.title}
                </h3>

                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {value.description}
                </p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* TEAM SECTION */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <div className="font-display text-fuchsia-500 font-semibold text-lg mb-4">
            OUR TEAM
          </div>

          <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
            Meet The Experts
          </h2>

          <p className="max-w-3xl mx-auto text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Our passionate team works together to create amazing ecommerce experiences for our customers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {team.map((member, index) => (
            <Card
              key={index}
              className="group border-fuchsia-100 dark:border-zinc-800 overflow-hidden shadow-lg hover:shadow-2xl transition-all"
            >
              <div className="overflow-hidden">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-[350px] object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>

              <div className="p-4 text-center">
                <h3 className="font-display text-lg font-semibold">
                  {member.name}
                </h3>

                <p className="text-fuchsia-500 font-semibold text-md">
                  {member.role}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <Card className="bg-gradient-to-r from-fuchsia-500 via-amber-500 to-fuchsia-600 p-10 md:p-16 text-white shadow-2xl text-center">
          <div className="font-display absolute top-0 right-0 text-[220px] opacity-10 font-bold leading-none">
            GROW
          </div>

          <div className="relative z-10 max-w-4xl mx-auto">
            <h2 className="font-display text-2xl md:text-6xl  font-bold mb-6 leading-tight">
              Let&apos;s Build The Future Of Ecommerce Together
            </h2>

            <p className="text-fuchsia-100 text-md md:text-xl leading-relaxed mb-10 max-w-3xl mx-auto">
              Join GrowMore Solutions and experience modern digital shopping, innovative commerce solutions, and customer-focused technology.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Button variant="shoe" >
              Start Shopping
              </Button>

              <Button variant="default">
                Contact Team
              </Button>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}