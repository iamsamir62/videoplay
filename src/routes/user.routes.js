// Inside user.routes.js

import express from 'express';
import { registerUser } from '../controllers/user.ctrl.js';
import {upload} from "../middlewares/multer.middleware.js"

const router = express.Router();

// Ensure you're handling POST request specifically for '/register'
router.post('/register',upload.fields([
{
    name:"avatar",
    maxCount:1
},
{
    name:"coverImage",
    maxCount:5
}

]) , registerUser);

export default router
