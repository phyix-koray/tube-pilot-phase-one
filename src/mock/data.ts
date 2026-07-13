import musicAvatar from "@/assets/music-agent.png.asset.json";
import aiAvatar from "@/assets/ai-agent.png.asset.json";
import stockAvatar from "@/assets/stock-agent.png.asset.json";

export type WorkflowStatus = "idle" | "running" | "scheduled" | "error";
export type VideoStatus =
  | "published"
  | "pending_review"
  | "publishing"
  | "draft"
  | "failed";

export interface WorkflowStep {
  n: number;
  title: string;
  description: string;
  config?: string;
  output?: string;
}

export interface Workflow {
  id: string;
  name: string;
  /** kept for legacy code paths; not shown in UI anymore */
  category: string;
  icon: string; // lucide name (fallback if no avatar)
  avatar?: string; // CDN url for agent portrait
  accent?: string; // subtle background tint for card hero
  description: string;
  steps: WorkflowStep[];
  status: WorkflowStatus;
  lastRun?: string;
  nextRun?: string;
  currentStep?: number; // when running
}

export interface Channel {
  id: string;
  name: string;
  emoji: string;
  subscribers: number;
  niche: string;
  connectedAt: string;
  usedIn?: string;
  color: string;
}

export interface Video {
  id: string;
  title: string;
  channelId: string;
  workflowId: string;
  status: VideoStatus;
  views?: number;
  publishedAt?: string;
  createdAt: string;
  thumbnail: string;
  reviewDeadline?: string; // ISO for pending_review
  approved?: boolean;
  error?: string;
}

export interface Skill {
  id: string;
  name: string;
  category: string;
  description: string;
  usedIn: string;
  lastEdited: string;
  instructions: string;
}

export const mockUser = {
  name: "Koray Bakirkure",
  email: "koray@example.com",
  avatarInitials: "KB",
  plan: "pro" as "free" | "pro" | "studio",
  credits: { used: 847, total: 2000 },
};

export const mockChannels: Channel[] = [
  {
    id: "ch1",
    name: "Coastal Sounds",
    emoji: "🌊",
    subscribers: 1,
    niche: "slow jazz, ambient music, world lounge",
    connectedAt: "2026-07-07",
    usedIn: "Music Channel — Suno Jazz",
    color: "#0A84FF",
  },
  {
    id: "ch2",
    name: "New Yolk Eggonomist",
    emoji: "🥚",
    subscribers: 9,
    niche: "",
    connectedAt: "2026-07-07",
    color: "#30D158",
  },
  {
    id: "ch3",
    name: "Stickman United",
    emoji: "🥢",
    subscribers: 1,
    niche: "history, geopolitics, sports recap",
    connectedAt: "2026-07-07",
    usedIn: "Documentary Hybrid",
    color: "#FFD60A",
  },
];

const musicSteps: WorkflowStep[] = [
  {
    n: 1,
    title: "AI Theme Generator",
    description:
      "Generates today's unique music theme based on genre guidance and theme history. Avoids repeating previous themes.",
    config: 'Genre: "slow smooth jazz, saxophone, world lounge..."',
    output: "Theme text → saved to theme_history.json",
  },
  {
    n: 2,
    title: "Suno Music Producer",
    description:
      "Connects to Suno via browser automation. Generates N songs per run with AI-varied keywords each iteration.",
    config: "Songs: 10  ·  Instrumental: On  ·  AI Model: Claude",
    output: "MP3 files → ~/SunoMusic/{date}_{theme}/",
  },
  {
    n: 3,
    title: "Audio Merger (Pi7)",
    description:
      "Merges all generated songs into one continuous audio file with configurable loop count.",
    config: "Loop count: 5  ·  (10 songs × 5 = 50 tracks total)",
    output: "merged_all_songs.mp3",
  },
  {
    n: 4,
    title: "Thumbnail Generator",
    description:
      "Creates a photorealistic luxury interior/panoramic-view image using GPT Image based on the day's theme.",
    config: "Style: Luxury interior with view  ·  Mode: Image only",
    output: "thumbnail_16x9.png",
  },
  {
    n: 5,
    title: "Video Renderer (YT Music Combiner)",
    description:
      "Combines merged audio and thumbnail into the final video file. Applies Fade In effect on first clip.",
    config: "Tool: localhost:8080/yt-music-combiner  ·  Effect: Fade In",
    output: "final_video.mp4",
  },
  {
    n: 6,
    title: "YouTube Metadata Writer",
    description:
      "AI writes title (≤100 chars), description, and tags (≤500 chars) based on the theme and keyword history from this run.",
    output: "youtube_title.txt · youtube_description.txt · youtube_tags.txt",
  },
  {
    n: 7,
    title: "YouTube Publisher",
    description:
      "Uploads final_video.mp4 + thumbnail + metadata to the selected YouTube channel via Data API v3.",
    config: "Channel: Coastal Sounds 🌊  ·  Visibility: Public",
    output: "YouTube video URL → youtube_video_id.txt",
  },
];

