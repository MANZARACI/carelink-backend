import { User } from "../models/userModel.js";
import ExpressError from "../utils/ExpressError.js";

const addTracker = async (req, res, next) => {
  const { name } = req.body;
  const userId = req.uid;

  let existingUser = await User.findOne({ userId });

  if (!existingUser) {
    existingUser = new User({
      userId,
    });
  } else {
    if (existingUser.trackers.some((tracker) => tracker.name === name)) {
      return next(new ExpressError("You already have that tracker!", 403));
    }
  }

  existingUser.trackers.push({
    name,
    values: new Map(),
  });

  await existingUser.save();

  return res.status(200).json({
    successMessage: "Successfully added!",
  });
};

const removeTracker = async (req, res, next) => {
  const { trackerName } = req.query;
  const userId = req.uid;

  const user = await User.findOne({ userId });

  if (!user) {
    return next(new ExpressError("User not found!", 404));
  }

  await user.updateOne({ $pull: { trackers: { name: trackerName } } });

  return res.status(200).json({
    successMessage: "Successfully deleted!",
  });
};

const addTrackerValue = async (req, res, next) => {
  const { date, name, value } = req.body;
  const userId = req.uid;

  const queryResult = await User.findOne(
    { userId },
    {
      trackers: {
        $elemMatch: { name },
      },
    }
  );

  if (!queryResult) {
    return next(new ExpressError("Not found!", 404));
  }

  const selectedTracker = queryResult.trackers[0];

  if (!value) {
    selectedTracker.values.delete(date);
  } else {
    selectedTracker.values.set(date, value);
  }

  await queryResult.save();

  return res.status(200).json({
    successMessage: "Successfully added!",
  });
};

const getTrackerValuesByDate = async (req, res, next) => {
  const { date } = req.query;
  const userId = req.uid;

  const queryResult = await User.findOne({ userId }).select(
    "trackers.name trackers.values." + date
  );

  if (!queryResult) {
    return next(new ExpressError("Not found!", 404));
  }

  const allTrackersByDate = queryResult.trackers;

  const result = allTrackersByDate.map((tracker) => {
    return {
      name: tracker.name,
      value: tracker.values.get(date),
    };
  });

  return res.status(200).json({ valuesByDate: result });
};

export { addTracker, getTrackerValuesByDate, addTrackerValue, removeTracker };
