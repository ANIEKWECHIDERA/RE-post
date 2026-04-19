export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type TableDefinition<Row, Insert = Row, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: Array<{
    foreignKeyName: string;
    columns: string[];
    referencedRelation: string;
    referencedColumns: string[];
  }>;
};

export type SocialPlatform = 'linkedin' | 'facebook' | 'instagram';
export type SocialConnectionStatus =
  | 'pending'
  | 'active'
  | 'expired'
  | 'revoked'
  | 'error';
export type MediaKind = 'image' | 'video';
export type MediaAssetStatus =
  | 'uploaded'
  | 'processing'
  | 'ready'
  | 'rejected'
  | 'deleted';
export type PostStatus =
  | 'draft'
  | 'scheduled'
  | 'queued'
  | 'publishing'
  | 'published'
  | 'partially_failed'
  | 'failed'
  | 'canceled';
export type ScheduleMode = 'now' | 'scheduled';
export type PostTargetStatus =
  | 'draft'
  | 'pending'
  | 'queued'
  | 'publishing'
  | 'published'
  | 'failed'
  | 'retry_scheduled'
  | 'canceled';
export type PublishJobStatus =
  | 'queued'
  | 'claimed'
  | 'running'
  | 'succeeded'
  | 'partially_failed'
  | 'failed'
  | 'canceled';
export type PublishAttemptStatus = 'started' | 'succeeded' | 'failed';
export type ActivityEventType =
  | 'profile_bootstrapped'
  | 'social_connection_created'
  | 'social_connection_updated'
  | 'media_uploaded'
  | 'media_validated'
  | 'post_created'
  | 'post_updated'
  | 'post_scheduled'
  | 'publish_queued'
  | 'publish_started'
  | 'publish_succeeded'
  | 'publish_failed'
  | 'retry_scheduled'
  | 'streak_updated';
export type StreakEventType =
  | 'incremented'
  | 'maintained'
  | 'missed'
  | 'recovered'
  | 'reset';

type Timestamp = string;
type Uuid = string;

