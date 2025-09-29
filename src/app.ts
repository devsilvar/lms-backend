import express from "express";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js"
import cors from "cors";
import { userInfo } from "os";


const app = express();
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    // ✅ your frontend's URL
    credentials: true, // ✅ allow cookies/authorization headers
  })
);
app.use(express.json());
app.use("/api/user" , userRoutes);
app.use("/api/auth", authRoutes);

export default app;
