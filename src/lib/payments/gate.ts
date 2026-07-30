/**
 * One place that decides whether money may actually move.
 *
 * Two independent conditions must both hold:
 *
 *   1. the `station_payments` feature flag is on   - a deliberate business decision
 *   2. Manifest is configured with an API key      - a deployment fact
 *
 * Keeping them separate matters. A configured provider with the flag off is a
 * staging environment or a station not yet selling; the flag on with no provider
 * is a misconfiguration that should be reported loudly rather than silently
 * charging nobody.
 *
 * Callers should use `assertPaymentsEnabled` when a charge is the point of the
 * request, and `paymentsStatus` when they want to record the intent regardless
 * and simply skip the charge.
 */

import { manifest } from "@/lib/payments/manifest";
import { flag } from "@/lib/flags";
import { logger } from "@/lib/logger";

export type PaymentsDisabledReason = "flag_off" | "not_configured";

export interface PaymentsStatus {
  enabled: boolean;
  reason?: PaymentsDisabledReason;
  /** Safe to show a user or an operator */
  message?: string;
}

export async function paymentsStatus(stationId?: string | null): Promise<PaymentsStatus> {
  const flagOn = await flag("station_payments", stationId);

  if (!flagOn) {
    return {
      enabled: false,
      reason: "flag_off",
      message:
        "Payments are turned off. Amounts are recorded but no card is charged. " +
        "Enable the 'Card payments' flag in admin to start taking money.",
    };
  }

  if (!manifest.isConfigured()) {
    // Flag on but no provider is a real misconfiguration, not a normal state
    logger.error("Payments flag is ON but Manifest is not configured", { stationId });
    return {
      enabled: false,
      reason: "not_configured",
      message:
        "Payments are enabled but the payment provider is not configured. " +
        "Add MANIFEST_API_KEY in admin settings.",
    };
  }

  return { enabled: true };
}

export class PaymentsDisabledError extends Error {
  readonly reason: PaymentsDisabledReason;
  constructor(status: PaymentsStatus) {
    super(status.message ?? "Payments are not enabled");
    this.name = "PaymentsDisabledError";
    this.reason = status.reason ?? "flag_off";
  }
}

/** Throws when money cannot move. Use where charging is the purpose of the call. */
export async function assertPaymentsEnabled(stationId?: string | null): Promise<void> {
  const status = await paymentsStatus(stationId);
  if (!status.enabled) throw new PaymentsDisabledError(status);
}
