import { describe, it, expect, vi } from 'vitest';
import { journeyService } from './journeyService';
import apiClient from './apiClient';

vi.mock('./apiClient');

describe('journeyService', () => {
  it('searchRoutes should return mapped routes on success', async () => {
    const mockData = [{ id: 'route-1', name: 'Fastest Route', totalDuration: 45 }];
    (apiClient.post as any).mockResolvedValue({ data: mockData });

    const result = await journeyService.searchRoutes('Station A', 'Station B');
    expect(apiClient.post).toHaveBeenCalledWith('/journey/plan', expect.any(Object));
    expect(result).toEqual(mockData);
  });
});
