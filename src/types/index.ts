export type ArtistStatus =
  | "DISCOVERED"
  | "CONTACTED"
  | "ENGAGED"
  | "QUALIFIED"
  | "ONBOARDING"
  | "ACTIVATED"
  | "ACTIVE"
  | "INNER_CIRCLE"
  | "DORMANT"
  | "UNRESPONSIVE";

export type PipelineStage =
  | "discovery"
  | "contacted"
  | "engaged"
  | "qualified"
  | "onboarding"
  | "activated"
  | "active";

export type ShowStatus = "SCHEDULED" | "REMINDED" | "LIVE" | "COMPLETED" | "CANCELLED";

export interface Artist {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  genre?: string;
  status: ArtistStatus;
  pipelineStage: PipelineStage;
  nextShowDate?: Date;
  nextShowVenue?: string;
  hasUsedNineWord: boolean;
  conversationCount: number;
}

export interface ConversationMessage {
  id: string;
  role: "riley" | "artist" | "system";
  content: string;
  createdAt: Date;
  intent?: string;
}
