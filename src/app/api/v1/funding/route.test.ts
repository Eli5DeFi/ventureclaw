/**
 * Tests for /api/v1/funding endpoint (AI agent funding queries)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { prisma } from '@/lib/prisma';

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    funding: {
      findUnique: vi.fn(),
    },
    startup: {
      findUnique: vi.fn(),
    },
  },
}));

describe('GET /api/v1/funding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should reject requests without API key', async () => {
    const request = new Request('http://localhost:3000/api/v1/funding?fundingId=123');
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toContain('Invalid or missing API key');
  });

  it('should reject requests with invalid Bearer format', async () => {
    const request = new Request('http://localhost:3000/api/v1/funding?fundingId=123', {
      headers: { authorization: 'InvalidFormat token123' },
    });
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toContain('Invalid or missing API key');
  });

  it('should reject requests with invalid API key', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const request = new Request('http://localhost:3000/api/v1/funding?fundingId=123', {
      headers: { authorization: 'Bearer invalid_key' },
    });
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toContain('Invalid or missing API key');
  });

  it('should require fundingId or pitchId parameter', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-1' });

    const request = new Request('http://localhost:3000/api/v1/funding', {
      headers: { authorization: 'Bearer valid_key' },
    });
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('fundingId or pitchId query parameter required');
  });

  it('should reject invalid fundingId UUID format', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-1' });

    const request = new Request('http://localhost:3000/api/v1/funding?fundingId=not-a-uuid', {
      headers: { authorization: 'Bearer valid_key' },
    });
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Invalid fundingId format');
  });

  it('should reject invalid pitchId UUID format', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-1' });

    const request = new Request('http://localhost:3000/api/v1/funding?pitchId=123-456', {
      headers: { authorization: 'Bearer valid_key' },
    });
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Invalid pitchId format');
  });

  it('should return 404 for funding owned by different user', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-1' });
    vi.mocked(prisma.funding.findUnique).mockResolvedValue({
      id: 'funding-1',
      startup: {
        id: 'startup-1',
        name: 'Test Startup',
        userId: 'user-2', // Different user!
      },
      milestones: [],
    } as any);

    const request = new Request(
      'http://localhost:3000/api/v1/funding?fundingId=550e8400-e29b-41d4-a716-446655440000',
      {
        headers: { authorization: 'Bearer valid_key' },
      }
    );
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Funding not found');
  });

  it('should return funding details by fundingId', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-1' });
    vi.mocked(prisma.funding.findUnique).mockResolvedValue({
      id: 'funding-1',
      dealAmount: 100000,
      equityPercent: 10,
      dealType: 'SAFE',
      status: 'active',
      totalReleased: 25000,
      acceptedAt: new Date('2026-02-01'),
      startup: {
        id: 'startup-1',
        name: 'Test Startup',
        userId: 'user-1',
      },
      milestones: [
        {
          id: 'milestone-1',
          number: 1,
          description: 'MVP Launch',
          amount: 25000,
          dueDate: new Date('2026-03-01'),
          status: 'completed',
          completedAt: new Date('2026-02-15'),
          verifiedAt: new Date('2026-02-16'),
          txHash: '0xabc',
        },
        {
          id: 'milestone-2',
          number: 2,
          description: 'First 100 users',
          amount: 25000,
          dueDate: new Date('2026-04-01'),
          status: 'in_progress',
          completedAt: null,
          verifiedAt: null,
          txHash: null,
        },
      ],
    } as any);

    const request = new Request(
      'http://localhost:3000/api/v1/funding?fundingId=550e8400-e29b-41d4-a716-446655440000',
      {
        headers: { authorization: 'Bearer valid_key' },
      }
    );
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.funding.id).toBe('funding-1');
    expect(data.funding.dealAmount).toBe(100000);
    expect(data.funding.progress.completedMilestones).toBe(1);
    expect(data.funding.progress.totalMilestones).toBe(2);
    expect(data.funding.progress.progressPercent).toBe(50);
    expect(data.funding.milestones).toHaveLength(2);
  });

  it('should return funding details by pitchId', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-1' });
    vi.mocked(prisma.startup.findUnique).mockResolvedValue({
      id: 'startup-1',
      name: 'Test Startup',
      userId: 'user-1',
      funding: {
        id: 'funding-1',
        dealAmount: 50000,
        equityPercent: 5,
        dealType: 'SAFE',
        status: 'active',
        totalReleased: 0,
        acceptedAt: new Date('2026-02-01'),
        milestones: [],
      },
    } as any);

    const request = new Request(
      'http://localhost:3000/api/v1/funding?pitchId=550e8400-e29b-41d4-a716-446655440000',
      {
        headers: { authorization: 'Bearer valid_key' },
      }
    );
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.funding.id).toBe('funding-1');
    expect(data.funding.dealAmount).toBe(50000);
  });

  it('should return 404 when pitch has no funding', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-1' });
    vi.mocked(prisma.startup.findUnique).mockResolvedValue({
      id: 'startup-1',
      name: 'Test Startup',
      userId: 'user-1',
      funding: null, // No funding!
    } as any);

    const request = new Request(
      'http://localhost:3000/api/v1/funding?pitchId=550e8400-e29b-41d4-a716-446655440000',
      {
        headers: { authorization: 'Bearer valid_key' },
      }
    );
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('No funding found for this pitch');
  });

  it('should calculate progress correctly with all milestones completed', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-1' });
    vi.mocked(prisma.funding.findUnique).mockResolvedValue({
      id: 'funding-1',
      dealAmount: 100000,
      equityPercent: 10,
      dealType: 'SAFE',
      status: 'completed',
      totalReleased: 100000,
      acceptedAt: new Date('2026-02-01'),
      startup: {
        id: 'startup-1',
        name: 'Test Startup',
        userId: 'user-1',
      },
      milestones: [
        {
          id: 'milestone-1',
          number: 1,
          description: 'MVP',
          amount: 50000,
          dueDate: new Date('2026-03-01'),
          status: 'verified',
          completedAt: new Date('2026-02-15'),
          verifiedAt: new Date('2026-02-16'),
          txHash: '0xabc',
        },
        {
          id: 'milestone-2',
          number: 2,
          description: 'Launch',
          amount: 50000,
          dueDate: new Date('2026-04-01'),
          status: 'completed',
          completedAt: new Date('2026-03-15'),
          verifiedAt: null,
          txHash: '0xdef',
        },
      ],
    } as any);

    const request = new Request(
      'http://localhost:3000/api/v1/funding?fundingId=550e8400-e29b-41d4-a716-446655440000',
      {
        headers: { authorization: 'Bearer valid_key' },
      }
    );
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.funding.progress.progressPercent).toBe(100);
  });
});
