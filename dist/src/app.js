import express from "express";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import cors from "cors";
const app = express();
app.use(cors({
    origin: "http://localhost:5173", // ✅ your frontend's URL
    credentials: true, // ✅ allow cookies/authorization headers
}));
app.use(express.json());
app.use("/api/user", userRoutes);
app.use("/api/auth", authRoutes);
export default app;
//# sourceMappingURL=app.js.map