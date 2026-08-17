import prisma from "../lib/prisma.js";
import {
  validateNonEmptyString,
  validateProductPayload,
} from "../utils/validation.js";
import cloudinary from "../lib/cloudinary.js";

function buildProductResponse(product) {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: product.price,
    is_custom: product.is_custom,
    stock_status: product.stock_status,
    created_at: product.created_at,
    category: product.category
      ? {
          id: product.category.id,
          name: product.category.name,
          slug: product.category.slug,
        }
      : null,
    thumbnail: product.media?.length
      ? {
          id: product.media[0].id,
          url: product.media[0].url,
          type: product.media[0].type,
          sort_order: product.media[0].sort_order,
        }
      : null,
  };
}

async function listProducts(req, res, next) {
  try {
    const { category, search, page = 1, limit = 20 } = req.query;
    const pageNumber = Number(page) || 1;
    const pageLimit = Number(limit) || 20;

    const filters = {};

    if (category) {
      filters.category = { slug: category };
    }

    if (search) {
      filters.name = { contains: search, mode: "insensitive" };
    }

    const total = await prisma.product.count({ where: filters });
    const products = await prisma.product.findMany({
      where: filters,
      orderBy: { created_at: "desc" },
      skip: (pageNumber - 1) * pageLimit,
      take: pageLimit,
      include: {
        category: true,
        media: {
          orderBy: { sort_order: "asc" },
          take: 1,
        },
      },
    });

    const transformed = products.map(buildProductResponse);
    const totalPages = Math.ceil(total / pageLimit);

    res.json({
      success: true,
      data: {
        products: transformed,
        total,
        page: pageNumber,
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function getProductDetail(req, res, next) {
  try {
    const { slug } = req.params;

    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        media: {
          orderBy: { sort_order: "asc" },
        },
      },
    });

    if (!product) {
      return res
        .status(404)
        .json({ success: false, error: "Product not found." });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
}

async function createProduct(req, res, next) {
  try {
    // TODO: protect with admin auth middleware (added in next step)
    const payload = req.body;
    const errors = validateProductPayload(payload);

    const requiredFields = [
      "name",
      "slug",
      "category_id",
      "price",
      "stock_status",
    ];
    const missingFields = requiredFields.filter(
      (field) =>
        payload[field] === undefined ||
        payload[field] === null ||
        payload[field] === "",
    );
    if (missingFields.length > 0) {
      errors.push(`Missing required fields: ${missingFields.join(", ")}.`);
    }

    if (errors.length > 0) {
      return res.status(400).json({ success: false, error: errors.join(" ") });
    }

    const existingProduct = await prisma.product.findUnique({
      where: { slug: payload.slug },
    });

    if (existingProduct) {
      return res
        .status(409)
        .json({ success: false, error: "Product slug already exists." });
    }

    const product = await prisma.product.create({
      data: {
        name: payload.name,
        slug: payload.slug,
        description: payload.description || null,
        price: payload.price,
        is_custom: payload.is_custom ?? false,
        stock_status: payload.stock_status,
        category: { connect: { id: payload.category_id } },
      },
    });

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
}

async function updateProduct(req, res, next) {
  try {
    // TODO: protect with admin auth middleware (added in next step)
    const { id } = req.params;
    const payload = req.body;

    if (!id) {
      return res
        .status(400)
        .json({ success: false, error: "Product ID is required." });
    }

    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return res
        .status(404)
        .json({ success: false, error: "Product not found." });
    }

    const errors = validateProductPayload(payload);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, error: errors.join(" ") });
    }

    const data = {};
    if (payload.name !== undefined) data.name = payload.name;
    if (payload.slug !== undefined) data.slug = payload.slug;
    if (payload.description !== undefined)
      data.description = payload.description;
    if (payload.price !== undefined) data.price = payload.price;
    if (payload.is_custom !== undefined) data.is_custom = payload.is_custom;
    if (payload.stock_status !== undefined)
      data.stock_status = payload.stock_status;
    if (payload.category_id !== undefined)
      data.category = { connect: { id: payload.category_id } };

    if (data.slug && data.slug !== existingProduct.slug) {
      const conflict = await prisma.product.findUnique({
        where: { slug: data.slug },
      });
      if (conflict) {
        return res
          .status(409)
          .json({ success: false, error: "Product slug already exists." });
      }
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data,
    });

    res.json({ success: true, data: updatedProduct });
  } catch (error) {
    next(error);
  }
}

