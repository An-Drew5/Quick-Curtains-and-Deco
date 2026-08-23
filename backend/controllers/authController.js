import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

const TOKEN_NAME = "admin_token";
const TOKEN_EXPIRES_IN = 7 * 24 * 60 * 60; // 7 days in seconds

function getCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: TOKEN_EXPIRES_IN * 1000,
    path: "/",
  };
}

function createJwtPayload(user) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
  };
}

function getCookieClearOptions() {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
  };
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, error: "Email and password are required." });
    }

    const user = await prisma.adminUser.findUnique({ where: { email } });
    const invalidResponse = () =>
      res.status(401).json({ success: false, error: "Invalid credentials" });

    if (!user) {
      return invalidResponse();
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) {
      return invalidResponse();
    }

    const payload = createJwtPayload(user);
    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: TOKEN_EXPIRES_IN,
    });

    res.cookie(TOKEN_NAME, token, getCookieOptions());

    res.json({ success: true, data: payload });
  } catch (error) {
    next(error);
  }
}

export function logout(_req, res) {
  res.clearCookie(TOKEN_NAME, getCookieClearOptions());
  res.json({ success: true });
}

export function me(req, res) {
  // `requireAdmin` middleware attaches the decoded admin info to `req.admin`.
  // Do not read from `req.body` for this GET route.
  return res.status(200).json({ success: true, data: req.admin });
}
