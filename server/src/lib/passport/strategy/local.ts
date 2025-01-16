import { compare } from "bcrypt";
import { Strategy } from "passport-local";
import User from "../../../database/models/User";
import exclude from "../../../lib/exclude";

export default function localStrategy() {
  return new Strategy(async (username, password, done) => {
    try {
      const found_user = await User.findOne({ username }).populate({ path: "photo", select: "url" });
      if (!found_user) return done(new Error("User does not exist"));
      if (!found_user.password) return done(new Error("Cannot login via credentials, login via GOOGLE"));
      if (!(await compare(found_user.password, password))) return done(new Error("Incorrect password"));

      return done(null, exclude(found_user.toJSON(), ["password"]));
    } catch (error) {
      console.log("ERROR::", error);
      return done(new Error("Oops! something went wrong"));
    }
  });
}
