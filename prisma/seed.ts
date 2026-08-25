import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

const DEMO_SLUG = "demo-store";

type ProductSeed = {
  name: string;
  description: string;
  price: string;
  category: string | null;
  images: string[];
  variants?: Array<{
    color?: string;
    size?: string;
    price?: string;
  }>;
  availability?: "AVAILABLE" | "UNAVAILABLE";
  status?: "ACTIVE" | "INACTIVE";
};

const products: ProductSeed[] = [
  {
    name: "هاتف ذكي Pro X",
    description: "هاتف ذكي حديث بشاشة عالية الدقة وأداء سريع للاستخدام اليومي.",
    price: "699.00",
    category: "هواتف",
    images: ["https://images.unsplash.com/photo-1511707171634-5f897ff02aa9"],
    variants: [
      { color: "أسود", size: "128GB", price: "699.00" },
      { color: "أزرق", size: "256GB", price: "749.00" },
    ],
  },

  {
    name: "هاتف ذكي Lite",
    description: "هاتف عملي وخفيف للاستخدام اليومي والتواصل.",
    price: "299.00",
    category: "هواتف",
    images: ["https://images.unsplash.com/photo-1598327105666-5b89351aff97"],
  },

  {
    name: "سماعات لاسلكية Pro",
    description: "سماعات لاسلكية بصوت واضح وعلبة شحن محمولة.",
    price: "89.00",
    category: "إكسسوارات",
    images: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944",
    ],
  },

  {
    name: "شاحن سريع USB-C",
    description: "شاحن سريع مناسب للأجهزة الحديثة.",
    price: "25.00",
    category: "إكسسوارات",
    images: ["https://images.unsplash.com/photo-1583863788434-e58a36330cf0"],
  },

  {
    name: "ساعة ذكية Active",
    description: "ساعة ذكية لمتابعة النشاط والتنبيهات اليومية.",
    price: "119.00",
    category: "إلكترونيات",
    images: ["https://images.unsplash.com/photo-1523275335684-37898b6baf30"],
    variants: [
      { color: "أسود", size: "M", price: "119.00" },
      { color: "فضي", size: "M", price: "129.00" },
    ],
  },

  {
    name: "حقيبة ظهر Urban",
    description: "حقيبة ظهر عملية للعمل والدراسة والسفر القصير.",
    price: "59.00",
    category: "ملابس",
    images: ["https://images.unsplash.com/photo-1553062407-98eeb64c6a62"],
    variants: [
      { color: "أسود", size: "M", price: "59.00" },
      { color: "رمادي", size: "L", price: "64.00" },
    ],
  },

  {
    name: "حذاء رياضي Runner",
    description: "حذاء رياضي مريح للاستخدام اليومي.",
    price: "79.00",
    category: "ملابس",
    images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff"],
    variants: [
      { color: "أبيض", size: "40", price: "79.00" },
      { color: "أسود", size: "42", price: "84.00" },
    ],
  },

  {
    name: "تيشيرت كلاسيكي",
    description: "تيشيرت قطني بتصميم بسيط ومريح.",
    price: "29.00",
    category: "ملابس",
    images: ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab"],
    variants: [
      { color: "أبيض", size: "M", price: "29.00" },
      { color: "أسود", size: "L", price: "32.00" },
    ],
  },

  {
    name: "جاكيت يومي Premium",
    description: "جاكيت أنيق مناسب للأجواء المعتدلة.",
    price: "109.00",
    category: "ملابس",
    images: ["https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3"],
    variants: [
      { color: "أسود", size: "M", price: "109.00" },
      { color: "بني", size: "L", price: "115.00" },
    ],
  },

  {
    name: "حقيبة يد أنيقة",
    description: "حقيبة يد بتصميم عصري للاستخدام اليومي.",
    price: "69.00",
    category: "ملابس",
    images: ["https://images.unsplash.com/photo-1584917865442-de89df76afd3"],
  },

  {
    name: "طقم أكواب قهوة",
    description: "طقم أكواب أنيق لمحبي القهوة.",
    price: "35.00",
    category: "منزل ومطبخ",
    images: ["https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd"],
  },

  {
    name: "مطحنة قهوة يدوية",
    description: "مطحنة يدوية مدمجة لتحضير قهوة طازجة.",
    price: "49.00",
    category: "منزل ومطبخ",
    images: ["https://images.unsplash.com/photo-1495474472287-4d71bcdd2085"],
  },

  {
    name: "غلاية كهربائية",
    description: "غلاية سريعة وأنيقة للمطبخ.",
    price: "42.00",
    category: "منزل ومطبخ",
    images: ["https://images.unsplash.com/photo-1594213114663-d94db9b171e9"],
  },

  {
    name: "خلاط مطبخ",
    description: "خلاط عملي لتحضير العصائر والوصفات اليومية.",
    price: "65.00",
    category: "منزل ومطبخ",
    images: ["https://images.unsplash.com/photo-1570222094114-d054a817e56b"],
  },

  {
    name: "مصباح مكتبي",
    description: "مصباح مكتبي بتصميم بسيط وإضاءة مريحة.",
    price: "31.00",
    category: "منزل ومطبخ",
    images: ["https://images.unsplash.com/photo-1507473885765-e6ed057f782c"],
  },

  {
    name: "منظم مكتب",
    description: "منظم أنيق للأقلام والأدوات المكتبية.",
    price: "18.00",
    category: "منزل ومطبخ",
    images: ["https://images.unsplash.com/photo-1499951360447-b19be8fe80f5"],
  },

  {
    name: "عطر Signature",
    description: "عطر أنيق بتركيبة عصرية.",
    price: "95.00",
    category: "عناية وجمال",
    images: ["https://images.unsplash.com/photo-1541643600914-78b084683601"],
  },

  {
    name: "مجموعة عناية بالبشرة",
    description: "مجموعة يومية للعناية بالبشرة.",
    price: "55.00",
    category: "عناية وجمال",
    images: ["https://images.unsplash.com/photo-1556228578-8c89e6adf883"],
  },

  {
    name: "كريم مرطب",
    description: "مرطب يومي بتركيبة خفيفة.",
    price: "24.00",
    category: "عناية وجمال",
    images: ["https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd"],
  },

  {
    name: "نظارة شمسية Classic",
    description: "نظارة شمسية بتصميم كلاسيكي.",
    price: "45.00",
    category: "إكسسوارات",
    images: ["https://images.unsplash.com/photo-1511499767150-a48a237f0083"],
  },

  {
    name: "محفظة جلدية",
    description: "محفظة عملية بتصميم أنيق.",
    price: "39.00",
    category: "إكسسوارات",
    images: ["https://images.unsplash.com/photo-1627123424574-724758594e93"],
  },

  {
    name: "سماعة مكتب USB",
    description: "سماعة مكتبية للمكالمات والاجتماعات.",
    price: "39.00",
    category: "إلكترونيات",
    images: ["https://images.unsplash.com/photo-1583394838336-acd977736f90"],
  },

  {
    name: "لوحة مفاتيح ميكانيكية",
    description: "لوحة مفاتيح مريحة للكتابة والعمل.",
    price: "99.00",
    category: "إلكترونيات",
    images: ["https://images.unsplash.com/photo-1587829741301-dc798b83add3"],
  },

  {
    name: "ماوس لاسلكي",
    description: "ماوس لاسلكي مريح للعمل اليومي.",
    price: "35.00",
    category: "إلكترونيات",
    images: ["https://images.unsplash.com/photo-1527814050087-3793815479db"],
  },

  {
    name: "شاشة 27 بوصة",
    description: "شاشة كبيرة مناسبة للعمل والترفيه.",
    price: "249.00",
    category: "إلكترونيات",
    images: ["https://images.unsplash.com/photo-1527443224154-c4a3942d3acf"],
  },

  {
    name: "حامل هاتف مكتبي",
    description: "حامل ثابت للهاتف على المكتب.",
    price: "15.00",
    category: "عروض",
    images: ["https://images.unsplash.com/photo-1586953208448-b95a79798f07"],
  },

  {
    name: "حامل لابتوب",
    description: "حامل لابتوب لتحسين وضعية العمل.",
    price: "44.00",
    category: "عروض",
    images: ["https://images.unsplash.com/photo-1527443154391-507e9dc6c5cc"],
  },

  {
    name: "مصباح LED محمول",
    description: "مصباح صغير قابل للحمل للاستخدامات المتنوعة.",
    price: "22.00",
    category: "عروض",
    images: ["https://images.unsplash.com/photo-1504198453319-5ce911bafcde"],
    availability: "UNAVAILABLE",
  },

  {
    name: "زجاجة ماء حرارية",
    description: "زجاجة حرارية للاستخدام اليومي.",
    price: "28.00",
    category: "عروض",
    images: ["https://images.unsplash.com/photo-1602143407151-7111542de6e8"],
  },

  {
    name: "دفتر ملاحظات Premium",
    description: "دفتر ملاحظات أنيق للعمل والدراسة.",
    price: "12.00",
    category: "عروض",
    images: ["https://images.unsplash.com/photo-1517842645767-c639042777db"],
  },

  {
    name: "منتج تجريبي بدون فئة",
    description: "هذا المنتج مخصص لاختبار حالة المنتج غير المصنف في الواجهة.",
    price: "17.00",
    category: null,
    images: ["https://images.unsplash.com/photo-1523275335684-37898b6baf30"],
  },
];

