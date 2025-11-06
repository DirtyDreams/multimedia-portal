"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Loader2, Globe, Mail, Shield, Bell, Palette } from "lucide-react";

interface Settings {
  general: {
    siteName: string;
    siteDescription: string;
    siteUrl: string;
    adminEmail: string;
    timezone: string;
    language: string;
  };
  email: {
    smtpHost: string;
    smtpPort: string;
    smtpUser: string;
    smtpPassword: string;
    fromEmail: string;
    fromName: string;
  };
  security: {
    allowRegistration: boolean;
    requireEmailVerification: boolean;
    enableTwoFactor: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
  };
  notifications: {
    emailNotifications: boolean;
    newCommentNotification: boolean;
    newUserNotification: boolean;
    contentReportNotification: boolean;
  };
  appearance: {
    theme: "light" | "dark" | "system";
    primaryColor: string;
    logoUrl: string;
    faviconUrl: string;
  };
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"general" | "email" | "security" | "notifications" | "appearance">("general");
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery<Settings>({
    queryKey: ["settings"],
    queryFn: async () => {
      // TODO: Replace with actual API endpoint
      return {
        general: {
          siteName: "Multimedia Portal",
          siteDescription: "Your comprehensive multimedia content platform",
          siteUrl: "https://example.com",
          adminEmail: "admin@example.com",
          timezone: "UTC",
          language: "en",
        },
        email: {
          smtpHost: "smtp.gmail.com",
          smtpPort: "587",
          smtpUser: "noreply@example.com",
          smtpPassword: "",
          fromEmail: "noreply@example.com",
          fromName: "Multimedia Portal",
        },
        security: {
          allowRegistration: true,
          requireEmailVerification: true,
          enableTwoFactor: false,
          sessionTimeout: 30,
          maxLoginAttempts: 5,
        },
        notifications: {
          emailNotifications: true,
          newCommentNotification: true,
          newUserNotification: true,
          contentReportNotification: true,
        },
        appearance: {
          theme: "system" as const,
          primaryColor: "#0070f3",
          logoUrl: "",
          faviconUrl: "",
        },
      };
    },
  });

  const [formData, setFormData] = useState<Settings>(settings || {} as Settings);

