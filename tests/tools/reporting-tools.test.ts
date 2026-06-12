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
    expect(result.totals.effective).toBe(1);
    expect(result.totals.nonEffective).toBe(1);
    expect(result.totals.failed).toBe(1);
    expect(result.totals.periods.daily['2026-06-11'].total).toBe(3);
    expect(result.averages.perDay.total).toBe(3);
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

  it('builds a pipeline report grouped by assigned user', async () => {
    const makeRequest = jest.fn(async (method: string, path: string) => {
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
      if (method === 'POST' && path === '/opportunities/search') {
        return {
          success: true,
          data: {
            opportunities: [
              {
                id: 'opp_1',
                assignedTo: 'user_1',
                monetaryValue: 1200,
                status: 'won',
                pipelineName: 'Main Sales',
                pipelineStageName: 'Closed Won',
                createdAt: '2026-06-05T12:00:00.000Z',
              },
              {
                id: 'opp_2',
                assignedTo: { id: 'user_1', name: 'Ada Seller' },
                value: '300',
                status: 'open',
                pipelineName: 'Main Sales',
                pipelineStageName: 'Proposal',
                createdAt: '2026-06-06T12:00:00.000Z',
              },
            ],
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

    const result = await reportingTools.handleToolCall('get_pipeline_activity_by_user', {
      startDate: '2026-06-01',
      endDate: '2026-06-11',
    }) as any;

    expect(result.success).toBe(true);
    expect(result.totals.opportunities).toBe(2);
    expect(result.totals.value).toBe(1500);
    expect(result.users[0]).toEqual(expect.objectContaining({
      userId: 'user_1',
      totalOpportunities: 2,
      won: 1,
      open: 1,
    }));
    expect(makeRequest).toHaveBeenCalledWith(
      'POST',
      '/opportunities/search',
      expect.objectContaining({ location_id: 'loc_123' }),
      { version: '2021-07-28' },
    );
  });

  it('builds a contact ownership report grouped by assigned user', async () => {
    const makeRequest = jest.fn(async (_method: string, path: string) => {
      if (path.startsWith('/users/search')) {
        return { success: true, data: { users: [{ id: 'user_1', name: 'Ada Seller' }] } };
      }
      if (path.startsWith('/contacts/?')) {
        return {
          success: true,
          data: {
            contacts: [
              { id: 'contact_1', assignedTo: 'user_1', firstName: 'Lead', email: 'lead@example.com', phone: '+1555000' },
              { id: 'contact_2', assignedTo: 'user_1', firstName: 'No Email' },
              { id: 'contact_3', firstName: 'Unassigned', email: 'none@example.com' },
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

    const result = await reportingTools.handleToolCall('get_contact_ownership_report', {
      limit: 50,
    }) as any;

    expect(result.success).toBe(true);
    expect(result.totals.contacts).toBe(3);
    expect(result.totals.withEmail).toBe(2);
    expect(result.totals.unassigned).toBe(1);
    expect(result.owners).toEqual(expect.arrayContaining([
      expect.objectContaining({
        userId: 'user_1',
        totalContacts: 2,
        withEmail: 1,
        withPhone: 1,
      }),
    ]));
    expect(makeRequest).toHaveBeenCalledWith(
      'GET',
      expect.stringContaining('/contacts/?'),
      undefined,
      { version: '2021-07-28' },
    );
  });

  it('builds a combined business report across pipeline, contacts, messages, WhatsApp, email, and calls', async () => {
    const makeRequest = jest.fn(async (method: string, path: string) => {
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
      if (method === 'POST' && path === '/opportunities/search') {
        return {
          success: true,
          data: {
            opportunities: [
              { id: 'opp_1', assignedTo: 'user_1', value: 500, status: 'won', createdAt: '2026-06-05T12:00:00.000Z' },
            ],
          },
        };
      }
      if (path.startsWith('/contacts/?')) {
        return {
          success: true,
          data: {
            contacts: [
              { id: 'contact_1', assignedTo: 'user_1', email: 'lead@example.com', phone: '+1555000' },
            ],
          },
        };
      }
      if (path.startsWith('/conversations/messages/export')) {
        const channel = new URL(`https://example.test${path}`).searchParams.get('channel');
        return {
          success: true,
          data: {
            messages: [
              {
                id: `msg_${channel}`,
                userId: 'user_1',
                channel,
                direction: 'outbound',
                status: 'delivered',
                createdAt: '2026-06-06T12:00:00.000Z',
                body: `${channel} sample`,
              },
            ],
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

    const result = await reportingTools.handleToolCall('get_user_business_report', {
      startDate: '2026-06-01',
      endDate: '2026-06-11',
      limitPerDataset: 25,
    }) as any;

    expect(result.success).toBe(true);
    expect(result.totals.pipeline.opportunities).toBe(1);
    expect(result.totals.contacts.contacts).toBe(1);
    expect(result.totals.sms.messages).toBe(1);
    expect(result.totals.whatsapp.messages).toBe(1);
    expect(result.totals.email.messages).toBe(1);
    expect(result.totals.calls.messages).toBe(1);
    expect(result.users[0]).toEqual(expect.objectContaining({
      userId: 'user_1',
      userEmail: 'ada@example.com',
      activityScore: 6,
    }));
    expect(result.users[0].pipeline.totalValue).toBe(500);
    expect(result.users[0].sms.totalMessages).toBe(1);
    expect(result.users[0].whatsapp.totalMessages).toBe(1);
    expect(result.users[0].email.totalMessages).toBe(1);
    expect(result.users[0].calls.totalMessages).toBe(1);
  });

  it('builds SaaS and Value Ladder vertical report tools with role use-case maps', async () => {
    const makeRequest = jest.fn(async (method: string, path: string) => {
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
      if (method === 'POST' && path === '/opportunities/search') {
        return {
          success: true,
          data: {
            opportunities: [
              {
                id: 'opp_1',
                assignedTo: 'user_1',
                value: 2500,
                status: 'open',
                pipelineName: 'Subscription Sales',
                pipelineStageName: 'Demo Booked',
                createdAt: '2026-06-05T12:00:00.000Z',
              },
            ],
          },
        };
      }
      if (path.startsWith('/contacts/?')) {
        return {
          success: true,
          data: {
            contacts: [
              { id: 'contact_1', assignedTo: 'user_1', email: 'lead@example.com', phone: '+1555000' },
            ],
          },
        };
      }
      if (path.startsWith('/conversations/messages/export')) {
        const channel = new URL(`https://example.test${path}`).searchParams.get('channel') || 'SMS';
        return {
          success: true,
          data: {
            messages: [
              {
                id: `msg_${channel}`,
                userId: 'user_1',
                channel,
                direction: 'outbound',
                status: channel === 'Call' ? 'completed' : 'delivered',
                createdAt: '2026-06-06T12:00:00.000Z',
                body: `${channel} sample`,
              },
            ],
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

    const saas = await reportingTools.handleToolCall('get_saas_subscription_report', {
      startDate: '2026-06-01',
      endDate: '2026-06-11',
      limitPerDataset: 25,
    }) as any;
    const valueLadder = await reportingTools.handleToolCall('get_value_ladder_info_product_report', {
      startDate: '2026-06-01',
      endDate: '2026-06-11',
      limitPerDataset: 25,
    }) as any;

    expect(saas.reportModel.type).toBe('saas_subscription');
    expect(saas.useCaseMap.salesLeader.coaching).toEqual(expect.arrayContaining([
      expect.stringContaining('calling enough'),
    ]));
    expect(saas.users[0].calls.effective).toBe(1);
    expect(saas.users[0].calls.averages.perDay.total).toBe(1);
    expect(saas.users[0].pipeline.stageCounts['Demo Booked']).toBe(1);

    expect(valueLadder.reportModel.type).toBe('value_ladder_info_product');
    expect(valueLadder.reportModel.funnelOrRevenueModel).toEqual(expect.arrayContaining([
      'masterclass or webinar registration',
      'high-ticket offer',
    ]));
    expect(valueLadder.roleViews.management).toEqual(expect.arrayContaining([
      expect.stringContaining('Full Value Ladder'),
    ]));
  });
});
