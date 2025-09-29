import jwt from "jsonwebtoken";
import crypto from "crypto";
import prisma from "../config/db.js";

export const generateAccessToken = (userId: string, role: string) => {
  return jwt.sign({ userId, role }, process.env.JWT_ACCESS_SECRET as string, {
    expiresIn: "15m",
  });
};

export const generateRefreshToken = (userId: string) => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET as string, {
    expiresIn: "7d",
  });
};

export const generateTokens = async (userId: string, role: string) => {
  const accessToken = generateAccessToken(userId, role);
  const refreshToken = generateRefreshToken(userId);

  // Hash refresh token before saving to DB
  const hashedToken = crypto.createHash("sha256").update(refreshToken).digest("hex");

  // Save refresh token in DB
  await prisma.refreshToken.create({
    data: {
      tokenHash: hashedToken,
      userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return { accessToken, refreshToken };
};
