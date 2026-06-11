/**
 * GoHighLevel Reporting/Analytics Tools
 * Tools for accessing reports and analytics
 */

import { GHLApiClient } from '../clients/ghl-api-client.js';

type JsonRecord = Record<string, any>;

export class ReportingTools {
  constructor(private ghlClient: GHLApiClient) {}

  getToolDefinitions() {
    return [
      // Attribution Reports
      {
        name: 'get_attribution_report',
        description: 'Get attribution/source tracking report showing where leads came from',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: { type: 'string', description: 'Location ID' },
            startDate: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
            endDate: { type: 'string', description: 'End date (YYYY-MM-DD)' },
          },
          required: ['startDate', 'endDate']
        },
        _meta: {
          labels: {
            category: "analytics",
            access: "read",
            complexity: "simple"
          }
        }
      },

      // Call Reports
      {
        name: 'get_call_reports',
        description: 'Get call activity reports including call duration, outcomes, etc.',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: { type: 'string', description: 'Location ID' },
            startDate: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
            endDate: { type: 'string', description: 'End date (YYYY-MM-DD)' },
            userId: { type: 'string', description: 'Filter by user ID' },
            type: { type: 'string', enum: ['inbound', 'outbound', 'all'], description: 'Call type filter' },
          },
          required: ['startDate', 'endDate']
        },
        _meta: {
          labels: {
            category: "analytics",
            access: "read",
            complexity: "batch"
          }
        }
      },

      // Appointment Reports
      {
        name: 'get_appointment_reports',
        description: 'Get appointment activity reports',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: { type: 'string', description: 'Location ID' },
            startDate: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
            endDate: { type: 'string', description: 'End date (YYYY-MM-DD)' },
            calendarId: { type: 'string', description: 'Filter by calendar ID' },
            status: { type: 'string', enum: ['booked', 'confirmed', 'showed', 'noshow', 'cancelled'], description: 'Appointment status filter' },
          },
          required: ['startDate', 'endDate']
        },
        _meta: {
          labels: {
            category: "analytics",
            access: "read",
            complexity: "simple"
          }
        }
      },

      // Pipeline/Opportunity Reports
      {
        name: 'get_pipeline_reports',
        description: 'Get pipeline/opportunity performance reports',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: { type: 'string', description: 'Location ID' },
            pipelineId: { type: 'string', description: 'Filter by pipeline ID' },
            startDate: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
            endDate: { type: 'string', description: 'End date (YYYY-MM-DD)' },
            userId: { type: 'string', description: 'Filter by assigned user' },
          },
          required: ['startDate', 'endDate']
        },
        _meta: {
          labels: {
            category: "analytics",
            access: "read",
            complexity: "simple"
          }
        }
      },

      // Email/SMS Reports
      {
        name: 'get_email_reports',
        description: 'Get email performance reports (deliverability, opens, clicks)',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: { type: 'string', description: 'Location ID' },
            startDate: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
            endDate: { type: 'string', description: 'End date (YYYY-MM-DD)' },
          },
          required: ['startDate', 'endDate']
        },
        _meta: {
          labels: {
            category: "analytics",
            access: "read",
            complexity: "simple"
          }
        }
      },
      {
        name: 'get_sms_reports',
        description: 'Get SMS performance reports. If the aggregate HighLevel reporting endpoint is unavailable, falls back to exported conversation messages grouped by user/seller.',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: { type: 'string', description: 'Location ID' },
            startDate: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
            endDate: { type: 'string', description: 'End date (YYYY-MM-DD)' },
            groupByUser: { type: 'boolean', description: 'Return message counts grouped by seller/user using conversation messages export', default: false },
            limit: { type: 'number', description: 'Messages to scan in fallback mode (10-500, default 100)', minimum: 10, maximum: 500 },
            cursor: { type: 'string', description: 'Pagination cursor returned by the previous fallback response' },
          },
          required: ['startDate', 'endDate']
        },
        _meta: {
          labels: {
            category: "analytics",
            access: "read",
            complexity: "simple"
          }
        }
      },
      {
        name: 'get_message_activity_by_user',
        description: 'Build a messages-by-seller report from exported conversation messages. Supports SMS, Email, WhatsApp, Call, or all channels and groups activity by the user/seller fields returned by HighLevel.',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: { type: 'string', description: 'Location ID' },
            startDate: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
            endDate: { type: 'string', description: 'End date (YYYY-MM-DD)' },
            channel: { type: 'string', enum: ['SMS', 'Email', 'WhatsApp', 'Call', 'all'], description: 'Message channel to report. Use all to include every exported channel.', default: 'SMS' },
            limit: { type: 'number', description: 'Messages to scan per page (10-500, default 100)', minimum: 10, maximum: 500 },
            cursor: { type: 'string', description: 'Cursor returned by the previous response for pagination' },
            includeSamples: { type: 'boolean', description: 'Include up to three sample message previews per seller', default: true },
          },
          required: ['startDate', 'endDate']
        },
        _meta: {
          labels: {
            category: "analytics",
            access: "read",
            complexity: "batch"
          }
        }
      },

      // Funnel Reports
      {
        name: 'get_funnel_reports',
        description: 'Get funnel performance reports (page views, conversions)',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: { type: 'string', description: 'Location ID' },
            funnelId: { type: 'string', description: 'Filter by funnel ID' },
            startDate: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
            endDate: { type: 'string', description: 'End date (YYYY-MM-DD)' },
          },
          required: ['startDate', 'endDate']
        },
        _meta: {
          labels: {
            category: "analytics",
            access: "read",
            complexity: "simple"
          }
        }
      },

      // Google/Facebook Ad Reports
      {
        name: 'get_ad_reports',
        description: 'Get advertising performance reports (Google/Facebook ads)',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: { type: 'string', description: 'Location ID' },
            platform: { type: 'string', enum: ['google', 'facebook', 'all'], description: 'Ad platform' },
            startDate: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
            endDate: { type: 'string', description: 'End date (YYYY-MM-DD)' },
          },
          required: ['startDate', 'endDate']
        },
        _meta: {
          labels: {
            category: "analytics",
            access: "read",
            complexity: "simple"
          }
        }
      },

      // Agent Performance
      {
        name: 'get_agent_reports',
        description: 'Get agent/user performance reports',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: { type: 'string', description: 'Location ID' },
            userId: { type: 'string', description: 'Filter by user ID' },
            startDate: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
            endDate: { type: 'string', description: 'End date (YYYY-MM-DD)' },
          },
          required: ['startDate', 'endDate']
        },
        _meta: {
          labels: {
            category: "analytics",
            access: "read",
            complexity: "simple"
          }
        }
      },

      // Dashboard Stats
      {
        name: 'get_dashboard_stats',
        description: 'Get main dashboard statistics overview',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: { type: 'string', description: 'Location ID' },
            dateRange: { type: 'string', enum: ['today', 'yesterday', 'last7days', 'last30days', 'thisMonth', 'lastMonth', 'custom'], description: 'Date range preset' },
            startDate: { type: 'string', description: 'Start date for custom range' },
            endDate: { type: 'string', description: 'End date for custom range' }
          }
        },
        _meta: {
          labels: {
            category: "analytics",
            access: "read",
            complexity: "simple"
          }
        }
      },

      // Conversion Reports
      {
        name: 'get_conversion_reports',
        description: 'Get conversion tracking reports',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: { type: 'string', description: 'Location ID' },
            startDate: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
            endDate: { type: 'string', description: 'End date (YYYY-MM-DD)' },
            source: { type: 'string', description: 'Filter by source' },
          },
          required: ['startDate', 'endDate']
        },
        _meta: {
          labels: {
            category: "analytics",
            access: "read",
            complexity: "simple"
          }
        }
      },

      // Revenue Reports
      {
        name: 'get_revenue_reports',
        description: 'Get revenue/payment reports',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: { type: 'string', description: 'Location ID' },
            startDate: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
            endDate: { type: 'string', description: 'End date (YYYY-MM-DD)' },
            groupBy: { type: 'string', enum: ['day', 'week', 'month'], description: 'Group results by' },
          },
          required: ['startDate', 'endDate']
        },
        _meta: {
          labels: {
            category: "analytics",
            access: "read",
            complexity: "simple"
          }
        }
      }
    ];
  }

  async handleToolCall(toolName: string, args: Record<string, unknown>): Promise<unknown> {
    const config = this.ghlClient.getConfig();
    const locationId = (args.locationId as string) || config.locationId;

    switch (toolName) {
      case 'get_attribution_report': {
        const params = new URLSearchParams();
        params.append('locationId', locationId);
        params.append('startDate', String(args.startDate));
        params.append('endDate', String(args.endDate));
        return this.ghlClient.makeRequest('GET', `/reporting/attribution?${params.toString()}`);
      }
      case 'get_call_reports': {
        const params = new URLSearchParams();
        params.append('locationId', locationId);
        params.append('startDate', String(args.startDate));
        params.append('endDate', String(args.endDate));
        if (args.userId) params.append('userId', String(args.userId));
        if (args.type) params.append('type', String(args.type));
        return this.ghlClient.makeRequest('GET', `/reporting/calls?${params.toString()}`);
      }
      case 'get_appointment_reports': {
        const params = new URLSearchParams();
        params.append('locationId', locationId);
        params.append('startDate', String(args.startDate));
        params.append('endDate', String(args.endDate));
        if (args.calendarId) params.append('calendarId', String(args.calendarId));
        if (args.status) params.append('status', String(args.status));
        return this.ghlClient.makeRequest('GET', `/reporting/appointments?${params.toString()}`);
      }
      case 'get_pipeline_reports': {
        const params = new URLSearchParams();
        params.append('locationId', locationId);
        params.append('startDate', String(args.startDate));
        params.append('endDate', String(args.endDate));
        if (args.pipelineId) params.append('pipelineId', String(args.pipelineId));
        if (args.userId) params.append('userId', String(args.userId));
        return this.ghlClient.makeRequest('GET', `/reporting/pipelines?${params.toString()}`);
      }
      case 'get_email_reports': {
        const params = new URLSearchParams();
        params.append('locationId', locationId);
        params.append('startDate', String(args.startDate));
        params.append('endDate', String(args.endDate));
        return this.ghlClient.makeRequest('GET', `/reporting/emails?${params.toString()}`);
      }
      case 'get_sms_reports': {
        if (args.groupByUser === true) {
          return this.buildMessageActivityByUser({ ...args, channel: 'SMS' }, locationId, {
            source: 'groupByUser',
          });
        }

        const params = new URLSearchParams();
        params.append('locationId', locationId);
        params.append('startDate', String(args.startDate));
        params.append('endDate', String(args.endDate));
        try {
          return await this.ghlClient.makeRequest('GET', `/reporting/sms?${params.toString()}`);
        } catch (error) {
          if (!isNotFound(error)) throw error;
          return this.buildMessageActivityByUser({ ...args, channel: 'SMS' }, locationId, {
            source: 'fallback',
            fallbackReason: 'HighLevel returned 404 for /reporting/sms, so the MCP built the report from exported conversation messages.',
          });
        }
      }
      case 'get_message_activity_by_user': {
        return this.buildMessageActivityByUser(args, locationId, {
          source: 'conversations_export',
        });
      }
      case 'get_funnel_reports': {
        const params = new URLSearchParams();
        params.append('locationId', locationId);
        params.append('startDate', String(args.startDate));
        params.append('endDate', String(args.endDate));
        if (args.funnelId) params.append('funnelId', String(args.funnelId));
        return this.ghlClient.makeRequest('GET', `/reporting/funnels?${params.toString()}`);
      }
      case 'get_ad_reports': {
        const params = new URLSearchParams();
        params.append('locationId', locationId);
        params.append('startDate', String(args.startDate));
        params.append('endDate', String(args.endDate));
        if (args.platform) params.append('platform', String(args.platform));
        return this.ghlClient.makeRequest('GET', `/reporting/ads?${params.toString()}`);
      }
      case 'get_agent_reports': {
        const params = new URLSearchParams();
        params.append('locationId', locationId);
        params.append('startDate', String(args.startDate));
        params.append('endDate', String(args.endDate));
        if (args.userId) params.append('userId', String(args.userId));
        return this.ghlClient.makeRequest('GET', `/reporting/agents?${params.toString()}`);
      }
      case 'get_dashboard_stats': {
        const params = new URLSearchParams();
        params.append('locationId', locationId);
        if (args.dateRange) params.append('dateRange', String(args.dateRange));
        if (args.startDate) params.append('startDate', String(args.startDate));
        if (args.endDate) params.append('endDate', String(args.endDate));
        return this.ghlClient.makeRequest('GET', `/reporting/dashboard?${params.toString()}`);
      }
      case 'get_conversion_reports': {
        const params = new URLSearchParams();
        params.append('locationId', locationId);
        params.append('startDate', String(args.startDate));
        params.append('endDate', String(args.endDate));
        if (args.source) params.append('source', String(args.source));
        return this.ghlClient.makeRequest('GET', `/reporting/conversions?${params.toString()}`);
      }
      case 'get_revenue_reports': {
        const params = new URLSearchParams();
        params.append('locationId', locationId);
        params.append('startDate', String(args.startDate));
        params.append('endDate', String(args.endDate));
        if (args.groupBy) params.append('groupBy', String(args.groupBy));
        return this.ghlClient.makeRequest('GET', `/reporting/revenue?${params.toString()}`);
      }

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  private async buildMessageActivityByUser(
    args: Record<string, unknown>,
    locationId: string,
    meta: JsonRecord
  ): Promise<unknown> {
    const params = new URLSearchParams();
    const channel = stringArg(args.channel) || 'SMS';
    const limit = clampNumber(args.limit, 100, 10, 500);

    params.append('locationId', locationId);
    params.append('limit', String(limit));
    params.append('sortBy', 'createdAt');
    params.append('sortOrder', 'desc');
    if (channel !== 'all') params.append('channel', channel);
    if (args.startDate) params.append('startDate', String(args.startDate));
    if (args.endDate) params.append('endDate', String(args.endDate));
    if (args.cursor) params.append('cursor', String(args.cursor));

    const [messagesResponse, users] = await Promise.all([
      this.ghlClient.makeRequest('GET', `/conversations/messages/export?${params.toString()}`, undefined, { version: '2021-04-15' }),
      this.loadUsers(locationId),
    ]);

    const responseData = (messagesResponse as JsonRecord).data ?? messagesResponse;
    const messages = firstArray(responseData, ['messages', 'data.messages', 'data', 'items', 'records', 'results']);
    const userMap = new Map(users.map((user) => [user.id, user]));
    const includeSamples = args.includeSamples !== false;
    const byUser = new Map<string, JsonRecord>();
    const totals = {
      messages: 0,
      outbound: 0,
      inbound: 0,
      sms: 0,
      email: 0,
      whatsapp: 0,
      call: 0,
      other: 0,
      delivered: 0,
      failed: 0,
    };

    for (const item of messages) {
      const message = isRecord(item) ? item : {};
      const userId = firstString(message, [
        'userId',
        'user_id',
        'senderId',
        'sender.id',
        'user.id',
        'messageBy.id',
        'createdBy',
        'createdBy.id',
        'assignedTo',
        'assignedTo.id',
        'assignedUserId',
        'ownerId',
        'staffId',
      ]) || 'unassigned';
      const user = userMap.get(userId);
      const userName = user?.name || firstString(message, [
        'userName',
        'senderName',
        'sender.name',
        'user.name',
        'messageBy.name',
        'createdBy.name',
        'assignedTo.name',
        'assignedUserName',
      ]) || (userId === 'unassigned' ? 'Sin vendedor/usuario en el mensaje' : userId);
      const bucket = getOrCreateUserBucket(byUser, userId, userName, user?.email);
      const messageChannel = normalizeChannel(firstString(message, ['channel', 'type', 'messageType', 'message_type']) || channel);
      const direction = normalizeDirection(firstString(message, ['direction', 'messageDirection', 'source', 'status']));
      const status = String(firstString(message, ['status', 'deliveryStatus', 'messageStatus']) || '').toLowerCase();

      bucket.totalMessages++;
      totals.messages++;
      incrementChannel(bucket, messageChannel);
      incrementChannel(totals, messageChannel);
      if (direction === 'outbound') {
        bucket.outbound++;
        totals.outbound++;
      } else if (direction === 'inbound') {
        bucket.inbound++;
        totals.inbound++;
      } else {
        bucket.unknownDirection++;
      }
      if (status.includes('deliver')) {
        bucket.delivered++;
        totals.delivered++;
      }
      if (status.includes('fail') || status.includes('error')) {
        bucket.failed++;
        totals.failed++;
      }

      if (includeSamples && bucket.samples.length < 3) {
        bucket.samples.push({
          id: firstString(message, ['id', 'messageId', '_id']),
          date: firstString(message, ['date', 'createdAt', 'created_at', 'dateAdded']),
          channel: messageChannel,
          direction,
          status: status || undefined,
          contactId: firstString(message, ['contactId', 'contact.id']),
          conversationId: firstString(message, ['conversationId', 'conversation.id']),
          preview: preview(firstString(message, ['body', 'message', 'text', 'content', 'lastMessageBody']) || ''),
        });
      }
    }

    const sellers = [...byUser.values()].sort((a, b) => b.totalMessages - a.totalMessages);
    const nextCursor = firstString(responseData, ['nextCursor', 'cursor.next', 'meta.nextCursor', 'pagination.nextCursor']);

    return {
      success: true,
      source: meta.source,
      fallback: meta.source === 'fallback',
      fallbackReason: meta.fallbackReason,
      locationId,
      dateRange: {
        startDate: args.startDate,
        endDate: args.endDate,
      },
      channel,
      scannedMessages: messages.length,
      limit,
      nextCursor,
      totals,
      sellers,
      notes: [
        'This report is built from the official conversations messages export endpoint, not from /reporting/sms.',
        'Grouping depends on user/seller fields returned by HighLevel for each exported message. Messages without a user field are grouped as unassigned.',
      ],
    };
  }

  private async loadUsers(locationId: string): Promise<Array<{ id: string; name: string; email?: string }>> {
    try {
      const params = new URLSearchParams();
      params.append('locationId', locationId);
      params.append('limit', '100');
      const response = await this.ghlClient.makeRequest('GET', `/users/search?${params.toString()}`);
      const data = (response as JsonRecord).data ?? response;
      return firstArray(data, ['users', 'data.users', 'data', 'items', 'records']).map((item) => {
        const user = isRecord(item) ? item : {};
        const id = firstString(user, ['id', 'userId', '_id']);
        return {
          id,
          name: [firstString(user, ['firstName']), firstString(user, ['lastName'])].filter(Boolean).join(' ') ||
            firstString(user, ['name', 'email']) ||
            id,
          email: firstString(user, ['email']),
        };
      }).filter((user) => user.id);
    } catch {
      return [];
    }
  }
}

function getOrCreateUserBucket(
  buckets: Map<string, JsonRecord>,
  userId: string,
  userName: string,
  email?: string
): JsonRecord {
  const existing = buckets.get(userId);
  if (existing) return existing;
  const bucket = {
    userId,
    userName,
    email,
    totalMessages: 0,
    outbound: 0,
    inbound: 0,
    unknownDirection: 0,
    sms: 0,
    email: 0,
    whatsapp: 0,
    call: 0,
    other: 0,
    delivered: 0,
    failed: 0,
    samples: [] as JsonRecord[],
  };
  buckets.set(userId, bucket);
  return bucket;
}

function incrementChannel(target: JsonRecord, channel: string): void {
  if (channel === 'SMS') target.sms++;
  else if (channel === 'Email') target.email++;
  else if (channel === 'WhatsApp') target.whatsapp++;
  else if (channel === 'Call') target.call++;
  else target.other++;
}

function normalizeChannel(value: string): string {
  const normalized = value.toLowerCase();
  if (normalized.includes('sms')) return 'SMS';
  if (normalized.includes('email')) return 'Email';
  if (normalized.includes('whatsapp')) return 'WhatsApp';
  if (normalized.includes('call')) return 'Call';
  return value || 'Other';
}

function normalizeDirection(value?: string): 'outbound' | 'inbound' | 'unknown' {
  const normalized = String(value || '').toLowerCase();
  if (normalized.includes('out') || normalized.includes('sent')) return 'outbound';
  if (normalized.includes('in') || normalized.includes('received')) return 'inbound';
  return 'unknown';
}

function firstArray(root: unknown, paths: string[]): JsonRecord[] {
  for (const path of paths) {
    const value = readPath(root, path);
    if (Array.isArray(value)) return value.filter(isRecord);
  }
  if (Array.isArray(root)) return root.filter(isRecord);
  return [];
}

function firstString(root: unknown, paths: string[]): string {
  for (const path of paths) {
    const value = readPath(root, path);
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return '';
}

function readPath(root: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((value, key) => {
    if (!isRecord(value)) return undefined;
    return value[key];
  }, root);
}

function stringArg(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function clampNumber(value: unknown, fallback: number, min: number, max: number): number {
  const number = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : fallback;
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.round(number)));
}

function preview(value: string): string {
  return value.length > 160 ? `${value.slice(0, 157)}...` : value;
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNotFound(error: unknown): boolean {
  const status = (error as any)?.response?.status;
  const message = error instanceof Error ? error.message : String(error);
  return status === 404 || /\b404\b/.test(message);
}