const documentarySteps: WorkflowStep[] = [
  {
    n: 1,
    title: "Viral Topic Finder",
    description:
      "Monitors RSS feeds and YouTube channels for trending topics matching the channel's niche. Ranks by estimated view potential.",
    config: 'RSS feeds: [3 feeds]  ·  Niche: "history, geopolitics"',
    output: "Top 5 topic candidates",
  },
  {
    n: 2,
    title: "Topic Memory Check",
    description:
      "Filters out topics already covered. Prevents duplicate content.",
    config: "Memory: 47 topics stored",
    output: "Approved topic + stored to memory",
  },
  {
    n: 3,
    title: "Deep Research Agent",
    description:
      "Decides if topic needs deep research. If yes, performs multi-source research and compiles a structured brief.",
    config: "Depth: Standard  [Quick / Standard / Deep]",
    output: "research_brief.md",
  },
  {
    n: 4,
    title: "Script & Scene Generator",
    description:
      "Uses a skill file to generate: transcript (per scene), image prompts, video prompts, and thumbnail concept.",
    config:
      "Skill: Script Writer — Documentary · Language: English · Duration: 3 min",
    output: "script.csv · thumbnail_prompt.txt",
  },
  {
    n: 5,
    title: "Scene Studio Renderer",
    description:
      "Uploads script CSV to Scene Studio (localhost:8080/hybrid). Selects stock images per scene. Renders final video.",
    config: "Tool: localhost:8080/hybrid  ·  Resolution: 1080p",
    output: "rendered_video.mp4",
  },
  {
    n: 6,
    title: "Thumbnail Generator",
    description:
      "Generates thumbnail using the AI-written thumbnail prompt from Step 4.",
    config: "Model: GPT Image  ·  Style: Documentary cinematic",
    output: "thumbnail_16x9.png",
  },
  {
    n: 7,
    title: "YouTube Metadata Writer",
    description:
      "Writes title, SEO description, and tags based on topic + research brief.",
    output: "youtube_title.txt · youtube_description.txt · youtube_tags.txt",
  },
  {
    n: 8,
    title: "YouTube Publisher",
    description:
      "Uploads to selected channel with thumbnail and metadata.",
    config: "Channel: Stickman United  ·  Visibility: Unlisted",
    output: "YouTube video URL",
  },
];

export const mockWorkflows: Workflow[] = [
  {
    id: "music-channel",
    name: "Music Channel — Suno Jazz",
    category: "music",
    icon: "Music",
    description:
      "Generate slow smooth jazz videos daily with AI themes, Suno song production, and YouTube auto-publishing.",
    steps: musicSteps,
    status: "scheduled",
    lastRun: "2 hours ago",
    nextRun: "Today 14:30",
  },
  {
    id: "documentary-hybrid",
    name: "Documentary — Hybrid Scenes",
    category: "documentary",
    icon: "Film",
    description:
      "Find viral topics, research deeply, generate scene-by-scene scripts and imagery through Scene Studio.",
    steps: documentarySteps,
    status: "idle",
    lastRun: "Yesterday",
  },
  {
    id: "history-shorts",
    name: "History Shorts",
    category: "education",
    icon: "BookOpen",
    description:
      "Daily historical events turned into engaging short-form videos with AI narration and stock imagery.",
    steps: musicSteps.slice(0, 6),
    status: "idle",
  },
  {
    id: "sports-recap",
    name: "Sports Recap",
    category: "sports",
    icon: "Trophy",
    description:
      "Post-match analysis videos auto-generated from live score feeds and match data.",
    steps: musicSteps.slice(0, 5),
    status: "idle",
  },
];

