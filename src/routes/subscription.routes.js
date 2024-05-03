import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    getSubscribedChannels,
    getUserChannelSubscribers,
    toggleSubscription,
} from "../controllers/subscription.ctrl.js";

const router = Router();

router.route("/subscribe/:channelId").get(verifyJWT, toggleSubscription);
router
    .route("/subscribers/:subscriberId")
    .get(verifyJWT, getUserChannelSubscribers);
router
    .route("/subscribed/:channelId")
    .get(verifyJWT, getSubscribedChannels);

export default router;