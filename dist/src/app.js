import express from "express";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import cors from "cors";
const app = express();
app.use(cors({
    origin: function (origin, callback) {
        callback(null, origin); // allow the requesting origin dynamically
    },
    credentials: true, // allow cookies/authorization headers
}));
app.use(express.json());
app.use("/api/user", userRoutes);
app.use("/api/auth", authRoutes);
export default app;
//# sourceMappingURL=app.js.map