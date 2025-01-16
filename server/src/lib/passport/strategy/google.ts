import { Strategy } from "passport-google-oauth20";
import User from "../../../database/models/User";
import passport from "@fastify/passport";
import { ClientSession, startSession } from "mongoose";
import Photo from "../../../database/models/Photo";
import exclude from "../../../lib/exclude";

export function googleStrategy() {
  const clientID = process.env.GOOGLE_CLIENT_ID;
  if (!clientID) throw new Error("GOOGLE_CLIENT_ID is missing from your .env file");

  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientSecret)
    throw new Error("GOOGLE_CLIENT_SECRET is missing from your .env file");

  let callbackURL;
  if (process.env.NODE_ENV === "production") {
    callbackURL = process.env.SERVER_PRODUCTION_ORIGIN;
    if (!callbackURL)
      throw new Error(
        "SERVER_PRODUCTION_ORIGIN is missing from your .env file \n SERVER_PRODUCTION_ORIGIN is the url origin of the server"
      );
  } else {
    callbackURL = process.env.SERVER_DEVELOPMENT_ORIGIN;
    if (!callbackURL)
      throw new Error(
        "SERVER_DEVELOPMENT_ORIGIN is missing from your .env file \n SERVER_DEVELOPMENT_ORIGIN is the url origin of the server for example http://localhost:3000"
      );
  }
  if (callbackURL.endsWith("/"))
    throw new Error(
      "url origin must not end with trailing slash \n trailing slash is the '/' at the end of a url"
    );

  callbackURL += "/v1/auth/google/callback";

  return new Strategy(
    {
      clientID,
      clientSecret,
      callbackURL,
      scope: ["profile", "email"],
    },
    async (token, refresh_token, profile, done) => {
      let session: ClientSession | null = null;
      try {
        session = await startSession();
        session.startTransaction();

        console.log(profile);
        const {
          _json: { email, picture },
        } = profile;

        let user = await User.findOne({ email })
          .select("-password")
          .populate({ path: "photo", select: "url" });

        if (!user) {
          user = new User({
            username: "@" + email!.substring(0, email?.indexOf("@")),
            display_name: email!.substring(0, email?.indexOf("@")),
            email: email!,
          });

          const new_photo = new Photo({ owner: user._id, type: "PROFILE", url: picture });
          user.photo = new_photo._id;

          await user.save({ session });
          await new_photo.save({ session });
          await session.commitTransaction();
          await session.endSession();

          user = await user.populate({ path: "photo", select: "url" });
        }

        done(null, exclude(user.toJSON(), ["password"]));
      } catch (error) {
        await session?.abortTransaction();

        console.log(error);
        done(new Error("Oops! something went wrong"));
      }
    }
  );
}
