import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateDocs } from '@/lib/db';
import { GET as getDocs } from '@/app/api/hubs/[id]/docs/route.js';
import { NextRequest } from 'next/server';

vi.mock('@/lib/db', () => ({
  generateDocs: vi.fn(),
}));

describe('Auto-Generated Docs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/hubs/[id]/docs', () => {
    it('returns generated markdown documentation', async () => {
      const mockMarkdown = '# WebhookHub — Auto-Generated Docs\n\nHub: **test-hub**';
      generateDocs.mockResolvedValue(mockMarkdown);

      const req = new NextRequest('http://localhost/api/hubs/test-hub/docs');
      const res = await getDocs(req, { params: { id: 'test-hub' } });
      const data = await res.text();

      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe('text/markdown');
      expect(data).toEqual(mockMarkdown);
      expect(generateDocs).toHaveBeenCalledWith('test-hub');
    });
  });
});
