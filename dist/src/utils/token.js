import jwt from "jsonwebtoken";
import crypto from "crypto";
import prisma from "../config/db.js";
export const generateAccessToken = (userId, role) => {
    return jwt.sign({ userId, role }, process.env.JWT_ACCESS_SECRET, {
        expiresIn: "15m",
    });
};
export const generateRefreshToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: "7d",
    });
};
export const generateTokens = async (userId, role) => {
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
//# sourceMappingURL=token.js.map