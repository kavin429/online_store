"use client";

import React, { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { Card } from "@online-store/ui/card";
import Link from "next/link";

type Category = {
  id: number;
  name: string;
  imageUrl: string | null;
};

export default function CategoriesSliderPage() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories");
        const data = await res.json();
        setCategories(data);
      } catch (err) {
        console.error("Failed to load categories", err);
      }
    };

    fetchCategories();
  }, []);

  const loopingCategories = [...categories, ...categories];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-center">
        Shop by Category
      </h1>

      <div className="relative overflow-hidden py-2">
        <div className="flex gap-4 animate-scroll-left">
          {loopingCategories.map((category, index) => (
            <Link
              key={`${category.id}-${index}`}
              href={`/categories/${category.id}`}
              className="flex-shrink-0 w-[300px]"
            >
              <Card className="grid grid-cols-2 items-center gap-2">
                <div className="w-full flex items-center justify-center">
                  <img
                    src={category.imageUrl || "/placeholder.png"}
                    alt={category.name}
                    className="w-full h-[100px] object-cover rounded-xl"
                  />
                </div>

                <div className="flex flex-col justify-center">
                  <h3 className="font-semibold text-md truncate">
                    {category.name}
                  </h3>

                  <span className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 mt-1">
                    Shop now
                    <span className="ml-2 flex items-center justify-center w-6 h-6 rounded-full bg-fuchsia-500 dark:bg-fuchsia-700">
                      <ChevronRight className="h-4 w-4 text-white" />
                    </span>
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}