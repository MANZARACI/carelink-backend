import { auth } from "./firebase.js";
import ExpressError from "./utils/ExpressError.js";

export const isLoggedIn = async (req, res, next) => {
  try {
    let token;
    const { authorization } = req.headers;
    const { idToken } = req.body;

    if (authorization) {
      token = authorization;
    } else {
      token = idToken;
    }

    const decodedToken = await auth.verifyIdToken(token);
    req.uid = decodedToken.uid;

    next();
  } catch (error) {
    next(new ExpressError("Authentication failed!", 401));
  }
};
