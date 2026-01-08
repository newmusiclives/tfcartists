/**
 * TypeScript types for Cassidy's Submission Review System
 * Matches Prisma schema models
 */

// ============================================================================
// ENUMS
// ============================================================================

export enum SubmissionStatus {
  PENDING = "PENDING",
  IN_REVIEW = "IN_REVIEW",
  JUDGED = "JUDGED",
  PLACED = "PLACED",
  NOT_PLACED = "NOT_PLACED",
}

export enum RotationTier {
  BRONZE = "BRONZE",
  SILVER = "SILVER",
  GOLD = "GOLD",
  PLATINUM = "PLATINUM",
}

// ============================================================================
// CORE MODELS
// ============================================================================

export interface Submission {
  id: string;
  createdAt: Date | string;
  updatedAt: Date | string;

  // Artist info
  artistId: string;
  artistName: string;
  artistEmail?: string;
  artistPhone?: string;

  // Track details
  trackTitle: string;
  trackFileUrl: string;
  trackDuration?: number;
  genre?: string;
  genreTags?: string;

  // Submission context (from Riley)
  discoverySource?: string;
  discoveredBy?: string;
  rileyContext?: any;

  // Review status
  status: SubmissionStatus;
  submissionType: string;

  // Judging timeline
  judgingStartedAt?: Date | string;
  judgingCompletedAt?: Date | string;

  // Final decision
  tierAwarded?: RotationTier;
  awardedAt?: Date | string;
  rotationSpinsWeekly?: number;
  decisionRationale?: string;

  // Progression pathway
  upgradePathway?: any;

  // Revenue
  premiumFastTrack: boolean;
  fastTrackFee?: number;

  // Relationships
  reviews?: SubmissionReview[];
  tierHistory?: TierPlacement[];

  metadata?: any;
}

export interface SubmissionReview {
  id: string;
  createdAt: Date | string;

  submissionId: string;
  judgeId: string;

  // Numerical scores (0-100)
  overallScore?: number;
  productionQuality?: number;
  commercialViability?: number;
  artisticMerit?: number;
  performanceQuality?: number;
  culturalSignificance?: number;
  growthPotential?: number;

  // Qualitative assessment
  strengths?: string;
  growthAreas?: string;
  tierRecommendation?: RotationTier;
  upgradePathwayAdvice?: string;

  // Judge-specific notes
  technicalNotes?: string;
  programmingNotes?: string;
  performanceNotes?: string;
  musicologicalNotes?: string;
  audienceNotes?: string;

  scoredAt: Date | string;

  // Populated relations
  judge?: Judge;
  submission?: Submission;
}

export interface Judge {
  id: string;
  createdAt: Date | string;
  updatedAt: Date | string;

  name: string;
  role: string;
  expertiseArea?: string;
  bio?: string;

  // Performance metrics
  avgScoreAccuracy?: number;
  judgingConsistency?: number;
  totalSubmissionsJudged: number;

  // Status
  isActive: boolean;
  availabilitySchedule?: any;

  // Relationships
  reviews?: SubmissionReview[];

  metadata?: any;
}

export interface TierPlacement {
  id: string;
  createdAt: Date | string;

  submissionId?: string;
  artistId: string;
  artistName: string;

  // Tier change
  previousTier?: RotationTier;
  newTier: RotationTier;
  changeDate: Date | string;
  reason?: string;
  decidedBy: string;

  // Judge scores summary
  judgeScores?: any;

  // Progression context
  isProgression: boolean;
  timeInPreviousTierDays?: number;
  improvementNotes?: string;

  metadata?: any;
}

export interface ProgressionRequest {
  id: string;
  createdAt: Date | string;
  updatedAt: Date | string;

  artistId: string;
  artistName: string;
  submissionId: string;

  // Request details
  currentTier: RotationTier;
  requestedTier: RotationTier;
  requestDate: Date | string;
  timeSinceLastTierDays?: number;

  // Artist's claims
  improvementsClaimed?: string;
  newMaterialDescription?: string;

  // Riley support
  rileyRecommendation?: string;
  rileyConfidenceScore?: number;

