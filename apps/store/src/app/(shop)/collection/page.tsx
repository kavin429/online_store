import { prisma } from "@/lib/prisma";
import { getActiveOffers, type LandingOffer } from "@/lib/offers";
import CollectionClient, {
  type CollectionIconKey,
  type CollectionItem,
  type CollectionStat,
} from "./collection-client";

// Categories, product counts and offers change from the admin/vendor apps, so
// always read fresh data instead of freezing the page at build time.
export const dynamic = "force-dynamic";

const ACCENTS = [
  "from-fuchsia-500 to-pink-500",
  "from-violet-500 to-fuchsia-500",
  "from-fuchsia-400 to-purple-500",
  "from-pink-500 to-fuchsia-600",
  "from-fuchsia-600 to-violet-600",
  "from-purple-500 to-fuchsia-500",
];

function iconKeyFor(name: string): CollectionIconKey {
  const value = name.toLowerCase();

  if (/(electronic|gadget|phone|computer|laptop|tech)/.test(value)) {
    return "electronics";
  }
  if (/(beauty|care|cosmetic|skin|health|wellness)/.test(value)) {
    return "beauty";
  }
  if (/(sport|fitness|gym|outdoor)/.test(value)) {
    return "sports";
  }
  if (/(home|living|furniture|kitchen|garden)/.test(value)) {
    return "home";
  }
  if (/(accessor|watch|jewel|bag|shoe)/.test(value)) {
    return "accessories";
  }
  return "fashion";
}

function formatCompact(value: number) {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M+`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}K+`;
  }
  return String(value);
}

export default async function CollectionPage() {
  // Only products that are actually purchasable should be counted, matching
  // the storefront product listing.
  const inStockWhere = {
    OR: [
      { stock: { gt: 0 } },
      { variants: { some: { stock: { gt: 0 } } } },
    ],
  };

  const [categoriesResult, statsResult, offersResult] = await Promise.allSettled([
    prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        subcategories: {
          select: { name: true },
          orderBy: { name: "asc" },
        },
        _count: {
          select: {
            products: { where: inStockWhere },
          },
        },
      },
    }),
    Promise.all([
      prisma.product.count({ where: inStockWhere }),
      prisma.review.aggregate({
        where: { status: "VISIBLE" },
        _avg: { rating: true },
      }),
      prisma.user.count({ where: { orders: { some: {} } } }),
      prisma.product.aggregate({
        where: inStockWhere,
        _max: { discountPercent: true },
      }),
    ]),
    getActiveOffers({ landingOnly: true, limit: 2 }),
  ]);

  let collections: CollectionItem[] = [];
  let stats: CollectionStat[] = [];
  let offers: LandingOffer[] = [];

  if (categoriesResult.status === "fulfilled") {
    // The admin app creates categories as PENDING and has no approval step,
    // so the storefront mirrors /categories and shows every category.
    collections = categoriesResult.value.map((category, index) => {
      const icon = iconKeyFor(category.name);
      const subcategoryNames = category.subcategories
        .map((subcategory) => subcategory.name)
        .filter(Boolean);

      return {
        id: category.id,
        title: category.name,
        subtitle:
          subcategoryNames.length > 0
            ? `Explore ${subcategoryNames.slice(0, 3).join(", ")}`
            : `Explore our ${category.name} collection`,
        image: category.image
          ? `data:image/png;base64,${Buffer.from(category.image).toString(
              "base64"
            )}`
          : null,
        count: String(category._count.products),
        accent: ACCENTS[index % ACCENTS.length],
        icon,
      };
    });
  } else {
    console.error("FETCH COLLECTIONS ERROR:", categoriesResult.reason);
  }

  if (statsResult.status === "fulfilled") {
    const [productCount, reviewAggregate, customerCount, discountAggregate] =
      statsResult.value;
    const averageRating = reviewAggregate._avg.rating ?? 0;
    const maxDiscount = discountAggregate._max.discountPercent ?? 0;

    stats = [
      {
        key: "products",
        value: formatCompact(productCount),
        label: "Products",
      },
      {
        key: "rating",
        value: averageRating > 0 ? averageRating.toFixed(1) : "—",
        label: "Avg Rating",
      },
      {
        key: "customers",
        value: formatCompact(customerCount),
        label: "Happy Customers",
      },
      {
        key: "discount",
        value: `${Math.round(maxDiscount)}%`,
        label: "Max Discount",
      },
    ];
  } else {
    console.error("FETCH COLLECTION STATS ERROR:", statsResult.reason);
  }

  if (offersResult.status === "fulfilled") {
    offers = offersResult.value;
  } else {
    console.error("FETCH COLLECTION OFFERS ERROR:", offersResult.reason);
  }

  return (
    <CollectionClient
      collections={collections}
      stats={stats}
      offers={offers}
    />
  );
}
