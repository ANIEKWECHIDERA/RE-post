export const legalContactEmail = "chideraaniekwederah73@gmail.com";

export type LegalSection = {
  title: string;
  body: readonly string[];
};

export const legalPages = {
  privacy: {
    title: "Privacy Policy",
    description:
      "How RE-post collects, uses, protects, and deletes creator workflow data.",
    effectiveDate: "April 20, 2026",
    sections: [
      {
        title: "What RE-post is",
        body: [
          "RE-post is a creator-first social media management app that helps users draft, schedule, publish, and track posts across supported social platforms.",
          "This policy explains what data the app handles when you create an account, connect social accounts, upload media, schedule posts, or use publishing and analytics features.",
        ],
      },
      {
        title: "Information we collect",
        body: [
          "Account information such as your email address, authentication identifiers, and profile records needed to operate the app.",
          "Creator workflow data such as drafts, captions, selected platforms, scheduled times, publish statuses, activity events, streak state, and internal analytics.",
          "Media assets and metadata you upload, including file type, size, dimensions, storage path, validation warnings, and related post references.",
          "Social connection metadata such as provider name, provider account identifiers, scopes, token status, expiry timestamps, and connection health. Raw provider tokens are encrypted before persistence and are not returned to the browser.",
          "Technical data such as request metadata, error states, audit events, and security-relevant logs needed to protect and operate the service.",
        ],
      },
      {
        title: "How we use information",
        body: [
          "To authenticate users, isolate account data, and provide the dashboard, composer, drafts, scheduling, publishing, activity, streak, and analytics features.",
          "To securely publish posts through provider APIs when you explicitly connect an account and create or schedule publish jobs.",
          "To validate media compatibility, prevent duplicate or unauthorized publishing, troubleshoot failures, and improve reliability.",
          "To comply with provider platform rules, security obligations, and lawful requests where applicable.",
        ],
      },
      {
        title: "How information is shared",
        body: [
          "RE-post sends post content, media, and required connection metadata to supported social providers only when needed to complete user-requested publishing actions.",
          "The app uses infrastructure providers such as Supabase for authentication, database, storage, realtime features, and server-side data access. Netlify may host the deployed web application and route handlers.",
          "We do not sell personal information.",
        ],
      },
      {
        title: "Security",
        body: [
          "RE-post uses Supabase Row Level Security for user-owned data isolation and keeps provider tokens server-side.",
          "Provider tokens are encrypted before persistence. Decryption is limited to server-side publishing flows that need temporary access to complete a user-requested action.",
          "No security system is perfect, but the app is designed to minimize token exposure, avoid unnecessary personal data, and log security-relevant failures cleanly.",
        ],
      },
      {
        title: "Retention and deletion",
        body: [
          "We retain account, workflow, media, activity, and publishing records while your account is active or as needed to operate, secure, audit, and improve the service.",
          "You can request deletion of your account data by following the Data Deletion page instructions or contacting support.",
          "Some logs or backup records may remain for a limited period where required for security, fraud prevention, legal compliance, or operational recovery.",
        ],
      },
      {
        title: "Contact",
        body: [
          `Questions or deletion requests can be sent to ${legalContactEmail}.`,
        ],
      },
    ],
  },
  terms: {
    title: "Terms of Service",
    description:
      "The basic rules for using RE-post to create, schedule, publish, and track social posts.",
    effectiveDate: "April 20, 2026",
    sections: [
      {
        title: "Using RE-post",
        body: [
          "By using RE-post, you agree to use the app lawfully and only with social accounts, content, media, and provider permissions you are allowed to manage.",
          "You are responsible for the captions, media, schedules, provider connections, and publishing actions created through your account.",
        ],
      },
      {
        title: "Social platform rules",
        body: [
          "RE-post integrates with third-party social platforms. Your use of those platforms remains subject to their own terms, developer policies, rate limits, review requirements, and account rules.",
          "Provider features may be disabled, mocked, or limited until credentials, account permissions, page selection, app review, and production validation are complete.",
        ],
      },
      {
        title: "Publishing and scheduling",
        body: [
          "RE-post provides tools for drafting, scheduling, and publishing, but publication can fail due to provider API changes, account permissions, media incompatibility, outages, expired tokens, rate limits, or invalid content.",
          "The app uses jobs, attempts, retries, and status tracking to improve reliability, but it does not guarantee that every post will be published at an exact time or accepted by every platform.",
        ],
      },
      {
        title: "User content",
        body: [
          "You keep ownership of the content you add to RE-post.",
          "You grant RE-post the limited permission needed to store, process, validate, schedule, transmit, and display that content so the app can provide its services.",
          "Do not upload unlawful, infringing, harmful, deceptive, or unauthorized content.",
        ],
      },
      {
        title: "Security and account access",
        body: [
          "Keep your login credentials and connected provider accounts secure.",
          "If you believe your account or provider connection has been compromised, contact support and revoke the affected provider connection.",
        ],
      },
      {
        title: "Changes and availability",
        body: [
          "RE-post may change features, provider integrations, limits, and these terms as the product evolves.",
          "The service may be interrupted for maintenance, provider outages, infrastructure issues, or security reasons.",
        ],
      },
      {
        title: "Contact",
        body: [
          `Questions about these terms can be sent to ${legalContactEmail}.`,
        ],
      },
    ],
  },
  deletion: {
    title: "User Data Deletion",
    description:
      "How to request deletion of your RE-post account data and connected social workflow data.",
    effectiveDate: "April 20, 2026",
    sections: [
      {
        title: "Request deletion by email",
        body: [
          `Send an email to ${legalContactEmail} from the email address associated with your RE-post account.`,
          "Use the subject line: RE-post data deletion request.",
          "Include the social provider you connected, if applicable, such as Facebook, Instagram, or LinkedIn. Do not include provider access tokens, passwords, or secrets.",
        ],
      },
      {
        title: "What we delete",
        body: [
          "We will delete or anonymize account profile data, drafts, scheduled posts, media records, social connection records, encrypted provider tokens, activity events, streak records, and internal analytics records associated with your account where deletion is technically and legally permitted.",
          "If you connected Facebook or Instagram, this request also covers RE-post records related to those provider connections.",
        ],
      },
      {
        title: "What may be retained temporarily",
        body: [
          "Limited security logs, audit records, backups, or records needed for fraud prevention, legal compliance, dispute handling, or operational recovery may be retained for a limited period.",
          "Content already published to third-party social platforms must be deleted from those platforms directly unless RE-post later adds provider-side deletion tooling.",
        ],
      },
      {
        title: "Expected timeline",
        body: [
          "We will confirm receipt of deletion requests and make reasonable efforts to complete verified deletion requests within 30 days.",
          "If additional verification is needed to protect your account, we may ask for information that confirms ownership of the RE-post account without requesting passwords or provider tokens.",
        ],
      },
    ],
  },
} as const;
