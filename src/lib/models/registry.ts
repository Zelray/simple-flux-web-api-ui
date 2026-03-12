import { Model } from "@/lib/types";
import * as textToText from "./flux/text-to-text";
import * as imageToVideo from "./video/image-to-video";

function isModel(value: unknown): value is Model {
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    "id" in value &&
    "inputSchema" in value &&
    "outputSchema" in value
  );
}

// Get all exported models from each category
const textToTextModels = Object.values(textToText).filter(isModel);
const videoModels = Object.values(imageToVideo).filter(isModel);

// Export all models in a single array
export const allModels = [...textToTextModels];

// Export video models separately
export const allVideoModels = [...videoModels]; 