  // Update formData when settings load
  useState(() => {
    if (settings) {
      setFormData(settings);
    }
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async (data: Settings) => {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveSettingsMutation.mutateAsync(formData);
  };

  const tabs = [
    { id: "general" as const, label: "General", icon: Globe },
    { id: "email" as const, label: "Email", icon: Mail },
    { id: "security" as const, label: "Security", icon: Shield },
    { id: "notifications" as const, label: "Notifications", icon: Bell },
    { id: "appearance" as const, label: "Appearance", icon: Palette },
  ];

  if (isLoading || !formData.general) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your portal configuration</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-card border border-border rounded-lg p-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-6">
            {/* General Settings */}
            {activeTab === "general" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-4">General Settings</h2>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Site Name</label>
                  <input
                    type="text"
                    value={formData.general.siteName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        general: { ...formData.general, siteName: e.target.value },
                      })
                    }
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Site Description</label>
                  <textarea
                    value={formData.general.siteDescription}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        general: { ...formData.general, siteDescription: e.target.value },
                      })
                    }
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Site URL</label>
                  <input
                    type="url"
                    value={formData.general.siteUrl}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        general: { ...formData.general, siteUrl: e.target.value },
                      })
                    }
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Admin Email</label>
                  <input
                    type="email"
                    value={formData.general.adminEmail}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        general: { ...formData.general, adminEmail: e.target.value },
                      })
                    }
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Timezone</label>
                    <select
                      value={formData.general.timezone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          general: { ...formData.general, timezone: e.target.value },
                        })
                      }
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/Denver">Mountain Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Language</label>
                    <select
                      value={formData.general.language}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          general: { ...formData.general, language: e.target.value },
                        })
                      }
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Email Settings */}
            {activeTab === "email" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-4">Email Settings</h2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">SMTP Host</label>
                    <input
                      type="text"
                      value={formData.email.smtpHost}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          email: { ...formData.email, smtpHost: e.target.value },
                        })
                      }
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">SMTP Port</label>
                    <input
                      type="text"
                      value={formData.email.smtpPort}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          email: { ...formData.email, smtpPort: e.target.value },
                        })
                      }
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">SMTP User</label>
                  <input
                    type="text"
                    value={formData.email.smtpUser}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        email: { ...formData.email, smtpUser: e.target.value },
                      })
                    }
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">SMTP Password</label>
                  <input
                    type="password"
                    value={formData.email.smtpPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        email: { ...formData.email, smtpPassword: e.target.value },
                      })
                    }
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Leave blank to keep current password"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">From Email</label>
                    <input
                      type="email"
                      value={formData.email.fromEmail}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          email: { ...formData.email, fromEmail: e.target.value },
                        })
                      }
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">From Name</label>
                    <input
                      type="text"
                      value={formData.email.fromName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          email: { ...formData.email, fromName: e.target.value },
                        })
                      }
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === "security" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-4">Security Settings</h2>
                </div>

                <div className="space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.security.allowRegistration}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          security: { ...formData.security, allowRegistration: e.target.checked },
                        })
                      }
                      className="w-5 h-5 rounded border-border"
                    />
                    <div>
                      <div className="font-medium">Allow User Registration</div>
                      <div className="text-sm text-muted-foreground">
                        Let new users create accounts on your portal
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.security.requireEmailVerification}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          security: { ...formData.security, requireEmailVerification: e.target.checked },
                        })
                      }
                      className="w-5 h-5 rounded border-border"
                    />
                    <div>
                      <div className="font-medium">Require Email Verification</div>
                      <div className="text-sm text-muted-foreground">
                        Users must verify their email before accessing the portal
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.security.enableTwoFactor}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          security: { ...formData.security, enableTwoFactor: e.target.checked },
                        })
                      }
                      className="w-5 h-5 rounded border-border"
                    />
                    <div>
                      <div className="font-medium">Enable Two-Factor Authentication</div>
                      <div className="text-sm text-muted-foreground">
                        Add an extra layer of security with 2FA
                      </div>
                    </div>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Session Timeout (minutes)</label>
                    <input
                      type="number"
                      value={formData.security.sessionTimeout}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          security: { ...formData.security, sessionTimeout: Number(e.target.value) },
                        })
                      }
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      min="5"
                      max="1440"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Max Login Attempts</label>
                    <input
                      type="number"
                      value={formData.security.maxLoginAttempts}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          security: { ...formData.security, maxLoginAttempts: Number(e.target.value) },
                        })
                      }
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      min="3"
                      max="10"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Settings */}
            {activeTab === "notifications" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-4">Notification Settings</h2>
                </div>

                <div className="space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.notifications.emailNotifications}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          notifications: { ...formData.notifications, emailNotifications: e.target.checked },
                        })
                      }
                      className="w-5 h-5 rounded border-border"
                    />
                    <div>
                      <div className="font-medium">Enable Email Notifications</div>
                      <div className="text-sm text-muted-foreground">
                        Master toggle for all email notifications
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.notifications.newCommentNotification}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          notifications: { ...formData.notifications, newCommentNotification: e.target.checked },
                        })
                      }
                      className="w-5 h-5 rounded border-border"
                      disabled={!formData.notifications.emailNotifications}
                    />
                    <div>
                      <div className="font-medium">New Comment Notifications</div>
                      <div className="text-sm text-muted-foreground">
                        Get notified when someone comments on content
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.notifications.newUserNotification}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          notifications: { ...formData.notifications, newUserNotification: e.target.checked },
                        })
                      }
                      className="w-5 h-5 rounded border-border"
                      disabled={!formData.notifications.emailNotifications}
                    />
                    <div>
                      <div className="font-medium">New User Notifications</div>
                      <div className="text-sm text-muted-foreground">
                        Get notified when a new user registers
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.notifications.contentReportNotification}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          notifications: { ...formData.notifications, contentReportNotification: e.target.checked },
                        })
                      }
                      className="w-5 h-5 rounded border-border"
                      disabled={!formData.notifications.emailNotifications}
                    />
                    <div>
                      <div className="font-medium">Content Report Notifications</div>
                      <div className="text-sm text-muted-foreground">
                        Get notified when content is reported
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Appearance Settings */}
            {activeTab === "appearance" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-4">Appearance Settings</h2>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Theme</label>
                  <select
                    value={formData.appearance.theme}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        appearance: { ...formData.appearance, theme: e.target.value as "light" | "dark" | "system" },
                      })
                    }
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Primary Color</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      value={formData.appearance.primaryColor}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          appearance: { ...formData.appearance, primaryColor: e.target.value },
                        })
                      }
                      className="w-20 h-10 rounded border border-border cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.appearance.primaryColor}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          appearance: { ...formData.appearance, primaryColor: e.target.value },
                        })
                      }
                      className="flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="#0070f3"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Logo URL</label>
                  <input
                    type="url"
                    value={formData.appearance.logoUrl}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        appearance: { ...formData.appearance, logoUrl: e.target.value },
                      })
                    }
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="https://example.com/logo.png"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Favicon URL</label>
                  <input
                    type="url"
                    value={formData.appearance.faviconUrl}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        appearance: { ...formData.appearance, faviconUrl: e.target.value },
                      })
                    }
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="https://example.com/favicon.ico"
                  />
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-border">
              <button
                type="submit"
                disabled={saveSettingsMutation.isPending}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saveSettingsMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Settings
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
