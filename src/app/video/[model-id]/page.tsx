'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { VideoGenerator } from "@/components/video-generator";
import { allVideoModels } from "@/lib/models/registry";
import { Model } from "@/lib/types";
import { Loader2 } from "lucide-react";

function createVideoModel(modelId: string, title: string, schema?: any): Model {
  const inputSchema = schema?.inputSchema || [];

  const hasPrompt = inputSchema.some((p: any) => p.key === 'prompt');

  const finalSchema = [...inputSchema];

  if (!hasPrompt) {
    finalSchema.unshift({
      key: 'prompt',
      type: 'string',
      required: true,
      description: 'The prompt to generate a video from',
    });
  }

  // Add common video parameters if missing
  const hasAspectRatio = inputSchema.some((p: any) => p.key === 'aspect_ratio');
  if (!hasAspectRatio) {
    finalSchema.push({
      key: 'aspect_ratio',
      type: 'enum',
      default: '16:9',
      options: ['16:9', '9:16', '1:1', '4:3', '3:4'],
      description: 'Video aspect ratio',
    });
  }

  return {
    id: modelId,
    name: title,
    inputSchema: finalSchema,
    outputSchema: [],
  };
}

export default function VideoModelPage() {
  const params = useParams();
  const modelIdParam = params['model-id'] as string;
  const [model, setModel] = useState<Model | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadModel() {
      setLoading(true);
      setError(null);

      // Convert URL format back to model ID (__ becomes /)
      const modelId = modelIdParam.replace(/__/g, '/');

      // First check if it's in our video registry
      const registryModel = allVideoModels.find((m) => m.id === modelId);

      if (registryModel) {
        setModel(registryModel);
        setLoading(false);
        return;
      }

      // Otherwise fetch dynamically
      try {
        const [modelsRes, schemaRes] = await Promise.all([
          fetch(`/api/models?keywords=${encodeURIComponent(modelId.split('/').pop() || '')}`),
          fetch(`/api/schema?model_id=${encodeURIComponent(modelId)}`),
        ]);

        const models = await modelsRes.json();
        const schema = await schemaRes.json();

        const modelInfo = Array.isArray(models)
          ? models.find((m: any) => m.id === modelId)
          : null;

        const title = modelInfo?.title || modelId.split('/').pop() || 'Unknown Model';

        setModel(createVideoModel(modelId, title, schema));
      } catch (err) {
        console.error('Failed to load model:', err);
        const title = modelId.split('/').pop() || 'Unknown Model';
        setModel(createVideoModel(modelId, title));
      } finally {
        setLoading(false);
      }
    }

    loadModel();
  }, [modelIdParam]);

  if (loading) {
    return (
      <main className="container mx-auto py-8 px-4">
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">Loading model...</p>
        </div>
      </main>
    );
  }

  if (error || !model) {
    return (
      <main className="container mx-auto py-8 px-4">
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <p className="text-destructive">{error || 'Model not found'}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto py-8 px-4">
      <div className="flex flex-col items-center space-y-8">
        <h1 className="text-4xl font-bold text-center">{model.name}</h1>
        <p className="text-muted-foreground text-center max-w-2xl">
          Generate videos using {model.name}
        </p>
        <VideoGenerator model={model} />
      </div>
    </main>
  );
}
