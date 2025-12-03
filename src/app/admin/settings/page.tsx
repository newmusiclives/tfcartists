"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Key,
  Settings,
  Mail,
  MessageSquare,
  Radio,
  DollarSign,
  Save,
  Eye,
  EyeOff,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

interface APIKey {
  id: string;
  name: string;
  service: string;
  key: string;
  status: "active" | "inactive";
  lastUsed?: string;
  createdAt: string;
}

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<"api-keys" | "system" | "station">("api-keys");
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Mock API keys - in production, these would come from secure backend
  const [apiKeys, setApiKeys] = useState<APIKey[]>([
    {
      id: "1",
      name: "SendGrid Email API",
      service: "email",
      key: "SG.xxxxxxxxxxxxxxxxxxxx.yyyyyyyyyyyyyyyyyyyyyyyy",
      status: "active",
      lastUsed: "2 hours ago",
      createdAt: "Jan 15, 2024",
    },
    {
      id: "2",
      name: "Twilio SMS API",
      service: "sms",
      key: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      status: "active",
      lastUsed: "5 hours ago",
      createdAt: "Jan 15, 2024",
    },
    {
      id: "3",
      name: "Manifest Financial API",
      service: "payment",
      key: "mf_live_xxxxxxxxxxxxxxxxxxxxxxxx",
      status: "active",
      lastUsed: "1 day ago",
      createdAt: "Jan 10, 2024",
    },
    {
      id: "4",
      name: "Instagram API",
      service: "social",
      key: "IGQxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      status: "inactive",
      createdAt: "Jan 5, 2024",
    },
    {
      id: "5",
      name: "Spotify API",
      service: "music",
      key: "BQDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      status: "active",
      lastUsed: "3 days ago",
      createdAt: "Jan 1, 2024",
    },
  ]);

  // System settings
  const [systemSettings, setSystemSettings] = useState({
    stationName: "North Country Radio (NACR)",
    stationUrl: "https://truefansradio.com",
    adminEmail: "admin@truefansradio.com",
    supportEmail: "support@truefansradio.com",
    rileyEmail: "riley@truefansradio.com",
    harperEmail: "harper@truefansradio.com",
    timezone: "America/New_York",
    autoApproveArtists: false,
    requireEmailVerification: true,
    enableSMSNotifications: true,
  });

  // Station settings
  const [stationSettings, setStationSettings] = useState({
    tracksPerHour: 12,
    adSpotsPerHour: 24,
    adSpotDuration: 15, // seconds
    primeHoursStart: "06:00",
    primeHoursEnd: "18:00",
    artistPoolPercentage: 80,
    stationRevenuePercentage: 20,
    minimumTrackBitrate: 192, // kbps
    maximumTrackSize: 10, // MB
    allowedFormats: ["mp3", "wav", "flac"],
  });

  const toggleKeyVisibility = (id: string) => {
    setShowKey((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (id: string, key: string) => {
    navigator.clipboard.writeText(key);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    // Show success message
    alert("Settings saved successfully!");
  };

  const getServiceIcon = (service: string) => {
    const icons = {
      email: <Mail className="w-5 h-5" />,
      sms: <MessageSquare className="w-5 h-5" />,
      payment: <DollarSign className="w-5 h-5" />,
      social: <Radio className="w-5 h-5" />,
      music: <Radio className="w-5 h-5" />,
    };
    return icons[service as keyof typeof icons] || <Key className="w-5 h-5" />;
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Header */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="text-gray-600 hover:text-gray-900 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">System Settings</h1>
                <p className="text-sm text-gray-600">Configure API keys and system preferences</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/admin" className="text-gray-600 hover:text-gray-900 text-sm">
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-t-xl border-b">
          <div className="flex space-x-2 p-2">
            <TabButton active={activeTab === "api-keys"} onClick={() => setActiveTab("api-keys")} label="API Keys" icon={<Key className="w-4 h-4" />} />
            <TabButton active={activeTab === "system"} onClick={() => setActiveTab("system")} label="System Settings" icon={<Settings className="w-4 h-4" />} />
            <TabButton active={activeTab === "station"} onClick={() => setActiveTab("station")} label="Station Config" icon={<Radio className="w-4 h-4" />} />
          </div>
        </div>

        {/* API Keys Tab */}
        {activeTab === "api-keys" && (
          <div className="bg-white rounded-b-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">API Key Management</h2>
                <p className="text-sm text-gray-600 mt-1">Configure external service integrations</p>
              </div>
              <button className="inline-flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                <Key className="w-4 h-4" />
                <span>Add New Key</span>
              </button>
            </div>

            <div className="space-y-4">
              {apiKeys.map((apiKey) => (
                <div key={apiKey.id} className="border rounded-lg p-4 hover:border-purple-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className={`p-2 rounded-lg ${apiKey.status === "active" ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-600"}`}>
                        {getServiceIcon(apiKey.service)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-gray-900">{apiKey.name}</h3>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              apiKey.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {apiKey.status}
                          </span>
                          <span className="text-xs text-gray-500 capitalize">{apiKey.service}</span>
                        </div>

                        <div className="flex items-center space-x-2 mb-2">
                          <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-sm font-mono text-gray-700">
                            {showKey[apiKey.id] ? apiKey.key : "•".repeat(apiKey.key.length)}
                          </code>
                          <button onClick={() => toggleKeyVisibility(apiKey.id)} className="p-2 bg-gray-100 rounded hover:bg-gray-200 transition-colors">
                            {showKey[apiKey.id] ? <EyeOff className="w-4 h-4 text-gray-600" /> : <Eye className="w-4 h-4 text-gray-600" />}
                          </button>
                          <button
                            onClick={() => copyToClipboard(apiKey.id, apiKey.key)}
                            className="p-2 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                          >
                            {copied === apiKey.id ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-600" />}
                          </button>
                          <button className="p-2 bg-gray-100 rounded hover:bg-gray-200 transition-colors">
                            <RefreshCw className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>

                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>Created: {apiKey.createdAt}</span>
                          {apiKey.lastUsed && <span>Last used: {apiKey.lastUsed}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-blue-900 mb-1">Security Best Practices</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Never share API keys publicly or commit them to version control</li>
                    <li>• Rotate keys regularly and immediately if compromised</li>
                    <li>• Use environment variables for production deployments</li>
                    <li>• Monitor API usage for unusual activity</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* System Settings Tab */}
        {activeTab === "system" && (
          <div className="bg-white rounded-b-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">System Configuration</h2>
                <p className="text-sm text-gray-600 mt-1">General system settings and preferences</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Station Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Station Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Station Name</label>
                    <input
                      type="text"
                      value={systemSettings.stationName}
                      onChange={(e) => setSystemSettings({ ...systemSettings, stationName: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Station URL</label>
                    <input
                      type="url"
                      value={systemSettings.stationUrl}
                      onChange={(e) => setSystemSettings({ ...systemSettings, stationUrl: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Email Addresses */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Admin Email</label>
                    <input
                      type="email"
                      value={systemSettings.adminEmail}
                      onChange={(e) => setSystemSettings({ ...systemSettings, adminEmail: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Support Email</label>
                    <input
                      type="email"
                      value={systemSettings.supportEmail}
                      onChange={(e) => setSystemSettings({ ...systemSettings, supportEmail: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Riley Team Email</label>
                    <input
                      type="email"
                      value={systemSettings.rileyEmail}
                      onChange={(e) => setSystemSettings({ ...systemSettings, rileyEmail: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Harper Team Email</label>
                    <input
                      type="email"
                      value={systemSettings.harperEmail}
                      onChange={(e) => setSystemSettings({ ...systemSettings, harperEmail: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* System Preferences */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Preferences</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                    <select
                      value={systemSettings.timezone}
                      onChange={(e) => setSystemSettings({ ...systemSettings, timezone: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="America/New_York">Eastern Time (ET)</option>
                      <option value="America/Chicago">Central Time (CT)</option>
                      <option value="America/Denver">Mountain Time (MT)</option>
                      <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={systemSettings.autoApproveArtists}
                        onChange={(e) => setSystemSettings({ ...systemSettings, autoApproveArtists: e.target.checked })}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Auto-approve new artists</span>
                        <p className="text-xs text-gray-500">Artists are automatically approved for FREE tier without manual review</p>
                      </div>
                    </label>

                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={systemSettings.requireEmailVerification}
                        onChange={(e) => setSystemSettings({ ...systemSettings, requireEmailVerification: e.target.checked })}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Require email verification</span>
                        <p className="text-xs text-gray-500">Artists must verify their email address before submitting tracks</p>
                      </div>
                    </label>

                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={systemSettings.enableSMSNotifications}
                        onChange={(e) => setSystemSettings({ ...systemSettings, enableSMSNotifications: e.target.checked })}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Enable SMS notifications</span>
                        <p className="text-xs text-gray-500">Send SMS notifications for important events (requires Twilio API)</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-6 border-t">
                <button
                  onClick={handleSaveSettings}
                  disabled={isSaving}
                  className="inline-flex items-center space-x-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>Save System Settings</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Station Config Tab */}
        {activeTab === "station" && (
          <div className="bg-white rounded-b-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Station Configuration</h2>
                <p className="text-sm text-gray-600 mt-1">Configure station capacity and revenue settings</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Airtime Configuration */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Airtime Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tracks per Hour</label>
                    <input
                      type="number"
                      value={stationSettings.tracksPerHour}
                      onChange={(e) => setStationSettings({ ...stationSettings, tracksPerHour: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ad Spots per Hour</label>
                    <input
                      type="number"
                      value={stationSettings.adSpotsPerHour}
                      onChange={(e) => setStationSettings({ ...stationSettings, adSpotsPerHour: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ad Spot Duration (sec)</label>
                    <input
                      type="number"
                      value={stationSettings.adSpotDuration}
                      onChange={(e) => setStationSettings({ ...stationSettings, adSpotDuration: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Prime Hours */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Prime Hours</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Prime Hours Start</label>
                    <input
                      type="time"
                      value={stationSettings.primeHoursStart}
                      onChange={(e) => setStationSettings({ ...stationSettings, primeHoursStart: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Prime Hours End</label>
                    <input
                      type="time"
                      value={stationSettings.primeHoursEnd}
                      onChange={(e) => setStationSettings({ ...stationSettings, primeHoursEnd: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Revenue Split */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Distribution</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Artist Pool Percentage</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={stationSettings.artistPoolPercentage}
                        onChange={(e) =>
                          setStationSettings({
                            ...stationSettings,
                            artistPoolPercentage: parseInt(e.target.value),
                            stationRevenuePercentage: 100 - parseInt(e.target.value),
                          })
                        }
                        className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <span className="text-gray-600 font-medium">%</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Station Revenue Percentage</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={stationSettings.stationRevenuePercentage}
                        onChange={(e) =>
                          setStationSettings({
                            ...stationSettings,
                            stationRevenuePercentage: parseInt(e.target.value),
                            artistPoolPercentage: 100 - parseInt(e.target.value),
                          })
                        }
                        className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <span className="text-gray-600 font-medium">%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Track Requirements */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Track Requirements</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Bitrate (kbps)</label>
                    <input
                      type="number"
                      value={stationSettings.minimumTrackBitrate}
                      onChange={(e) => setStationSettings({ ...stationSettings, minimumTrackBitrate: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Maximum File Size (MB)</label>
                    <input
                      type="number"
                      value={stationSettings.maximumTrackSize}
                      onChange={(e) => setStationSettings({ ...stationSettings, maximumTrackSize: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Allowed Formats</label>
                    <div className="space-y-2">
                      {["mp3", "wav", "flac"].map((format) => (
                        <label key={format} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={stationSettings.allowedFormats.includes(format)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setStationSettings({
                                  ...stationSettings,
                                  allowedFormats: [...stationSettings.allowedFormats, format],
                                });
                              } else {
                                setStationSettings({
                                  ...stationSettings,
                                  allowedFormats: stationSettings.allowedFormats.filter((f) => f !== format),
                                });
                              }
                            }}
                            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                          />
                          <span className="text-sm text-gray-700 uppercase">{format}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-6 border-t">
                <button
                  onClick={handleSaveSettings}
                  disabled={isSaving}
                  className="inline-flex items-center space-x-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>Save Station Config</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function TabButton({ active, onClick, label, icon }: { active: boolean; onClick: () => void; label: string; icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
        active ? "bg-purple-100 text-purple-700" : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
