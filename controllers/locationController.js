import { db } from "../firebase.js";
import ExpressError from "../utils/ExpressError.js";
import { Timestamp } from "firebase-admin/firestore";
import { seedLocations } from "../utils/locationSeed.js";

const askLocation = async (req, res, next) => {
  const deviceId = req.query.deviceId;

  if (!deviceId) {
    return next(new ExpressError("You must provide a device id!"));
  }

  const fetchUserIdRef = db.ref("device-user/" + deviceId);
  const userIdResult = await fetchUserIdRef.once("value");

  if (!userIdResult.exists()) {
    return next(new ExpressError("No user found with this device id!", 404));
  }

  const userId = userIdResult.val();

  const setLocationRequestRef = db.ref("users/" + userId + "/locationRequest");
  setLocationRequestRef.set(true);

  return res.status(200).send("Successful");
};

const addLocation = async (req, res, next) => {
  const { lat, lng } = req.body;
  const userId = req.uid;

  const fetchDeviceIdRef = db.ref("users/" + userId + "/deviceId");
  const deviceIdResult = await fetchDeviceIdRef.once("value");

  if (!deviceIdResult.exists()) {
    return next(new ExpressError("You don't have a device id!", 404));
  }

  const deviceId = deviceIdResult.val();

  const locationsRef = db.ref("devices/" + deviceId);

  const location = {
    lat,
    lng,
    time: Timestamp.now(),
  };

  locationsRef.push(location);

  const removeLocationRequestRef = db.ref(
    "users/" + userId + "/locationRequest"
  );
  removeLocationRequestRef.set(null);

  return res.status(200).send("Location sent");
};

const seedLocation = (req, res) => {
  const { lat, lng } = req.query;
  const location = {
    lat: Number(lat),
    lng: Number(lng),
  };
  seedLocations(location);
};

export { askLocation, addLocation, seedLocation };
