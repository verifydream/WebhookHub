// Mock DB for tests
import { vi } from 'vitest';

export const mockPool = {
  query: vi.fn(),
  end: vi.fn(),
};

export const createHub = vi.fn();
export const getHub = vi.fn();
export const saveEvent = vi.fn();
export const getEvents = vi.fn();
export const getEvent = vi.fn();
export const deleteEvent = vi.fn();
export const addComment = vi.fn();
export const getComments = vi.fn();
export const generateDocs = vi.fn();

vi.mock('@/lib/db', () => ({
  default: mockPool,
  createHub,
  getHub,
  saveEvent,
  getEvents,
  getEvent,
  deleteEvent,
  addComment,
  getComments,
  generateDocs,
}));
