import { db } from "../firebase.js";
import fs from "fs";
import { User } from "../models/userModel.js";
import ExpressError from "../utils/ExpressError.js";
import faceapi from "face-api.js";
import canvas from "canvas";

const recogniseFace = async (req, res, next) => {
  const deviceId = req.query.deviceId;

  const imageType = req.files.imageFile.mimetype.replace("image/", ".");
  const imagePath = req.files.imageFile.tempFilePath + imageType;

  fs.renameSync(req.files.imageFile.tempFilePath, imagePath);

  const fetchUserIdRef = db.ref("device-user/" + deviceId);
  const userIdResult = await fetchUserIdRef.once("value");
  const userId = userIdResult.val();

  const existingUser = await User.findOne({ userId });
  if (!existingUser) {
    return next(new ExpressError("No user found.", 401));
  }

  let faces = existingUser.faces;
  let transformed_faces = [];

  for (let i = 0; i < faces.length; i++) {
    //Change the face data descriptors from Objects to Float32Array type
    for (let j = 0; j < faces[i].descriptions.length; j++) {
      faces[i].descriptions[j] = new Float32Array(
        Object.values(faces[i].descriptions[j])
      );
    }

    transformed_faces[i] = new faceapi.LabeledFaceDescriptors(
      faces[i].label,
      faces[i].descriptions
    );
  }

  const faceMatcher = new faceapi.FaceMatcher(transformed_faces, 0.6); // set distance threshold to 0.6 (if result is more than the threshold no result will be provided)

  //Read the image using canvas
  const img = await canvas.loadImage(imagePath);
  const temp = faceapi.createCanvasFromMedia(img);

  //Process the image for the model
  const displaySize = { width: img.width, height: img.height };
  faceapi.matchDimensions(temp, displaySize);

  //Find matching faces
  const detections = await faceapi
    .detectAllFaces(img)
    .withFaceLandmarks()
    .withFaceDescriptors();
  const resizedDetections = faceapi.resizeResults(detections, displaySize);
  const results = resizedDetections.map((d) =>
    faceMatcher.findBestMatch(d.descriptor)
  );

  fs.unlinkSync(imagePath);

  const labelList = results.map((result) => {
    return result.label;
  });

  const detectedFacesRef = db.ref("users/" + userId + "/detectedFaces");
  detectedFacesRef.set(labelList);

  return res.status(200).json({ results });
};

const resetDetectedFaces = async (req, res, next) => {
  const userId = req.uid;

  const resetDetectedFacesRef = db.ref("users/" + userId + "/detectedFaces");
  resetDetectedFacesRef.set(null);

  return res.status(200).send("Successful");
};

const getFaces = async (req, res, next) => {
  const userId = req.query.userId;

  let user = await User.findOne({ userId });

  if (!user) {
    user = new User({ userId });

    await user.save();
  }

  const faceArray = [];
  user.faces.forEach((face) => {
    faceArray.push({ id: face._id, label: face.label });
  });

  return res.status(200).json({ faceArray });
};

const addFaceBase64 = async (req, res, next) => {
  const { encoded, encoded2, encoded3, label } = req.body;
  const userId = req.uid;

  const File1 = Buffer.from(encoded, "base64");
  const File2 = Buffer.from(encoded2, "base64");
  const File3 = Buffer.from(encoded3, "base64");

  const images = [File1, File2, File3];

  let existingUser = await User.findOne({ userId });

  if (!existingUser) {
    existingUser = new User({
      userId,
    });

    await existingUser.save();
  }

  let counter = 0;
  const descriptions = [];

  //loop through the images
  for (let i = 0; i < images.length; i++) {
    const img = await canvas.loadImage(images[i]);
    counter = (i / images.length) * 100;
    console.log(`Progress - ${counter}%`);

    const detections = await faceapi
      .detectSingleFace(img)
      .withFaceLandmarks()
      .withFaceDescriptor();

    descriptions.push(detections.descriptor);
  }

  const face = {
    label,
    descriptions,
  };

  existingUser.faces.push(face);
  await existingUser.save();
  return res.status(200).json({
    successMessage: "Successfully updated",
  });
};

const deleteFace = async (req, res, next) => {
  const { faceId } = req.body;
  const userId = req.uid;

  const user = await User.findOne({ userId });

  if (!user) {
    return next(new ExpressError("No user found.", 401));
  }

  await user.updateOne({ $pull: { faces: { _id: faceId } } });

  return res.status(200).send("Successfully deleted");
};

export {
  recogniseFace,
  resetDetectedFaces,
  getFaces,
  addFaceBase64,
  deleteFace,
};
