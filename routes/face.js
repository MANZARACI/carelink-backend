import express from "express";
import {
  addFaceBase64,
  deleteFace,
  getFaces,
  recogniseFace,
  resetDetectedFaces,
} from "../controllers/faceController.js";
import catchAsync from "../utils/catchAsync.js";
import { isLoggedIn } from "../middleware.js";

const router = express.Router();

router.post("/recognise", catchAsync(recogniseFace)); // recognise a face
router.post("/reset-detected", isLoggedIn, catchAsync(resetDetectedFaces)); // reset detected faces
router.post("/add-face-base64", isLoggedIn, catchAsync(addFaceBase64)); // add a new face using base64 format
router.post("/delete-face", isLoggedIn, catchAsync(deleteFace)); // delete a face
router.get("/", catchAsync(getFaces)); // get saved faces

export default router;