async function main() {
  console.log("🌱 Starting Dalalti demo seed...");

  /*
   * ------------------------------------------------------------
   * 1. Demo Owner
   * ------------------------------------------------------------
   */

  const owner = await prisma.user.upsert({
    where: {
      email: "demo@dalalti.local",
    },
    update: {
      name: "Dalalti Demo Owner",
      phone: "967700000001",
      role: "STORE_OWNER",
    },
    create: {
      name: "Dalalti Demo Owner",
      phone: "967700000001",
      email: "demo@dalalti.local",
      passwordHash: "DEMO_ONLY_NOT_FOR_LOGIN",
      role: "STORE_OWNER",
    },
  });

  console.log("✓ Demo owner");

  /*
   * ------------------------------------------------------------
   * 2. Demo Store
   * ------------------------------------------------------------
   */

  const store = await prisma.store.upsert({
    where: {
      slug: DEMO_SLUG,
    },
    update: {
      ownerId: owner.id,
      name: "Dalalti Demo Store",
      description: "متجر تجريبي لاختبار واجهة Dalalti Storefront.",
      phone: "967700000001",
      status: "ACTIVE",
    },
    create: {
      ownerId: owner.id,
      name: "Dalalti Demo Store",
      slug: DEMO_SLUG,
      description: "متجر تجريبي لاختبار واجهة Dalalti Storefront.",
      phone: "967700000001",
      status: "ACTIVE",
    },
  });

  console.log(`✓ Store: ${store.slug}`);

  /*
   * ------------------------------------------------------------
   * 3. Store Theme
   * ------------------------------------------------------------
   */

  await prisma.storeTheme.upsert({
    where: {
      storeId: store.id,
    },
    update: {
      primaryColor: "#7A5C3E",
      secondaryColor: "#5E4530",
      accentColor: "#B8862E",
      backgroundColor: "#FAF7F2",
      textColor: "#2B2420",
    },
    create: {
      storeId: store.id,
      primaryColor: "#7A5C3E",
      secondaryColor: "#5E4530",
      accentColor: "#B8862E",
      backgroundColor: "#FAF7F2",
      textColor: "#2B2420",
    },
  });

  console.log("✓ Store theme");

  /*
   * ------------------------------------------------------------
   * 4. Demo Plan
   * ------------------------------------------------------------
   */

  const plan = await prisma.plan.upsert({
    where: {
      name_billingPeriod: {
        name: "Demo Premium",
        billingPeriod: "MONTHLY",
      },
    },
    update: {
      price: "0.00",
      isActive: true,
    },
    create: {
      name: "Demo Premium",
      billingPeriod: "MONTHLY",
      price: "0.00",
      isActive: true,
    },
  });

  console.log("✓ Demo plan");

  /*
   * ------------------------------------------------------------
   * 5. Subscription
   * ------------------------------------------------------------
   */

  await prisma.subscription.upsert({
    where: {
      storeId: store.id,
    },
    update: {
      planId: plan.id,
      status: "ACTIVE",
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
    create: {
      storeId: store.id,
      planId: plan.id,
      status: "ACTIVE",
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });

  console.log("✓ Subscription");

  /*
   * ------------------------------------------------------------
   * 6. Remove previous Demo catalog
   *
   * Products are deleted first because they depend on categories.
   * This keeps the seed repeatable.
   * ------------------------------------------------------------
   */

  await prisma.product.deleteMany({
    where: {
      storeId: store.id,
    },
  });

  await prisma.category.deleteMany({
    where: {
      storeId: store.id,
    },
  });

  console.log("✓ Previous demo catalog cleared");

  /*
   * ------------------------------------------------------------
   * 7. Categories
   * ------------------------------------------------------------
   */

  const categoryMap: Record<string, string> = {};

  const rootCategories = [
    {
      name: "إلكترونيات",
      imageUrl: "https://images.unsplash.com/photo-1468495244123-6c6c332eeece",
    },
    {
      name: "ملابس",
      imageUrl: "https://images.unsplash.com/photo-1445205170230-053b83016050",
    },
    {
      name: "منزل ومطبخ",
      imageUrl: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f",
    },
    {
      name: "عناية وجمال",
      imageUrl: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908",
    },
    {
      name: "عروض",
      imageUrl: "https://images.unsplash.com/photo-1607082349566-187342175e2f",
    },
  ];

  for (const category of rootCategories) {
    const created = await prisma.category.create({
      data: {
        storeId: store.id,
        name: category.name,
        imageUrl: category.imageUrl,
      },
    });

    categoryMap[category.name] = created.id;
  }

  const electronicSubcategories = [
    {
      name: "هواتف",
      imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9",
    },
    {
      name: "إكسسوارات",
      imageUrl: "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85",
    },
  ];

  for (const category of electronicSubcategories) {
    const created = await prisma.category.create({
      data: {
        storeId: store.id,
        parentId: categoryMap["إلكترونيات"],
        name: category.name,
        imageUrl: category.imageUrl,
      },
    });

    categoryMap[category.name] = created.id;
  }

  console.log("✓ Categories created");

  /*
   * ------------------------------------------------------------
   * 8. Products
   * ------------------------------------------------------------
   */

  for (const productData of products) {
    const product = await prisma.product.create({
      data: {
        storeId: store.id,

        categoryId: productData.category
          ? categoryMap[productData.category]
          : null,

        name: productData.name,
        description: productData.description,
        price: productData.price,

        availability: productData.availability ?? "AVAILABLE",

        status: productData.status ?? "ACTIVE",

        images: {
          create: productData.images.map((imageUrl, index) => ({
            imageUrl,
            sortOrder: index,
            isPrimary: index === 0,
          })),
        },

        variants: productData.variants
          ? {
              create: productData.variants.map((variant) => ({
                color: variant.color ?? null,
                size: variant.size ?? null,
                price: variant.price ?? null,
                availability: "AVAILABLE",
              })),
            }
          : undefined,
      },
    });

    console.log(`  ✓ ${product.name}`);
  }

  /*
   * ------------------------------------------------------------
   * 9. Summary
   * ------------------------------------------------------------
   */

  const categoryCount = await prisma.category.count({
    where: {
      storeId: store.id,
    },
  });

  const productCount = await prisma.product.count({
    where: {
      storeId: store.id,
    },
  });

  const imageCount = await prisma.productImage.count({
    where: {
      product: {
        storeId: store.id,
      },
    },
  });

  const variantCount = await prisma.productVariant.count({
    where: {
      product: {
        storeId: store.id,
      },
    },
  });

  console.log("");
  console.log("========================================");
  console.log("🎉 Dalalti Demo Seed Completed");
  console.log("========================================");
  console.log(`Store:      ${store.name}`);
  console.log(`Slug:       ${store.slug}`);
  console.log(`Categories: ${categoryCount}`);
  console.log(`Products:   ${productCount}`);
  console.log(`Images:     ${imageCount}`);
  console.log(`Variants:   ${variantCount}`);
  console.log("");
  console.log(`Storefront: http://localhost:3000/${store.slug}`);
  console.log("========================================");
}

main()
  .catch((error) => {
    console.error("");
    console.error("❌ Demo seed failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
