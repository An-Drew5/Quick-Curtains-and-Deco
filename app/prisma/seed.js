import dotenv from "dotenv";
import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma.js";

dotenv.config();

const categories = [
  { name: "Curtains", slug: "curtains" },
  { name: "Blinds", slug: "blinds" },
  { name: "Wallpapers", slug: "wallpapers" },
  { name: "Bed Sheets", slug: "bed-sheets" },
];

const products = [
  {
    name: "Charcoal Grey Pleated Curtain",
    slug: "charcoal-grey-pleated-curtain",
    description:
      "A refined ready-made curtain with a soft pleat and a modern charcoal finish. Ideal for living rooms and bedrooms that need a darker, more tailored look.",
    price: new Prisma.Decimal("240"),
    stock_status: "in_stock",
    categorySlug: "curtains",
    mediaSeeds: [
      "charcoal-grey-pleated-curtain-1",
      "charcoal-grey-pleated-curtain-2",
    ],
  },
  {
    name: "Ivory Blackout Eyelet Curtain",
    slug: "ivory-blackout-eyelet-curtain",
    description:
      "A ready-made blackout curtain designed for privacy, light control, and a clean eyelet finish. The ivory tone keeps spaces bright while still feeling polished.",
    price: new Prisma.Decimal("275"),
    stock_status: "out_of_stock",
    categorySlug: "curtains",
    mediaSeeds: [
      "ivory-blackout-eyelet-curtain-1",
      "ivory-blackout-eyelet-curtain-2",
      "ivory-blackout-eyelet-curtain-3",
    ],
  },
  {
    name: "Beige Roman Blind",
    slug: "beige-roman-blind",
    description:
      "A classic Roman blind in a warm beige tone for a soft, timeless window treatment. Suitable for kitchens, studies, and compact spaces.",
    price: new Prisma.Decimal("180"),
    stock_status: "in_stock",
    categorySlug: "blinds",
    mediaSeeds: ["beige-roman-blind-1", "beige-roman-blind-2"],
  },
  {
    name: "Slate Roller Blind",
    slug: "slate-roller-blind",
    description:
      "A minimal roller blind with a slate finish for understated styling and easy daily use. It works well in rooms that need a neat, modern window cover.",
    price: new Prisma.Decimal("160"),
    stock_status: "in_stock",
    categorySlug: "blinds",
    mediaSeeds: ["slate-roller-blind-1"],
  },
  {
    name: "Floral Damask Wallpaper",
    slug: "floral-damask-wallpaper",
    description:
      "A decorative wallpaper pattern with a soft floral damask look for feature walls. It adds character without overwhelming the room.",
    price: new Prisma.Decimal("260"),
    stock_status: "in_stock",
    categorySlug: "wallpapers",
    mediaSeeds: ["floral-damask-wallpaper-1", "floral-damask-wallpaper-2"],
  },
  {
    name: "Textured Linen Wallpaper",
    slug: "textured-linen-wallpaper",
    description:
      "A subtle wallpaper with a linen-like texture and a calm neutral palette. It is designed to create depth while remaining easy to pair with furniture and curtains.",
    price: new Prisma.Decimal("235"),
    stock_status: "out_of_stock",
    categorySlug: "wallpapers",
    mediaSeeds: [
      "textured-linen-wallpaper-1",
      "textured-linen-wallpaper-2",
      "textured-linen-wallpaper-3",
    ],
  },
  {
    name: "Egyptian Cotton Bed Sheet Set",
    slug: "egyptian-cotton-bed-sheet-set",
    description:
      "A smooth bed sheet set made for everyday comfort with a premium cotton feel. It is a practical staple for bedrooms that need a softer finish.",
    price: new Prisma.Decimal("140"),
    stock_status: "in_stock",
    categorySlug: "bed-sheets",
    mediaSeeds: [
      "egyptian-cotton-bed-sheet-set-1",
      "egyptian-cotton-bed-sheet-set-2",
    ],
  },
  {
    name: "Sateen Stripe Bed Sheet Set",
    slug: "sateen-stripe-bed-sheet-set",
    description:
      "A striped sateen sheet set with a gentle sheen and polished hotel-style feel. It is an easy ready-made option for a more elevated bedroom look.",
    price: new Prisma.Decimal("155"),
    stock_status: "in_stock",
    categorySlug: "bed-sheets",
    mediaSeeds: ["sateen-stripe-bed-sheet-set-1"],
  },
  {
    name: "Botanical Print Bed Sheet Set",
    slug: "botanical-print-bed-sheet-set",
    description:
      "A bright patterned sheet set with a botanical print that adds personality to the bedroom. It is ideal for showing a more expressive ready-made textile option.",
    price: new Prisma.Decimal("165"),
    stock_status: "in_stock",
    categorySlug: "bed-sheets",
    mediaSeeds: [
      "botanical-print-bed-sheet-set-1",
      "botanical-print-bed-sheet-set-2",
    ],
  },
];

function buildPlaceholderImageUrl(seed) {
  // Placeholder images only. Replace with real Cloudinary uploads later.
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/800/800`;
}

async function main() {
  try {
    const existingCategoryCount = await prisma.category.count();

    if (existingCategoryCount > 0) {
      console.log(
        `Seed skipped: ${existingCategoryCount} categories already exist. No duplicates were created.`,
      );
      return;
    }

    const createdCategories = {};

    for (const category of categories) {
      const createdCategory = await prisma.category.create({
        data: category,
      });

      createdCategories[category.slug] = createdCategory;
    }

    let productCount = 0;
    let mediaCount = 0;

    for (const product of products) {
      const category = createdCategories[product.categorySlug];

      const createdProduct = await prisma.product.create({
        data: {
          name: product.name,
          slug: product.slug,
          description: product.description,
          price: product.price,
          is_custom: false,
          stock_status: product.stock_status,
          category: {
            connect: { id: category.id },
          },
        },
      });

      productCount += 1;

      for (let index = 0; index < product.mediaSeeds.length; index += 1) {
        await prisma.productMedia.create({
          data: {
            product_id: createdProduct.id,
            url: buildPlaceholderImageUrl(product.mediaSeeds[index]),
            type: "image",
            sort_order: index,
          },
        });

        mediaCount += 1;
      }
    }

    console.log(
      `Seeded ${categories.length} categories and ${productCount} products with ${mediaCount} media records.`,
    );
  } catch (error) {
    console.error("Failed to seed product catalog:", error.message || error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
