import express from "express";
import dotenv from "dotenv";
import ExpressError from "./utils/ExpressError.js";
import cors from "cors";
import mongoose from "mongoose";
import { fileURLToPath } from "url";
import path from "path";
import faceapi from "face-api.js";
import { Canvas, Image } from "canvas";
import fileUpload from "express-fileupload";
import faceRoutes from "./routes/face.js";
import locationRoutes from "./routes/location.js";
import deviceRoutes from "./routes/device.js";
import trackerRoutes from "./routes/tracker.js";

faceapi.env.monkeyPatch({ Canvas, Image });

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port: ${PORT}`));

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(
  fileUpload({
    useTempFiles: true,
  })
);

const loadModels = async () => {
  await faceapi.nets.faceRecognitionNet.loadFromDisk(__dirname + "/aiModels");
  await faceapi.nets.faceLandmark68Net.loadFromDisk(__dirname + "/aiModels");
  await faceapi.nets.ssdMobilenetv1.loadFromDisk(__dirname + "/aiModels");
};

loadModels();

mongoose.connect(process.env.MDB_CONNECT, (err) => {
  if (err) return console.error(err);
  console.log("Connected to mongoDB");
});

app.get("/", (req, res) => {
  res.send("Server is working");
});

app.use("/api/face", faceRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/device", deviceRoutes);
app.use("/api/tracker", trackerRoutes);

app.all("*", (req, res, next) => {
  next(new ExpressError("Path Not Found", 404));
});

app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;

  if (!err.message) {
    err.message = "Something went wrong!";
  }
  res.status(statusCode).json({
    errorMessage: err.message,
  });
});
