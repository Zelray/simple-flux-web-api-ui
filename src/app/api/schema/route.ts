import { NextResponse } from 'next/server';

const FAL_BASE_URL = 'https://fal.ai/api';

// Convert OpenAPI schema to our ModelParameter format
function convertOpenAPIToModelParams(schema: any): any[] {
  const inputSchema = schema?.paths?.['/']?.post?.requestBody?.content?.['application/json']?.schema;

  if (!inputSchema?.properties) {
    return getDefaultInputSchema();
  }

  const params: any[] = [];
  const required = inputSchema.required || [];

  for (const [key, prop] of Object.entries<any>(inputSchema.properties)) {
    const param: any = {
      key,
      required: required.includes(key),
      description: prop.description,
    };

    // Determine type
    if (prop.enum) {
      param.type = 'enum';
      param.options = prop.enum;
      param.default = prop.default;
    } else if (prop.type === 'boolean') {
      param.type = 'boolean';
      param.default = prop.default;
    } else if (prop.type === 'integer' || prop.type === 'number') {
      param.type = 'number';
      param.default = prop.default;
      if (prop.minimum !== undefined || prop.maximum !== undefined) {
        param.validation = {
          min: prop.minimum,
          max: prop.maximum,
        };
      }
    } else if (prop.type === 'array') {
      param.type = 'array';
      param.items = prop.items;
    } else if (prop.type === 'object') {
      param.type = 'object';
    } else {
      param.type = 'string';
      param.default = prop.default;
    }

    params.push(param);
  }

  return params;
}

// Default schema for models without OpenAPI spec
function getDefaultInputSchema(): any[] {
  return [
    {
      key: 'prompt',
      type: 'string',
      required: true,
      description: 'The prompt to generate an image from',
    },
    {
      key: 'image_size',
      type: 'enum',
      default: 'landscape_4_3',
      options: ['square_hd', 'square', 'portrait_4_3', 'portrait_16_9', 'landscape_4_3', 'landscape_16_9'],
    },
    {
      key: 'num_images',
      type: 'number',
      default: 1,
      validation: { min: 1, max: 4 },
    },
    {
      key: 'enable_safety_checker',
      type: 'boolean',
      default: false,
    },
    {
      key: 'safety_tolerance',
      type: 'enum',
      default: '6',
      options: ['1', '2', '3', '4', '5', '6'],
      description: 'Safety tolerance level (1=strict, 6=permissive)',
    },
    {
      key: 'seed',
      type: 'number',
      description: 'Random seed for reproducibility',
    },
  ];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const modelId = searchParams.get('model_id');

  if (!modelId) {
    return NextResponse.json(
      { error: 'model_id parameter required' },
      { status: 400 }
    );
  }

  try {
    const url = `${FAL_BASE_URL}/openapi/queue/openapi.json?endpoint_id=${encodeURIComponent(modelId)}`;

    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      // Return default schema if OpenAPI not available
      return NextResponse.json({
        modelId,
        inputSchema: getDefaultInputSchema(),
        outputSchema: [],
      });
    }

    const openApiSchema = await response.json();
    const inputSchema = convertOpenAPIToModelParams(openApiSchema);

    return NextResponse.json({
      modelId,
      inputSchema,
      outputSchema: [],
      raw: openApiSchema,
    });
  } catch (error) {
    console.error('Error fetching schema:', error);
    return NextResponse.json({
      modelId,
      inputSchema: getDefaultInputSchema(),
      outputSchema: [],
    });
  }
}