async function deleteProduct(req, res, next) {
  try {
    // TODO: protect with admin auth middleware (added in next step)
    const { id } = req.params;

    const existingProduct = await prisma.product.findUnique({ where: { id } });
    if (!existingProduct) {
      return res
        .status(404)
        .json({ success: false, error: "Product not found." });
    }

    await prisma.$transaction([
      prisma.productMedia.deleteMany({ where: { product_id: id } }),
      prisma.product.delete({ where: { id } }),
    ]);

    res.json({
      success: true,
      data: { message: "Product deleted successfully." },
    });
  } catch (error) {
    next(error);
  }
}

async function createMedia(req, res, next) {
  try {
    const { productId } = req.params;
    const { url, type, sort_order } = req.body;

    if (!url || !type) {
      return res
        .status(400)
        .json({ success: false, error: "url and type are required." });
    }

    if (!["image", "video"].includes(type)) {
      return res
        .status(400)
        .json({ success: false, error: "type must be 'image' or 'video'." });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      return res
        .status(404)
        .json({ success: false, error: "Product not found." });
    }

    const created = await prisma.productMedia.create({
      data: {
        product_id: productId,
        url,
        type,
        sort_order: sort_order ?? 0,
      },
    });

    res.status(201).json({ success: true, data: created });
  } catch (error) {
    next(error);
  }
}

async function deleteMedia(req, res, next) {
  try {
    const { productId, mediaId } = req.params;

    const media = await prisma.productMedia.findUnique({
      where: { id: mediaId },
    });
    if (!media || media.product_id !== productId) {
      return res
        .status(404)
        .json({ success: false, error: "Media not found." });
    }

    // Deleting the remote asset requires storing the Cloudinary public_id.
    // If the `public_id` field is not present on the model, we cannot
    // reliably delete the asset from Cloudinary using only the URL.
    if (media.public_id) {
      const resourceType = media.type === "video" ? "video" : "image";
      try {
        await cloudinary.uploader.destroy(media.public_id, {
          resource_type: resourceType,
        });
      } catch (err) {
        // Log and continue to delete DB record; do not block admin UX.
        console.warn("Failed to delete Cloudinary asset:", err?.message || err);
      }
    } else {
      // If public_id isn't stored, notify in response that remote deletion
      // was skipped and advise adding `public_id` to ProductMedia model.
      console.warn(
        "Media has no public_id; remote Cloudinary deletion skipped.",
      );
    }

    await prisma.productMedia.delete({ where: { id: mediaId } });

    res.json({ success: true, data: { message: "Media deleted." } });
  } catch (error) {
    next(error);
  }
}

async function reorderMedia(req, res, next) {
  try {
    const { productId } = req.params;
    const { order } = req.body;

    if (!Array.isArray(order)) {
      return res
        .status(400)
        .json({ success: false, error: "order must be an array." });
    }

    const updates = order.map((item) =>
      prisma.productMedia.update({
        where: { id: item.id },
        data: { sort_order: item.sort_order },
      }),
    );

    await prisma.$transaction(updates);

    res.json({ success: true, data: { message: "Order updated." } });
  } catch (error) {
    next(error);
  }
}

export {
  listProducts,
  getProductDetail,
  createProduct,
  updateProduct,
  deleteProduct,
  // Media handlers
  createMedia,
  deleteMedia,
  reorderMedia,
};
