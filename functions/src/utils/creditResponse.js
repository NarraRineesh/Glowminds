import { finalizeCreditCharge } from "../services/creditService.js";

/** Attach post-success credit debit info to an API JSON payload. */
export async function withCreditDebit(req, payload) {
  const debit = await finalizeCreditCharge(req);
  if (debit?.balanceAfter == null) return payload;
  return {
    ...payload,
    credits: {
      balance: debit.balanceAfter,
      debited: debit.debited ?? 0,
    },
  };
}
