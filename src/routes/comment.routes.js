import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { addComment, deleteComment, getVideoComments, updateComment } from "../controllers/comment.ctrl.js";

const router=Router()

router.route("/video-comment/:videoId").get(verifyJWT,getVideoComments)
router.route("/add-comment/:videoId").get(verifyJWT,addComment)
router.route("/update-comment/:commentId").patch(verifyJWT, updateComment);
router.route("/delete-comment/:commentId").delete(verifyJWT, deleteComment);

export default router;