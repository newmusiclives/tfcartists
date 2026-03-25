"use client";

import { useEffect, useState, useCallback } from "react";
import { SharedNav } from "@/components/shared-nav";
import {
  Share2,
  Save,
  Check,
  Loader2,
  Eye,
  RefreshCw,
  Clock,
  Hash,
  FileText,
  Twitter,
  Facebook,
  Instagram,
  Trash2,
} from "lucide-react";

interface SocialSettings {
  twitterEnabled: boolean;
  facebookEnabled: boolean;
  instagramEnabled: boolean;
  twitterApiKey: string;
  twitterApiSecret: string;
  facebookPageToken: string;
  instagramAccessToken: string;
  postFrequency: string;
  postTemplate: string;
  hashtags: string[];
  siteUrl: string;
}

interface PostRecord {
  id: string;
  platform: string;
  content: string;
  songTitle: string;
  artistName: string;
  status: string;
  createdAt: string;
}

const DEFAULT_TEMPLATE =
  '\u{1F3B5} Now Playing on {station}: "{title}" by {artist} | Listen live: {url} #NowPlaying #{stationHashtag}';

const FREQUENCY_OPTIONS = [
  { value: "every_song", label: "Every Song" },
  { value: "every_15min", label: "Every 15 Minutes" },
  { value: "every_30min", label: "Every 30 Minutes" },
  { value: "every_hour", label: "Every Hour" },
];

function defaultSettings(): SocialSettings {
  return {
    twitterEnabled: false,
    facebookEnabled: false,
    instagramEnabled: false,
    twitterApiKey: "",
    twitterApiSecret: "",
    facebookPageToken: "",
    instagramAccessToken: "",
    postFrequency: "every_30min",
    postTemplate: DEFAULT_TEMPLATE,
    hashtags: [],
    siteUrl: "https://truefans-radio.netlify.app",
  };
}

