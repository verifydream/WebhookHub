import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as createHubPost, GET as listHubsGet } from '@/app/api/hubs/route.js';
import { GET as getHubGet, DELETE as deleteHubDelete } from '@/app/api/hubs/[id]/route.js';
import { GET as getEventsGet } from '@/app/api/hubs/[id]/events/route.js';
import { createHub, getHub, deleteHub, getEvents } from '@/lib/db';
import pool from '@/lib/db';
import { NextRequest } from 'next/server';

// We mock the database
vi.mock('@/lib/db', () => ({
  createHub: vi.fn(),
  getHub: vi.fn(),
  deleteHub: vi.fn(),
  getEvents: vi.fn(),
  default: {
    query: vi.fn(),
  }
}));

// Also mock nanoid since it's used in POST
vi.mock('nanoid', () => ({
  nanoid: vi.fn().mockReturnValue('mock-id'),
}));

describe('Hub Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/hubs', () => {
    it('creates a new hub with provided name', async () => {
      const mockHub = { id: 'mock-id', name: 'Test Hub', secret: 'mock-id' };
      createHub.mockResolvedValue(mockHub);

      const req = new NextRequest('http://localhost/api/hubs', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test Hub' }),
      });

      const res = await createHubPost(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toEqual(mockHub);
      expect(createHub).toHaveBeenCalledWith('mock-id', 'Test Hub', 'mock-id');
    });
  });

  describe('GET /api/hubs', () => {
    it('lists all hubs', async () => {
      const mockHubs = [{ id: 'mock-id', name: 'Test Hub', secret: 'mock-id' }];
      pool.query.mockResolvedValue({ rows: mockHubs });

      const req = new NextRequest('http://localhost/api/hubs');
      const res = await listHubsGet(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toEqual(mockHubs);
    });
  });

  describe('GET /api/hubs/[id]', () => {
    it('returns a hub if it exists', async () => {
      const mockHub = { id: 'test-hub-id', name: 'Test Hub' };
      getHub.mockResolvedValue(mockHub);

      const req = new NextRequest('http://localhost/api/hubs/test-hub-id');
      const res = await getHubGet(req, { params: { id: 'test-hub-id' } });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toEqual(mockHub);
      expect(getHub).toHaveBeenCalledWith('test-hub-id');
    });
  });

  describe('DELETE /api/hubs/[id]', () => {
    it('deletes a hub if it exists', async () => {
      const mockHub = { id: 'test-hub-id', name: 'Test Hub' };
      getHub.mockResolvedValue(mockHub);

      const req = new NextRequest('http://localhost/api/hubs/test-hub-id');
      const res = await deleteHubDelete(req, { params: { id: 'test-hub-id' } });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toEqual({ deleted: true });
      expect(deleteHub).toHaveBeenCalledWith('test-hub-id');
    });
  });

  describe('GET /api/hubs/[id]/events', () => {
    it('returns events for a hub', async () => {
      const mockEvents = [{ id: 1, hub_id: 'test-hub-id' }];
      getEvents.mockResolvedValue(mockEvents);

      const req = new NextRequest('http://localhost/api/hubs/test-hub-id/events');
      const res = await getEventsGet(req, { params: { id: 'test-hub-id' } });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toEqual(mockEvents);
      expect(getEvents).toHaveBeenCalledWith('test-hub-id');
    });
  });
});
