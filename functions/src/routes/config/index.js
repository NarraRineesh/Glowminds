import { Router } from "express";
import landing from "./landing.js";
import pricing from "./pricing.js";

const router = Router();

router.use(landing);
router.use(pricing);

export default router;
