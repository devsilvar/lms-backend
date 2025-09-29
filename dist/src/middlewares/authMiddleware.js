import jwt from "jsonwebtoken";
export const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }
    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        req.user = { id: decoded.userId, role: decoded.role };
        next();
    }
    catch (err) {
        return res.status(403).json({ message: "Forbidden: Invalid or expired token" });
    }
};
//# sourceMappingURL=authMiddleware.js.map