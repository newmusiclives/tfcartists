/**
 * Webhook Event Types
 *
 * All event types supported by the TrueFans Radio webhook system.
 * Operators subscribe to specific events when creating webhook endpoints.
 */

export const WEBHOOK_EVENTS = {
  // Artist events
  "artist.created": "Fired when a new artist is added to the station",
  "artist.updated": "Fired when an artist profile is updated",
  "artist.tier_changed": "Fired when an artist's airplay tier changes",

  // Sponsor events
  "sponsor.created": "Fired when a new sponsor is added",
  "sponsor.deal_closed": "Fired when a sponsor deal is closed",

  // Listener events
  "listener.registered": "Fired when a new listener registers",
  "listener.milestone": "Fired when a listener reaches a listening milestone",

  // Track events
  "track.played": "Fired when a track finishes playing on air",
  "track.submitted": "Fired when a new track is submitted for review",
  "track.approved": "Fired when a submitted track is approved for airplay",

  // Payment events
  "payment.received": "Fired when a payment is received",
  "payment.payout_sent": "Fired when an artist payout is sent",

  // Show events
  "show.started": "Fired when a scheduled show starts",
  "show.ended": "Fired when a scheduled show ends",
} as const;

export type WebhookEventType = keyof typeof WEBHOOK_EVENTS;

export const WEBHOOK_EVENT_LIST = Object.keys(WEBHOOK_EVENTS) as WebhookEventType[];

/** Event category groupings for the UI. */
export const WEBHOOK_EVENT_CATEGORIES: Record<string, { label: string; events: WebhookEventType[] }> = {
  artist: {
    label: "Artist",
    events: ["artist.created", "artist.updated", "artist.tier_changed"],
  },
  sponsor: {
    label: "Sponsor",
    events: ["sponsor.created", "sponsor.deal_closed"],
  },
  listener: {
    label: "Listener",
    events: ["listener.registered", "listener.milestone"],
  },
  track: {
    label: "Track",
    events: ["track.played", "track.submitted", "track.approved"],
  },
  payment: {
    label: "Payment",
    events: ["payment.received", "payment.payout_sent"],
  },
  show: {
    label: "Show",
    events: ["show.started", "show.ended"],
  },
};

/** Example payloads for each event type (used for test pings and docs). */
export const WEBHOOK_EVENT_EXAMPLES: Record<WebhookEventType, object> = {
  "artist.created": {
    artistId: "clx789ghi",
    name: "New Artist",
    genre: "Indie Rock",
    discoverySource: "instagram",
    createdAt: "2026-03-25T12:00:00Z",
  },
  "artist.updated": {
    artistId: "clx789ghi",
    name: "Updated Artist",
    changes: ["genre", "bio"],
    updatedAt: "2026-03-25T12:00:00Z",
  },
  "artist.tier_changed": {
    artistId: "clx789ghi",
    name: "Rising Star",
    previousTier: "LIGHT",
    newTier: "MEDIUM",
    changedAt: "2026-03-25T12:00:00Z",
  },
  "sponsor.created": {
    sponsorId: "clx456def",
    name: "Acme Corp",
    contactEmail: "deals@acme.com",
    createdAt: "2026-03-25T12:00:00Z",
  },
  "sponsor.deal_closed": {
    sponsorId: "clx456def",
    name: "Acme Corp",
    dealValue: 500,
    startDate: "2026-04-01",
    endDate: "2026-06-30",
    closedAt: "2026-03-25T12:00:00Z",
  },
  "listener.registered": {
    listenerId: "clx345mno",
    displayName: "listener42",
    registeredAt: "2026-03-25T12:00:00Z",
  },
  "listener.milestone": {
    listenerId: "clx345mno",
    milestone: "100_hours",
    totalHours: 100,
    achievedAt: "2026-03-25T12:00:00Z",
  },
  "track.played": {
    songId: "clx123abc",
    title: "Summer Breeze",
    artist: "The Sunny Days",
    duration: 234,
    playedAt: "2026-03-25T12:00:00Z",
  },
  "track.submitted": {
    songId: "clx123abc",
    title: "New Song Demo",
    artist: "Unsigned Band",
    submittedAt: "2026-03-25T12:00:00Z",
  },
  "track.approved": {
    songId: "clx123abc",
    title: "Approved Hit",
    artist: "Rising Star",
    approvedAt: "2026-03-25T12:00:00Z",
    tier: "MEDIUM",
  },
  "payment.received": {
    paymentId: "pay_abc123",
    amount: 50.0,
    currency: "USD",
    from: "Acme Corp",
    type: "sponsorship",
    receivedAt: "2026-03-25T12:00:00Z",
  },
  "payment.payout_sent": {
    payoutId: "po_abc123",
    amount: 25.0,
    currency: "USD",
    artistName: "The Sunny Days",
    period: "2026-02",
    sentAt: "2026-03-25T12:00:00Z",
  },
  "show.started": {
    showId: "show_abc123",
    title: "Morning Drive",
    host: "DJ Cassidy",
    startedAt: "2026-03-25T06:00:00Z",
  },
  "show.ended": {
    showId: "show_abc123",
    title: "Morning Drive",
    host: "DJ Cassidy",
    endedAt: "2026-03-25T10:00:00Z",
    duration: 14400,
  },
};
