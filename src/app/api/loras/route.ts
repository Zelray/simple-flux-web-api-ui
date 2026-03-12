import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const loraPath = searchParams.get('path') || './loras';

  try {
    const absolutePath = path.isAbsolute(loraPath)
      ? loraPath
      : path.resolve(process.cwd(), loraPath);

    if (!fs.existsSync(absolutePath)) {
      return NextResponse.json({
        files: [],
        error: `Directory not found: ${absolutePath}`,
        path: absolutePath
      });
    }

    const files = fs.readdirSync(absolutePath);
    const loraFiles = files
      .filter(file =>
        file.endsWith('.safetensors') ||
        file.endsWith('.ckpt') ||
        file.endsWith('.pt')
      )
      .map(file => ({
        name: file,
        path: path.join(absolutePath, file),
        size: fs.statSync(path.join(absolutePath, file)).size,
      }));

    return NextResponse.json({
      files: loraFiles,
      path: absolutePath,
      count: loraFiles.length
    });
  } catch (error) {
    console.error('Error reading LoRA directory:', error);
    return NextResponse.json({
      files: [],
      error: error instanceof Error ? error.message : 'Failed to read directory'
    }, { status: 500 });
  }
}
