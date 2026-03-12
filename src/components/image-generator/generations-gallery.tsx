'use client';

import { useState, useEffect } from "react";
import { Generation, Model } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Lightbox } from "@/components/ui/lightbox";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Download, Search, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { flux_1_1_pro, flux_1_1_pro_ultra } from "@/lib/models/flux/text-to-text";
import { cn } from "@/lib/utils";

type NSFWFilter = "show" | "blur" | "hide";

interface GenerationsGalleryProps {
  generations: Generation[];
}

const ITEMS_PER_PAGE = 16;
const AVAILABLE_MODELS = [flux_1_1_pro, flux_1_1_pro_ultra];

const NSFW_OPTIONS = [
  { value: "show", label: "Show NSFW" },
  { value: "blur", label: "Blur NSFW" },
  { value: "hide", label: "Hide NSFW" },
] as const;

function truncateText(text: string, maxWords: number = 150) {
  const words = text.split(' ');
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(' ') + '...';
}

async function downloadImage(url: string, filename: string) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);
  } catch (error) {
    console.error('Failed to download image:', error);
  }
}

export function GenerationsGallery({ generations }: GenerationsGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [selectedGeneration, setSelectedGeneration] = useState<Generation | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedModels, setSelectedModels] = useState<string[]>(AVAILABLE_MODELS.map(m => m.id));
  const [nsfwFilter, setNsfwFilter] = useState<NSFWFilter>("show");
  const [searchQuery, setSearchQuery] = useState("");
  const [localGenerations, setLocalGenerations] = useState<Generation[]>(generations);

  // Update localGenerations when props change
  useEffect(() => {
    setLocalGenerations(generations);
  }, [generations]);

  const sortedAndFilteredGenerations = [...localGenerations]
    .sort((a, b) => b.timestamp - a.timestamp)
    .filter(gen => selectedModels.includes(gen.modelId))
    .filter(gen => 
      searchQuery === "" || 
      gen.prompt.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const handleNSFWToggle = (isNSFW: boolean) => {
    if (!selectedGeneration) return;
    
    const updatedGenerations = localGenerations.map(gen => {
      if (gen.id === selectedGeneration.id) {
        return {
          ...gen,
          output: {
            ...gen.output,
            has_nsfw_concepts: [isNSFW]
          }
        };
      }
      return gen;
    });

    // Update local state
    setLocalGenerations(updatedGenerations);

    // Persist to localStorage
    localStorage.setItem('fal-ai-generations', JSON.stringify(updatedGenerations));

    // Update selected generation state
    setSelectedGeneration(prev => prev ? {
      ...prev,
      output: {
        ...prev.output,
        has_nsfw_concepts: [isNSFW]
      }
    } : null);
  };

  const handleDelete = (generationId: string) => {
    const updatedGenerations = localGenerations.filter(gen => gen.id !== generationId);
    
    // Update local state
    setLocalGenerations(updatedGenerations);
    
    // Persist to localStorage
    localStorage.setItem('fal-ai-generations', JSON.stringify(updatedGenerations));
    
    // Close lightbox if the deleted image was being viewed
    if (selectedGeneration?.id === generationId) {
      setSelectedGeneration(null);
      setSelectedImageIndex(null);
    }
  };

  const totalPages = Math.ceil(sortedAndFilteredGenerations.length / ITEMS_PER_PAGE);
  const paginatedGenerations = sortedAndFilteredGenerations.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl sm:text-2xl font-bold">Previous Generations</h2>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">Search:</span>
              <div className="relative w-full sm:w-[200px]">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search prompts..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">Models:</span>
              <Select
                value={selectedModels.join(",")}
                onValueChange={(value) => {
                  const models = value.split(",").filter(Boolean);
                  setSelectedModels(models.length ? models : [AVAILABLE_MODELS[0].id]);
                }}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue>
                    {selectedModels.length === AVAILABLE_MODELS.length
                      ? "All Models"
                      : `${selectedModels.length} Selected`}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_MODELS.map((model) => (
                    <SelectItem
                      key={model.id}
                      value={model.id}
                      className={cn(
                        "cursor-pointer",
                        selectedModels.includes(model.id) && "bg-accent"
                      )}
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedModels(prev => {
                          const isSelected = prev.includes(model.id);
                          if (isSelected) {
                            if (prev.length === 1) return prev;
                            return prev.filter(id => id !== model.id);
                          }
                          return [...prev, model.id];
                        });
                      }}
                    >
                      {model.name.replace('Flux ', '')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">NSFW:</span>
              <Select
                value={nsfwFilter}
                onValueChange={(value) => setNsfwFilter(value as NSFWFilter)}
              >
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NSFW_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center sm:justify-start gap-1 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-8 px-2 sm:px-4"
            >
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => {
                  // On mobile, show fewer page numbers
                  if (window.innerWidth < 640) {
                    return page === 1 || 
                           page === totalPages || 
                           page === currentPage ||
                           Math.abs(page - currentPage) <= 1;
                  }
                  return true;
                })
                .map((page, index, array) => (
                  <>
                    {index > 0 && array[index - 1] !== page - 1 && (
                      <span className="px-1">...</span>
                    )}
                    <Button
                      key={page}
                      variant={page === currentPage ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="h-8 w-8 p-0"
                    >
                      {page}
                    </Button>
                  </>
                ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-8 px-2 sm:px-4"
            >
              Next
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {paginatedGenerations
          .filter(generation => 
            nsfwFilter !== "hide" || !generation.output.has_nsfw_concepts?.[0]
          )
          .map((generation) => {
            const isNSFW = generation.output.has_nsfw_concepts?.[0];
            const shouldBlur = isNSFW && nsfwFilter === "blur";

            return (
              <Card key={generation.id} className="overflow-hidden group cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                <CardContent className="p-0">
                  <div className="flex flex-col">
                    <div 
                      onClick={() => {
                        setSelectedGeneration(generation);
                        setSelectedImageIndex(0);
                      }}
                      className="relative aspect-square"
                    >
                      <img
                        src={generation.output.images[0].url}
                        alt={generation.prompt}
                        className={`absolute inset-0 object-cover w-full h-full transition-all ${
                          shouldBlur ? "blur-xl" : ""
                        }`}
                      />
                      <div className="absolute top-2 right-2 flex gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 bg-black/20 hover:bg-black/40 backdrop-blur-[2px] text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadImage(
                              generation.output.images[0].url,
                              `generation-${generation.id}.png`
                            );
                          }}
                        >
                          <Download className="h-4 w-4" />
                          <span className="sr-only">Download image</span>
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 bg-black/20 hover:bg-red-500/40 backdrop-blur-[2px] text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(generation.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete image</span>
                        </Button>
                      </div>
                    </div>
                    <div className="p-3 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-muted-foreground">{generation.modelName}</span>
                        {isNSFW && (
                          <Badge variant="destructive" className="text-[10px]">NSFW</Badge>
                        )}
                      </div>
                      <p className="text-xs line-clamp-3">{truncateText(generation.prompt)}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(generation.timestamp, { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
        })}
      </div>

      {selectedGeneration && selectedImageIndex !== null && (
        <Lightbox
          isOpen={true}
          onClose={() => {
            setSelectedImageIndex(null);
            setSelectedGeneration(null);
          }}
          imageUrl={selectedGeneration.output.images[selectedImageIndex].url}
          onNext={selectedImageIndex < selectedGeneration.output.images.length - 1 
            ? () => setSelectedImageIndex(i => i !== null ? i + 1 : null)
            : undefined}
          onPrevious={selectedImageIndex > 0
            ? () => setSelectedImageIndex(i => i !== null ? i - 1 : null)
            : undefined}
          hasNext={selectedImageIndex < selectedGeneration.output.images.length - 1}
          hasPrevious={selectedImageIndex > 0}
          onDownload={() => {
            const image = selectedGeneration.output.images[selectedImageIndex];
            downloadImage(image.url, `generation-${selectedGeneration.id}-${selectedImageIndex}.png`);
          }}
          onDelete={() => handleDelete(selectedGeneration.id)}
          isNSFW={selectedGeneration.output.has_nsfw_concepts?.[selectedImageIndex] ?? false}
          onNSFWToggle={handleNSFWToggle}
        >
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-1">Prompt</h3>
              <p className="text-sm text-muted-foreground">{selectedGeneration.prompt}</p>
            </div>
            <Separator />
            <div>
              <h3 className="font-medium mb-1">Model</h3>
              <p className="text-sm text-muted-foreground">{selectedGeneration.modelName}</p>
            </div>
            <Separator />
            <div>
              <h3 className="font-medium mb-1">Generated</h3>
              <p className="text-sm text-muted-foreground">
                {formatDistanceToNow(selectedGeneration.timestamp, { addSuffix: true })}
              </p>
            </div>
          </div>
        </Lightbox>
      )}
    </div>
  );
} 