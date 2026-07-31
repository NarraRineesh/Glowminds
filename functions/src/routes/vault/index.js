import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { ApiError } from "../../middleware/errors.js";
import { admin, getFirestore } from "../../config/firebase.js";

const router = Router();

/**
 * Session-gated file access. Streams a vault file through the API only for its
 * owner, so files are never reachable via a shareable public URL.
 */
router.get("/file/:docId", requireAuth, async (req, res, next) => {
  try {
    const uid = req.user.uid;
    const docId = String(req.params.docId || "").trim();
    if (!docId) throw new ApiError("invalid-argument", "docId is required");

    const snap = await getFirestore()
      .collection("users")
      .doc(uid)
      .collection("vault")
      .doc(docId)
      .get();

    if (!snap.exists) throw new ApiError("not-found", "File not found");

    const data = snap.data() || {};
    const storagePath = data.storagePath;
    if (!storagePath) throw new ApiError("not-found", "File has no storage path");

    // Ownership guard: only files under this user's namespace are allowed.
    const owns =
      storagePath.startsWith(`${uid}/vault/`) ||
      storagePath.startsWith(`vault/${uid}/`);
    if (!owns) throw new ApiError("permission-denied", "Not your file");

    const file = admin.storage().bucket().file(storagePath);
    const [exists] = await file.exists();
    if (!exists) throw new ApiError("not-found", "File missing from storage");

    res.setHeader("Content-Type", data.contentType || "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `inline; filename*=UTF-8''${encodeURIComponent(data.name || "file")}`,
    );
    res.setHeader("Cache-Control", "private, no-store");

    file
      .createReadStream()
      .on("error", (err) => next(new ApiError("internal", err.message)))
      .pipe(res);
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError("internal", err.message));
  }
});

export default router;
