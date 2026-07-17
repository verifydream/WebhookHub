import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as receiveWebhookPost } from '@/app/api/w/[hubId]/route.js';
import { getHub, saveEvent } from '@/lib/db';
import { NextRequest } from 'next/server';

vi.mock('@/lib/db', () => ({
  getHub: vi.fn(),
  saveEvent: vi.fn(),
}));

describe('Webhook Capture Endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/w/[hubId]', () => {
    it('returns 404 if hub not found', async () => {
      getHub.mockResolvedValue(null);

      const req = new NextRequest('http://localhost/api/w/invalid-hub', { method: 'POST' });
      const res = await receiveWebhookPost(req, { params: { hubId: 'invalid-hub' } });
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data).toEqual({ error: 'Hub not found' });
      expect(getHub).toHaveBeenCalledWith('invalid-hub');
      expect(saveEvent).not.toHaveBeenCalled();
    });

    it('captures JSON payload correctly', async () => {
      getHub.mockResolvedValue({ id: 'test-hub' });
      saveEvent.mockResolvedValue({ id: 123, received_at: new Date().toISOString() });

      const payload = { event: 'user.created', data: { id: 1 } };

      const req = new NextRequest('http://localhost/api/w/test-hub', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Custom-Header': 'test-value',
          'X-Forwarded-For': '192.168.1.1'
        },
        body: JSON.stringify(payload),
      });

      const res = await receiveWebhookPost(req, { params: { hubId: 'test-hub' } });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toEqual({ received: true, event_id: 123 });

      expect(saveEvent).toHaveBeenCalledWith('test-hub', expect.objectContaining({
        method: 'POST',
        body: payload,
        rawBody: JSON.stringify(payload),
        sourceIp: '192.168.1.1'
      }));

      const capturedArgs = saveEvent.mock.calls[0][1];
      expect(capturedArgs.headers['x-custom-header']).toBe('test-value');
    });

    it('captures Form-data / URL encoded payload correctly', async () => {
      getHub.mockResolvedValue({ id: 'test-hub' });
      saveEvent.mockResolvedValue({ id: 124 });

      const rawBody = 'field1=value1&field2=value2';

      const req = new NextRequest('http://localhost/api/w/test-hub', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: rawBody,
      });

      const res = await receiveWebhookPost(req, { params: { hubId: 'test-hub' } });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toEqual({ received: true, event_id: 124 });

      expect(saveEvent).toHaveBeenCalledWith('test-hub', expect.objectContaining({
        method: 'POST',
        body: null,
        rawBody: rawBody,
        sourceIp: 'unknown'
      }));
    });

    it('captures XML payload correctly', async () => {
      getHub.mockResolvedValue({ id: 'test-hub' });
      saveEvent.mockResolvedValue({ id: 125 });

      const rawBody = '<root><user>admin</user></root>';

      const req = new NextRequest('http://localhost/api/w/test-hub', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/xml',
        },
        body: rawBody,
      });

      const res = await receiveWebhookPost(req, { params: { hubId: 'test-hub' } });

      expect(res.status).toBe(200);
      expect(saveEvent).toHaveBeenCalledWith('test-hub', expect.objectContaining({
        method: 'POST',
        body: null,
        rawBody: rawBody,
      }));
    });

    it('returns 429 if rate limit exceeded', async () => {
      getHub.mockResolvedValue({ id: 'test-hub' });
      saveEvent.mockResolvedValue({ id: 126 });

      // Send 100 requests to trigger rate limit
      for (let i = 0; i < 100; i++) {
        const req = new NextRequest('http://localhost/api/w/test-hub', {
          method: 'POST',
          headers: { 'X-Forwarded-For': '10.0.0.1' },
          body: JSON.stringify({ i }),
        });
        await receiveWebhookPost(req, { params: { hubId: 'test-hub' } });
      }

      // The 101st request should be rejected
      const reqOverLimit = new NextRequest('http://localhost/api/w/test-hub', {
        method: 'POST',
        headers: { 'X-Forwarded-For': '10.0.0.1' },
        body: JSON.stringify({ overLimit: true }),
      });

      const res = await receiveWebhookPost(reqOverLimit, { params: { hubId: 'test-hub' } });
      const data = await res.json();

      expect(res.status).toBe(429);
      expect(data).toEqual({ error: 'Rate limit exceeded' });
    });
  });
});
