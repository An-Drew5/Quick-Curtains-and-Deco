import prisma from "../lib/prisma.js";
import { validateNonEmptyString } from "../utils/validation.js";

async function listCategories(req, res, next) {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
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

async function updateCategory(req, res, next) {
  try {
    const { id } = req.params;
    const { name, slug } = req.body;
    const errors = [];

    const idError = validateNonEmptyString(id, "id");
    const nameError = validateNonEmptyString(name, "name");
    const slugError = validateNonEmptyString(slug, "slug");

    if (idError) errors.push(idError);
    if (nameError) errors.push(nameError);
    if (slugError) errors.push(slugError);

    if (errors.length > 0) {
      return res.status(400).json({ success: false, error: errors.join(" ") });
    }

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, error: "Category not found." });
    }

    const slugConflict = await prisma.category.findFirst({
      where: {
        slug,
        NOT: { id },
      },
    });

    if (slugConflict) {
      return res
        .status(409)
        .json({ success: false, error: "Category slug already exists." });
    }

    const updated = await prisma.category.update({
      where: { id },
      data: { name, slug },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    return res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
}

async function deleteCategory(req, res, next) {
  try {
    const { id } = req.params;
    const idError = validateNonEmptyString(id, "id");
    if (idError) {
      return res.status(400).json({ success: false, error: idError });
    }

    const existing = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: "Category not found." });
    }

    if (existing._count.products > 0) {
      return res.status(409).json({
        success: false,
        error:
          "Cannot delete category with linked products. Move or delete those products first.",
      });
    }

    await prisma.category.delete({ where: { id } });

    return res.json({
      success: true,
      data: { message: "Category deleted successfully." },
    });
  } catch (error) {
    next(error);
  }
}

export { listCategories, createCategory, updateCategory, deleteCategory };
