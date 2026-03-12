'use server';

import { fal } from "@fal-ai/client";
import { Model } from "@/lib/types";

interface SuccessResponse {
  success: true;
  video_url: string;
  requestId: string;
  timings?: Record<string, any>;
}

interface ErrorResponse {
  success: false;
  error: string;
}

type GenerateVideoResponse = SuccessResponse | ErrorResponse;

export async function generateVideo(
  model: Model,
  input: Record<string, any>,
  apiKey: string
): Promise<GenerateVideoResponse> {
  console.log('🎬 Starting video generation process:', {
    modelId: model.id,
    inputParams: { ...input, prompt: input.prompt?.substring(0, 50) + '...' }
  });

  try {
    if (!apiKey) {
      console.error('❌ No API key provided');
      throw new Error("Please set your FAL.AI API key first");
    }

    fal.config({
      credentials: apiKey,
    });

    // Clean up input parameters
    const cleanInput: Record<string, any> = { ...input };

    // Remove empty loras array
    if (Array.isArray(cleanInput.loras) && cleanInput.loras.length === 0) {
      delete cleanInput.loras;
    }
    // Filter out loras with empty paths
    if (Array.isArray(cleanInput.loras)) {
      cleanInput.loras = cleanInput.loras.filter((l: any) => l.path && l.path.trim() !== '');
      if (cleanInput.loras.length === 0) {
        delete cleanInput.loras;
      }
    }

    // Remove undefined/null/empty values
    Object.keys(cleanInput).forEach(key => {
      if (cleanInput[key] === undefined || cleanInput[key] === null || cleanInput[key] === '') {
        delete cleanInput[key];
      }
    });

    console.log('📤 Clean input:', JSON.stringify(cleanInput, null, 2));

    console.log('⏳ Subscribing to FAL video model...');
    const result = await fal.subscribe(model.id, {
      input: cleanInput,
      logs: true,
      onQueueUpdate: (update) => {
        console.log(`🔄 Queue Status: ${update.status}`);
        if (update.status === "IN_PROGRESS") {
          update.logs.map((log) => log.message).forEach((msg) => console.log(`   ${msg}`));
        }
      },
    });

    console.log('📦 Complete API Response:', JSON.stringify(result, null, 2));

    // Video responses can have different structures
    const videoUrl = result.data?.video?.url ||
      result.data?.video_url ||
      result.data?.output?.video?.url ||
      result.data?.output?.video_url ||
      result.data?.videos?.[0]?.url;

    if (!videoUrl) {
      console.error('❌ No video URL in response:', result.data);
      throw new Error("No video was generated");
    }

    console.log('🎉 Successfully generated video:', {
      requestId: result.requestId,
      videoUrl
    });

    return {
      success: true,
      video_url: videoUrl,
      requestId: result.requestId,
      timings: result.data?.timings || {},
    };
  } catch (error) {
    console.error("❌ Video generation failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate video",
    };
  }
}
