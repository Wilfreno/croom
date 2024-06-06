import { Router } from "express";
import v1 from "./v1/v1";

const router = Router();

router.use("/v1", v1);

const create_router = router;
export default create_router;
