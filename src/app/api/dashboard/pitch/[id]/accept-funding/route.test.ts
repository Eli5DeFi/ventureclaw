/**
 * Tests for /api/dashboard/pitch/[id]/accept-funding endpoint
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Mock auth and prisma
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    startup: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    funding: {
      create: vi.fn(),
    },
  },
}));

describe('POST /api/dashboard/pitch/[id]/accept-funding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should reject unauthenticated requests', async () => {
    vi.mocked(auth).mockResolvedValue(null);

    const request = new Request('http://localhost:3000/api/dashboard/pitch/123/accept-funding', {
      method: 'POST',
      body: JSON.stringify({ offerId: 'offer_1' }),
    });

    const params = Promise.resolve({ id: '550e8400-e29b-41d4-a716-446655440000' });
    const response = await POST(request, { params });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should reject invalid pitch ID format', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);

    const request = new Request('http://localhost:3000/api/dashboard/pitch/invalid-uuid/accept-funding', {
      method: 'POST',
      body: JSON.stringify({ offerId: 'offer_1' }),
    });

    const params = Promise.resolve({ id: 'not-a-uuid' });
    const response = await POST(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid pitch ID format');
  });

  it('should reject invalid offer ID format', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);

    const request = new Request('http://localhost:3000/api/dashboard/pitch/123/accept-funding', {
      method: 'POST',
      body: JSON.stringify({ offerId: 'invalid_offer' }),
    });

    const params = Promise.resolve({ id: '550e8400-e29b-41d4-a716-446655440000' });
    const response = await POST(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid offer ID');
  });

  it('should return 404 for non-existent pitch', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);
    vi.mocked(prisma.startup.findUnique).mockResolvedValue(null);

    const request = new Request('http://localhost:3000/api/dashboard/pitch/123/accept-funding', {
      method: 'POST',
      body: JSON.stringify({ offerId: 'offer_1' }),
    });

    const params = Promise.resolve({ id: '550e8400-e29b-41d4-a716-446655440000' });
    const response = await POST(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Pitch not found');
  });

  it('should reject if funding already accepted', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);
    vi.mocked(prisma.startup.findUnique).mockResolvedValue({
      id: 'pitch-1',
      userId: 'user-1',
      fundingAsk: 100000,
      funding: { id: 'existing-funding' }, // Already has funding!
    } as any);

    const request = new Request('http://localhost:3000/api/dashboard/pitch/123/accept-funding', {
      method: 'POST',
      body: JSON.stringify({ offerId: 'offer_1' }),
    });

    const params = Promise.resolve({ id: '550e8400-e29b-41d4-a716-446655440000' });
    const response = await POST(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Funding already accepted for this pitch');
  });

  it('should create funding with 5 milestones for offer_1', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);
    vi.mocked(prisma.startup.findUnique).mockResolvedValue({
      id: 'pitch-1',
      userId: 'user-1',
      fundingAsk: 100000,
      funding: null,
    } as any);

    const mockFunding = {
      id: 'funding-1',
      startupId: 'pitch-1',
      dealAmount: 80000, // 80% of fundingAsk
      equityPercent: 15,
      dealType: 'SAFE',
      status: 'active',
      milestones: [
        { number: 1, amount: 16000, status: 'pending' },
        { number: 2, amount: 16000, status: 'pending' },
        { number: 3, amount: 20000, status: 'pending' },
        { number: 4, amount: 16000, status: 'pending' },
        { number: 5, amount: 12000, status: 'pending' },
      ],
    };

    vi.mocked(prisma.funding.create).mockResolvedValue(mockFunding as any);
    vi.mocked(prisma.startup.update).mockResolvedValue({} as any);

    const request = new Request('http://localhost:3000/api/dashboard/pitch/123/accept-funding', {
      method: 'POST',
      body: JSON.stringify({ offerId: 'offer_1' }),
    });

    const params = Promise.resolve({ id: '550e8400-e29b-41d4-a716-446655440000' });
    const response = await POST(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.fundingId).toBe('funding-1');
    expect(data.funding.milestones).toHaveLength(5);

    // Verify startup was updated to FUNDED status
    expect(prisma.startup.update).toHaveBeenCalledWith({
      where: { id: 'pitch-1' },
      data: { status: 'FUNDED' },
    });
  });

  it('should create funding with offer_2 parameters', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);
    vi.mocked(prisma.startup.findUnique).mockResolvedValue({
      id: 'pitch-1',
      userId: 'user-1',
      fundingAsk: 100000,
      funding: null,
    } as any);

    const mockFunding = {
      id: 'funding-1',
      startupId: 'pitch-1',
      dealAmount: 100000, // 100% of fundingAsk
      equityPercent: 20,
      dealType: 'Equity',
      status: 'active',
      milestones: [
        { number: 1, amount: 20000 },
        { number: 2, amount: 20000 },
        { number: 3, amount: 25000 },
        { number: 4, amount: 20000 },
        { number: 5, amount: 15000 },
      ],
    };

    vi.mocked(prisma.funding.create).mockResolvedValue(mockFunding as any);
    vi.mocked(prisma.startup.update).mockResolvedValue({} as any);

    const request = new Request('http://localhost:3000/api/dashboard/pitch/123/accept-funding', {
      method: 'POST',
      body: JSON.stringify({ offerId: 'offer_2' }),
    });

    const params = Promise.resolve({ id: '550e8400-e29b-41d4-a716-446655440000' });
    const response = await POST(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.funding.dealAmount).toBe(100000);
    expect(data.funding.equityPercent).toBe(20);
    expect(data.funding.dealType).toBe('Equity');
  });

  it('should validate milestone amounts add up correctly', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);
    vi.mocked(prisma.startup.findUnique).mockResolvedValue({
      id: 'pitch-1',
      userId: 'user-1',
      fundingAsk: 100000,
      funding: null,
    } as any);

    let capturedMilestones: any[] = [];
    vi.mocked(prisma.funding.create).mockImplementation(async (args: any) => {
      capturedMilestones = args.data.milestones.create;
      return {
        id: 'funding-1',
        milestones: capturedMilestones,
      } as any;
    });

    vi.mocked(prisma.startup.update).mockResolvedValue({} as any);

    const request = new Request('http://localhost:3000/api/dashboard/pitch/123/accept-funding', {
      method: 'POST',
      body: JSON.stringify({ offerId: 'offer_1' }),
    });

    const params = Promise.resolve({ id: '550e8400-e29b-41d4-a716-446655440000' });
    await POST(request, { params });

    // Calculate total milestone amounts
    const totalMilestoneAmount = capturedMilestones.reduce(
      (sum, milestone) => sum + milestone.amount,
      0
    );

    // Should be 80% of 100000 = 80000
    // Allowing for rounding errors (within 1%)
    expect(totalMilestoneAmount).toBeGreaterThanOrEqual(79200);
    expect(totalMilestoneAmount).toBeLessThanOrEqual(80800);
  });
});
