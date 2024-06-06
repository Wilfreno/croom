import { Router } from "express";
import v1 from "./v1/v1";

const router = Router();

router.use("/v1", v1);

const get_router = router;

export default get_router;