// Deadline helpers — anchored to a "now" of Jul 4 2026 12:39 UTC
const now = new Date("2026-07-04T12:39:00Z");
const hoursFromNow = (h: number) => new Date(now.getTime() + h * 3.6e6).toISOString();

export const mockVideos: Video[] = [
  {
    id: "v1",
    title: "Cape Town Harbor Jazz – Misty Morning Saxophone",
    channelId: "ch1",
    workflowId: "music-channel",
    status: "published",
    views: 47,
    publishedAt: "2026-07-04T09:12:00Z",
    createdAt: "2026-07-04T08:30:00Z",
    thumbnail: "https://picsum.photos/seed/tubepilot1/640/360",
  },
  {
    id: "v2",
    title: "Kyoto Tea House Rain – Late Afternoon Saxophone",
    channelId: "ch1",
    workflowId: "music-channel",
    status: "pending_review",
    reviewDeadline: hoursFromNow(18.7),
    createdAt: "2026-07-04T12:39:00Z",
    thumbnail: "https://picsum.photos/seed/tubepilot2/640/360",
  },
  {
    id: "v3",
    title: "Prague Cellar Jazz – Midnight Cobblestone",
    channelId: "ch1",
    workflowId: "music-channel",
    status: "pending_review",
    reviewDeadline: hoursFromNow(0.6),
    createdAt: "2026-07-03T22:00:00Z",
    thumbnail: "https://picsum.photos/seed/tubepilot3/640/360",
  },
  {
    id: "v4",
    title: "Japan vs Brazil – Round of 16",
    channelId: "ch3",
    workflowId: "documentary-hybrid",
    status: "published",
    views: 312,
    publishedAt: "2026-07-01T14:00:00Z",
    createdAt: "2026-07-01T09:00:00Z",
    thumbnail: "https://picsum.photos/seed/tubepilot4/640/360",
  },
  {
    id: "v5",
    title: "The Dam That Never Cracked",
    channelId: "ch3",
    workflowId: "documentary-hybrid",
    status: "draft",
    createdAt: "2026-07-02T10:00:00Z",
    thumbnail: "https://picsum.photos/seed/tubepilot5/640/360",
  },
  {
    id: "v6",
    title: "Marrakech Rooftop Dusk – Jazz at Sunset",
    channelId: "ch1",
    workflowId: "music-channel",
    status: "failed",
    error: "YT Music Combiner timeout",
    createdAt: "2026-07-03T15:00:00Z",
    thumbnail: "https://picsum.photos/seed/tubepilot6/640/360",
  },
];

