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

  it('generates a paginated historical call report grouped by seller and leader', async () => {
    const makeRequest = jest.fn(async (_method: string, path: string) => {
      if (path.startsWith('/users/search')) {
        return {
          success: true,
          data: {
            users: [
              { id: 'user_1', firstName: 'Ada', lastName: 'Closer', email: 'ada@example.com' },
              { id: 'user_2', firstName: 'Grace', lastName: 'Setter', email: 'grace@example.com' },
            ],
          },
        };
      }
      if (path.startsWith('/conversations/messages/export')) {
        const url = new URL(`https://example.test${path}`);
        const cursor = url.searchParams.get('cursor');
        if (!cursor) {
          return {
            success: true,
            data: {
              messages: [
                {
                  id: 'call_1',
                  userId: 'user_1',
                  channel: 'Call',
                  direction: 'outbound',
                  status: 'answered',
                  callDuration: '00:02:30',
                  contactId: 'contact_1',
                  conversationId: 'conv_1',
                  createdAt: '2026-06-10T14:00:00.000Z',
                },
              ],
              nextCursor: 'page-2',
            },
          };
        }
        return {
          success: true,
          data: {
            messages: [
              {
                id: 'call_2',
                userId: 'user_2',
                channel: 'Call',
                direction: 'outbound',
                status: 'no-answer',
                durationSeconds: 30,
                contactId: 'contact_2',
                conversationId: 'conv_2',
                createdAt: '2026-06-11T14:00:00.000Z',
              },
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

    const result = await reportingTools.handleToolCall('generate_historical_activity_report', {
      startDate: '2026-06-01',
      endDate: '2026-06-30',
      channel: 'Call',
      pageLimit: 500,
      maxPages: 5,
      includeDetails: true,
      includeCsv: true,
      leaderMap: {
        user_1: 'Leader A',
        user_2: 'Leader B',
      },
    }) as any;

    expect(result.success).toBe(true);
    expect(result.completed).toBe(true);
    expect(result.scannedRecords).toBe(2);
    expect(result.matchedRecords).toBe(2);
    expect(result.pagination.pagesScanned).toBe(2);
    expect(result.totals.call).toBe(2);
    expect(result.totals.answeredCalls).toBe(1);
    expect(result.totals.noAnswerCalls).toBe(1);
    expect(result.totals.totalCallDurationSeconds).toBe(180);
    expect(result.totals.averageCallDurationSeconds).toBe(90);
    expect(result.sellers).toEqual(expect.arrayContaining([
      expect.objectContaining({
        userId: 'user_1',
        userName: 'Ada Closer',
        call: 1,
        answeredCalls: 1,
        uniqueContacts: 1,
      }),
      expect.objectContaining({
        userId: 'user_2',
        userName: 'Grace Setter',
        call: 1,
        noAnswerCalls: 1,
      }),
    ]));
    expect(result.leaders).toEqual(expect.arrayContaining([
      expect.objectContaining({ userName: 'Leader A', call: 1 }),
      expect.objectContaining({ userName: 'Leader B', call: 1 }),
    ]));
    expect(result.details).toHaveLength(2);
    expect(result.exports.summaryCsv).toContain('Ada Closer');
    expect(result.exports.detailCsv).toContain('call_1');
    expect(makeRequest).toHaveBeenCalledWith(
      'GET',
      expect.stringContaining('cursor=page-2'),
      undefined,
      { version: '2021-04-15' },
    );
  });

  it('stops historical export at the configured record safety limit', async () => {
    const makeRequest = jest.fn(async (_method: string, path: string) => {
      if (path.startsWith('/users/search')) return { success: true, data: { users: [] } };
      if (path.startsWith('/conversations/messages/export')) {
        return {
          success: true,
          data: {
            messages: Array.from({ length: 100 }, (_, index) => ({
              id: `msg_${index}`,
              userId: 'user_1',
              channel: 'SMS',
              direction: 'outbound',
              status: 'delivered',
              createdAt: '2026-06-11T14:00:00.000Z',
            })),
            nextCursor: 'another-page',
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

    const result = await reportingTools.handleToolCall('generate_historical_activity_report', {
      startDate: '2026-06-01',
      endDate: '2026-06-30',
      channel: 'SMS',
      pageLimit: 100,
      maxRecords: 100,
      maxPages: 20,
    }) as any;

    expect(result.stoppedBySafetyLimit).toBe(true);
    expect(result.completed).toBe(false);
    expect(result.scannedRecords).toBe(100);
    expect(result.pagination.pagesScanned).toBe(1);
    expect(makeRequest).toHaveBeenCalledTimes(2);
  });

  it('locally filters historical records when HighLevel ignores the requested date window', async () => {
    const makeRequest = jest.fn(async (_method: string, path: string) => {
      if (path.startsWith('/users/search')) return { success: true, data: { users: [{ id: 'user_1', name: 'Ada Seller' }] } };
      if (path.startsWith('/conversations/messages/export')) {
        return {
          success: true,
          data: {
            messages: [
              {
                id: 'recent_call_1',
                userId: 'user_1',
                channel: 'Call',
                direction: 'outbound',
                status: 'answered',
                durationSeconds: 120,
                createdAt: '2026-06-12T14:00:00.000Z',
              },
              {
                id: 'recent_call_2',
                userId: 'user_1',
                channel: 'Call',
                direction: 'outbound',
                status: 'answered',
                durationSeconds: 90,
                createdAt: '2026-06-11T14:00:00.000Z',
              },
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

    const result = await reportingTools.handleToolCall('generate_historical_activity_report', {
      startDate: '2026-06-01',
      endDate: '2026-06-10',
      channel: 'Call',
      includeDetails: true,
    }) as any;

    expect(result.scannedRecords).toBe(2);
    expect(result.matchedRecords).toBe(0);
    expect(result.totals.totalRecords).toBe(0);
    expect(result.totals.call).toBe(0);
    expect(result.details).toEqual([]);
    expect(result.skippedRecords.afterDateRange).toBe(2);
    expect(result.pagination.likelyDateWindowIncomplete).toBe(true);
    expect(result.notes).toEqual(expect.arrayContaining([
      expect.stringContaining('local date filtering'),
    ]));
  });

  it('keeps paginating past newer records until it reaches the requested historical window', async () => {
    const makeRequest = jest.fn(async (_method: string, path: string) => {
      if (path.startsWith('/users/search')) return { success: true, data: { users: [{ id: 'user_1', name: 'Ada Seller' }] } };
      if (path.startsWith('/conversations/messages/export')) {
        const url = new URL(`https://example.test${path}`);
        const cursor = url.searchParams.get('cursor');
        if (!cursor) {
          return {
            success: true,
            data: {
              messages: [
                { id: 'recent', userId: 'user_1', channel: 'Call', status: 'answered', createdAt: '2026-06-12T14:00:00.000Z' },
              ],
              nextCursor: 'older-page',
            },
          };
        }
        return {
          success: true,
          data: {
            messages: [
              { id: 'historical', userId: 'user_1', channel: 'Call', status: 'answered', durationSeconds: 60, createdAt: '2026-06-05T14:00:00.000Z' },
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

    const result = await reportingTools.handleToolCall('generate_historical_activity_report', {
      startDate: '2026-06-01',
      endDate: '2026-06-10',
      channel: 'Call',
      includeDetails: true,
    }) as any;

    expect(result.scannedRecords).toBe(2);
    expect(result.matchedRecords).toBe(1);
    expect(result.skippedRecords.afterDateRange).toBe(1);
    expect(result.totals.call).toBe(1);
    expect(result.details[0].id).toBe('historical');
    expect(result.pagination.pagesScanned).toBe(2);
    expect(result.pagination.likelyDateWindowIncomplete).toBe(false);
  });
});
