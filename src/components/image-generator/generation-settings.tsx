'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Model, ModelParameter } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { LoraSelector } from "@/components/lora-selector";

interface GenerationSettingsProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  model: Model;
  parameters: Record<string, any>;
  setParameters: (params: Record<string, any>) => void;
}

export function GenerationSettings({ 
  prompt, 
  setPrompt, 
  onGenerate, 
  isGenerating, 
  model,
  parameters,
  setParameters 
}: GenerationSettingsProps) {
  function renderParameter(param: ModelParameter) {
    if (param.key === 'prompt' || param.key === 'sync_mode' || param.key === 'enable_safety_checker') return null;

    const value = parameters[param.key] ?? param.default;
    const onChange = (newValue: any) => {
      setParameters({ ...parameters, [param.key]: newValue });
    };

    switch (param.type) {
      case 'string':
        // Handle string inputs like image_url
        if (param.key === 'image_url') {
          return (
            <div key={param.key} className="space-y-1">
              <Label htmlFor={param.key} className="text-sm">
                {param.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                {param.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              <Input
                id={param.key}
                type="url"
                placeholder="Enter image URL..."
                value={value || ''}
                className="h-8"
                onChange={(e) => onChange(e.target.value)}
              />
              {param.description && (
                <p className="text-xs text-muted-foreground">{param.description}</p>
              )}
            </div>
          );
        }
        return null;

      case 'enum':
        return (
          <div key={param.key} className="space-y-1">
            <Label htmlFor={param.key} className="text-sm">{param.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Label>
            <Select value={value?.toString()} onValueChange={onChange}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(param.options as string[])?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      
      case 'boolean':
        return (
          <div key={param.key} className="flex items-center justify-between space-x-2 py-1">
            <Label htmlFor={param.key} className="text-sm">{param.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Label>
            <Switch
              id={param.key}
              checked={value}
              onCheckedChange={onChange}
            />
          </div>
        );
      
      case 'number':
        // Special handling for guidance_scale and num_inference_steps
        if (param.key === 'guidance_scale' || param.key === 'num_inference_steps') {
          const config = {
            guidance_scale: {
              min: 1,
              max: 10,
              step: 0.1,
              default: 3.5,
              decimals: 1
            },
            num_inference_steps: {
              min: 1,
              max: 50,
              step: 1,
              default: 35,
              decimals: 0
            }
          }[param.key];

          return (
            <div key={param.key} className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor={param.key} className="text-sm">
                  {param.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Label>
                <span className="text-sm w-12 text-right">
                  {Number(value || config.default).toFixed(config.decimals)}
                </span>
              </div>
              <Input
                id={param.key}
                type="range"
                min={config.min}
                max={config.max}
                step={config.step}
                value={value || config.default}
                className="h-6"
                onChange={(e) => onChange(Number(e.target.value))}
              />
            </div>
          );
        }

        // Default number input for other numeric parameters
        return (
          <div key={param.key} className="space-y-1">
            <Label htmlFor={param.key} className="text-sm">{param.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Label>
            <Input
              id={param.key}
              type="number"
              value={value}
              className="h-8"
              onChange={(e) => onChange(Number(e.target.value))}
            />
          </div>
        );
      
      case 'array':
        if (param.key === 'loras') {
          const loras = value as Array<{ path: string; scale?: number }> || [];

          return (
            <div key={param.key}>
              <LoraSelector
                value={loras}
                onChange={onChange}
                maxLoras={5}
              />
            </div>
          );
        }
        return null;
      
      default:
        return null;
    }
  }

  // Group parameters by type for more efficient layout
  const groupParameters = () => {
    const stringParams: JSX.Element[] = [];
    const enumParams: JSX.Element[] = [];
    const booleanParams: JSX.Element[] = [];
    const numberParams: JSX.Element[] = [];
    const otherParams: JSX.Element[] = [];

    model.inputSchema.forEach(param => {
      const rendered = renderParameter(param);
      if (!rendered) return;

      switch (param.type) {
        case 'string':
          stringParams.push(rendered);
          break;
        case 'enum':
          enumParams.push(rendered);
          break;
        case 'boolean':
          booleanParams.push(rendered);
          break;
        case 'number':
          numberParams.push(rendered);
          break;
        default:
          otherParams.push(rendered);
      }
    });

    return { stringParams, enumParams, booleanParams, numberParams, otherParams };
  };

  const { stringParams, enumParams, booleanParams, numberParams, otherParams } = groupParameters();

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle>Settings</CardTitle>
        <CardDescription>Configure your image generation for {model.name}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="prompt" className="text-sm">Prompt</Label>
          <Textarea
            id="prompt"
            placeholder="Enter your image generation prompt..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[80px]"
          />
        </div>

        {/* String parameters (like image_url) */}
        {stringParams.length > 0 && (
          <div className="space-y-3">
            {stringParams}
          </div>
        )}

        {/* Grid layout for enum parameters */}
        {enumParams.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {enumParams}
          </div>
        )}

        {/* Grid layout for boolean parameters */}
        {booleanParams.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {booleanParams}
          </div>
        )}

        {/* Grid layout for number parameters */}
        {numberParams.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {numberParams}
          </div>
        )}

        {/* Other parameters (like LoRA) */}
        {otherParams}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={onGenerate}
          disabled={isGenerating || !prompt}
          className="w-full"
        >
          {isGenerating ? "Generating..." : "Generate Image"}
        </Button>
      </CardFooter>
    </Card>
  );
} 