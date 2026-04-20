export type MarketingFeature = {
  eyebrow: string;
  title: string;
  description: string;
};

export type HowItWorksStep = {
  step: string;
  title: string;
  description: string;
};

export type Testimonial = {
  quote: string;
  name: string;
  role: string;
};

export const navItems = [
  { label: "Why it works", href: "#why" },
  { label: "How to use", href: "#how-it-works" },
  { label: "Proof", href: "#proof" },
  { label: "Preview", href: "#preview" },
] as const;

export const heroStats = [
  { label: "platforms", value: "3" },
  { label: "streak-first workflow", value: "daily" },
  { label: "posting engine", value: "server-led" },
] as const;

// Placeholder trust marks for development only. Replace with verified logos and
// written brand approval before using this section in production marketing.
export const trustLogos = [
  "Loop Social",
  "Glow Desk",
  "Studio North",
  "DailyDrop",
  "CreatorOps",
] as const;

export const problems = [
  "You had the idea, then the day got loud.",
  "LinkedIn wants polish. Instagram wants rhythm. Facebook still matters.",
  "Drafts pile up while your audience forgets you were building.",
  "Clients want clarity, not ten tabs and a prayer.",
] as const;

export const features: MarketingFeature[] = [
  {
    eyebrow: "Composer",
    title: "Create once, publish smarter",
    description:
      "Write the post, pick the platforms, and get media guidance before anything hits the queue.",
  },
  {
    eyebrow: "Schedule",
    title: "Stay visible on your actual timeline",
    description:
      "Plan posts around your week, protect your streak, and keep momentum even when life gets noisy.",
  },
  {
    eyebrow: "Drafts",
    title: "Turn half-ideas into a system",
    description:
      "Save sparks, reopen them fast, duplicate what works, and move from maybe-later to ready.",
  },
  {
    eyebrow: "Analytics",
    title: "Measure consistency before vanity",
    description:
      "See publishing output, success rate, platform mix, and streak history without drowning in dashboards.",
  },
  {
    eyebrow: "Realtime",
    title: "Know what just happened",
    description:
      "Activity updates make publishing feel alive: queued, processing, posted, failed, retried.",
  },
  {
    eyebrow: "Secure engine",
    title: "Browser-free publishing",
    description:
      "Provider tokens stay server-side while jobs, attempts, retries, and results stay auditable.",
  },
];

export const howItWorks: HowItWorksStep[] = [
  {
    step: "01",
    title: "Connect your accounts",
    description:
      "Link LinkedIn, Facebook, and Instagram through provider-specific flows when your credentials are ready.",
  },
  {
    step: "02",
    title: "Build the post",
    description:
      "Draft the caption, add media, choose platforms, and see compatibility notes before you commit.",
  },
  {
    step: "03",
    title: "Schedule or ship",
    description:
      "Publish now or set a timezone-aware slot. RE-post queues each platform target separately.",
  },
  {
    step: "04",
    title: "Track the signal",
    description:
      "Watch status changes, retry failures, keep your streak alive, and learn your posting rhythm.",
  },
] as const;

// Placeholder testimonial seed content for development only. These quotes must
// be replaced with approved customer quotes before production launch.
export const testimonials: Testimonial[] = [
  {
    quote:
      "RE-post feels like the first tool that understands that consistency is the product.",
    name: "Maya R.",
    role: "Social media manager",
  },
  {
    quote:
      "I stopped losing posts in random notes. Draft, schedule, streak, done.",
    name: "Jordan L.",
    role: "Creator strategist",
  },
  {
    quote:
      "The activity feed makes client publishing feel calm instead of chaotic.",
    name: "Ari S.",
    role: "Agency social lead",
  },
  {
    quote:
      "It gives my week a rhythm. I can see what is queued and what needs attention.",
    name: "Nia K.",
    role: "Community manager",
  },
  {
    quote:
      "The streak idea is weirdly motivating in the best way. It makes showing up visible.",
    name: "Theo M.",
    role: "Founder creator",
  },
  {
    quote:
      "Cleaner than the big scheduling tools, but still serious enough for client work.",
    name: "Cam V.",
    role: "Freelance SMM",
  },
  {
    quote:
      "I can prep the whole week without feeling like I moved into a spreadsheet.",
    name: "Lena P.",
    role: "Content operator",
  },
  {
    quote:
      "The platform warnings save me from the tiny mistakes that become annoying failures.",
    name: "Sam E.",
    role: "Brand social manager",
  },
  {
    quote:
      "It feels more like a creator cockpit than another calendar pretending to be a strategy.",
    name: "Imani T.",
    role: "Creator manager",
  },
  {
    quote:
      "Fast, focused, and made for the daily discipline of staying visible.",
    name: "Chris A.",
    role: "Social content lead",
  },
];

export const previewItems = [
  { label: "Current streak", value: "18 days", tone: "Keep it alive today" },
  { label: "Queued posts", value: "12", tone: "4 platforms targets ready" },
  { label: "Success rate", value: "96%", tone: "Last 30 publish attempts" },
] as const;
