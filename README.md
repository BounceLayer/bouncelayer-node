# @bouncelayer/sdk

Official Node.js and TypeScript client for [BounceLayer](https://bouncelayer.com/) — high-throughput, deterministic RFC 5321 email verification with direct TCP port 25 SMTP handshakes.

Website: [https://bouncelayer.com/](https://bouncelayer.com/)  
API Documentation: [https://bouncelayer.com/docs](https://bouncelayer.com/docs)  
Dashboard & API Keys: [https://bouncelayer.com/dashboard/api-keys](https://bouncelayer.com/dashboard/api-keys)

---

## Features

- ⚡ **Sub-140ms Latency**: Non-blocking asynchronous checks against remote MX nodes.
- 🎯 **Direct RFC 5321 Handshake**: Connects to port 25 (EHLO -> MAIL FROM -> RCPT TO -> QUIT) with **0 emails dispatched**.
- 🛡️ **100K+ Burner Firewall**: Hourly-synced trie lookup for disposable inboxes.
- 📬 **Catch-All & Role Account Detection**: Flags catch-all servers and role accounts (`billing@`, `support@`, etc.).
- 📦 **Bulk Job Management**: Submit and poll up to 10,000 addresses in a single job.
- 🔐 **Webhook Verification**: Built-in HMAC SHA-256 signature validation.

---

## Installation

```bash
npm install @bouncelayer/sdk
# or
yarn add @bouncelayer/sdk
# or
pnpm add @bouncelayer/sdk
```

---

## Quick Start

Get your free API key at [https://bouncelayer.com/](https://bouncelayer.com/):

```typescript
import { BounceLayer } from "@bouncelayer/sdk";

const client = new BounceLayer({
  apiKey: process.env.BOUNCELAYER_API_KEY, // or pass explicitly
});

// Single Email Verification (<140ms)
const result = await client.verify.single("alex@stripe.com");

console.log(result.status);           // "valid" | "invalid" | "catch_all" | "do_not_mail" | "unknown"
console.log(result.confidence_score); // 98
console.log(result.is_disposable);    // false
console.log(result.smtp_checked);     // true (RFC 5321 Port 25 confirmation)
```

---

## Bulk Verification

```typescript
// Submit list of up to 10,000 addresses
const job = await client.verify.bulk([
  "lead1@company.com",
  "lead2@partner.io",
  "throwaway@burnermail.org",
], {
  webhookUrl: "https://api.mycrm.com/webhooks/bouncelayer",
});

// Wait for job completion automatically
const completed = await client.verify.waitForJob(job.job_id);
console.log(`Processed ${completed.processed_emails} emails.`);
```

---

## Webhook Verification

```typescript
import { verifyWebhookSignature } from "@bouncelayer/sdk";
import express from "express";

const app = express();

app.post("/webhooks/bouncelayer", express.raw({ type: "application/json" }), (req, res) => {
  const signature = req.headers["x-bouncelayer-signature"] as string;
  const isValid = verifyWebhookSignature(
    req.body,
    signature,
    process.env.BOUNCELAYER_WEBHOOK_SECRET!
  );

  if (!isValid) return res.status(401).send("Invalid signature");

  const event = JSON.parse(req.body.toString());
  console.log("Verified event:", event.event);
  res.sendStatus(200);
});
```

---

## Official Links

- **Website**: [https://bouncelayer.com/](https://bouncelayer.com/)
- **Pricing & Free Credits**: [https://bouncelayer.com/pricing](https://bouncelayer.com/pricing)
- **MCP Server**: [https://www.npmjs.com/package/@bouncelayer/mcp](https://www.npmjs.com/package/@bouncelayer/mcp)
- **Support**: [support@bouncelayer.com](mailto:support@bouncelayer.com)

## License

MIT © [BounceLayer](https://bouncelayer.com/)
