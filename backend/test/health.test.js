import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock the dependencies before they are imported
jest.unstable_mockModule('../src/services/directDataService.js', () => ({
  default: {
    getCacheStats: jest.fn(),
  },
}));

jest.unstable_mockModule('../src/websocket/realtime.js', () => ({
  io: {
    sockets: {
      sockets: {
        size: 0,
      },
    },
  },
}));

// Dynamically import the modules after mocking
const { getHealth } = await import('../src/controllers/utility.controller.js');
const directDataService = (await import('../src/services/directDataService.js')).default;
const { io } = await import('../src/websocket/realtime.js');


describe('GET /health', () => {
  beforeEach(() => {
    // Clear mock history before each test
    jest.clearAllMocks();
  });

  it('should return a healthy status', async () => {
    // Mock the request and response objects
    const req = {};
    const res = {
      json: jest.fn(),
      status: jest.fn(() => res), // chainable
    };

    // Mock the return value of getCacheStats
    directDataService.getCacheStats.mockReturnValue({ keys: { length: 5 } });

    // Mock the number of connected sockets
    io.sockets.sockets.size = 2;

    await getHealth(req, res);

    expect(res.status).not.toHaveBeenCalled(); // Should not be called on success
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'healthy',
        services: expect.objectContaining({
          cache: {
            status: 'active',
            keys_count: 5,
          },
          websocket: {
            status: 'active',
            connected_clients: 2,
          },
        }),
      })
    );
  });

  it('should handle errors gracefully', async () => {
    const req = {};
    const res = {
      json: jest.fn(),
      status: jest.fn(() => res),
    };

    // Mock an error
    const errorMessage = 'Test error';
    directDataService.getCacheStats.mockImplementation(() => {
      throw new Error(errorMessage);
    });

    await getHealth(req, res);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'unhealthy',
        error: errorMessage,
      })
    );
  });
});
