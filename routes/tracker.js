import express from "express";
import catchAsync from "../utils/catchAsync.js";
import {
  addTracker,
  addTrackerValue,
  getTrackerValuesByDate,
  removeTracker,
} from "../controllers/trackerController.js";
import { isLoggedIn } from "../middleware.js";

const router = express.Router();

router.post("/", isLoggedIn, catchAsync(addTracker));
router.post("/add-value", isLoggedIn, catchAsync(addTrackerValue));
router.delete("/", isLoggedIn, catchAsync(removeTracker));
router.get("/by-day", isLoggedIn, catchAsync(getTrackerValuesByDate));

export default router;
