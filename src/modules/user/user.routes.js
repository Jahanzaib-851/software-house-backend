// backend/src/modules/user/user.routes.js
import { Router } from "express";
import controller from "./user.controller.js";
import protect from "../../middlewares/auth.middleware.js";
import authorize from "../../middlewares/role.middleware.js";
import upload from "../../middlewares/multer.middleware.js";
import ROLES from "../../constants/roles.js";

const router = Router();

router.use(protect); // All routes protected

// User routes
router.post("/", authorize(ROLES.ADMIN), controller.createUser);
router.get("/me", controller.getProfile);
router.patch("/me", controller.updateProfile);
router.patch("/me/avatar", upload.single("avatar"), controller.updateAvatar);
router.patch("/me/cover", upload.single("coverImage"), controller.updateCoverImage);

// Admin-only routes
router.get("/", authorize(ROLES.ADMIN), controller.getUsers);
router.get("/:id", authorize(ROLES.ADMIN), controller.getUserById);
router.patch("/:id", authorize(ROLES.ADMIN), controller.updateUserByAdmin);
router.delete("/:id", authorize(ROLES.ADMIN), controller.deleteUser);

export default router;
