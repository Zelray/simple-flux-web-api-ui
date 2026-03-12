'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Link2, FolderOpen, Plus, X, Sparkles, RefreshCw } from "lucide-react";
import { getSettings } from "@/lib/settings";

interface LoraFile {
  name: string;
  path: string;
  size: number;
}

interface LoraEntry {
  path: string;
  scale?: number;
}

interface LoraSelectorProps {
  value: LoraEntry[];
  onChange: (loras: LoraEntry[]) => void;
  maxLoras?: number;
}

export function LoraSelector({ value = [], onChange, maxLoras = 5 }: LoraSelectorProps) {
  const [localFiles, setLocalFiles] = useState<LoraFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loraPath, setLoraPath] = useState('./loras');

  useEffect(() => {
    const settings = getSettings();
    setLoraPath(settings.paths.saved_loras);
    fetchLocalLoras(settings.paths.saved_loras);
  }, []);

  const fetchLocalLoras = async (path: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/loras?path=${encodeURIComponent(path)}`);
      const data = await response.json();
      if (data.error && data.files.length === 0) {
        setError(data.error);
      }
      setLocalFiles(data.files || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch local LoRAs');
    } finally {
      setLoading(false);
    }
  };

  const addLora = (path: string, scale: number = 1) => {
    if (value.length >= maxLoras) return;
    if (value.some(l => l.path === path)) return;
    onChange([...value, { path, scale }]);
  };

  const removeLora = (index: number) => {
    const newLoras = [...value];
    newLoras.splice(index, 1);
    onChange(newLoras);
  };

  const updateLoraScale = (index: number, scale: number) => {
    const newLoras = [...value];
    newLoras[index] = { ...newLoras[index], scale };
    onChange(newLoras);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-pink-500" />
          LoRA Models
          <span className="text-xs text-muted-foreground">
            ({value.length}/{maxLoras})
          </span>
        </Label>
      </div>

      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((lora, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-border/50"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-mono truncate" title={lora.path}>
                  {lora.path.split('/').pop() || lora.path}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Label className="text-xs text-muted-foreground w-12">
                  {((lora.scale || 1) * 100).toFixed(0)}%
                </Label>
                <Slider
                  value={[(lora.scale || 1) * 100]}
                  onValueChange={([v]) => updateLoraScale(index, v / 100)}
                  min={0}
                  max={200}
                  step={5}
                  className="w-20"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => removeLora(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {value.length < maxLoras && (
        <Tabs defaultValue="url" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="url" className="flex items-center gap-2">
              <Link2 className="h-3 w-3" />
              URL
            </TabsTrigger>
            <TabsTrigger value="local" className="flex items-center gap-2">
              <FolderOpen className="h-3 w-3" />
              Local Folder
            </TabsTrigger>
          </TabsList>

          <TabsContent value="url" className="space-y-2">
            <UrlLoraInput onAdd={(url) => addLora(url)} />
          </TabsContent>

          <TabsContent value="local" className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <span>Folder: {loraPath}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={() => fetchLocalLoras(loraPath)}
                disabled={loading}
              >
                <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}

            {localFiles.length === 0 && !error && !loading && (
              <p className="text-xs text-muted-foreground py-4 text-center">
                No LoRA files found. Add .safetensors, .ckpt, or .pt files to your LoRA folder.
              </p>
            )}

            {localFiles.length > 0 && (
              <div className="max-h-40 overflow-y-auto space-y-1">
                {localFiles.map((file) => (
                  <Button
                    key={file.path}
                    variant="ghost"
                    className="w-full justify-between h-auto py-2 px-3"
                    onClick={() => addLora(file.path)}
                    disabled={value.some(l => l.path === file.path)}
                  >
                    <span className="text-xs font-mono truncate">{file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </span>
                  </Button>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function UrlLoraInput({ onAdd }: { onAdd: (url: string) => void }) {
  const [url, setUrl] = useState('');

  const handleAdd = () => {
    if (url.trim()) {
      onAdd(url.trim());
      setUrl('');
    }
  };

  return (
    <div className="flex gap-2">
      <Input
        placeholder="https://huggingface.co/.../model.safetensors"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        className="text-xs"
      />
      <Button
        variant="secondary"
        size="sm"
        onClick={handleAdd}
        disabled={!url.trim()}
      >
        <Plus className="h-3 w-3 mr-1" />
        Add
      </Button>
    </div>
  );
}