export type Database = {
  public: {
    Tables: {
      profiles: TableDefinition<
        {
          id: Uuid;
          handle: string | null;
          display_name: string | null;
          avatar_url: string | null;
          timezone: string;
          onboarding_completed_at: Timestamp | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        },
        {
          id: Uuid;
          handle?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          timezone?: string;
          onboarding_completed_at?: Timestamp | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        }
      >;
      social_connections: TableDefinition<
        {
          id: Uuid;
          user_id: Uuid;
          platform: SocialPlatform;
          provider_account_id: string;
          display_name: string | null;
          handle: string | null;
          avatar_url: string | null;
          scopes: string[];
          status: SocialConnectionStatus;
          access_token_ciphertext: string | null;
          refresh_token_ciphertext: string | null;
          token_expires_at: Timestamp | null;
          token_refreshed_at: Timestamp | null;
          token_last_checked_at: Timestamp | null;
          token_last_refresh_attempt_at: Timestamp | null;
          token_key_version: string;
          connected_at: Timestamp | null;
          disconnected_at: Timestamp | null;
          last_error_code: string | null;
          last_error_message: string | null;
          metadata: Json;
          created_at: Timestamp;
          updated_at: Timestamp;
        },
        {
          id?: Uuid;
          user_id: Uuid;
          platform: SocialPlatform;
          provider_account_id: string;
          display_name?: string | null;
          handle?: string | null;
          avatar_url?: string | null;
          scopes?: string[];
          status?: SocialConnectionStatus;
          access_token_ciphertext?: string | null;
          refresh_token_ciphertext?: string | null;
          token_expires_at?: Timestamp | null;
          token_refreshed_at?: Timestamp | null;
          token_last_checked_at?: Timestamp | null;
          token_last_refresh_attempt_at?: Timestamp | null;
          token_key_version?: string;
          connected_at?: Timestamp | null;
          disconnected_at?: Timestamp | null;
          last_error_code?: string | null;
          last_error_message?: string | null;
          metadata?: Json;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        }
      >;
      media_assets: TableDefinition<
        {
          id: Uuid;
          user_id: Uuid;
          storage_bucket: string;
          storage_path: string;
          original_filename: string;
          mime_type: string;
          byte_size: number;
          kind: MediaKind;
          width: number | null;
          height: number | null;
          duration_seconds: number | null;
          aspect_ratio: number | null;
          checksum: string | null;
          status: MediaAssetStatus;
          metadata: Json;
          validation_warnings: Json;
          created_at: Timestamp;
          updated_at: Timestamp;
          deleted_at: Timestamp | null;
        },
        {
          id?: Uuid;
          user_id: Uuid;
          storage_bucket?: string;
          storage_path: string;
          original_filename: string;
          mime_type: string;
          byte_size: number;
          kind: MediaKind;
          width?: number | null;
          height?: number | null;
          duration_seconds?: number | null;
          aspect_ratio?: number | null;
          checksum?: string | null;
          status?: MediaAssetStatus;
          metadata?: Json;
          validation_warnings?: Json;
          created_at?: Timestamp;
          updated_at?: Timestamp;
          deleted_at?: Timestamp | null;
        }
      >;
      media_variants: TableDefinition<
        {
          id: Uuid;
          media_asset_id: Uuid;
          user_id: Uuid;
          platform: SocialPlatform | null;
          storage_bucket: string;
          storage_path: string;
          width: number | null;
          height: number | null;
          mime_type: string;
          byte_size: number;
          transform_strategy: string;
          metadata: Json;
          created_at: Timestamp;
        },
        {
          id?: Uuid;
          media_asset_id: Uuid;
          user_id: Uuid;
          platform?: SocialPlatform | null;
          storage_bucket?: string;
          storage_path: string;
          width?: number | null;
          height?: number | null;
          mime_type: string;
          byte_size: number;
          transform_strategy?: string;
          metadata?: Json;
          created_at?: Timestamp;
        }
      >;
      posts: TableDefinition<
        {
          id: Uuid;
          user_id: Uuid;
          body: string;
          status: PostStatus;
          schedule_mode: ScheduleMode;
          scheduled_at: Timestamp | null;
          timezone: string;
          published_at: Timestamp | null;
          created_at: Timestamp;
          updated_at: Timestamp;
          archived_at: Timestamp | null;
        },
        {
          id?: Uuid;
          user_id: Uuid;
          body?: string;
          status?: PostStatus;
          schedule_mode?: ScheduleMode;
          scheduled_at?: Timestamp | null;
          timezone?: string;
          published_at?: Timestamp | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
          archived_at?: Timestamp | null;
        }
      >;
      post_media_assets: TableDefinition<
        {
          post_id: Uuid;
          media_asset_id: Uuid;
          user_id: Uuid;
          sort_order: number;
          created_at: Timestamp;
        },
        {
          post_id: Uuid;
          media_asset_id: Uuid;
          user_id: Uuid;
          sort_order?: number;
          created_at?: Timestamp;
        }
      >;
      post_platform_targets: TableDefinition<
        {
          id: Uuid;
          post_id: Uuid;
          user_id: Uuid;
          social_connection_id: Uuid | null;
          platform: SocialPlatform;
          status: PostTargetStatus;
          platform_body: string | null;
          settings: Json;
          validation_warnings: Json;
          provider_publish_id: string | null;
          provider_permalink: string | null;
          last_error_code: string | null;
          last_error_message: string | null;
          published_at: Timestamp | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        },
        {
          id?: Uuid;
          post_id: Uuid;
          user_id: Uuid;
          social_connection_id?: Uuid | null;
          platform: SocialPlatform;
          status?: PostTargetStatus;
          platform_body?: string | null;
          settings?: Json;
          validation_warnings?: Json;
          provider_publish_id?: string | null;
          provider_permalink?: string | null;
          last_error_code?: string | null;
          last_error_message?: string | null;
          published_at?: Timestamp | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        }
      >;
      publish_jobs: TableDefinition<
        {
          id: Uuid;
          user_id: Uuid;
          post_id: Uuid;
          status: PublishJobStatus;
          run_at: Timestamp;
          claimed_at: Timestamp | null;
          locked_until: Timestamp | null;
          worker_id: string | null;
          attempts_count: number;
          max_attempts: number;
          idempotency_key: string;
          last_error_code: string | null;
          last_error_message: string | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        },
        {
          id?: Uuid;
          user_id: Uuid;
          post_id: Uuid;
          status?: PublishJobStatus;
          run_at?: Timestamp;
          claimed_at?: Timestamp | null;
          locked_until?: Timestamp | null;
          worker_id?: string | null;
          attempts_count?: number;
          max_attempts?: number;
          idempotency_key: string;
          last_error_code?: string | null;
          last_error_message?: string | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        }
      >;
      publish_attempts: TableDefinition<
        {
          id: Uuid;
          user_id: Uuid;
          publish_job_id: Uuid;
          post_platform_target_id: Uuid;
          platform: SocialPlatform;
          attempt_number: number;
          status: PublishAttemptStatus;
          provider_request_id: string | null;
          provider_publish_id: string | null;
          normalized_error_code: string | null;
          normalized_error_message: string | null;
          retry_after: Timestamp | null;
          started_at: Timestamp;
          finished_at: Timestamp | null;
          created_at: Timestamp;
        },
        {
          id?: Uuid;
          user_id: Uuid;
          publish_job_id: Uuid;
          post_platform_target_id: Uuid;
          platform: SocialPlatform;
          attempt_number: number;
          status?: PublishAttemptStatus;
          provider_request_id?: string | null;
          provider_publish_id?: string | null;
          normalized_error_code?: string | null;
          normalized_error_message?: string | null;
          retry_after?: Timestamp | null;
          started_at?: Timestamp;
          finished_at?: Timestamp | null;
          created_at?: Timestamp;
        }
      >;
      activity_events: TableDefinition<
        {
          id: Uuid;
          user_id: Uuid;
          post_id: Uuid | null;
          post_platform_target_id: Uuid | null;
          type: ActivityEventType;
          title: string;
          message: string | null;
          metadata: Json;
          created_at: Timestamp;
        },
        {
          id?: Uuid;
          user_id: Uuid;
          post_id?: Uuid | null;
          post_platform_target_id?: Uuid | null;
          type: ActivityEventType;
          title: string;
          message?: string | null;
          metadata?: Json;
          created_at?: Timestamp;
        }
      >;
      streak_state: TableDefinition<
        {
          user_id: Uuid;
          timezone: string;
          current_count: number;
          longest_count: number;
          last_counted_on: string | null;
          last_successful_post_id: Uuid | null;
          updated_at: Timestamp;
        },
        {
          user_id: Uuid;
          timezone?: string;
          current_count?: number;
          longest_count?: number;
          last_counted_on?: string | null;
          last_successful_post_id?: Uuid | null;
          updated_at?: Timestamp;
        }
      >;
      streak_events: TableDefinition<
        {
          id: Uuid;
          user_id: Uuid;
          post_id: Uuid | null;
          event_date: string;
          type: StreakEventType;
          previous_count: number;
          new_count: number;
          metadata: Json;
          created_at: Timestamp;
        },
        {
          id?: Uuid;
          user_id: Uuid;
          post_id?: Uuid | null;
          event_date: string;
          type: StreakEventType;
          previous_count?: number;
          new_count?: number;
          metadata?: Json;
          created_at?: Timestamp;
        }
      >;
      analytics_daily_rollups: TableDefinition<
        {
          id: Uuid;
          user_id: Uuid;
          rollup_date: string;
          platform: SocialPlatform | null;
          posts_created: number;
          posts_published: number;
          publish_successes: number;
          publish_failures: number;
          scheduled_posts: number;
          metadata: Json;
          created_at: Timestamp;
          updated_at: Timestamp;
        },
        {
          id?: Uuid;
          user_id: Uuid;
          rollup_date: string;
          platform?: SocialPlatform | null;
          posts_created?: number;
          posts_published?: number;
          publish_successes?: number;
          publish_failures?: number;
          scheduled_posts?: number;
          metadata?: Json;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        }
      >;
      connection_oauth_states: TableDefinition<
        {
          id: Uuid;
          user_id: Uuid;
          platform: SocialPlatform;
          state_hash: string;
          code_verifier_ciphertext: string;
          redirect_path: string;
          expires_at: Timestamp;
          consumed_at: Timestamp | null;
          created_at: Timestamp;
        },
        {
          id?: Uuid;
          user_id: Uuid;
          platform: SocialPlatform;
          state_hash: string;
          code_verifier_ciphertext: string;
          redirect_path?: string;
          expires_at: Timestamp;
          consumed_at?: Timestamp | null;
          created_at?: Timestamp;
        }
      >;
    };
    Views: Record<string, never>;
    Functions: {
      cancel_scheduled_post: {
        Args: {
          post_id_input: string;
        };
        Returns: boolean;
      };
      claim_publish_jobs: {
        Args: {
          worker_id_input: string;
          limit_input?: number;
          lock_seconds_input?: number;
        };
        Returns: Database['public']['Tables']['publish_jobs']['Row'][];
      };
      record_publish_streak_success: {
        Args: {
          user_id_input: string;
          post_id_input: string;
          occurred_at_input?: string;
        };
        Returns: Database['public']['Tables']['streak_state']['Row'];
      };
      handle_new_user: {
        Args: Record<string, never>;
        Returns: unknown;
      };
      set_updated_at: {
        Args: Record<string, never>;
        Returns: unknown;
      };
    };
    Enums: {
      social_platform: SocialPlatform;
      social_connection_status: SocialConnectionStatus;
      media_kind: MediaKind;
      media_asset_status: MediaAssetStatus;
      post_status: PostStatus;
      schedule_mode: ScheduleMode;
      post_target_status: PostTargetStatus;
      publish_job_status: PublishJobStatus;
      publish_attempt_status: PublishAttemptStatus;
      activity_event_type: ActivityEventType;
      streak_event_type: StreakEventType;
    };
    CompositeTypes: Record<string, never>;
  };
};
