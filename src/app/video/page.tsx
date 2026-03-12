'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Search, VideoIcon, Sparkles } from "lucide-react";
import { allVideoModels } from "@/lib/models/registry";

interface FalModel {
  id: string;
  title: string;
  shortDescription?: string;
  category?: string;
  thumbnailUrl?: string;
  modelLab?: string;
  modelFamily?: string;
  isRegistryModel?: boolean;
}

export default function VideoPage() {
  const [models, setModels] = useState<FalModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async (keywords?: string) => {
    setLoading(true);
    setError(null);
    try {
      // First add registry video models (converted to FalModel format)
      const registryModels: FalModel[] = allVideoModels.map(m => ({
        id: m.id,
        title: m.name,
        shortDescription: 'Custom registry model with LoRA support',
        category: 'image-to-video',
        thumbnailUrl: undefined,
        modelLab: 'FAL.AI',
        isRegistryModel: true,
      }));

      const url = keywords
        ? `/api/models?keywords=${encodeURIComponent(keywords)}`
        : '/api/models?total=200';

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch models');

      const data = await response.json();

      // Filter for video-related models from API
      const apiVideoModels = Array.isArray(data)
        ? data.filter((m: FalModel) => {
            const cat = m.category?.toLowerCase() || '';
            return (
              cat.includes('video') ||
              cat.includes('text-to-video') ||
              cat.includes('image-to-video')
            );
          })
        : [];

      // Combine registry models first, then API models (avoiding duplicates)
      const registryIds = new Set(registryModels.map(m => m.id));
      const uniqueApiModels = apiVideoModels.filter((m: FalModel) => !registryIds.has(m.id));

      // Filter by search if provided
      let combinedModels = [...registryModels, ...uniqueApiModels];
      if (keywords) {
        const searchLower = keywords.toLowerCase();
        combinedModels = combinedModels.filter(m =>
          m.title?.toLowerCase().includes(searchLower) ||
          m.id.toLowerCase().includes(searchLower)
        );
      }

      setModels(combinedModels);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      fetchModels(search);
    } else {
      fetchModels();
    }
  };

  return (
    <main className="container mx-auto py-8 px-4">
      <div className="flex flex-col space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Video Generation</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {loading ? 'Loading models...' : `${models.length} AI video generation models available`}
          </p>
        </div>

        <form onSubmit={handleSearch} className="max-w-md mx-auto w-full">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search video models..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </form>

        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <div className="text-center text-destructive py-8">
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {models.map((model) => (
              <Link
                key={model.id}
                href={`/video/${model.id.replace(/\//g, "__")}`}
                className="block group"
              >
                <Card className="h-full transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:border-primary/50 bg-card/50">
                  <div className="aspect-video relative bg-muted/50 rounded-t-lg overflow-hidden flex items-center justify-center">
                    {model.thumbnailUrl ? (
                      <img
                        src={model.thumbnailUrl}
                        alt={model.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <VideoIcon className="h-12 w-12 text-muted-foreground/50" />
                    )}
                  </div>
                  <CardHeader className="p-4">
                    <CardTitle className="text-sm font-medium line-clamp-1">
                      {model.title}
                    </CardTitle>
                    {model.shortDescription && (
                      <CardDescription className="text-xs line-clamp-2">
                        {model.shortDescription}
                      </CardDescription>
                    )}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {model.isRegistryModel && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-400 border border-pink-500/30 flex items-center gap-1">
                          <Sparkles className="h-3 w-3" />
                          LoRA
                        </span>
                      )}
                      {model.modelLab && (
                        <span className="text-xs text-muted-foreground">
                          {model.modelLab}
                        </span>
                      )}
                      {model.category && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          {model.category}
                        </span>
                      )}
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {!loading && !error && models.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No video models found. Try a different search term.</p>
          </div>
        )}
      </div>
    </main>
  );
}
