import prisma from "../lib/prisma.js";

const VALID_ORDER_STATUSES = [
  "pending",
  "paid",
  "shipped",
  "delivered",
  "cancelled",
];

const PAID_ORDER_STATUSES = ["paid", "shipped", "delivered"];

function normalizeStatus(status) {
  return typeof status === "string" ? status.trim().toLowerCase() : "";
}

export async function updateOrderStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!id || typeof id !== "string" || id.trim() === "") {
      return res
        .status(400)
        .json({ success: false, error: "Order id is required." });
    }

    const normalizedStatus = normalizeStatus(status);
    if (!VALID_ORDER_STATUSES.includes(normalizedStatus)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Valid values are: ${VALID_ORDER_STATUSES.join(", ")}.`,
      });
    }

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return res
        .status(404)
        .json({ success: false, error: "Order not found." });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status: normalizedStatus },
    });

    return res.json({ success: true, data: updatedOrder });
  } catch (error) {
    next(error);
  }
}

export async function getAdminStats(req, res, next) {
  try {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const [
      ordersToday,
      pendingOrders,
      revenueThisWeek,
      revenueThisMonth,
      recentOrders,
      outOfStockCount,
      outOfStockProducts,
    ] = await Promise.all([
      prisma.order.count({
        where: {
          created_at: {
            gte: startOfDay,
            lte: now,
          },
        },
      }),
      prisma.order.count({
        where: {
          status: "pending",
        },
      }),
      prisma.order.aggregate({
        _sum: { total_amount: true },
        where: {
          status: { in: PAID_ORDER_STATUSES },
          created_at: {
            gte: sevenDaysAgo,
            lte: now,
          },
        },
      }),
      prisma.order.aggregate({
        _sum: { total_amount: true },
        where: {
          status: { in: PAID_ORDER_STATUSES },
          created_at: {
            gte: thirtyDaysAgo,
            lte: now,
          },
        },
      }),
      prisma.order.findMany({
        take: 8,
        orderBy: { created_at: "desc" },
        select: {
          id: true,
          customer_name: true,
          total_amount: true,
          status: true,
          created_at: true,
        },
      }),
      prisma.product.count({
        where: {
          stock_status: "out_of_stock",
        },
      }),
      prisma.product.findMany({
        where: {
          stock_status: "out_of_stock",
        },
        select: {
          id: true,
          name: true,
        },
        take: 10,
      }),
    ]);

    const serializedRecentOrders = recentOrders.map((order) => ({
      ...order,
      total_amount: Number(order.total_amount),
    }));

    return res.json({
      success: true,
      data: {
        orders_today: ordersToday,
        pending_orders: pendingOrders,
        revenue_this_week: Number(revenueThisWeek._sum.total_amount || 0),
        revenue_this_month: Number(revenueThisMonth._sum.total_amount || 0),
        recent_orders: serializedRecentOrders,
        out_of_stock_count: outOfStockCount,
        out_of_stock_products: outOfStockProducts,
      },
    });
  } catch (error) {
    next(error);
  }
}