export const mockSkills: Skill[] = [
  {
    id: "script-writer-doc",
    name: "Script Writer — Documentary",
    category: "Documentary",
    description:
      "Guides the AI to write documentary-style scene transcripts with emotional hooks, pacing notes, and visual directions.",
    usedIn: "Documentary Hybrid (Step 4)",
    lastEdited: "3 days ago",
    instructions: `You are an expert documentary scriptwriter. Write for a 3-minute video split into 12–18 scenes.

For each scene, output:
- S### (scene number, zero-padded)
- transcript: one 1–3 sentence narration line
- image_prompt: a vivid still-frame description
- video_prompt: optional 5s motion cue
- pacing: fast | medium | slow

Open with a hook. Layer stakes, then a turn, then a resolution. Never use filler words.`,
  },
  {
    id: "thumb-art-director",
    name: "Thumbnail Art Director — Luxury Interiors",
    category: "Music",
    description:
      "Directs GPT Image to create luxury interior panoramic thumbnails matching the day's theme.",
    usedIn: "Music Channel (Step 4)",
    lastEdited: "1 week ago",
    instructions: `Photorealistic 16:9 luxury interior with a panoramic city or nature view.
Cinematic warm light, film grain, no visible text or people.`,
  },
  {
    id: "yt-metadata-music",
    name: "YouTube Metadata Writer — Music",
    category: "Music",
    description:
      "Writes SEO-friendly titles, descriptions, and tags for ambient jazz music videos.",
    usedIn: "Music Channel (Step 6)",
    lastEdited: "2 days ago",
    instructions: `Title: ≤100 chars, evocative location + mood + instrument.
Description: 3 short paragraphs, timestamps, channel CTA.
Tags: 15–25 comma-separated, ≤500 chars total.`,
  },
  {
    id: "keyword-variation",
    name: "Keyword Variation Generator — Suno",
    category: "Music",
    description:
      "Produces varied Suno keyword sets so consecutive songs feel distinct within the same theme.",
    usedIn: "Music Channel (Step 2)",
    lastEdited: "5 days ago",
    instructions: `Given a theme, output 10 keyword bundles. Each bundle: 4–6 tags across mood, tempo, instrument, era.`,
  },
  {
    id: "topic-researcher",
    name: "Topic Researcher — History Channel",
    category: "Education",
    description:
      "Turns raw topic ideas into multi-source structured research briefs.",
    usedIn: "History Shorts (Step 3)",
    lastEdited: "2 weeks ago",
    instructions: `Return a brief with: hook, key facts (with dates), tension, resolution, and 3 primary sources.`,
  },
  {
    id: "viral-hook",
    name: "Viral Hook Writer — Education",
    category: "Education",
    description:
      "Cold-opens that keep the audience watching past the first 3 seconds.",
    usedIn: "History Shorts (Step 4)",
    lastEdited: "1 month ago",
    instructions: `Write 5 first-line hooks under 12 words each. Prefer concrete nouns and a single surprising number.`,
  },
];

// Video Editor scenes (for editor demo)
export interface Scene {
  id: string;
  sceneNumber: number;
  label: string;
  imageSrc: string;
  duration: number; // seconds
  effect: "none" | "fade-in" | "fade-out" | "cross-dissolve";
  volume: number;
  imagePrompt: string;
  voiceover: string;
  caption: string;
}

