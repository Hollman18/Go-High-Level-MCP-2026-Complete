import { describe, expect, it, jest } from '@jest/globals';
import { ReportingTools } from '../../src/tools/reporting-tools.js';

describe('ReportingTools message activity fallback', () => {
  it('falls back to exported messages when the aggregate SMS report is unavailable', async () => {
    const makeRequest = jest.fn(async (method: string, path: string) => {
      if (path.startsWith('/reporting/sms')) {
        throw new Error('GHL API Error (404): Not Found');
      }
      if (path.startsWith('/users/search')) {
        return {
          success: true,
          data: {
            users: [
              { id: 'user_1', firstName: 'Ada', lastName: 'Seller', email: 'ada@example.com' },
            ],
          },
        };
      }
      if (path.startsWith('/conversations/messages/export')) {
        return {
          success: true,
          data: {
            messages: [
              {
                id: 'msg_1',
                userId: 'user_1',
                channel: 'SMS',
                direction: 'outbound',
                status: 'delivered',
                createdAt: '2026-06-11T20:00:00.000Z',
                body: 'Hola, seguimos atentos.',
              },
              {
                id: 'msg_2',
                userId: 'user_1',
                channel: 'SMS',
                direction: 'inbound',
                createdAt: '2026-06-11T20:01:00.000Z',
                body: 'Gracias.',
              },
              {
                id: 'msg_3',
                channel: 'SMS',
                direction: 'outbound',
                status: 'failed',
                createdAt: '2026-06-11T20:02:00.000Z',
                body: 'Mensaje sin vendedor.',
              },
            ],
            nextCursor: 'next-page',
          },
        };
      }
      throw new Error(`Unexpected request: ${method} ${path}`);
    });
    const reportingTools = new ReportingTools({
      getConfig: () => ({
        accessToken: 'test',
        baseUrl: 'https://services.leadconnectorhq.com',
        version: '2023-02-21',
        locationId: 'loc_123',
      }),
      makeRequest,
    } as any);

    const result = await reportingTools.handleToolCall('get_sms_reports', {
      startDate: '2026-06-01',
      endDate: '2026-06-11',
    }) as any;

    expect(result.success).toBe(true);
    expect(result.fallback).toBe(true);
    expect(result.scannedMessages).toBe(3);
    expect(result.totals.sms).toBe(3);
    expect(result.totals.outbound).toBe(2);
    expect(result.totals.inbound).toBe(1);
    expect(result.totals.failed).toBe(1);
    expect(result.nextCursor).toBe('next-page');
    expect(result.sellers).toEqual(expect.arrayContaining([
      expect.objectContaining({
        userId: 'user_1',
        userName: 'Ada Seller',
        totalMessages: 2,
        outbound: 1,
        inbound: 1,
      }),
      expect.objectContaining({
        userId: 'unassigned',
        totalMessages: 1,
        failed: 1,
      }),
    ]));
    expect(makeRequest).toHaveBeenCalledWith(
      'GET',
      expect.stringContaining('/conversations/messages/export?'),
      undefined,
      { version: '2021-04-15' },
    );
  });

  it('can build a WhatsApp message activity report directly', async () => {
    const makeRequest = jest.fn(async (_method: string, path: string) => {
      if (path.startsWith('/users/search')) return { success: true, data: { users: [] } };
      if (path.startsWith('/conversations/messages/export')) {
        return {
          success: true,
          data: {
            messages: [
              { id: 'msg_1', messageBy: { id: 'user_2', name: 'Grace Hopper' }, type: 'WhatsApp', direction: 'outbound' },
            ],
          },
        };
      }
      throw new Error(`Unexpected path: ${path}`);
    });
    const reportingTools = new ReportingTools({
      getConfig: () => ({
        accessToken: 'test',
        baseUrl: 'https://services.leadconnectorhq.com',
        version: '2023-02-21',
        locationId: 'loc_123',
      }),
      makeRequest,
    } as any);

    const result = await reportingTools.handleToolCall('get_message_activity_by_user', {
      startDate: '2026-06-01',
      endDate: '2026-06-11',
      channel: 'WhatsApp',
    }) as any;

    expect(result.channel).toBe('WhatsApp');
    expect(result.totals.whatsapp).toBe(1);
    expect(result.sellers[0]).toEqual(expect.objectContaining({
      userId: 'user_2',
      userName: 'Grace Hopper',
      totalMessages: 1,
    }));
  });
});
