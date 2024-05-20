import { Router } from "express";
import { badRequest } from "src/lib/response-json";

const router = Router();
const environment_mode = process.env.NODE_ENV;

router.get("/user", async (request, response) => {
  try {
  } catch (error) {
    if (environment_mode === "development") console.error(error);
    return response.status(400).json(badRequest(new Error(error as string)));
  }
});

const get_router = router;

export default get_router;
