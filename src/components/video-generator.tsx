'use client';

import { Model } from "@/lib/types";
import { useState, useEffect } from "react";
import { GenerationSettings } from "./image-generator/generation-settings";
import { generateVideo } from "@/lib/actions/generate-video";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from 'uuid';
import { Card } from "./ui/card";
import { VideoIcon, Download, Loader2 } from "lucide-react";
import { Button } from "./ui/button";

const API_KEY_STORAGE_KEY = 'fal-ai-api-key';
const VIDEO_GENERATIONS_STORAGE_KEY = 'fal-ai-video-generations';

interface VideoGeneration {
  id: string;
  modelId: string;
  modelName: string;
  prompt: string;
  parameters: Record<string, any>;
  output: {
    video_url: string;
    timings?: Record<string, any>;
  };
  timestamp: number;
}

interface VideoGeneratorProps {
  model: Model;
}

export function VideoGenerator({ model }: VideoGeneratorProps) {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [generations, setGenerations] = useState<VideoGeneration[]>([]);
  const { toast } = useToast();

  const [parameters, setParameters] = useState<Record<string, any>>(() => {
    return Object.fromEntries(
      model.inputSchema
        .filter(param => param.default !== undefined)
        .map(param => [param.key, param.default])
    );
  });

  useEffect(() => {
    const savedGenerations = localStorage.getItem(VIDEO_GENERATIONS_STORAGE_KEY);
    if (savedGenerations) {
      try {
        setGenerations(JSON.parse(savedGenerations));
      } catch (error) {
        console.error('Failed to parse saved video generations:', error);
      }
    }
  }, []);

  async function handleGenerate() {
    const apiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please set your FAL.AI API key first",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const allParameters = {
        ...parameters,
        prompt,
      };

      const response = await generateVideo(model, allParameters, apiKey);

      if (response.success) {
        setResult(response.video_url);

        const newGeneration: VideoGeneration = {
          id: uuidv4(),
          modelId: model.id,
          modelName: model.name,
          prompt,
          parameters: allParameters,
          output: {
            video_url: response.video_url,
            timings: response.timings,
          },
          timestamp: Date.now(),
        };

        const updatedGenerations = [newGeneration, ...generations];
        setGenerations(updatedGenerations);
        localStorage.setItem(VIDEO_GENERATIONS_STORAGE_KEY, JSON.stringify(updatedGenerations));

        toast({
          title: "Video generated successfully",
          description: "Your video is ready to view",
        });
      } else {
        toast({
          title: "Generation failed",
          description: response.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="flex flex-col space-y-8 w-full max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GenerationSettings
          prompt={prompt}
          setPrompt={setPrompt}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          model={model}
          parameters={parameters}
          setParameters={setParameters}
        />

        <Card className="aspect-video flex items-center justify-center bg-muted/50 overflow-hidden">
          {isGenerating ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Generating video...</p>
              <p className="text-xs text-muted-foreground">This may take a few minutes</p>
            </div>
          ) : result ? (
            <div className="relative w-full h-full">
              <video
                src={result}
                controls
                className="w-full h-full object-contain"
                autoPlay
                loop
              />
              <Button
                size="icon"
                variant="secondary"
                className="absolute top-2 right-2"
                onClick={() => window.open(result, '_blank')}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <VideoIcon className="h-12 w-12" />
              <p className="text-sm">Your generated video will appear here</p>
            </div>
          )}
        </Card>
      </div>

      {/* Video Gallery */}
      {generations.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Previous Generations</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {generations.slice(0, 12).map((gen) => (
              <Card key={gen.id} className="overflow-hidden">
                <video
                  src={gen.output.video_url}
                  className="w-full aspect-video object-cover"
                  muted
                  loop
                  onMouseEnter={(e) => e.currentTarget.play()}
                  onMouseLeave={(e) => {
                    e.currentTarget.pause();
                    e.currentTarget.currentTime = 0;
                  }}
                />
                <div className="p-3">
                  <p className="text-xs text-muted-foreground line-clamp-2">{gen.prompt}</p>
                  <p className="text-xs text-muted-foreground mt-1">{gen.modelName}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
