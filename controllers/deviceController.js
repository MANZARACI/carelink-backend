import { db } from "../firebase.js";
import ExpressError from "../utils/ExpressError.js";

const changeDeviceId = async (req, res, next) => {
  const { newDeviceId } = req.body;
  const userId = req.uid;

  // device id validation
  if (newDeviceId.length !== 6) {
    return next(new ExpressError("Device id must be 6 characters!"));
  }

  // check if the provided id has been already owned
  const checkDeviceIdOwnerRef = db.ref("device-user/" + newDeviceId);
  const isOwned = await checkDeviceIdOwnerRef.once("value");
  if (isOwned.exists()) {
    return next(new ExpressError("This id is already owned!", 409));
  }

  // remove ownership from the old device id
  const checkOlderDeviceIdRef = db.ref("users/" + userId + "/deviceId");
  const result = await checkOlderDeviceIdRef.once("value");
  if (result.exists()) {
    db.ref("device-user/" + result.val()).set(null);
  }

  // set new ownership of the device id
  checkOlderDeviceIdRef.set(newDeviceId);
  checkDeviceIdOwnerRef.set(userId);

  return res.status(200).json({
    successMessage: "Successfully updated",
  });
};

export { changeDeviceId };
