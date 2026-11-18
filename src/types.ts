export type VerificationStatus =
  | "valid"
  | "invalid"
  | "catch_all"
  | "do_not_mail"
  | "unknown";

export interface MXRecord {
  priority: number;
  host: string;
}

export interface VerificationResult {
  email: string;
  status: VerificationStatus;
  is_valid: boolean;
  syntax_valid: boolean;
  domain: string;
  domain_valid: boolean;
  has_mx: boolean;
  mx_records: MXRecord[];
  smtp_checked: boolean;
  smtp_response_code: number | null;
  is_disposable: boolean;
  is_role_based: boolean;
  is_catch_all: boolean;
  is_free_provider: boolean;
  /** Suggested fix for a mistyped domain ("lead@gmail.com" for "lead@gmial.com"). Never changes the status. */
  did_you_mean?: string | null;
  /** Plain-English reason, e.g. "The mail server said this mailbox doesn't exist (550)." */
  explanation?: string | null;
  confidence_score: number;
  status_reason: string;
  provider: string;
  verification_time_ms: number;
  cached: boolean;
}

export interface SingleVerifyResponse {
  success: boolean;
  credits_used: number;
  result: VerificationResult;
}

export interface BulkVerifyRequestOptions {
  webhookUrl?: string;
}

export interface BulkVerifySubmitResponse {
  success: boolean;
  job_id: string;
  total_emails: number;
  status: "pending" | "processing" | "completed" | "cancelled" | "failed";
  credits_reserved: number;
  created_at: string;
}

export interface BulkJobSummary {
  job_id: string;
  filename?: string;
  status: "pending" | "processing" | "completed" | "cancelled" | "failed";
  total_emails: number;
  processed_emails: number;
  valid_count: number;
  invalid_count: number;
  catch_all_count?: number;
  disposable_count?: number;
  unknown_count?: number;
  credits_used: number;
  created_at: string;
  completed_at?: string | null;
}

export interface BulkJobStatusResponse extends BulkJobSummary {
  results?: VerificationResult[] | null;
}

export interface CreditBalanceResponse {
  balance: number;
  total_used: number;
  total_purchased: number;
  plan?: string;
}

export interface RiskIntelligenceResponse {
  email: string;
  domain: string;
  risk: {
    overall_score: number;
    risk_level: "low" | "medium" | "high" | "critical";
    /** None, Low, Medium or High. Estimated from the overall risk score. Not a spam-trap database lookup. */
    spam_trap_probability: string;
  };
  dns: {
    has_spf: boolean;
    has_dmarc: boolean;
    dmarc_policy: string;
  };
  threats: {
    is_disposable: boolean;
    is_free_mailbox: boolean;
    is_role_based: boolean;
    risk_factors: string[];
  };
}

export interface BounceLayerConfig {
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
}
