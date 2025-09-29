import { Router } from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import { authorizeRoles } from "../middlewares/roleMiddlewares.js";

const router = Router();

// Example: only ADMIN can access
// router.get(
//   "/dashboard",
//   authenticate,
//   authorizeRoles("ADMIN"),
//   (req, res) => {
//     res.json({ message: "Welcome Admin Dashboard" });
//   }
// );

// Example: both ADMIN & INSTRUCTOR can access
// router.post(
//   "/create-course",
//   authenticate,
//   authorizeRoles("ADMIN", "INSTRUCTOR"),
//   (req, res) => {
//     res.json({ message: "Course created successfully!" });
//   }
// );

export default router;
