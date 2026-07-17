import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as getCommentsGet, POST as addCommentPost } from '@/app/api/events/[id]/comments/route.js';
import { getComments, addComment } from '@/lib/db';
import { NextRequest } from 'next/server';

vi.mock('@/lib/db', () => ({
  getComments: vi.fn(),
  addComment: vi.fn(),
}));

describe('Comments Endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/events/[id]/comments', () => {
    it('returns comments for an event', async () => {
      const mockComments = [{ id: 1, author: 'User', content: 'Test comment' }];
      getComments.mockResolvedValue(mockComments);

      const req = new NextRequest('http://localhost/api/events/1/comments');
      const res = await getCommentsGet(req, { params: { id: '1' } });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toEqual(mockComments);
      expect(getComments).toHaveBeenCalledWith(1);
    });
  });

  describe('POST /api/events/[id]/comments', () => {
    it('adds a comment to an event', async () => {
      const mockComment = { id: 1, event_id: 1, author: 'User', content: 'New comment' };
      addComment.mockResolvedValue(mockComment);

      const req = new NextRequest('http://localhost/api/events/1/comments', {
        method: 'POST',
        body: JSON.stringify({ author: 'User', content: 'New comment' }),
      });

      const res = await addCommentPost(req, { params: { id: '1' } });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toEqual(mockComment);
      expect(addComment).toHaveBeenCalledWith(1, 'User', 'New comment');
    });
  });
});
