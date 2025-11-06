"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Loader2, Bell, Mail, MessageSquare, Heart, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface NotificationPreferences {
  email: {
    enabled: boolean;
    newComment: boolean;
    newReply: boolean;
    newLike: boolean;
    newFollower: boolean;
    weeklyDigest: boolean;
  };
  push: {
    enabled: boolean;
    newComment: boolean;
    newReply: boolean;
    newLike: boolean;
    newFollower: boolean;
  };
  inApp: {
    enabled: boolean;
    newComment: boolean;
    newReply: boolean;
    newLike: boolean;
    newFollower: boolean;
    systemUpdates: boolean;
  };
}

export default function NotificationSettingsPage() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: preferences, isLoading } = useQuery<NotificationPreferences>({
    queryKey: ["notification-preferences"],
    queryFn: async () => {
      // TODO: Replace with actual API endpoint
      return {
        email: {
          enabled: true,
          newComment: true,
          newReply: true,
          newLike: false,
          newFollower: true,
          weeklyDigest: true,
        },
        push: {
          enabled: false,
          newComment: true,
          newReply: true,
          newLike: true,
          newFollower: false,
        },
        inApp: {
          enabled: true,
          newComment: true,
          newReply: true,
          newLike: true,
          newFollower: true,
          systemUpdates: true,
        },
      };
    },
  });

  const [formData, setFormData] = useState<NotificationPreferences>(
    preferences || {
      email: {
        enabled: true,
        newComment: false,
        newReply: false,
        newLike: false,
        newFollower: false,
        weeklyDigest: false,
      },
      push: {
        enabled: false,
        newComment: false,
        newReply: false,
        newLike: false,
        newFollower: false,
      },
      inApp: {
        enabled: true,
        newComment: false,
        newReply: false,
        newLike: false,
        newFollower: false,
        systemUpdates: false,
      },
    }
  );

  // Update formData when preferences load
  useState(() => {
    if (preferences) {
      setFormData(preferences);
    }
  });

  const savePreferencesMutation = useMutation({
    mutationFn: async (data: NotificationPreferences) => {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
      toast.success("Notification preferences saved successfully");
    },
    onError: () => {
      toast.error("Failed to save notification preferences");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await savePreferencesMutation.mutateAsync(formData);
  };

  const handleEmailToggle = (enabled: boolean) => {
    setFormData({
      ...formData,
      email: {
        ...formData.email,
        enabled,
      },
    });
  };

  const handlePushToggle = (enabled: boolean) => {
    setFormData({
      ...formData,
      push: {
        ...formData.push,
        enabled,
      },
    });
  };

  const handleInAppToggle = (enabled: boolean) => {
    setFormData({
      ...formData,
      inApp: {
        ...formData.inApp,
        enabled,
      },
    });
  };

  if (isLoading || !formData.email) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Notification Settings</h1>
        <p className="text-muted-foreground">
          Manage how you receive notifications from the portal
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Notifications */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Email Notifications</h3>
                <p className="text-sm text-muted-foreground">
                  Receive notifications via email
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.email.enabled}
                onChange={(e) => handleEmailToggle(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="space-y-4 ml-14">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="font-medium">New Comments</div>
                <div className="text-sm text-muted-foreground">
                  When someone comments on your content
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.email.newComment}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    email: { ...formData.email, newComment: e.target.checked },
                  })
                }
                disabled={!formData.email.enabled}
                className="w-5 h-5 rounded border-border"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="font-medium">New Replies</div>
                <div className="text-sm text-muted-foreground">
                  When someone replies to your comment
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.email.newReply}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    email: { ...formData.email, newReply: e.target.checked },
                  })
                }
                disabled={!formData.email.enabled}
                className="w-5 h-5 rounded border-border"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="font-medium">New Likes</div>
                <div className="text-sm text-muted-foreground">
                  When someone likes your content
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.email.newLike}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    email: { ...formData.email, newLike: e.target.checked },
                  })
                }
                disabled={!formData.email.enabled}
                className="w-5 h-5 rounded border-border"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="font-medium">New Followers</div>
                <div className="text-sm text-muted-foreground">
                  When someone follows you
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.email.newFollower}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    email: { ...formData.email, newFollower: e.target.checked },
                  })
                }
                disabled={!formData.email.enabled}
                className="w-5 h-5 rounded border-border"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="font-medium">Weekly Digest</div>
                <div className="text-sm text-muted-foreground">
                  Weekly summary of your activity
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.email.weeklyDigest}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    email: { ...formData.email, weeklyDigest: e.target.checked },
                  })
                }
                disabled={!formData.email.enabled}
                className="w-5 h-5 rounded border-border"
              />
            </label>
          </div>
        </div>

        {/* Push Notifications */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Push Notifications</h3>
                <p className="text-sm text-muted-foreground">
                  Receive browser push notifications
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.push.enabled}
                onChange={(e) => handlePushToggle(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="space-y-4 ml-14">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="font-medium">New Comments</div>
                <div className="text-sm text-muted-foreground">
                  When someone comments on your content
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.push.newComment}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    push: { ...formData.push, newComment: e.target.checked },
                  })
                }
                disabled={!formData.push.enabled}
                className="w-5 h-5 rounded border-border"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="font-medium">New Replies</div>
                <div className="text-sm text-muted-foreground">
                  When someone replies to your comment
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.push.newReply}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    push: { ...formData.push, newReply: e.target.checked },
                  })
                }
                disabled={!formData.push.enabled}
                className="w-5 h-5 rounded border-border"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="font-medium">New Likes</div>
                <div className="text-sm text-muted-foreground">
                  When someone likes your content
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.push.newLike}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    push: { ...formData.push, newLike: e.target.checked },
                  })
                }
                disabled={!formData.push.enabled}
                className="w-5 h-5 rounded border-border"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="font-medium">New Followers</div>
                <div className="text-sm text-muted-foreground">
                  When someone follows you
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.push.newFollower}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    push: { ...formData.push, newFollower: e.target.checked },
                  })
                }
                disabled={!formData.push.enabled}
                className="w-5 h-5 rounded border-border"
              />
            </label>
          </div>
        </div>

        {/* In-App Notifications */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">In-App Notifications</h3>
                <p className="text-sm text-muted-foreground">
                  Receive notifications within the portal
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.inApp.enabled}
                onChange={(e) => handleInAppToggle(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="space-y-4 ml-14">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="font-medium">New Comments</div>
                <div className="text-sm text-muted-foreground">
                  When someone comments on your content
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.inApp.newComment}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    inApp: { ...formData.inApp, newComment: e.target.checked },
                  })
                }
                disabled={!formData.inApp.enabled}
                className="w-5 h-5 rounded border-border"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="font-medium">New Replies</div>
                <div className="text-sm text-muted-foreground">
                  When someone replies to your comment
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.inApp.newReply}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    inApp: { ...formData.inApp, newReply: e.target.checked },
                  })
                }
                disabled={!formData.inApp.enabled}
                className="w-5 h-5 rounded border-border"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="font-medium">New Likes</div>
                <div className="text-sm text-muted-foreground">
                  When someone likes your content
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.inApp.newLike}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    inApp: { ...formData.inApp, newLike: e.target.checked },
                  })
                }
                disabled={!formData.inApp.enabled}
                className="w-5 h-5 rounded border-border"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="font-medium">New Followers</div>
                <div className="text-sm text-muted-foreground">
                  When someone follows you
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.inApp.newFollower}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    inApp: { ...formData.inApp, newFollower: e.target.checked },
                  })
                }
                disabled={!formData.inApp.enabled}
                className="w-5 h-5 rounded border-border"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="font-medium">System Updates</div>
                <div className="text-sm text-muted-foreground">
                  Portal updates and announcements
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.inApp.systemUpdates}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    inApp: { ...formData.inApp, systemUpdates: e.target.checked },
                  })
                }
                disabled={!formData.inApp.enabled}
                className="w-5 h-5 rounded border-border"
              />
            </label>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={savePreferencesMutation.isPending}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {savePreferencesMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Preferences
          </button>
        </div>
      </form>
    </div>
  );
}
