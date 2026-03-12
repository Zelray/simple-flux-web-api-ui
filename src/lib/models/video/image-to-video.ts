import { Model } from "@/lib/types";

export const wan_v2_2_lora: Model = {
  name: "WAN 2.2 LoRA (Image to Video)",
  id: "fal-ai/wan/v2.2-a14b/image-to-video/lora",
  inputSchema: [
    {
      key: "prompt",
      type: "string",
      required: true,
      description: "The prompt to generate the video from"
    },
    {
      key: "image_url",
      type: "string",
      required: true,
      description: "URL of the input image to animate"
    },
    {
      key: "aspect_ratio",
      type: "enum",
      default: "16:9",
      options: ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9", "9:21"]
    },
    {
      key: "num_frames",
      type: "number",
      default: 81,
      description: "Number of frames to generate",
      validation: {
        min: 1,
        max: 129
      }
    },
    {
      key: "fps",
      type: "number",
      default: 16,
      description: "Frames per second",
      validation: {
        min: 1,
        max: 30
      }
    },
    {
      key: "num_inference_steps",
      type: "number",
      default: 30,
      description: "Number of inference steps",
      validation: {
        min: 1,
        max: 50
      }
    },
    {
      key: "guidance_scale",
      type: "number",
      default: 5.0,
      description: "Guidance scale for generation",
      validation: {
        min: 1,
        max: 20
      }
    },
    {
      key: "seed",
      type: "number",
      description: "Random seed for reproducibility"
    },
    {
      key: "loras",
      type: "array",
      items: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "URL or path to the LoRA weights"
          },
          scale: {
            type: "number",
            description: "Scale factor for the LoRA weight (0 to 2)",
            validation: {
              min: 0,
              max: 2
            },
            default: 1
          }
        }
      },
      description: "LoRA weights to use for video generation"
    }
  ],
  outputSchema: [
    {
      key: "video",
      type: "object",
      required: true
    }
  ]
};
