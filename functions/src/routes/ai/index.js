import { Router } from "express";

import { aiRateLimitStack } from "../../middleware/aiRateLimit.js";
import careerChat from "./careerChat.js";
import interviewQuestions from "./interviewQuestions.js";
import evaluateSession from "./evaluateSession.js";
import profileReview from "./profileReview.js";
import coverLetter from "./coverLetter.js";
import grammar from "./grammar.js";
import paraphrase from "./paraphrase.js";
import resumeReview from "./resumeReview.js";
import linkedinAudit from "./linkedinAudit.js";
import jobFit from "./jobFit.js";
import salaryNegotiate from "./salaryNegotiate.js";

const router = Router();

router.use(aiRateLimitStack);
router.use(careerChat);
router.use(interviewQuestions);
router.use(evaluateSession);
router.use(profileReview);
router.use(coverLetter);
router.use(grammar);
router.use(paraphrase);
router.use(resumeReview);
router.use(linkedinAudit);
router.use(jobFit);
router.use(salaryNegotiate);

export default router;
