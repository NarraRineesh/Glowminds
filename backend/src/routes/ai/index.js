import { Router } from "express";

import careerChat from "./careerChat.js";
import interviewQuestions from "./interviewQuestions.js";
import evaluateSession from "./evaluateSession.js";
import jobMatch from "./jobMatch.js";
import profileReview from "./profileReview.js";
import coverLetter from "./coverLetter.js";
import grammar from "./grammar.js";
import paraphrase from "./paraphrase.js";
import parseResume from "./parseResume.js";

const router = Router();

router.use(careerChat);
router.use(interviewQuestions);
router.use(evaluateSession);
router.use(jobMatch);
router.use(profileReview);
router.use(coverLetter);
router.use(grammar);
router.use(paraphrase);
router.use(parseResume);

export default router;
