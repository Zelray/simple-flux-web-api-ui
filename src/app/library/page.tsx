'use client';

import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getSettings } from "@/lib/settings";
import {
  ImageIcon,
  VideoIcon,
  Brain,
  Search,
  Download,
  Trash2,
  ExternalLink,
  Loader2,
  FolderOpen,
  Grid3X3,
  LayoutGrid,
  Clock,
  Filter
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Generation } from "@/lib/types";

interface FileItem {
  name: string;
  path: string;
  url: string;
  type: 'image' | 'video';
  size?: number;
  modified?: number;
}

type TabType = 'images' | 'videos' | 'training';

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState<TabType>('images');
  const [search, setSearch] = useState('');
  const [gridSize, setGridSize] = useState<'small' | 'large'>('large');
  const [selectedItem, setSelectedItem] = useState<FileItem | Generation | null>(null);

  // Load from localStorage (browser-based storage)
  const [imageGenerations, setImageGenerations] = useState<Generation[]>([]);
  const [videoGenerations, setVideoGenerations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load generations from localStorage
    const loadGenerations = () => {
      setLoading(true);
      try {
        const images = localStorage.getItem('fal-ai-generations');
        const videos = localStorage.getItem('fal-ai-video-generations');

        if (images) {
          setImageGenerations(JSON.parse(images));
        }
        if (videos) {
          setVideoGenerations(JSON.parse(videos));
        }
      } catch (error) {
        console.error('Failed to load generations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadGenerations();
  }, []);

  const filteredImages = imageGenerations.filter(gen =>
    gen.prompt.toLowerCase().includes(search.toLowerCase()) ||
    gen.modelName.toLowerCase().includes(search.toLowerCase())
  );

  const filteredVideos = videoGenerations.filter(gen =>
    gen.prompt?.toLowerCase().includes(search.toLowerCase()) ||
    gen.modelName?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (id: string, type: 'image' | 'video') => {
    if (!confirm('Delete this item from history?')) return;

    if (type === 'image') {
      const updated = imageGenerations.filter(g => g.id !== id);
      setImageGenerations(updated);
      localStorage.setItem('fal-ai-generations', JSON.stringify(updated));
    } else {
      const updated = videoGenerations.filter(g => g.id !== id);
      setVideoGenerations(updated);
      localStorage.setItem('fal-ai-video-generations', JSON.stringify(updated));
    }
    setSelectedItem(null);
  };

  const tabs = [
    { id: 'images' as const, label: 'Images', icon: ImageIcon, count: imageGenerations.length },
    { id: 'videos' as const, label: 'Videos', icon: VideoIcon, count: videoGenerations.length },
    { id: 'training' as const, label: 'Training', icon: Brain, count: 0, disabled: true },
  ];

  const gridCols = gridSize === 'small'
    ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'
    : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4';

  return (
    <main className="container mx-auto py-8 px-4">
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <FolderOpen className="h-8 w-8" />
              Library
            </h1>
            <p className="text-muted-foreground">
              Browse your generated content
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Grid size toggle */}
            <div className="flex border rounded-md">
              <Button
                variant={gridSize === 'large' ? 'secondary' : 'ghost'}
                size="icon"
                className="rounded-r-none"
                onClick={() => setGridSize('large')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={gridSize === 'small' ? 'secondary' : 'ghost'}
                size="icon"
                className="rounded-l-none"
                onClick={() => setGridSize('small')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by prompt or model..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)}>
          <TabsList className="grid w-full max-w-md grid-cols-3">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  disabled={tab.disabled}
                  className="gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                  <span className="text-xs text-muted-foreground">
                    ({tab.count})
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Images Tab */}
          <TabsContent value="images" className="mt-6">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredImages.length === 0 ? (
              <EmptyState
                icon={ImageIcon}
                title="No images yet"
                description="Generated images will appear here"
              />
            ) : (
              <div className={`grid ${gridCols} gap-4`}>
                {filteredImages.map((gen) => (
                  <Card
                    key={gen.id}
                    className="group overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:border-primary/50 bg-card/50"
                    onClick={() => setSelectedItem(gen)}
                  >
                    <div className="aspect-square relative overflow-hidden bg-muted">
                      {gen.output.images[0]?.url ? (
                        <img
                          src={gen.output.images[0].url}
                          alt={gen.prompt}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                        <div className="text-white text-xs line-clamp-2">
                          {gen.prompt}
                        </div>
                      </div>
                    </div>
                    {gridSize === 'large' && (
                      <div className="p-3 space-y-1">
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {gen.modelName}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(gen.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Videos Tab */}
          <TabsContent value="videos" className="mt-6">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredVideos.length === 0 ? (
              <EmptyState
                icon={VideoIcon}
                title="No videos yet"
                description="Generated videos will appear here"
              />
            ) : (
              <div className={`grid ${gridCols} gap-4`}>
                {filteredVideos.map((gen) => (
                  <Card
                    key={gen.id}
                    className="group overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:border-primary/50 bg-card/50"
                    onClick={() => setSelectedItem(gen)}
                  >
                    <div className="aspect-video relative overflow-hidden bg-muted">
                      {gen.output?.video_url ? (
                        <video
                          src={gen.output.video_url}
                          className="w-full h-full object-cover"
                          muted
                          loop
                          onMouseEnter={(e) => e.currentTarget.play()}
                          onMouseLeave={(e) => {
                            e.currentTarget.pause();
                            e.currentTarget.currentTime = 0;
                          }}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <VideoIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    {gridSize === 'large' && (
                      <div className="p-3 space-y-1">
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {gen.modelName}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(gen.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Training Tab */}
          <TabsContent value="training" className="mt-6">
            <EmptyState
              icon={Brain}
              title="Training Data"
              description="Coming soon - Save and manage training datasets for LoRA fine-tuning"
              comingSoon
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Detail Modal */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogTitle className="sr-only">Content Details</DialogTitle>
          {selectedItem && 'output' in selectedItem && (
            <div className="space-y-4">
              {/* Image/Video Preview */}
              {'images' in selectedItem.output ? (
                <img
                  src={selectedItem.output.images[0]?.url}
                  alt={selectedItem.prompt}
                  className="w-full rounded-lg"
                />
              ) : 'video_url' in selectedItem.output ? (
                <video
                  src={selectedItem.output.video_url}
                  controls
                  autoPlay
                  loop
                  className="w-full rounded-lg"
                />
              ) : null}

              {/* Details */}
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Prompt</p>
                  <p className="text-sm">{selectedItem.prompt}</p>
                </div>
                <div className="flex gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Model</p>
                    <p>{selectedItem.modelName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Date</p>
                    <p>{new Date(selectedItem.timestamp).toLocaleString()}</p>
                  </div>
                  {'output' in selectedItem && 'seed' in selectedItem.output && (
                    <div>
                      <p className="text-muted-foreground">Seed</p>
                      <p className="font-mono">{selectedItem.output.seed}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => {
                    const url = 'images' in selectedItem.output
                      ? selectedItem.output.images[0]?.url
                      : selectedItem.output.video_url;
                    if (url) window.open(url, '_blank');
                  }}
                >
                  <ExternalLink className="h-4 w-4" />
                  Open Original
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => {
                    const url = 'images' in selectedItem.output
                      ? selectedItem.output.images[0]?.url
                      : selectedItem.output.video_url;
                    if (url) {
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `fal-${selectedItem.id}`;
                      a.click();
                    }
                  }}
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 text-destructive hover:text-destructive"
                  onClick={() => {
                    const type = 'images' in selectedItem.output ? 'image' : 'video';
                    handleDelete(selectedItem.id, type);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  comingSoon
}: {
  icon: any;
  title: string;
  description: string;
  comingSoon?: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className={`p-4 rounded-full bg-muted mb-4 ${comingSoon ? 'opacity-50' : ''}`}>
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mt-1">{description}</p>
      {comingSoon && (
        <span className="mt-3 text-xs px-3 py-1 rounded-full bg-primary/10 text-primary">
          Coming Soon
        </span>
      )}
    </div>
  );
}
