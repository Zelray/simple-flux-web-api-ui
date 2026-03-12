import { NextResponse } from 'next/server';

const FAL_BASE_URL = 'https://fal.ai/api';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const keywords = searchParams.get('keywords');
  const category = searchParams.get('category');
  const page = searchParams.get('page') || '1';
  const total = searchParams.get('total') || '100';

  try {
    let url = `${FAL_BASE_URL}/models?page=${page}&total=${total}`;

    if (keywords) {
      url += `&keywords=${encodeURIComponent(keywords)}`;
    }

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 300 } // Cache for 5 minutes
    });

    if (!response.ok) {
      throw new Error(`FAL API error: ${response.status}`);
    }

    const data = await response.json();

    // FAL API returns { items: [...] }
    let models = data.items || [];

    // Filter by category if specified
    if (category) {
      models = models.filter((model: { category?: string }) =>
        model.category?.toLowerCase().includes(category.toLowerCase())
      );
    }

    return NextResponse.json(models);
  } catch (error) {
    console.error('Error fetching models:', error);
    return NextResponse.json(
      { error: 'Failed to fetch models' },
      { status: 500 }
    );
  }
}
