import prisma from "../lib/prisma.js";
import { validateNonEmptyString } from "../utils/validation.js";

async function listCategories(req, res, next) {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    });

    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
}

async function createCategory(req, res, next) {
  try {
    // TODO: protect with admin auth middleware (added in next step)
    const { name, slug } = req.body;
    const errors = [];

    const nameError = validateNonEmptyString(name, "name");
    const slugError = validateNonEmptyString(slug, "slug");

    if (nameError) errors.push(nameError);
    if (slugError) errors.push(slugError);

    if (errors.length > 0) {
      return res.status(400).json({ success: false, error: errors.join(" ") });
    }

    const existingCategory = await prisma.category.findUnique({
      where: { slug },
    });

    if (existingCategory) {
      return res
        .status(409)
        .json({ success: false, error: "Category slug already exists." });
    }

    const category = await prisma.category.create({
      data: { name, slug },
    });

    res.status(201).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
}

export { listCategories, createCategory };
