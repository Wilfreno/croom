import { Router } from "express";
import { badRequest } from "src/lib/response-json";

const router = Router();
const environment_mode = process.env.NODE_ENV;

router.get("/", async (request, response) => {
  try {
  } catch (error) {
    if (environment_mode === "development") console.error(error);
    return response.status(400).json(badRequest());
  }
});

const v1_room = router;

export default v1_room;
