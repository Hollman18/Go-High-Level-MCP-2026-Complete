/**
 * GoHighLevel Reporting/Analytics Tools
 * Tools for accessing reports and analytics
 */

import { GHLApiClient } from '../clients/ghl-api-client.js';

type JsonRecord = Record<string, any>;
type UserInfo = { id: string; name: string; email?: string };

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
      {
        name: 'get_sms_activity_by_user',
        description: 'Build an SMS-by-seller report with sent, received, delivered, failed, and sample message details.',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: { type: 'string', description: 'Location ID' },
            startDate: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
            endDate: { type: 'string', description: 'End date (YYYY-MM-DD)' },
            limit: { type: 'number', description: 'SMS messages to scan per page (10-500, default 100)', minimum: 10, maximum: 500 },
            cursor: { type: 'string', description: 'Cursor returned by the previous response for pagination' },
            userId: { type: 'string', description: 'Only include one assigned/sending user' },
            userIds: { type: 'array', items: { type: 'string' }, description: 'Only include these assigned/sending users' },
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
      {
        name: 'get_call_activity_by_user',
        description: 'Build a calls-by-user report from exported conversation call records with direction, status, contacts, conversations, and sample details.',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: { type: 'string', description: 'Location ID' },
            startDate: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
            endDate: { type: 'string', description: 'End date (YYYY-MM-DD)' },
            limit: { type: 'number', description: 'Call records to scan per page (10-500, default 100)', minimum: 10, maximum: 500 },
            cursor: { type: 'string', description: 'Cursor returned by the previous response for pagination' },
            userId: { type: 'string', description: 'Only include one assigned/sending user' },
            userIds: { type: 'array', items: { type: 'string' }, description: 'Only include these assigned/sending users' },
            includeSamples: { type: 'boolean', description: 'Include up to three sample call records per seller', default: true },
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
      {
        name: 'get_whatsapp_activity_by_user',
        description: 'Build a WhatsApp-by-seller report with sent, received, delivered, failed, and sample message details.',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: { type: 'string', description: 'Location ID' },
            startDate: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
            endDate: { type: 'string', description: 'End date (YYYY-MM-DD)' },
            limit: { type: 'number', description: 'WhatsApp messages to scan per page (10-500, default 100)', minimum: 10, maximum: 500 },
            cursor: { type: 'string', description: 'Cursor returned by the previous response for pagination' },
            userId: { type: 'string', description: 'Only include one assigned/sending user' },
            userIds: { type: 'array', items: { type: 'string' }, description: 'Only include these assigned/sending users' },
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
      {
        name: 'get_email_activity_by_user',
        description: 'Build an email-by-seller report with sent, received, delivered, failed, and sample email message details.',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: { type: 'string', description: 'Location ID' },
            startDate: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
            endDate: { type: 'string', description: 'End date (YYYY-MM-DD)' },
            limit: { type: 'number', description: 'Email messages to scan per page (10-500, default 100)', minimum: 10, maximum: 500 },
            cursor: { type: 'string', description: 'Cursor returned by the previous response for pagination' },
            userId: { type: 'string', description: 'Only include one assigned/sending user' },
            userIds: { type: 'array', items: { type: 'string' }, description: 'Only include these assigned/sending users' },
            includeSamples: { type: 'boolean', description: 'Include up to three sample email previews per seller', default: true },
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
      {
        name: 'get_pipeline_activity_by_user',
        description: 'Build a sales and pipeline report grouped by assigned user, including opportunity counts, values, statuses, stages, and samples.',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: { type: 'string', description: 'Location ID' },
            startDate: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
            endDate: { type: 'string', description: 'End date (YYYY-MM-DD)' },
            pipelineId: { type: 'string', description: 'Filter by pipeline ID' },
            status: { type: 'string', enum: ['open', 'won', 'lost', 'abandoned', 'all'], description: 'Opportunity status filter', default: 'all' },
            userId: { type: 'string', description: 'Only include one assigned user' },
            userIds: { type: 'array', items: { type: 'string' }, description: 'Only include these assigned users' },
            limit: { type: 'number', description: 'Opportunities to scan (1-100, default 100)', minimum: 1, maximum: 100 },
            startAfterId: { type: 'string', description: 'Pagination cursor/id returned by HighLevel' },
            includeSamples: { type: 'boolean', description: 'Include up to three sample opportunities per user', default: true },
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
      {
        name: 'get_contact_ownership_report',
        description: 'Build a contacts-by-user report showing how many contacts are assigned to each user, plus email/phone coverage and samples.',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: { type: 'string', description: 'Location ID' },
            query: { type: 'string', description: 'Optional contact search query' },
            userId: { type: 'string', description: 'Only include one assigned/owner user' },
            userIds: { type: 'array', items: { type: 'string' }, description: 'Only include these assigned/owner users' },
            limit: { type: 'number', description: 'Contacts to scan (1-100, default 100)', minimum: 1, maximum: 100 },
            startAfterId: { type: 'string', description: 'Pagination cursor/id returned by HighLevel' },
            startAfter: { type: 'number', description: 'Pagination timestamp returned by HighLevel' },
            includeSamples: { type: 'boolean', description: 'Include up to three sample contacts per owner', default: true },
          },
          required: []
        },
        _meta: {
          labels: {
            category: "analytics",
            access: "read",
            complexity: "batch"
          }
        }
      },
      {
        name: 'get_user_business_report',
        description: 'Build a complete business performance report by user combining pipeline/sales, contacts, SMS, WhatsApp, email, and calls.',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: { type: 'string', description: 'Location ID' },
            startDate: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
            endDate: { type: 'string', description: 'End date (YYYY-MM-DD)' },
            pipelineId: { type: 'string', description: 'Filter sales metrics by pipeline ID' },
            status: { type: 'string', enum: ['open', 'won', 'lost', 'abandoned', 'all'], description: 'Pipeline status filter', default: 'all' },
            userId: { type: 'string', description: 'Only include one user' },
            userIds: { type: 'array', items: { type: 'string' }, description: 'Only include these users' },
            limitPerDataset: { type: 'number', description: 'Records to scan per dataset (10-500, default 100)', minimum: 10, maximum: 500 },
            includeSamples: { type: 'boolean', description: 'Include sample records in each section', default: true },
          },
          required: ['startDate', 'endDate']
        },
        _meta: {
          labels: {
            category: "analytics",
            access: "read",
            complexity: "workflow"
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
      case 'get_sms_activity_by_user': {
        return this.buildMessageActivityByUser({ ...args, channel: 'SMS' }, locationId, {
          source: 'conversations_export_sms',
        });
      }
      case 'get_call_activity_by_user': {
        return this.buildMessageActivityByUser({ ...args, channel: 'Call' }, locationId, {
          source: 'conversations_export_calls',
        });
      }
      case 'get_whatsapp_activity_by_user': {
        return this.buildMessageActivityByUser({ ...args, channel: 'WhatsApp' }, locationId, {
          source: 'conversations_export_whatsapp',
        });
      }
      case 'get_email_activity_by_user': {
        return this.buildMessageActivityByUser({ ...args, channel: 'Email' }, locationId, {
          source: 'conversations_export_email',
        });
      }
      case 'get_pipeline_activity_by_user': {
        return this.buildPipelineActivityByUser(args, locationId);
      }
      case 'get_contact_ownership_report': {
        return this.buildContactOwnershipReport(args, locationId);
      }
      case 'get_user_business_report': {
        return this.buildUserBusinessReport(args, locationId);
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
    meta: JsonRecord,
    preloadedUsers?: UserInfo[]
  ): Promise<unknown> {
    const params = new URLSearchParams();
    const channel = stringArg(args.channel) || 'SMS';
    const limit = clampNumber(args.limit, 100, 10, 500);
    const filterUserIds = userFilter(args);

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
      preloadedUsers ? Promise.resolve(preloadedUsers) : this.loadUsers(locationId),
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
      if (!matchesUserFilter(filterUserIds, userId)) continue;
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

  private async buildPipelineActivityByUser(
    args: Record<string, unknown>,
    locationId: string,
    preloadedUsers?: UserInfo[]
  ): Promise<unknown> {
    const limit = clampNumber(args.limit, 100, 1, 100);
    const includeSamples = args.includeSamples !== false;
    const filterUserIds = userFilter(args);
    const [opportunitiesResponse, users] = await Promise.all([
      this.fetchOpportunities(args, locationId, limit),
      preloadedUsers ? Promise.resolve(preloadedUsers) : this.loadUsers(locationId),
    ]);
    const data = (opportunitiesResponse as JsonRecord).data ?? opportunitiesResponse;
    const opportunities = firstArray(data, ['opportunities', 'data.opportunities', 'data', 'items', 'records', 'results'])
      .filter((item) => isWithinRange(item, args, ['createdAt', 'created_at', 'dateAdded', 'updatedAt', 'updated_at']));
    const userMap = new Map(users.map((user) => [user.id, user]));
    const byUser = new Map<string, JsonRecord>();
    const totals = {
      opportunities: 0,
      value: 0,
      open: 0,
      won: 0,
      lost: 0,
      abandoned: 0,
      unknownStatus: 0,
    };

    for (const item of opportunities) {
      const opportunity = isRecord(item) ? item : {};
      const userId = firstString(opportunity, [
        'assignedTo',
        'assignedTo.id',
        'assigned_to',
        'assignedUserId',
        'ownerId',
        'userId',
        'contact.assignedTo',
        'contact.assignedTo.id',
      ]) || 'unassigned';
      if (!matchesUserFilter(filterUserIds, userId)) continue;
      const user = userMap.get(userId);
      const userName = user?.name || firstString(opportunity, [
        'assignedTo.name',
        'assignedUserName',
        'owner.name',
        'user.name',
      ]) || (userId === 'unassigned' ? 'Sin vendedor/usuario asignado' : userId);
      const bucket = getOrCreatePipelineBucket(byUser, userId, userName, user?.email);
      const value = numberFrom(opportunity, ['monetaryValue', 'value', 'amount', 'opportunityValue', 'pipelineValue']);
      const status = normalizeOpportunityStatus(firstString(opportunity, ['status', 'opportunityStatus', 'state']));
      const stageName = firstString(opportunity, ['pipelineStageName', 'stageName', 'stage.name', 'pipelineStage.name', 'pipeline_stage.name']) || 'Sin etapa';
      const pipelineName = firstString(opportunity, ['pipelineName', 'pipeline.name']) || firstString(opportunity, ['pipelineId', 'pipeline.id']) || 'Sin pipeline';

      bucket.totalOpportunities++;
      bucket.totalValue += value;
      bucket.stageCounts[stageName] = (bucket.stageCounts[stageName] || 0) + 1;
      bucket.pipelineCounts[pipelineName] = (bucket.pipelineCounts[pipelineName] || 0) + 1;
      totals.opportunities++;
      totals.value += value;

      if (status === 'open') {
        bucket.open++;
        totals.open++;
      } else if (status === 'won') {
        bucket.won++;
        totals.won++;
      } else if (status === 'lost') {
        bucket.lost++;
        totals.lost++;
      } else if (status === 'abandoned') {
        bucket.abandoned++;
        totals.abandoned++;
      } else {
        bucket.unknownStatus++;
        totals.unknownStatus++;
      }

      if (includeSamples && bucket.samples.length < 3) {
        bucket.samples.push({
          id: firstString(opportunity, ['id', 'opportunityId', '_id']),
          name: firstString(opportunity, ['name', 'title']),
          status,
          value,
          pipelineId: firstString(opportunity, ['pipelineId', 'pipeline.id']),
          pipelineName,
          stageId: firstString(opportunity, ['pipelineStageId', 'stageId', 'pipelineStage.id']),
          stageName,
          contactId: firstString(opportunity, ['contactId', 'contact.id']),
          createdAt: firstString(opportunity, ['createdAt', 'created_at', 'dateAdded']),
          updatedAt: firstString(opportunity, ['updatedAt', 'updated_at']),
        });
      }
    }

    const usersReport = [...byUser.values()].sort((a, b) => b.totalOpportunities - a.totalOpportunities);

    return {
      success: true,
      source: 'opportunities_search',
      locationId,
      dateRange: {
        startDate: args.startDate,
        endDate: args.endDate,
      },
      scannedOpportunities: opportunities.length,
      limit,
      nextCursor: firstString(data, ['nextCursor', 'meta.nextCursor', 'pagination.nextCursor', 'startAfterId']),
      totals,
      users: usersReport,
      notes: [
        'Pipeline reporting is built from HighLevel opportunity search and grouped by assigned user fields when present.',
        'Opportunities without an assigned user field are grouped as unassigned.',
      ],
    };
  }

  private async buildContactOwnershipReport(
    args: Record<string, unknown>,
    locationId: string,
    preloadedUsers?: UserInfo[]
  ): Promise<unknown> {
    const limit = clampNumber(args.limit, 100, 1, 100);
    const includeSamples = args.includeSamples !== false;
    const filterUserIds = userFilter(args);
    const [contactsResponse, users] = await Promise.all([
      this.fetchContacts(args, locationId, limit),
      preloadedUsers ? Promise.resolve(preloadedUsers) : this.loadUsers(locationId),
    ]);
    const data = (contactsResponse as JsonRecord).data ?? contactsResponse;
    const contacts = firstArray(data, ['contacts', 'data.contacts', 'data', 'items', 'records', 'results']);
    const userMap = new Map(users.map((user) => [user.id, user]));
    const byUser = new Map<string, JsonRecord>();
    const totals = {
      contacts: 0,
      withEmail: 0,
      withPhone: 0,
      unassigned: 0,
    };

    for (const item of contacts) {
      const contact = isRecord(item) ? item : {};
      const userId = firstString(contact, [
        'assignedTo',
        'assignedTo.id',
        'assigned_to',
        'assignedUserId',
        'ownerId',
        'owner.id',
        'userId',
        'contactOwner',
        'contactOwner.id',
      ]) || 'unassigned';
      if (!matchesUserFilter(filterUserIds, userId)) continue;
      const user = userMap.get(userId);
      const userName = user?.name || firstString(contact, [
        'assignedTo.name',
        'assignedUserName',
        'owner.name',
        'contactOwner.name',
      ]) || (userId === 'unassigned' ? 'Sin vendedor/usuario asignado' : userId);
      const bucket = getOrCreateContactBucket(byUser, userId, userName, user?.email);
      const email = firstString(contact, ['email', 'primaryEmail']);
      const phone = firstString(contact, ['phone', 'primaryPhone', 'phoneNumber']);

      bucket.totalContacts++;
      totals.contacts++;
      if (email) {
        bucket.withEmail++;
        totals.withEmail++;
      }
      if (phone) {
        bucket.withPhone++;
        totals.withPhone++;
      }
      if (userId === 'unassigned') totals.unassigned++;

      if (includeSamples && bucket.samples.length < 3) {
        bucket.samples.push({
          id: firstString(contact, ['id', 'contactId', '_id']),
          name: [firstString(contact, ['firstName']), firstString(contact, ['lastName'])].filter(Boolean).join(' ') ||
            firstString(contact, ['name', 'fullName']),
          email,
          phone,
          createdAt: firstString(contact, ['createdAt', 'created_at', 'dateAdded']),
          updatedAt: firstString(contact, ['updatedAt', 'updated_at']),
        });
      }
    }

    return {
      success: true,
      source: 'contacts',
      locationId,
      scannedContacts: contacts.length,
      limit,
      nextCursor: firstString(data, ['nextCursor', 'meta.nextCursor', 'pagination.nextCursor', 'startAfterId']),
      totals,
      owners: [...byUser.values()].sort((a, b) => b.totalContacts - a.totalContacts),
      notes: [
        'Contact ownership is built from HighLevel contact listing/search and grouped by assigned/owner user fields when present.',
        'Contacts without an assigned user field are grouped as unassigned.',
      ],
    };
  }

  private async buildUserBusinessReport(
    args: Record<string, unknown>,
    locationId: string
  ): Promise<unknown> {
    const limit = clampNumber(args.limitPerDataset ?? args.limit, 100, 10, 500);
    const users = await this.loadUsers(locationId);
    const commonArgs = {
      ...args,
      limit,
      includeSamples: args.includeSamples,
    };

    const [pipeline, contacts, sms, whatsapp, email, calls] = await Promise.all([
      this.buildPipelineActivityByUser({ ...commonArgs, limit: Math.min(limit, 100) }, locationId, users),
      this.buildContactOwnershipReport({ ...commonArgs, limit: Math.min(limit, 100) }, locationId, users),
      this.buildMessageActivityByUser({ ...commonArgs, channel: 'SMS' }, locationId, { source: 'business_report_sms' }, users),
      this.buildMessageActivityByUser({ ...commonArgs, channel: 'WhatsApp' }, locationId, { source: 'business_report_whatsapp' }, users),
      this.buildMessageActivityByUser({ ...commonArgs, channel: 'Email' }, locationId, { source: 'business_report_email' }, users),
      this.buildMessageActivityByUser({ ...commonArgs, channel: 'Call' }, locationId, { source: 'business_report_calls' }, users),
    ]) as JsonRecord[];

    const byUser = new Map<string, JsonRecord>();
    const filterUserIds = userFilter(args);
    for (const user of users) {
      if (matchesUserFilter(filterUserIds, user.id)) {
        getOrCreateBusinessBucket(byUser, user.id, user.name, user.email);
      }
    }

    for (const bucket of firstArray(pipeline, ['users'])) {
      const summary = getOrCreateBusinessBucket(byUser, bucket.userId, bucket.userName, bucket.email);
      summary.pipeline = pickPipelineMetrics(bucket);
    }
    for (const bucket of firstArray(contacts, ['owners'])) {
      const summary = getOrCreateBusinessBucket(byUser, bucket.userId, bucket.userName, bucket.email);
      summary.contacts = pickContactMetrics(bucket);
    }
    for (const bucket of firstArray(sms, ['sellers'])) {
      const summary = getOrCreateBusinessBucket(byUser, bucket.userId, bucket.userName, bucket.email);
      summary.sms = pickMessageMetrics(bucket);
    }
    for (const bucket of firstArray(whatsapp, ['sellers'])) {
      const summary = getOrCreateBusinessBucket(byUser, bucket.userId, bucket.userName, bucket.email);
      summary.whatsapp = pickMessageMetrics(bucket);
    }
    for (const bucket of firstArray(email, ['sellers'])) {
      const summary = getOrCreateBusinessBucket(byUser, bucket.userId, bucket.userName, bucket.email);
      summary.email = pickMessageMetrics(bucket);
    }
    for (const bucket of firstArray(calls, ['sellers'])) {
      const summary = getOrCreateBusinessBucket(byUser, bucket.userId, bucket.userName, bucket.email);
      summary.calls = pickMessageMetrics(bucket);
    }

    const userReports = [...byUser.values()]
      .map((summary) => ({
        ...summary,
        activityScore:
          summary.contacts.totalContacts +
          summary.pipeline.totalOpportunities +
          summary.sms.totalMessages +
          summary.whatsapp.totalMessages +
          summary.email.totalMessages +
          summary.calls.totalMessages,
      }))
      .filter((summary) => summary.activityScore > 0 || summary.userId !== 'unassigned')
      .sort((a, b) => b.activityScore - a.activityScore);

    return {
      success: true,
      source: 'business_report_composite',
      locationId,
      dateRange: {
        startDate: args.startDate,
        endDate: args.endDate,
      },
      limitPerDataset: limit,
      totals: {
        pipeline: pipeline.totals,
        contacts: contacts.totals,
        sms: sms.totals,
        whatsapp: whatsapp.totals,
        email: email.totals,
        calls: calls.totals,
      },
      users: userReports,
      datasets: {
        pipeline: {
          scanned: pipeline.scannedOpportunities,
          nextCursor: pipeline.nextCursor,
        },
        contacts: {
          scanned: contacts.scannedContacts,
          nextCursor: contacts.nextCursor,
        },
        sms: {
          scanned: sms.scannedMessages,
          nextCursor: sms.nextCursor,
        },
        whatsapp: {
          scanned: whatsapp.scannedMessages,
          nextCursor: whatsapp.nextCursor,
        },
        email: {
          scanned: email.scannedMessages,
          nextCursor: email.nextCursor,
        },
        calls: {
          scanned: calls.scannedMessages,
          nextCursor: calls.nextCursor,
        },
      },
      notes: [
        'This composite report combines HighLevel opportunities, contacts, and exported conversation messages.',
        'Use the specialized report tools when an agent needs deeper pagination or channel-specific samples.',
      ],
    };
  }

  private async fetchOpportunities(
    args: Record<string, unknown>,
    locationId: string,
    limit: number
  ): Promise<unknown> {
    const body: JsonRecord = {
      location_id: locationId,
      limit,
    };
    const status = stringArg(args.status);
    if (args.pipelineId) body.pipeline_id = String(args.pipelineId);
    if (args.userId) body.assigned_to = String(args.userId);
    if (status && status !== 'all') body.status = status;
    if (args.startAfterId) body.startAfterId = String(args.startAfterId);
    if (args.startDate) body.startDate = String(args.startDate);
    if (args.endDate) body.endDate = String(args.endDate);

    try {
      return await this.ghlClient.makeRequest('POST', '/opportunities/search', body, { version: '2021-07-28' });
    } catch (error) {
      const params = new URLSearchParams();
      params.append('location_id', locationId);
      params.append('limit', String(limit));
      if (args.pipelineId) params.append('pipeline_id', String(args.pipelineId));
      if (args.userId) params.append('assigned_to', String(args.userId));
      if (status && status !== 'all') params.append('status', status);
      if (args.startAfterId) params.append('startAfterId', String(args.startAfterId));
      if (args.startDate) params.append('startDate', String(args.startDate));
      if (args.endDate) params.append('endDate', String(args.endDate));
      return this.ghlClient.makeRequest('GET', `/opportunities/search?${params.toString()}`);
    }
  }

  private async fetchContacts(
    args: Record<string, unknown>,
    locationId: string,
    limit: number
  ): Promise<unknown> {
    const params = new URLSearchParams();
    params.append('locationId', locationId);
    params.append('limit', String(limit));
    if (args.query) params.append('query', String(args.query));
    if (args.startAfterId) params.append('startAfterId', String(args.startAfterId));
    if (args.startAfter) params.append('startAfter', String(args.startAfter));

    try {
      return await this.ghlClient.makeRequest('GET', `/contacts/?${params.toString()}`, undefined, { version: '2021-07-28' });
    } catch (error) {
      const body: JsonRecord = {
        locationId,
        pageLimit: limit,
      };
      if (args.query) body.query = String(args.query);
      if (args.startAfterId) body.startAfterId = String(args.startAfterId);
      if (args.startAfter) body.startAfter = Number(args.startAfter);
      return this.ghlClient.makeRequest('POST', '/contacts/search', body);
    }
  }

  private async loadUsers(locationId: string): Promise<UserInfo[]> {
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

function getOrCreatePipelineBucket(
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
    totalOpportunities: 0,
    totalValue: 0,
    open: 0,
    won: 0,
    lost: 0,
    abandoned: 0,
    unknownStatus: 0,
    stageCounts: {} as JsonRecord,
    pipelineCounts: {} as JsonRecord,
    samples: [] as JsonRecord[],
  };
  buckets.set(userId, bucket);
  return bucket;
}

function getOrCreateContactBucket(
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
    totalContacts: 0,
    withEmail: 0,
    withPhone: 0,
    samples: [] as JsonRecord[],
  };
  buckets.set(userId, bucket);
  return bucket;
}

function getOrCreateBusinessBucket(
  buckets: Map<string, JsonRecord>,
  userId: string,
  userName: string,
  userEmail?: string
): JsonRecord {
  const existing = buckets.get(userId);
  if (existing) {
    if (!existing.userEmail && userEmail) existing.userEmail = userEmail;
    return existing;
  }
  const bucket = {
    userId,
    userName,
    userEmail,
    contacts: emptyContactMetrics(),
    pipeline: emptyPipelineMetrics(),
    sms: emptyMessageMetrics(),
    whatsapp: emptyMessageMetrics(),
    email: emptyMessageMetrics(),
    calls: emptyMessageMetrics(),
  };
  buckets.set(userId, bucket);
  return bucket;
}

function emptyContactMetrics(): JsonRecord {
  return {
    totalContacts: 0,
    withEmail: 0,
    withPhone: 0,
    samples: [] as JsonRecord[],
  };
}

function emptyPipelineMetrics(): JsonRecord {
  return {
    totalOpportunities: 0,
    totalValue: 0,
    open: 0,
    won: 0,
    lost: 0,
    abandoned: 0,
    unknownStatus: 0,
    stageCounts: {} as JsonRecord,
    pipelineCounts: {} as JsonRecord,
    samples: [] as JsonRecord[],
  };
}

function emptyMessageMetrics(): JsonRecord {
  return {
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
}

function pickContactMetrics(bucket: JsonRecord): JsonRecord {
  return {
    totalContacts: bucket.totalContacts || 0,
    withEmail: bucket.withEmail || 0,
    withPhone: bucket.withPhone || 0,
    samples: bucket.samples || [],
  };
}

function pickPipelineMetrics(bucket: JsonRecord): JsonRecord {
  return {
    totalOpportunities: bucket.totalOpportunities || 0,
    totalValue: bucket.totalValue || 0,
    open: bucket.open || 0,
    won: bucket.won || 0,
    lost: bucket.lost || 0,
    abandoned: bucket.abandoned || 0,
    unknownStatus: bucket.unknownStatus || 0,
    stageCounts: bucket.stageCounts || {},
    pipelineCounts: bucket.pipelineCounts || {},
    samples: bucket.samples || [],
  };
}

function pickMessageMetrics(bucket: JsonRecord): JsonRecord {
  return {
    totalMessages: bucket.totalMessages || 0,
    outbound: bucket.outbound || 0,
    inbound: bucket.inbound || 0,
    unknownDirection: bucket.unknownDirection || 0,
    sms: bucket.sms || 0,
    email: bucket.email || 0,
    whatsapp: bucket.whatsapp || 0,
    call: bucket.call || 0,
    other: bucket.other || 0,
    delivered: bucket.delivered || 0,
    failed: bucket.failed || 0,
    samples: bucket.samples || [],
  };
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

function normalizeOpportunityStatus(value: string): string {
  const normalized = value.toLowerCase();
  if (normalized.includes('won')) return 'won';
  if (normalized.includes('lost')) return 'lost';
  if (normalized.includes('abandon')) return 'abandoned';
  if (normalized.includes('open')) return 'open';
  return normalized || 'unknown';
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

function numberFrom(root: unknown, paths: string[]): number {
  for (const path of paths) {
    const value = readPath(root, path);
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value.replace(/[^0-9.-]/g, ''));
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return 0;
}

function userFilter(args: Record<string, unknown>): Set<string> | undefined {
  const ids = new Set<string>();
  const userId = stringArg(args.userId);
  if (userId) ids.add(userId);
  if (Array.isArray(args.userIds)) {
    for (const value of args.userIds) {
      const id = stringArg(value);
      if (id) ids.add(id);
    }
  }
  return ids.size ? ids : undefined;
}

function matchesUserFilter(filterUserIds: Set<string> | undefined, userId: string): boolean {
  return !filterUserIds || filterUserIds.has(userId);
}

function isWithinRange(record: JsonRecord, args: Record<string, unknown>, datePaths: string[]): boolean {
  const startDate = stringArg(args.startDate);
  const endDate = stringArg(args.endDate);
  if (!startDate && !endDate) return true;
  const rawDate = firstString(record, datePaths);
  if (!rawDate) return true;
  const time = Date.parse(rawDate);
  if (!Number.isFinite(time)) return true;
  if (startDate) {
    const start = Date.parse(startDate);
    if (Number.isFinite(start) && time < start) return false;
  }
  if (endDate) {
    const end = Date.parse(endDate.includes('T') ? endDate : `${endDate}T23:59:59.999Z`);
    if (Number.isFinite(end) && time > end) return false;
  }
  return true;
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
