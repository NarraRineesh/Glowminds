import { Router } from "express";
import companies from "./companies.js";
import sync from "./sync.js";
import overview from "./overview.js";

const router = Router();

router.use(overview);
router.use(companies);
router.use(sync);

export default router;
