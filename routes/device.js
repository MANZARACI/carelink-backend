import express from "express";
import { isLoggedIn } from "../middleware.js";
import catchAsync from "../utils/catchAsync.js";
import { changeDeviceId } from "../controllers/deviceController.js";

const router = express.Router();

router.post("/deviceId", isLoggedIn, catchAsync(changeDeviceId)); // change device ID of the account

export default router;
