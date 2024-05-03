import { Router } from "express";
import { getLikedVideos, toggleCommentLike, toggleVideoLike } from "../controllers/like.ctrl.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router=Router()

router.route("/like-video/:videoId").get(verifyJWT, toggleVideoLike);
router.route("/like-comment/:commentId").get(verifyJWT, toggleCommentLike);
router.route("/liked-video").get(verifyJWT, getLikedVideos);

export default router;