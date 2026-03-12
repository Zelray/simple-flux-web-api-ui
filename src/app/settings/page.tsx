'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { getSettings, saveSettings, DEFAULT_SETTINGS, AppSettings } from "@/lib/settings";
import { FolderOpen, Save, RotateCcw, ImageIcon, VideoIcon, Brain, Settings2, Sparkles } from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  const handlePathChange = (key: keyof AppSettings['paths'], value: string) => {
    setSettings(prev => ({
      ...prev,
      paths: { ...prev.paths, [key]: value }
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    saveSettings(settings);
    setHasChanges(false);
    toast({
      title: "Settings saved",
      description: "Your preferences have been saved successfully.",
    });
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    saveSettings(DEFAULT_SETTINGS);
    setHasChanges(false);
    toast({
      title: "Settings reset",
      description: "All settings have been restored to defaults.",
    });
  };

  const handleBrowseFolder = async (key: keyof AppSettings['paths']) => {
    // Prompt user to enter the full path
    const currentPath = settings.paths[key];
    const newPath = window.prompt(
      'Enter the full folder path:\n\nExamples:\n• C:\\Users\\you\\loras\n• /home/you/loras\n• ./loras (relative to project)',
      currentPath
    );

    if (newPath !== null && newPath.trim() !== '') {
      handlePathChange(key, newPath.trim());
      toast({
        title: "Path updated",
        description: `Set to: ${newPath.trim()}`,
      });
    }
  };

  const pathConfigs = [
    {
      key: 'saved_images' as const,
      label: 'Images',
      description: 'Where generated images are saved',
      icon: ImageIcon,
      color: 'text-blue-500',
    },
    {
      key: 'saved_videos' as const,
      label: 'Videos',
      description: 'Where generated videos are saved',
      icon: VideoIcon,
      color: 'text-purple-500',
    },
    {
      key: 'saved_loras' as const,
      label: 'LoRA Models',
      description: 'Where LoRA model files (.safetensors) are stored',
      icon: Sparkles,
      color: 'text-pink-500',
    },
    {
      key: 'saved_training' as const,
      label: 'Training Data',
      description: 'Where training datasets are saved',
      icon: Brain,
      color: 'text-orange-500',
      comingSoon: true,
    },
  ];

  return (
    <main className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="flex flex-col space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Settings2 className="h-8 w-8" />
              Settings
            </h1>
            <p className="text-muted-foreground">
              Configure your output paths and preferences
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleReset}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>

        {/* Output Paths Section */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Output Paths
            </CardTitle>
            <CardDescription>
              Enter full paths where your content is stored. Use absolute paths (C:\Users\...) or relative paths from the project root (./loras).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {pathConfigs.map((config) => {
              const Icon = config.icon;
              return (
                <div key={config.key} className="space-y-2">
                  <Label
                    htmlFor={config.key}
                    className={`flex items-center gap-2 text-sm font-medium ${config.comingSoon ? 'opacity-50' : ''}`}
                  >
                    <Icon className={`h-4 w-4 ${config.color}`} />
                    {config.label}
                    {config.comingSoon && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        Coming Soon
                      </span>
                    )}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id={config.key}
                      value={settings.paths[config.key]}
                      onChange={(e) => handlePathChange(config.key, e.target.value)}
                      placeholder={DEFAULT_SETTINGS.paths[config.key]}
                      disabled={config.comingSoon}
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={config.comingSoon}
                      title="Browse folder"
                      onClick={() => handleBrowseFolder(config.key)}
                    >
                      <FolderOpen className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {config.description}
                  </p>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* General Settings */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle>General</CardTitle>
            <CardDescription>
              Additional preferences for content generation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="autoSave">Auto-save generated content</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically save all generated images and videos to the configured paths
                </p>
              </div>
              <Switch
                id="autoSave"
                checked={settings.autoSave}
                onCheckedChange={(checked) => {
                  setSettings(prev => ({ ...prev, autoSave: checked }));
                  setHasChanges(true);
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>Thumbnail Size</Label>
              <div className="flex gap-2">
                {(['small', 'medium', 'large'] as const).map((size) => (
                  <Button
                    key={size}
                    variant={settings.thumbnailSize === size ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setSettings(prev => ({ ...prev, thumbnailSize: size }));
                      setHasChanges(true);
                    }}
                    className="capitalize"
                  >
                    {size}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Size of thumbnails in the library view
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Storage Info */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle>Storage</CardTitle>
            <CardDescription>
              Local browser storage usage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">API Key</p>
                <p className="font-mono">fal-ai-api-key</p>
              </div>
              <div>
                <p className="text-muted-foreground">Image History</p>
                <p className="font-mono">fal-ai-generations</p>
              </div>
              <div>
                <p className="text-muted-foreground">Video History</p>
                <p className="font-mono">fal-ai-video-generations</p>
              </div>
              <div>
                <p className="text-muted-foreground">Settings</p>
                <p className="font-mono">fal-ai-settings</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 text-destructive hover:text-destructive"
              onClick={() => {
                if (confirm('This will clear all local data including API key and history. Continue?')) {
                  localStorage.clear();
                  window.location.reload();
                }
              }}
            >
              Clear All Local Data
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
