import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
  try {
    const decoded = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
    req.user = await User.findById(decoded.user.id).select("-password");
    if (!req.user) {
      return res.status(401).json({ message: "User no longer exists" });
    }
    next();
  } catch {
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
};

export const admin = (req, res, next) => {
  if (req.user?.role === "admin") return next();
  return res.status(403).json({ message: "Not authorized as admin" });
};

// Attaches req.user when a valid token is present, but never rejects.
// Endpoints that serve both signed-in shoppers and guests use this so the
// account is derived from the token instead of an id supplied by the caller.
export const identify = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return next();
  try {
    const decoded = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
    req.user = await User.findById(decoded.user.id).select("-password");
  } catch {
    // An expired or malformed token is treated as "not signed in" rather than
    // an error — the caller simply continues as a guest.
  }
  next();
};
