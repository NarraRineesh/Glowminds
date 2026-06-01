import { Router } from "express";
import pricing from "./pricing.js";

const router = Router();

router.use(pricing);

export default router;