export const mockScenes: Scene[] = [
  {
    id: "s001",
    sceneNumber: 1,
    label: "S001",
    imageSrc: "https://picsum.photos/seed/scene1/320/180",
    duration: 5,
    effect: "fade-in",
    volume: 0.8,
    imagePrompt:
      "Picture a concrete wall standing at the edge of an alpine valley just before dawn, mist curling around its base.",
    voiceover: "Houston. June 29th, 1929.",
    caption: "Houston. June 29th, 1929.",
  },
  {
    id: "s002",
    sceneNumber: 2,
    label: "S002",
    imageSrc: "https://picsum.photos/seed/scene2/320/180",
    duration: 5,
    effect: "none",
    volume: 0.8,
    imagePrompt: "Stadium floodlights over a red-cinder track at dusk.",
    voiceover: "Five World Records in one afternoon.",
    caption: "Five World Records in one afternoon.",
  },
  {
    id: "s003",
    sceneNumber: 3,
    label: "S003",
    imageSrc: "https://picsum.photos/seed/scene3/320/180",
    duration: 5,
    effect: "none",
    volume: 0.8,
    imagePrompt: "A wooden gymnasium interior, sunlight through high windows.",
    voiceover: "And a team that believed him.",
    caption: "And a team that believed him.",
  },
  {
    id: "s004",
    sceneNumber: 4,
    label: "S004",
    imageSrc: "https://picsum.photos/seed/scene4/320/180",
    duration: 4,
    effect: "cross-dissolve",
    volume: 0.8,
    imagePrompt: "Crowd rising to its feet, motion blur of hats in the air.",
    voiceover: "This is how the impossible became routine.",
    caption: "This is how the impossible became routine.",
  },
  {
    id: "s005",
    sceneNumber: 5,
    label: "S005",
    imageSrc: "https://picsum.photos/seed/scene5/320/180",
    duration: 5,
    effect: "none",
    volume: 0.8,
    imagePrompt: "Newspaper front pages spinning into focus.",
    voiceover: "The papers, of course, disagreed.",
    caption: "The papers, of course, disagreed.",
  },
  {
    id: "s006",
    sceneNumber: 6,
    label: "S006",
    imageSrc: "https://picsum.photos/seed/scene6/320/180",
    duration: 5,
    effect: "none",
    volume: 0.8,
    imagePrompt: "Vintage typewriter close-up, keys striking paper.",
    voiceover: "Every hero, they wrote, needs a villain.",
    caption: "Every hero, they wrote, needs a villain.",
  },
  {
    id: "s007",
    sceneNumber: 7,
    label: "S007",
    imageSrc: "https://picsum.photos/seed/scene7/320/180",
    duration: 5,
    effect: "none",
    volume: 0.8,
    imagePrompt: "A dim locker room with a single bulb swinging.",
    voiceover: "But he refused the role.",
    caption: "But he refused the role.",
  },
  {
    id: "s008",
    sceneNumber: 8,
    label: "S008",
    imageSrc: "https://picsum.photos/seed/scene8/320/180",
    duration: 5,
    effect: "none",
    volume: 0.8,
    imagePrompt: "Sunrise over an empty stadium the morning after.",
    voiceover: "The record stood for fifteen years.",
    caption: "The record stood for fifteen years.",
  },
  {
    id: "s009",
    sceneNumber: 9,
    label: "S009",
    imageSrc: "https://picsum.photos/seed/scene9/320/180",
    duration: 5,
    effect: "none",
    volume: 0.8,
    imagePrompt: "Framed photograph on a mantel, dust visible in shafts of light.",
    voiceover: "And the man behind it, silent.",
    caption: "And the man behind it, silent.",
  },
  {
    id: "s010",
    sceneNumber: 10,
    label: "S010",
    imageSrc: "https://picsum.photos/seed/scene10/320/180",
    duration: 5,
    effect: "none",
    volume: 0.8,
    imagePrompt: "An empty track from above, chalk lines vanishing at the horizon.",
    voiceover: "This is his story.",
    caption: "This is his story.",
  },
  {
    id: "s011",
    sceneNumber: 11,
    label: "S011",
    imageSrc: "https://picsum.photos/seed/scene11/320/180",
    duration: 4,
    effect: "fade-out",
    volume: 0.8,
    imagePrompt: "Slow zoom into a single stopwatch, hands frozen at 9.4 seconds.",
    voiceover: "Told in his own time.",
    caption: "Told in his own time.",
  },
];

export const totalDurationSeconds = () =>
  mockScenes.reduce((a, s) => a + s.duration, 0);

export function categoryClass(cat: WorkflowCategory) {
  switch (cat) {
    case "music":
      return "bg-[rgba(10,132,255,0.12)] text-[#0A84FF]";
    case "documentary":
      return "bg-[rgba(255,214,10,0.12)] text-[#FFD60A]";
    case "education":
      return "bg-[rgba(48,209,88,0.12)] text-[#30D158]";
    case "sports":
      return "bg-[rgba(255,69,58,0.12)] text-[#FF453A]";
    default:
      return "bg-[rgba(142,142,147,0.12)] text-[#8E8E93]";
  }
}

export function statusLeftBorder(status: WorkflowStatus) {
  switch (status) {
    case "running":
      return "border-l-[3px] border-l-green pulse-dot";
    case "scheduled":
      return "border-l-[3px] border-l-blue";
    case "error":
      return "border-l-[3px] border-l-red";
    default:
      return "border-l-[3px] border-l-subtle";
  }
}
