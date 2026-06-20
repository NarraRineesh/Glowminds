import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { ApiError } from "../../middleware/errors.js";
import { admin } from "../../config/firebase.js";
import {
  assertCanCreateApplication,
} from "../../services/creditService.js";
import { applicationsCol } from "../../services/userCollections.js";

const router = Router();

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const uid = req.user.uid;
    await assertCanCreateApplication(uid);

    const {
      company = "",
      role = "",
      status = "applied",
      appliedDate = "",
      salary = "",
      notes = "",
      logo = "jobs",
      source = "",
      jobUrl = "",
      jobId = null,
    } = req.body || {};

    if (!String(company).trim() || !String(role).trim()) {
      throw new ApiError("invalid-argument", "company and role are required");
    }

    const col = applicationsCol();

    if (jobId) {
      const existing = await col.where("userId", "==", uid).where("jobId", "==", jobId).limit(1).get();
      if (!existing.empty) {
        const doc = existing.docs[0];
        res.json({ id: doc.id, ...doc.data() });
        return;
      }
    }

    const payload = {
      userId: uid,
      company: String(company).trim(),
      role: String(role).trim(),
      status: String(status || "applied"),
      appliedDate: appliedDate || new Date().toISOString().split("T")[0],
      salary: String(salary || ""),
      notes: String(notes || ""),
      logo: String(logo || "jobs"),
      source: String(source || ""),
      jobUrl: String(jobUrl || ""),
      jobId: jobId || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await col.add(payload);
    res.status(201).json({ id: docRef.id, ...payload, createdAt: new Date().toISOString() });
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError("internal", err.message));
  }
});

export default router;
