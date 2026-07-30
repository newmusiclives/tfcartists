import { describe, it, expect, beforeEach, vi } from "vitest";

/**
 * The payment gate decides whether real money moves. A gate that fails OPEN
 * would be worse than no gate, so every path is asserted explicitly.
 */

const flagMock = vi.fn();
const isConfiguredMock = vi.fn();

vi.mock("@/lib/flags", () => ({
  flag: (...args: unknown[]) => flagMock(...args),
}));

vi.mock("@/lib/payments/manifest", () => ({
  manifest: { isConfigured: () => isConfiguredMock() },
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import {
  paymentsStatus,
  assertPaymentsEnabled,
  PaymentsDisabledError,
} from "@/lib/payments/gate";

beforeEach(() => {
  flagMock.mockReset();
  isConfiguredMock.mockReset();
});

describe("paymentsStatus", () => {
  it("is disabled when the flag is off, even with a configured provider", async () => {
    flagMock.mockResolvedValue(false);
    isConfiguredMock.mockReturnValue(true);

    const status = await paymentsStatus();
    expect(status.enabled).toBe(false);
    expect(status.reason).toBe("flag_off");
  });

  it("is disabled when the flag is on but the provider is missing", async () => {
    flagMock.mockResolvedValue(true);
    isConfiguredMock.mockReturnValue(false);

    const status = await paymentsStatus();
    expect(status.enabled).toBe(false);
    expect(status.reason).toBe("not_configured");
  });

  it("is enabled only when both conditions hold", async () => {
    flagMock.mockResolvedValue(true);
    isConfiguredMock.mockReturnValue(true);

    const status = await paymentsStatus();
    expect(status.enabled).toBe(true);
    expect(status.reason).toBeUndefined();
  });

  it("passes the station through so payments can be enabled per station", async () => {
    flagMock.mockResolvedValue(true);
    isConfiguredMock.mockReturnValue(true);

    await paymentsStatus("station-1");
    expect(flagMock).toHaveBeenCalledWith("station_payments", "station-1");
  });

  it("never leaks provider details in the operator-facing message", async () => {
    flagMock.mockResolvedValue(false);
    isConfiguredMock.mockReturnValue(true);

    const status = await paymentsStatus();
    expect(status.message).toBeTruthy();
    expect(status.message).not.toMatch(/api[_ ]?key|secret|token/i);
  });
});

describe("assertPaymentsEnabled", () => {
  it("throws with the reason attached when disabled", async () => {
    flagMock.mockResolvedValue(false);
    isConfiguredMock.mockReturnValue(true);

    await expect(assertPaymentsEnabled()).rejects.toBeInstanceOf(PaymentsDisabledError);
    await assertPaymentsEnabled().catch((e: PaymentsDisabledError) => {
      expect(e.reason).toBe("flag_off");
    });
  });

  it("resolves quietly when enabled", async () => {
    flagMock.mockResolvedValue(true);
    isConfiguredMock.mockReturnValue(true);
    await expect(assertPaymentsEnabled()).resolves.toBeUndefined();
  });
});
