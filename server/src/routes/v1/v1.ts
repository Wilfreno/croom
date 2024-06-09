import { Router } from "express";
import v1_user from "./user";
import v1_direct_conversation from "./direct-conversation";
import v1_direct_message from "./direct-message";
import v1_friend_request from "./friend-request";
import v1_friend from "./friend";
import v1_otp from "./otp";
import v1_room from "./room";

const router = Router();

router.use("/user", v1_user);
router.use("/otp", v1_otp);
router.use("/friend-request", v1_friend_request);
router.use("/friend", v1_friend);
router.use("/direct-conversation", v1_direct_conversation);
router.use("/direct-message", v1_direct_message);
router.use("/room", v1_room);
const v1 = router;

export default v1;
