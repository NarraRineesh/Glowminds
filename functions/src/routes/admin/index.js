import { Router } from "express";
import overview from "./overview.js";
import users from "./users.js";
import pricing from "./pricing.js";

const router = Router();

router.use(overview);
router.use(pricing);
router.use(users);

export default router;
