import { Router } from "express";
import create_router from "../create";
import get_router from "../get";
import delete_router from "../delete";
import authenticate_router from "../authenticate";
import accept_router from "../accept";
import decline_router from "../decline";
const router = Router();

router.use("/create", create_router);
router.use("/get", get_router);
router.use("/delete", delete_router);
router.use("/authenticate", authenticate_router);
router.use("/accept", accept_router);
router.use("/decline", decline_router);
const v1_router = router;

export default v1_router;
