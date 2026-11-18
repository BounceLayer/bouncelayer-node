import {
  BounceLayerConfig,
  SingleVerifyResponse,
  VerificationResult,
  BulkVerifySubmitResponse,
  BulkVerifyRequestOptions,
  BulkJobStatusResponse,
  CreditBalanceResponse,
  RiskIntelligenceResponse,
} from "./types";

export class BounceLayerError extends Error {
  public status?: number;
  public details?: any;

  constructor(message: string, status?: number, details?: any) {
    super(message);
    this.name = "BounceLayerError";
    this.status = status;
    this.details = details;
  }
}

export class BounceLayer {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeout: number;

  constructor(config: BounceLayerConfig = {}) {
    const key =
      config.apiKey ||
      (typeof process !== "undefined" && process.env?.BOUNCELAYER_API_KEY) ||
      "";
    if (!key) {
      throw new BounceLayerError(
        "Missing BounceLayer API key. Pass { apiKey: 'bl_live_...' } or set process.env.BOUNCELAYER_API_KEY."
      );
    }
    this.apiKey = key;
    this.baseUrl = (config.baseUrl || "https://api.bouncelayer.com/v1").replace(/\/$/, "");
    this.timeout = config.timeout || 30000;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
    const headers: Record<string, string> = {
      "X-API-Key": this.apiKey,
      "Content-Type": "application/json",
      "User-Agent": "BounceLayer-Node-SDK/1.0.0",
      ...(options.headers as Record<string, string>),
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errData: any = {};
        try {
          errData = await response.json();
        } catch {
          errData = { message: response.statusText };
        }
        throw new BounceLayerError(
          errData.detail || errData.message || `Request failed with status ${response.status}`,
          response.status,
          errData
        );
      }

      return (await response.json()) as T;
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err instanceof BounceLayerError) throw err;
      throw new BounceLayerError(err.message || "Network request failed");
    }
  }

  public readonly verify = {
    /**
     * Verify a single email address in real time (<150ms) across 7 layers.
     */
    single: async (email: string): Promise<VerificationResult> => {
      const res = await this.request<SingleVerifyResponse>("/verify/single", {
        method: "POST",
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      return res.result;
    },

    /**
     * Submit an asynchronous bulk verification job (up to 10,000 emails).
     */
    bulk: async (
      emails: string[],
      options: BulkVerifyRequestOptions = {}
    ): Promise<BulkVerifySubmitResponse> => {
      return this.request<BulkVerifySubmitResponse>("/verify/bulk", {
        method: "POST",
        body: JSON.stringify({
          emails,
          webhook_url: options.webhookUrl,
        }),
      });
    },

    /**
     * Check the status and retrieve results of a bulk verification job.
     */
    getJob: async (jobId: string): Promise<BulkJobStatusResponse> => {
      return this.request<BulkJobStatusResponse>(`/verify/bulk/${jobId}`);
    },

    /**
     * Poll a bulk verification job until completed or cancelled.
     */
    waitForJob: async (
      jobId: string,
      options: { intervalMs?: number; maxWaitMs?: number } = {}
    ): Promise<BulkJobStatusResponse> => {
      const interval = options.intervalMs || 2000;
      const maxWait = options.maxWaitMs || 120000;
      const start = Date.now();

      while (Date.now() - start < maxWait) {
        const job = await this.verify.getJob(jobId);
        if (
          job.status === "completed" ||
          job.status === "cancelled" ||
          job.status === "failed"
        ) {
          return job;
        }
        await new Promise((r) => setTimeout(r, interval));
      }

      throw new BounceLayerError(`Job ${jobId} timed out after ${maxWait}ms`);
    },

    /**
     * Cancel a pending or processing bulk job and refund reserved credits.
     */
    cancelJob: async (jobId: string): Promise<{ success: boolean; message: string }> => {
      return this.request<{ success: boolean; message: string }>(`/verify/bulk/${jobId}`, {
        method: "DELETE",
      });
    },
  };

  public readonly credits = {
    /**
     * Get remaining credit balance and usage counters.
     */
    getBalance: async (): Promise<CreditBalanceResponse> => {
      return this.request<CreditBalanceResponse>("/credits");
    },
  };

  public readonly intelligence = {
    /**
     * Perform deep domain threat and disposable firewall risk analysis.
     */
    analyzeRisk: async (emailOrDomain: string): Promise<RiskIntelligenceResponse> => {
      const param = emailOrDomain.includes("@")
        ? `email=${encodeURIComponent(emailOrDomain)}`
        : `domain=${encodeURIComponent(emailOrDomain)}`;
      return this.request<RiskIntelligenceResponse>(`/intelligence/risk?${param}`);
    },
  };
}