function PlatformToggle({
  icon: Icon,
  name,
  enabled,
  onToggle,
  color,
}: {
  icon: typeof Twitter;
  name: string;
  enabled: boolean;
  onToggle: () => void;
  color: string;
}) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
        enabled
          ? `${color} shadow-sm`
          : "border-zinc-800 bg-zinc-900/50 text-zinc-500 hover:border-zinc-700"
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{name}</span>
      <div
        className={`ml-auto w-10 h-6 rounded-full transition-colors relative ${
          enabled ? "bg-green-500" : "bg-zinc-700"
        }`}
      >
        <div
          className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
            enabled ? "translate-x-5" : "translate-x-1"
          }`}
        />
      </div>
    </button>
  );
}

export default function SocialMediaPage() {
  const [settings, setSettings] = useState<SocialSettings>(defaultSettings());
  const [posts, setPosts] = useState<PostRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hashtagInput, setHashtagInput] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      // Load settings from Config via a simple fetch
      const res = await fetch("/api/social/settings");
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSettings({ ...defaultSettings(), ...data.settings });
        }
      }
    } catch {
      // Use defaults
    }
    // Load post log
    try {
      const res = await fetch("/api/social/post");
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const saveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/social/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      // error
    }
    setSaving(false);
  };

  const addHashtag = () => {
    const tag = hashtagInput.trim().replace(/^#/, "");
    if (tag && !settings.hashtags.includes(tag)) {
      setSettings((s) => ({ ...s, hashtags: [...s.hashtags, tag] }));
      setHashtagInput("");
    }
  };

  const removeHashtag = (tag: string) => {
    setSettings((s) => ({
      ...s,
      hashtags: s.hashtags.filter((h) => h !== tag),
    }));
  };

  const previewText = () => {
    const hashtags = settings.hashtags;
    const stationHashtag = hashtags[0] || "TrueFansRadio";
    let text = settings.postTemplate
      .replace(/\{title\}/gi, "Whiskey River")
      .replace(/\{artist\}/gi, "Willie Nelson")
      .replace(/\{station\}/gi, "TrueFans Radio")
      .replace(/\{url\}/gi, settings.siteUrl || "https://truefans-radio.netlify.app")
      .replace(/\{dj\}/gi, "Hank Westwood")
      .replace(/\{stationHashtag\}/gi, stationHashtag);

    if (hashtags.length > 1) {
      const extra = hashtags
        .slice(1)
        .map((h) => (h.startsWith("#") ? h : `#${h}`))
        .join(" ");
      text = `${text} ${extra}`;
    }
    return text;
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const platformIcon = (platform: string) => {
    if (platform === "twitter") return <Twitter className="w-4 h-4 text-sky-400" />;
    if (platform === "facebook") return <Facebook className="w-4 h-4 text-blue-500" />;
    if (platform === "instagram") return <Instagram className="w-4 h-4 text-pink-500" />;
    return <Share2 className="w-4 h-4 text-zinc-400" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950">
        <SharedNav />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <SharedNav />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
              <Share2 className="w-6 h-6 text-blue-400" />
              Auto Social Media Posting
            </h1>
            <p className="text-zinc-500 text-sm mt-1">
              Automatically share now-playing tracks to social platforms
            </p>
          </div>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 transition-colors"
          >
            {saved ? (
              <Check className="w-4 h-4" />
            ) : saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saved ? "Saved" : "Save Settings"}
          </button>
        </div>

        <div className="space-y-6">
          {/* Platform Toggles */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
            <h2 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-blue-400" />
              Platforms
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <PlatformToggle
                icon={Twitter}
                name="Twitter / X"
                enabled={settings.twitterEnabled}
                onToggle={() =>
                  setSettings((s) => ({ ...s, twitterEnabled: !s.twitterEnabled }))
                }
                color="border-sky-500/50 bg-sky-950/30 text-sky-300"
              />
              <PlatformToggle
                icon={Facebook}
                name="Facebook"
                enabled={settings.facebookEnabled}
                onToggle={() =>
                  setSettings((s) => ({ ...s, facebookEnabled: !s.facebookEnabled }))
                }
                color="border-blue-500/50 bg-blue-950/30 text-blue-300"
              />
              <PlatformToggle
                icon={Instagram}
                name="Instagram"
                enabled={settings.instagramEnabled}
                onToggle={() =>
                  setSettings((s) => ({
                    ...s,
                    instagramEnabled: !s.instagramEnabled,
                  }))
                }
                color="border-pink-500/50 bg-pink-950/30 text-pink-300"
              />
            </div>
          </div>

          {/* API Keys (placeholder for future OAuth) */}
          {(settings.twitterEnabled ||
            settings.facebookEnabled ||
            settings.instagramEnabled) && (
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
              <h2 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                API Credentials
              </h2>
              <p className="text-xs text-zinc-500 mb-4">
                API keys will be used when platform OAuth is connected. For now, posts are logged locally.
              </p>
              <div className="space-y-4">
                {settings.twitterEnabled && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">
                        Twitter API Key
                      </label>
                      <input
                        type="password"
                        value={settings.twitterApiKey}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            twitterApiKey: e.target.value,
                          }))
                        }
                        placeholder="Enter API key..."
                        className="w-full px-3 py-2 text-sm bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-300 placeholder:text-zinc-600 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">
                        Twitter API Secret
                      </label>
                      <input
                        type="password"
                        value={settings.twitterApiSecret}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            twitterApiSecret: e.target.value,
                          }))
                        }
                        placeholder="Enter API secret..."
                        className="w-full px-3 py-2 text-sm bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-300 placeholder:text-zinc-600 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}
                {settings.facebookEnabled && (
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">
                      Facebook Page Access Token
                    </label>
                    <input
                      type="password"
                      value={settings.facebookPageToken}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          facebookPageToken: e.target.value,
                        }))
                      }
                      placeholder="Enter page access token..."
                      className="w-full px-3 py-2 text-sm bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-300 placeholder:text-zinc-600 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}
                {settings.instagramEnabled && (
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">
                      Instagram Access Token
                    </label>
                    <input
                      type="password"
                      value={settings.instagramAccessToken}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          instagramAccessToken: e.target.value,
                        }))
                      }
                      placeholder="Enter access token..."
                      className="w-full px-3 py-2 text-sm bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-300 placeholder:text-zinc-600 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Post Frequency */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
            <h2 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-green-400" />
              Post Frequency
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {FREQUENCY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() =>
                    setSettings((s) => ({ ...s, postFrequency: opt.value }))
                  }
                  className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                    settings.postFrequency === opt.value
                      ? "border-green-500/50 bg-green-950/30 text-green-300"
                      : "border-zinc-800 bg-zinc-950 text-zinc-500 hover:border-zinc-700 hover:text-zinc-400"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Post Template */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-400" />
                Post Template
              </h2>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <Eye className="w-3 h-3" />
                {showPreview ? "Hide Preview" : "Show Preview"}
              </button>
            </div>
            <textarea
              value={settings.postTemplate}
              onChange={(e) =>
                setSettings((s) => ({ ...s, postTemplate: e.target.value }))
              }
              rows={3}
              className="w-full px-3 py-2 text-sm bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-300 placeholder:text-zinc-600 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 font-mono"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {["{title}", "{artist}", "{station}", "{url}", "{dj}", "{stationHashtag}"].map(
                (v) => (
                  <span
                    key={v}
                    className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono cursor-help"
                    title={`Variable: ${v}`}
                  >
                    {v}
                  </span>
                )
              )}
            </div>
            <button
              onClick={() =>
                setSettings((s) => ({ ...s, postTemplate: DEFAULT_TEMPLATE }))
              }
              className="mt-2 text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              Reset to default template
            </button>

            {/* Preview */}
            {showPreview && (
              <div className="mt-4 bg-zinc-950 border border-zinc-800 rounded-lg p-4">
                <div className="text-xs text-zinc-500 mb-2">Preview:</div>
                <p className="text-sm text-zinc-300 whitespace-pre-wrap">
                  {previewText()}
                </p>
                <div className="mt-2 text-xs text-zinc-600">
                  {previewText().length} characters
                  {previewText().length > 280 && (
                    <span className="text-red-400 ml-2">
                      (over Twitter&apos;s 280 char limit)
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Hashtags */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
            <h2 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
              <Hash className="w-4 h-4 text-cyan-400" />
              Hashtags
            </h2>
            <p className="text-xs text-zinc-500 mb-3">
              First hashtag is used for {"{stationHashtag}"} in the template. All others are appended to every post.
            </p>
            <div className="flex gap-2 mb-3">
              <input
                value={hashtagInput}
                onChange={(e) => setHashtagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addHashtag()}
                placeholder="Add hashtag..."
                className="flex-1 px-3 py-2 text-sm bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-300 placeholder:text-zinc-600 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
              />
              <button
                onClick={addHashtag}
                className="px-3 py-2 text-sm bg-cyan-900/30 border border-cyan-700/50 text-cyan-300 rounded-lg hover:bg-cyan-900/50 transition-colors"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {settings.hashtags.map((tag, i) => (
                <span
                  key={tag}
                  className={`inline-flex items-center gap-1 text-sm px-3 py-1 rounded-full ${
                    i === 0
                      ? "bg-cyan-950/50 border border-cyan-700/50 text-cyan-300"
                      : "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  #{tag}
                  <button
                    onClick={() => removeHashtag(tag)}
                    className="ml-1 text-zinc-600 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {settings.hashtags.length === 0 && (
                <span className="text-xs text-zinc-600">
                  No hashtags configured. Station name will be used as default.
                </span>
              )}
            </div>
          </div>

          {/* Site URL */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
            <h2 className="text-sm font-semibold text-zinc-300 mb-4">
              Station Listen URL
            </h2>
            <input
              value={settings.siteUrl}
              onChange={(e) =>
                setSettings((s) => ({ ...s, siteUrl: e.target.value }))
              }
              placeholder="https://your-station.com"
              className="w-full px-3 py-2 text-sm bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-300 placeholder:text-zinc-600 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-zinc-600 mt-1">
              This URL is used for the {"{url}"} variable in post templates.
            </p>
          </div>

          {/* Recent Posts Log */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                <Clock className="w-4 h-4 text-zinc-500" />
                Recent Posts
              </h2>
              <button
                onClick={loadSettings}
                className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                Refresh
              </button>
            </div>
            {posts.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <Share2 className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                <p className="text-sm text-zinc-600">No posts yet.</p>
                <p className="text-xs text-zinc-700 mt-1">
                  Posts will appear here once the cron job runs with enabled platforms.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800">
                {posts.slice(0, 20).map((post) => (
                  <div key={post.id} className="px-6 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {platformIcon(post.platform)}
                        <span className="text-xs font-medium text-zinc-400 capitalize">
                          {post.platform}
                        </span>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded ${
                            post.status === "sent"
                              ? "bg-green-900/30 text-green-400"
                              : "bg-zinc-800 text-zinc-500"
                          }`}
                        >
                          {post.status}
                        </span>
                      </div>
                      <span className="text-xs text-zinc-600">
                        {formatTime(post.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-400 truncate">{post.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