  // Review status
  reviewStatus: string;
  reviewDate?: Date | string;
  reviewerId?: string;
  decisionRationale?: string;

  // Outcome
  upgradeApproved?: boolean;
  newTierIfApproved?: RotationTier;
  timelineToResubmit?: string;

  metadata?: any;
}

export interface RotationSlot {
  id: string;
  createdAt: Date | string;
  updatedAt: Date | string;

  // Time configuration
  daypart: string;
  dayOfWeek: number;
  timeStart: string;
  timeEnd: string;

  // Current assignment
  currentArtistId?: string;
  currentArtistName?: string;
  currentTrackId?: string;
  currentTier?: RotationTier;
  indieVsMainstream: string;

  // Replacement strategy
  replacementCandidateArtistId?: string;
  replacementReadinessScore?: number;
  replacementScheduledDate?: Date | string;

  // Sponsor integration (Harper)
  sponsorId?: string;
  sponsorIntegrationType?: string;

  // Performance (Elliott)
  avgEngagementScore?: number;
  skipRate?: number;
  listenerFeedback?: any;

  // 80/20 transformation
  mainstreamReplaced: boolean;
  replacedAt?: Date | string;
  progressContribution?: number;

  metadata?: any;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreateSubmissionRequest {
  artistId: string;
  artistName: string;
  artistEmail?: string;
  artistPhone?: string;
  trackTitle: string;
  trackFileUrl: string;
  trackDuration?: number;
  genre?: string;
  genreTags?: string[];
  discoverySource?: string;
  discoveredBy?: string;
  rileyContext?: any;
  submissionType?: string;
  premiumFastTrack?: boolean;
}

export interface SubmitReviewRequest {
  submissionId: string;
  judgeId: string;
  scores: {
    overallScore: number;
    productionQuality?: number;
    commercialViability?: number;
    artisticMerit?: number;
    performanceQuality?: number;
    culturalSignificance?: number;
    growthPotential?: number;
  };
  qualitative: {
    strengths?: string;
    growthAreas?: string;
    tierRecommendation?: RotationTier;
    upgradePathwayAdvice?: string;
  };
  judgeSpecificNotes?: {
    technicalNotes?: string;
    programmingNotes?: string;
    performanceNotes?: string;
    musicologicalNotes?: string;
    audienceNotes?: string;
  };
}

export interface AssignTierRequest {
  submissionId: string;
  tierAwarded: RotationTier;
  rotationSpinsWeekly: number;
  decisionRationale: string;
  upgradePathway?: {
    nextTier: RotationTier;
    timeline: string;
    specificImprovements: string[];
    resourcesRecommended: string[];
  };
  rotationIntegration?: {
    daypartRecommendation: string;
    genreFit: string;
    replacesMainstreamSlot: boolean;
  };
}

// ============================================================================
// DASHBOARD STATISTICS
// ============================================================================

export interface CassidyStats {
  totalArtistsInRotation: number;
  byTier: {
    BRONZE: number;
    SILVER: number;
    GOLD: number;
    PLATINUM: number;
  };
  submissionsThisMonth: number;
  placementRate: number;
  avgReviewTime: number;
  rotationTransformation: {
    indie: number;
    mainstream: number;
    target: number;
  };
  pendingSubmissions: number;
  inReview: number;
  judgedThisWeek: number;
}

export interface SubmissionListItem {
  id: string;
  artistName: string;
  trackTitle: string;
  status: SubmissionStatus;
  tierAwarded?: RotationTier;
  submittedAt: string;
  judgesCompleted: number;
  totalJudges: number;
}

export interface ProgressionRequestListItem {
  id: string;
  artistName: string;
  currentTier: RotationTier;
  requestedTier: RotationTier;
  submittedDaysAgo: number;
  status: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface TierDistribution {
  tier: RotationTier;
  count: number;
  percentage: number;
  spinsPerWeek: string;
  color: string;
}

export interface RotationTransformationProgress {
  current: {
    indie: number;
    mainstream: number;
  };
  target: {
    indie: number;
    mainstream: number;
  };
  progressPercentage: number;
  slotsRemaining: number;
  estimatedCompletion?: string;
}
