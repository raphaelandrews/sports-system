// AUTO-GENERATED — do not edit manually.
// Regenerate: bun run gen:types  (requires backend running on localhost:3000)

export interface components {
  schemas: {
    // ─── Auth ────────────────────────────────────────────────────────────────
    RegisterRequest: {
      email: string;
      name: string;
      password: string;
    };
    LoginRequest: {
      email: string;
      password: string;
    };
    TokenResponse: {
      access_token: string;
      refresh_token: string;
      token_type: string;
    };
    RefreshRequest: {
      refresh_token: string;
    };

    // ─── Users ───────────────────────────────────────────────────────────────
    UserRole: "ADMIN" | "CHIEF" | "COACH" | "ATHLETE";
    ChiefRequestStatus: "PENDING" | "APPROVED" | "REJECTED";

    UserResponse: {
      id: number;
      email: string;
      name: string;
      role: components["schemas"]["UserRole"];
      is_active: boolean;
      created_at: string;
    };
    UserSearchResponse: {
      id: number;
      email: string;
      name: string;
      role: components["schemas"]["UserRole"];
      is_active: boolean;
    };
    UserUpdate: {
      name?: string | null;
    };
    ChiefRequestCreate: {
      delegation_name: string;
      message?: string | null;
    };
    ChiefRequestResponse: {
      id: number;
      user_id: number;
      delegation_name: string;
      message: string | null;
      status: components["schemas"]["ChiefRequestStatus"];
      reviewed_by: number | null;
      created_at: string;
    };

    // ─── Delegations ─────────────────────────────────────────────────────────
    DelegationMemberRole: "CHIEF" | "ATHLETE" | "COACH";
    InviteStatus: "PENDING" | "ACCEPTED" | "REFUSED";

    DelegationCreate: {
      name: string;
      code?: string | null;
      flag_url?: string | null;
    };
    DelegationUpdate: {
      name?: string | null;
      flag_url?: string | null;
    };
    DelegationResponse: {
      id: number;
      code: string;
      name: string;
      flag_url: string | null;
      chief_id: number | null;
      is_active: boolean;
      created_at: string;
    };
    MemberInfo: {
      id: number;
      user_id: number;
      user_name: string;
      role: components["schemas"]["DelegationMemberRole"];
      joined_at: string;
      left_at: string | null;
    };
    DelegationDetailResponse: components["schemas"]["DelegationResponse"] & {
      members: components["schemas"]["MemberInfo"][];
    };
    MemberHistoryItem: {
      id: number;
      user_id: number;
      user_name: string;
      role: components["schemas"]["DelegationMemberRole"];
      joined_at: string;
      left_at: string | null;
    };
    InviteCreate: {
      user_id: number;
    };
    InviteResponse: {
      id: number;
      delegation_id: number;
      user_id: number;
      status: components["schemas"]["InviteStatus"];
      created_at: string;
    };

    // ─── Athletes ────────────────────────────────────────────────────────────
    AthleteGender: "M" | "F";

    AthleteCreate: {
      name: string;
      code: string;
      gender?: components["schemas"]["AthleteGender"] | null;
      birthdate?: string | null;
      user_id?: number | null;
    };
    AthleteUpdate: {
      name?: string | null;
      gender?: components["schemas"]["AthleteGender"] | null;
      birthdate?: string | null;
      is_active?: boolean | null;
    };
    AthleteResponse: {
      id: number;
      name: string;
      code: string;
      gender: components["schemas"]["AthleteGender"] | null;
      birthdate: string | null;
      is_active: boolean;
      user_id: number | null;
      created_at: string;
    };
    DelegationHistoryItem: {
      delegation_id: number;
      delegation_name: string;
      delegation_code: string;
      role: string;
      joined_at: string;
      left_at: string | null;
    };
    MatchHistoryItem: {
      match_id: number;
      event_id: number;
      modality_name: string;
      sport_name: string;
      delegation_code: string;
      role: string;
      match_date: string | null;
    };
    AthleteHistoryResponse: {
      delegation_history: components["schemas"]["DelegationHistoryItem"][];
      match_history: components["schemas"]["MatchHistoryItem"][];
    };
    AthleteStatisticsResponse: {
      athlete_id: number;
      total_matches: number;
      modalities: string[];
      raw: Record<string, unknown>[];
    };

    // ─── Sports ──────────────────────────────────────────────────────────────
    SportType: "INDIVIDUAL" | "TEAM";
    Gender: "M" | "F" | "MIXED";

    SportResponse: {
      id: number;
      name: string;
      sport_type: components["schemas"]["SportType"];
      description: string | null;
      rules_json: Record<string, unknown>;
      player_count: number | null;
      is_active: boolean;
      created_at: string;
    };
    SportDetailResponse: components["schemas"]["SportResponse"] & {
      modalities: components["schemas"]["ModalityResponse"][];
      stats_schema: Record<string, unknown> | null;
    };
    SportCreate: {
      name: string;
      sport_type: components["schemas"]["SportType"];
      description?: string | null;
      rules_json?: Record<string, unknown>;
      player_count?: number | null;
    };
    SportUpdate: {
      name?: string | null;
      description?: string | null;
      rules_json?: Record<string, unknown> | null;
      player_count?: number | null;
    };
    ModalityResponse: {
      id: number;
      sport_id: number;
      name: string;
      gender: components["schemas"]["Gender"];
      category: string | null;
      rules_json: Record<string, unknown>;
      is_active: boolean;
    };
    ModalityCreate: {
      name: string;
      gender: components["schemas"]["Gender"];
      category?: string | null;
      rules_json?: Record<string, unknown>;
    };
    ModalityUpdate: {
      name?: string | null;
      gender?: components["schemas"]["Gender"] | null;
      category?: string | null;
      rules_json?: Record<string, unknown> | null;
    };

    // ─── Weeks ───────────────────────────────────────────────────────────────
    WeekStatus: "DRAFT" | "SCHEDULED" | "LOCKED" | "ACTIVE" | "COMPLETED";

    WeekCreate: {
      week_number: number;
      start_date: string;
      end_date: string;
      sport_focus?: number[];
    };
    WeekUpdate: {
      week_number?: number | null;
      start_date?: string | null;
      end_date?: string | null;
      sport_focus?: number[] | null;
    };
    WeekResponse: {
      id: number;
      week_number: number;
      start_date: string;
      end_date: string;
      status: components["schemas"]["WeekStatus"];
      sport_focus: number[];
    };
    SchedulePreviewMatch: {
      modality_id: number;
      modality_name: string;
      team_a: string;
      team_b: string;
    };
    GenerateSchedulePreview: {
      week_id: number;
      matches: components["schemas"]["SchedulePreviewMatch"][];
    };

    // ─── Events & Matches ────────────────────────────────────────────────────
    EventPhase: "GROUPS" | "QUARTER" | "SEMI" | "FINAL" | "BRONZE";
    EventStatus: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
    MatchStatus: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
    ParticipantRole: "PLAYER" | "CAPTAIN" | "SUBSTITUTE";
    MatchEventType:
      | "GOAL"
      | "CARD_YELLOW"
      | "CARD_RED"
      | "POINT"
      | "PENALTY"
      | "SUBSTITUTION"
      | "SET_END"
      | "IPPON"
      | "WAZA_ARI";

    EventCreate: {
      week_id: number;
      modality_id: number;
      event_date: string;
      start_time: string;
      venue?: string | null;
      phase: components["schemas"]["EventPhase"];
    };
    EventUpdate: {
      event_date?: string | null;
      start_time?: string | null;
      venue?: string | null;
      phase?: components["schemas"]["EventPhase"] | null;
      status?: components["schemas"]["EventStatus"] | null;
    };
    EventResponse: {
      id: number;
      week_id: number;
      modality_id: number;
      event_date: string;
      start_time: string;
      venue: string | null;
      phase: components["schemas"]["EventPhase"];
      status: components["schemas"]["EventStatus"];
    };
    MatchParticipantResponse: {
      id: number;
      match_id: number;
      athlete_id: number;
      delegation_id_at_time: number;
      role: components["schemas"]["ParticipantRole"];
    };
    MatchEventResponse: {
      id: number;
      match_id: number;
      minute: number | null;
      event_type: components["schemas"]["MatchEventType"];
      athlete_id: number | null;
      delegation_id_at_time: number | null;
      value_json: Record<string, unknown> | null;
      created_at: string;
    };
    MatchEventCreate: {
      minute?: number | null;
      event_type: components["schemas"]["MatchEventType"];
      athlete_id?: number | null;
      delegation_id_at_time?: number | null;
      value_json?: Record<string, unknown> | null;
    };
    MatchResponse: {
      id: number;
      event_id: number;
      team_a_delegation_id: number | null;
      team_b_delegation_id: number | null;
      athlete_a_id: number | null;
      athlete_b_id: number | null;
      score_a: number | null;
      score_b: number | null;
      winner_delegation_id: number | null;
      winner_athlete_id: number | null;
      status: components["schemas"]["MatchStatus"];
      started_at: string | null;
      ended_at: string | null;
    };
    MatchDetailResponse: components["schemas"]["MatchResponse"] & {
      participants: components["schemas"]["MatchParticipantResponse"][];
      events: components["schemas"]["MatchEventResponse"][];
    };
    EventDetailResponse: components["schemas"]["EventResponse"] & {
      matches: components["schemas"]["MatchResponse"][];
    };

    // ─── Enrollments ─────────────────────────────────────────────────────────
    EnrollmentStatus: "PENDING" | "APPROVED" | "REJECTED";

    EnrollmentCreate: {
      athlete_id: number;
      event_id: number;
      delegation_id: number;
    };
    EnrollmentReview: {
      status: components["schemas"]["EnrollmentStatus"];
      validation_message?: string | null;
    };
    EnrollmentResponse: {
      id: number;
      athlete_id: number;
      event_id: number;
      delegation_id: number;
      status: components["schemas"]["EnrollmentStatus"];
      validation_message: string | null;
      created_at: string;
    };

    // ─── Results ─────────────────────────────────────────────────────────────
    Medal: "GOLD" | "SILVER" | "BRONZE";

    ResultCreate: {
      match_id: number;
      delegation_id?: number | null;
      athlete_id?: number | null;
      rank: number;
      medal?: components["schemas"]["Medal"] | null;
      value_json?: Record<string, unknown> | null;
    };
    ResultUpdate: {
      rank?: number | null;
      medal?: components["schemas"]["Medal"] | null;
      value_json?: Record<string, unknown> | null;
    };
    ResultResponse: {
      id: number;
      match_id: number;
      delegation_id: number | null;
      athlete_id: number | null;
      rank: number;
      medal: components["schemas"]["Medal"] | null;
      value_json: Record<string, unknown> | null;
    };
    MedalBoardEntry: {
      delegation_id: number;
      delegation_name: string;
      delegation_code: string;
      gold: number;
      silver: number;
      bronze: number;
      total: number;
    };
    SportStandingEntry: {
      rank: number;
      delegation_id: number | null;
      delegation_name: string | null;
      athlete_id: number | null;
      athlete_name: string | null;
      medal: components["schemas"]["Medal"] | null;
      value_json: Record<string, unknown> | null;
    };
    RecordResponse: {
      id: number;
      modality_id: number;
      modality_name: string;
      athlete_id: number;
      athlete_name: string;
      delegation_name: string;
      value: string;
      week_id: number;
      set_at: string;
    };

    // ─── Notifications ───────────────────────────────────────────────────────
    NotificationType:
      | "INVITE"
      | "REQUEST_REVIEWED"
      | "MATCH_REMINDER"
      | "RESULT"
      | "TRANSFER";

    NotificationResponse: {
      id: number;
      user_id: number;
      notification_type: components["schemas"]["NotificationType"];
      payload: Record<string, unknown>;
      read: boolean;
      created_at: string;
    };

    // ─── Reports ─────────────────────────────────────────────────────────────
    CompetitionSummary: {
      total_delegations: number;
      total_athletes: number;
      total_weeks: number;
      total_events: number;
      total_matches: number;
      completed_matches: number;
    };
    AthleteBySportEntry: {
      sport_id: number;
      sport_name: string;
      athlete_count: number;
    };
    WeekSummary: {
      total_events: number;
      completed_matches: number;
      total_matches: number;
    };
    WeekReportResponse: {
      week_id: number;
      week_number: number;
      status: string;
      start_date: string;
      end_date: string;
      medal_board: components["schemas"]["MedalBoardEntry"][];
      summary: components["schemas"]["WeekSummary"];
    };
    FinalReportResponse: {
      medal_board: components["schemas"]["MedalBoardEntry"][];
      records: components["schemas"]["RecordResponse"][];
      summary: components["schemas"]["CompetitionSummary"];
      athletes_by_sport: components["schemas"]["AthleteBySportEntry"][];
    };
    AthleteReportResponse: {
      athlete: components["schemas"]["AthleteResponse"];
      delegation_history: components["schemas"]["DelegationHistoryItem"][];
      match_history: components["schemas"]["MatchHistoryItem"][];
      medals: components["schemas"]["ResultResponse"][];
      statistics: Record<string, unknown>;
    };
    NarrativeResponse: {
      id: number;
      narrative_date: string;
      content: string;
      generated_at: string;
    };
    AIGenerationResponse: {
      id: number;
      generation_type: string;
      count: number;
      created_at: string;
    };

    // ─── Common ──────────────────────────────────────────────────────────────
    Meta: {
      total: number;
      page: number;
      per_page: number;
    };
    ErrorResponse: {
      error: string;
      detail: string;
      code: string;
    };
  };
}

export type ApiSchemas = components["schemas"];
