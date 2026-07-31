import { finalizeCreditCharge } from "../services/creditService.js";
import { recordFeatureUsage } from "../services/featurePolicy.js";

/** Attach post-success credit debit info to an API JSON payload. */
export async function withCreditDebit(req, payload) {
  const debit = await finalizeCreditCharge(req);
  const policyId = req.creditCharge?.policyId || req.creditCharge?.featureKey;
  if (req.user?.uid && policyId) {
    try {
      await recordFeatureUsage(req.user.uid, policyId);
    } catch {
      /* non-fatal */
    }
  }
  if (debit?.balanceAfter == null) return payload;
  return {
    ...payload,
    credits: {
      balance: debit.balanceAfter,
      debited: debit.debited ?? 0,
    },
  };
}
