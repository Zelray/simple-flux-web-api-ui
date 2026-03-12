'use server';

import { fal } from "@fal-ai/client";
import { Model, Image } from "@/lib/types";

interface SuccessResponse {
  success: true;
  image: Image;
  seed: number;
  requestId: string;
  timings: Record<string, any>;
  has_nsfw_concepts: boolean[];
}

interface ErrorResponse {
  success: false;
  error: string;
}

type GenerateImageResponse = SuccessResponse | ErrorResponse;

export async function generateImage(
  model: Model,
  input: Record<string, any>,
  apiKey: string
): Promise<GenerateImageResponse> {
  console.log('🚀 Starting image generation process:', {
    modelId: model.id,
    inputParams: { ...input, prompt: input.prompt?.substring(0, 50) + '...' } // Truncate prompt for logging
  });

  try {
    if (!apiKey) {
      console.error('❌ No API key provided');
      throw new Error("Please set your FAL.AI API key first");
    }

    console.log('📝 Configuring FAL client with API key');
    fal.config({
      credentials: apiKey,
    });

    // Clean up input parameters
    const safeInput: Record<string, any> = { ...input };

    // Handle safety settings
    if ('enable_safety_checker' in safeInput) {
      safeInput.enable_safety_checker = safeInput.enable_safety_checker ?? false;
    }
    if ('safety_tolerance' in safeInput) {
      // Convert to number if it's a string
      safeInput.safety_tolerance = parseInt(String(safeInput.safety_tolerance), 10) || 6;
    }

    // Remove empty loras array (causes validation error)
    if (Array.isArray(safeInput.loras) && safeInput.loras.length === 0) {
      delete safeInput.loras;
    }
    // Filter out loras with empty paths
    if (Array.isArray(safeInput.loras)) {
      safeInput.loras = safeInput.loras.filter((l: any) => l.path && l.path.trim() !== '');
      if (safeInput.loras.length === 0) {
        delete safeInput.loras;
      }
    }

    // Remove undefined/null values
    Object.keys(safeInput).forEach(key => {
      if (safeInput[key] === undefined || safeInput[key] === null || safeInput[key] === '') {
        delete safeInput[key];
      }
    });

    console.log('📤 Clean input:', JSON.stringify(safeInput, null, 2));

    console.log('⏳ Subscribing to FAL model...');
    const result = await fal.subscribe(model.id, {
      input: safeInput,
      logs: true,
      onQueueUpdate: (update) => {
        console.log(`🔄 Queue Status: ${update.status}`);
        if (update.status === "IN_PROGRESS") {
          console.log('📊 Generation Logs:');
          update.logs.map((log) => log.message).forEach((msg) => console.log(`   ${msg}`));
        }
      },
    });

    console.log('📦 Complete API Response:', JSON.stringify(result, null, 2));
    console.log('✅ Generation completed:', { 
      requestId: result.requestId,
      hasImages: !!result.data?.images?.length
    });

    // Extract the first image from the result
    const image = result.data?.images?.[0];
    if (!image) {
      console.error('❌ No image in response');
      throw new Error("No image was generated");
    }

    console.log('🎉 Successfully generated image:', {
      seed: result.data?.seed,
      requestId: result.requestId,
      image
    });

    return {
      success: true,
      image,
      seed: result.data?.seed,
      requestId: result.requestId,
      timings: result.data?.timings || {},
      has_nsfw_concepts: result.data?.has_nsfw_concepts || [],
    };
  } catch (error) {
    console.error("❌ Image generation failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate image",
    };
  }
} 