import express from "express";
import catchAsync from "../utils/catchAsync.js";
import {
  addLocation,
  askLocation,
  seedLocation,
} from "../controllers/locationController.js";
import { isLoggedIn } from "../middleware.js";

const router = express.Router();

router.post("/", isLoggedIn, catchAsync(addLocation)); // send a location to the caregiver
router.get("/request-location", catchAsync(askLocation)); // request a location from the patient
router.get("/seedLocation", seedLocation);

export default router;
