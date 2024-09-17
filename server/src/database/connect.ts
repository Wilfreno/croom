import { FastifyInstance, FastifyPluginOptions } from "fastify";
import mongoose from "mongoose";

export default async function connectToDB(
  fastify: FastifyInstance,
  _: FastifyPluginOptions
) {
  try {
    const mongodb_uri = process.env.MONGODB_URI;
    if (!mongodb_uri)
      throw new Error("MONGODB_URI is missing from the .env file");

    //connect to mongodb
    await mongoose.connect(mongodb_uri);

    fastify.log.info("connected to db");
  } catch (error) {
    fastify.log.error(error);
    throw error;
  }
}
