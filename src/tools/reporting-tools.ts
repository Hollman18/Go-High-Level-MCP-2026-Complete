/**
 * GoHighLevel Reporting/Analytics Tools
 * Tools for accessing reports and analytics
 */

import { GHLApiClient } from '../clients/ghl-api-client.js';

type JsonRecord = Record<string, any>;
type UserInfo = { id: string; name: string; email?: string };
type DateWindow = { start?: number; end?: number };

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
        name: 'generate_historical_activity_report',
        description: 'Generate a complete historical activity report with automatic pagination across calls, SMS, WhatsApp, email, or all exported conversation activity. Returns executive totals, seller/leader rollups, cursor diagnostics, and optional detail/CSV rows.',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: { type: 'string', description: 'Location ID' },
            startDate: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
            endDate: { type: 'string', description: 'End date (YYYY-MM-DD)' },
            channel: { type: 'string', enum: ['SMS', 'Email', 'WhatsApp', 'Call', 'all'], description: 'Single channel to scan. Defaults to all.' },
            channels: { type: 'array', items: { type: 'string', enum: ['SMS', 'Email', 'WhatsApp', 'Call'] }, description: 'Optional list of channels to scan separately. Ignored when channel is all.' },
            pageLimit: { type: 'number', description: 'Records per HighLevel page (10-500, default 500)', minimum: 10, maximum: 500 },
            maxPages: { type: 'number', description: 'Safety cap for API pages to scan (1-200, default 50)', minimum: 1, maximum: 200 },
            maxRecords: { type: 'number', description: 'Safety cap for total records to scan (100-100000, default 25000)', minimum: 100, maximum: 100000 },
            cursor: { type: 'string', description: 'Optional starting cursor for continuing a previous export' },
            userId: { type: 'string', description: 'Only include one assigned/sending user' },
            userIds: { type: 'array', items: { type: 'string' }, description: 'Only include these assigned/sending users' },
            leaderMap: { type: 'object', description: 'Optional mapping of userId to leader/manager name or ID for leader rollups' },
            leaderField: { type: 'string', description: 'Optional record path to read leader/manager from exported records, e.g. assignedTo.managerName' },
            includeDetails: { type: 'boolean', description: 'Return detailed activity rows. Defaults to false to keep agent responses small.', default: false },
            maxDetailRows: { type: 'number', description: 'Maximum detailed rows to return when includeDetails is true (10-5000, default 500)', minimum: 10, maximum: 5000 },
            includeCsv: { type: 'boolean', description: 'Include CSV strings for summary and returned detail rows', default: false },
            includeSamples: { type: 'boolean', description: 'Include up to three activity samples per seller and leader', default: true },
          },
          required: ['startDate', 'endDate']
        },
        _meta: {
          labels: {
            category: "analytics",
            access: "read",
            complexity: "workflow",
            source: "historical-export"
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
            complexity: "workflow",
            source: "curated-business-report",
            stability: "legacy-compatible"
          }
        }
      },
      {
        name: 'get_saas_subscription_report',
        description: 'Build a SaaS subscription sales report for closers, setters, sales leaders, and management, including pipeline, calls, SMS, WhatsApp, email, contacts, and SaaS KPI use cases.',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: { type: 'string', description: 'Location ID' },
            startDate: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
            endDate: { type: 'string', description: 'End date (YYYY-MM-DD)' },
            pipelineId: { type: 'string', description: 'Filter sales metrics by SaaS pipeline ID' },
            status: { type: 'string', enum: ['open', 'won', 'lost', 'abandoned', 'all'], description: 'Pipeline status filter', default: 'all' },
            userId: { type: 'string', description: 'Only include one user' },
            userIds: { type: 'array', items: { type: 'string' }, description: 'Only include these users' },
            limitPerDataset: { type: 'number', description: 'Records to scan per dataset (10-500, default 100)', minimum: 10, maximum: 500 },
            includeSamples: { type: 'boolean', description: 'Include sample records in each section', default: true },
            includeUseCaseMap: { type: 'boolean', description: 'Include the full SaaS reporting use-case map', default: true },
          },
          required: ['startDate', 'endDate']
        },
        _meta: {
          labels: {
            category: "analytics",
            access: "read",
            complexity: "workflow",
            source: "curated-business-report",
            stability: "legacy-compatible"
          }
        }
      },
      {
        name: 'get_value_ladder_info_product_report',
        description: 'Build a Value Ladder info-product sales report for masterclass/webinar, workshop, lead magnet, entry offer, and high-ticket pipelines with seller, sales leader, and management views.',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: { type: 'string', description: 'Location ID' },
            startDate: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
            endDate: { type: 'string', description: 'End date (YYYY-MM-DD)' },
            pipelineId: { type: 'string', description: 'Filter sales metrics by Value Ladder pipeline ID' },
            status: { type: 'string', enum: ['open', 'won', 'lost', 'abandoned', 'all'], description: 'Pipeline status filter', default: 'all' },
            userId: { type: 'string', description: 'Only include one user' },
            userIds: { type: 'array', items: { type: 'string' }, description: 'Only include these users' },
            limitPerDataset: { type: 'number', description: 'Records to scan per dataset (10-500, default 100)', minimum: 10, maximum: 500 },
            includeSamples: { type: 'boolean', description: 'Include sample records in each section', default: true },
            includeUseCaseMap: { type: 'boolean', description: 'Include the full Value Ladder reporting use-case map', default: true },
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
      case 'generate_historical_activity_report': {
        return this.buildHistoricalActivityReport(args, locationId);
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
      case 'get_saas_subscription_report': {
        return this.buildVerticalBusinessReport(args, locationId, SAAS_SUBSCRIPTION_REPORT_MODEL);
      }
      case 'get_value_ladder_info_product_report': {
        return this.buildVerticalBusinessReport(args, locationId, VALUE_LADDER_REPORT_MODEL);
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
      effective: 0,
      nonEffective: 0,
      delivered: 0,
      failed: 0,
      periods: emptyActivityPeriods(),
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
      const date = firstString(message, ['date', 'createdAt', 'created_at', 'dateAdded']);
      const effectiveness = classifyEffectiveness(status, messageChannel);

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
      if (effectiveness === 'effective') {
        bucket.effective++;
        totals.effective++;
      } else if (effectiveness === 'nonEffective') {
        bucket.nonEffective++;
        totals.nonEffective++;
      }
      incrementActivityPeriods(bucket.periods, date, messageChannel, direction, effectiveness);
      incrementActivityPeriods(totals.periods, date, messageChannel, direction, effectiveness);

      if (includeSamples && bucket.samples.length < 3) {
        bucket.samples.push({
          id: firstString(message, ['id', 'messageId', '_id']),
          date,
          channel: messageChannel,
          direction,
          status: status || undefined,
          effectiveness,
          contactId: firstString(message, ['contactId', 'contact.id']),
          conversationId: firstString(message, ['conversationId', 'conversation.id']),
          preview: preview(firstString(message, ['body', 'message', 'text', 'content', 'lastMessageBody']) || ''),
        });
      }
    }

    const sellers = [...byUser.values()].sort((a, b) => b.totalMessages - a.totalMessages);
    for (const seller of sellers) seller.averages = buildPeriodAverages(seller.periods);
    const averages = buildPeriodAverages(totals.periods);
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
      averages,
      sellers,
      notes: [
        'This report is built from the official conversations messages export endpoint, not from /reporting/sms.',
        'Grouping depends on user/seller fields returned by HighLevel for each exported message. Messages without a user field are grouped as unassigned.',
      ],
    };
  }

  private async buildHistoricalActivityReport(
    args: Record<string, unknown>,
    locationId: string
  ): Promise<unknown> {
    const pageLimit = clampNumber(args.pageLimit ?? args.limit, 500, 10, 500);
    const maxPages = clampNumber(args.maxPages, 50, 1, 200);
    const maxRecords = clampNumber(args.maxRecords, 25000, 100, 100000);
    const maxDetailRows = clampNumber(args.maxDetailRows, 500, 10, 5000);
    const includeDetails = args.includeDetails === true;
    const includeCsv = args.includeCsv === true;
    const includeSamples = args.includeSamples !== false;
    const filterUserIds = userFilter(args);
    const users = await this.loadUsers(locationId);
    const userMap = new Map(users.map((user) => [user.id, user]));
    const channels = historicalChannels(args);
    const totals = emptyHistoricalMetrics();
    const byUser = new Map<string, JsonRecord>();
    const byLeader = new Map<string, JsonRecord>();
    const details: JsonRecord[] = [];
    const progress: JsonRecord[] = [];
    const leaderMap = isRecord(args.leaderMap) ? args.leaderMap : {};
    const leaderField = stringArg(args.leaderField);
    const dateWindow = buildDateWindow(args);
    const startedAt = new Date().toISOString();
    let scannedRecords = 0;
    let matchedRecords = 0;
    let skippedBeforeRange = 0;
    let skippedAfterRange = 0;
    let undatedRecords = 0;
    let reachedRecordsOlderThanStart = false;
    let stoppedBySafetyLimit = false;

    for (const channel of channels) {
      let cursor = stringArg(args.cursor);
      const seenCursors = new Set<string>();

      for (let page = 1; page <= maxPages; page++) {
        if (scannedRecords >= maxRecords) {
          stoppedBySafetyLimit = true;
          break;
        }

        const pageData = await this.fetchHistoricalMessagePage({
          locationId,
          channel,
          startDate: stringArg(args.startDate),
          endDate: stringArg(args.endDate),
          cursor,
          limit: Math.min(pageLimit, maxRecords - scannedRecords),
        });
        const messages = pageData.messages;
        scannedRecords += messages.length;
        let pageMatchedRecords = 0;
        let pageSkippedBeforeRange = 0;
        let pageSkippedAfterRange = 0;
        let pageUndatedRecords = 0;
        let pageReachedRecordsOlderThanStart = false;

        for (const item of messages) {
          if (scannedRecords > maxRecords) {
            stoppedBySafetyLimit = true;
            break;
          }
          const message = isRecord(item) ? item : {};
          const normalized = normalizeHistoricalRecord(message, channel, userMap, leaderMap, leaderField);
          const datePosition = classifyDatePosition(normalized.date, dateWindow);
          if (datePosition === 'undated') {
            undatedRecords++;
            pageUndatedRecords++;
          } else if (datePosition === 'before') {
            skippedBeforeRange++;
            pageSkippedBeforeRange++;
            pageReachedRecordsOlderThanStart = true;
            continue;
          } else if (datePosition === 'after') {
            skippedAfterRange++;
            pageSkippedAfterRange++;
            continue;
          }
          if (!matchesUserFilter(filterUserIds, normalized.userId)) continue;
          matchedRecords++;
          pageMatchedRecords++;
          addHistoricalRecord(totals, normalized, includeSamples);
          addHistoricalRecord(
            getOrCreateHistoricalBucket(byUser, normalized.userId, normalized.userName, normalized.userEmail),
            normalized,
            includeSamples
          );
          addHistoricalRecord(
            getOrCreateHistoricalBucket(byLeader, normalized.leaderId, normalized.leaderName),
            normalized,
            includeSamples
          );
          if (includeDetails && details.length < maxDetailRows) details.push(normalized.detail);
        }

        const nextCursor = pageData.nextCursor;
        progress.push({
          channel,
          page,
          scanned: messages.length,
          matched: pageMatchedRecords,
          skippedBeforeRange: pageSkippedBeforeRange,
          skippedAfterRange: pageSkippedAfterRange,
          undated: pageUndatedRecords,
          cursorUsed: cursor,
          nextCursor,
        });

        if (pageReachedRecordsOlderThanStart) {
          reachedRecordsOlderThanStart = true;
          cursor = nextCursor;
          break;
        }
        if (!nextCursor || messages.length === 0 || seenCursors.has(nextCursor)) {
          cursor = nextCursor;
          break;
        }
        seenCursors.add(nextCursor);
        cursor = nextCursor;
      }

      if (stoppedBySafetyLimit) break;
    }

    const sellers = [...byUser.values()].map(finalizeHistoricalMetrics).sort((a, b) => b.totalRecords - a.totalRecords);
    const leaders = [...byLeader.values()].map(finalizeHistoricalMetrics).sort((a, b) => b.totalRecords - a.totalRecords);
    const summaryRows = sellers.map((seller) => historicalSummaryRow(seller));
    const finalizedTotals = finalizeHistoricalMetrics(totals);

    return {
      success: true,
      source: 'historical_conversations_export',
      locationId,
      dateRange: {
        startDate: args.startDate,
        endDate: args.endDate,
      },
      channels,
      limits: {
        pageLimit,
        maxPages,
        maxRecords,
        maxDetailRows: includeDetails ? maxDetailRows : 0,
      },
      scannedRecords,
      matchedRecords,
      skippedRecords: {
        beforeDateRange: skippedBeforeRange,
        afterDateRange: skippedAfterRange,
        undated: undatedRecords,
      },
      stoppedBySafetyLimit,
      completed: !stoppedBySafetyLimit,
      generatedAt: new Date().toISOString(),
      runtime: {
        startedAt,
        completedAt: new Date().toISOString(),
      },
      totals: finalizedTotals,
      sellers,
      leaders,
      details: includeDetails ? details : undefined,
      exports: includeCsv ? {
        summaryCsv: toCsv(summaryRows),
        detailCsv: includeDetails ? toCsv(details) : undefined,
        returnedDetailRows: details.length,
        detailRowsTruncated: includeDetails && matchedRecords > details.length,
      } : undefined,
      pagination: {
        pagesScanned: progress.length,
        lastCursor: progress.length ? progress[progress.length - 1].nextCursor : undefined,
        reachedRecordsOlderThanStart,
        likelyDateWindowIncomplete: matchedRecords === 0 && scannedRecords > 0 && !stoppedBySafetyLimit && !reachedRecordsOlderThanStart && !progress.some((item) => item.nextCursor),
        progress,
      },
      notes: [
        'This tool automatically paginates HighLevel conversation message exports until the cursor ends or a safety limit is reached.',
        'The MCP applies local date filtering because some HighLevel export surfaces may ignore startDate/endDate query parameters.',
        'For very large accounts, schedule this report in a VPS cron job and store the CSV/JSON output externally instead of asking the agent to print every row.',
        'Leader rollups require leaderMap or leaderField unless HighLevel returns a leader/manager field in the exported activity record.',
      ],
    };
  }

  private async fetchHistoricalMessagePage(options: {
    locationId: string;
    channel: string;
    startDate?: string;
    endDate?: string;
    cursor?: string;
    limit: number;
  }): Promise<{ messages: JsonRecord[]; nextCursor?: string }> {
    const params = new URLSearchParams();
    params.append('locationId', options.locationId);
    params.append('limit', String(options.limit));
    params.append('sortBy', 'createdAt');
    params.append('sortOrder', 'desc');
    if (options.channel !== 'all') params.append('channel', options.channel);
    if (options.startDate) params.append('startDate', options.startDate);
    if (options.endDate) params.append('endDate', options.endDate);
    if (options.cursor) params.append('cursor', options.cursor);

    const response = await this.ghlClient.makeRequest(
      'GET',
      `/conversations/messages/export?${params.toString()}`,
      undefined,
      { version: '2021-04-15' }
    );
    const responseData = (response as JsonRecord).data ?? response;
    return {
      messages: firstArray(responseData, ['messages', 'data.messages', 'data', 'items', 'records', 'results']),
      nextCursor: firstString(responseData, ['nextCursor', 'cursor.next', 'meta.nextCursor', 'pagination.nextCursor']),
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

  private async buildVerticalBusinessReport(
    args: Record<string, unknown>,
    locationId: string,
    reportModel: JsonRecord
  ): Promise<unknown> {
    const businessReport = await this.buildUserBusinessReport(args, locationId) as JsonRecord;
    const includeUseCaseMap = args.includeUseCaseMap !== false;

    return {
      ...businessReport,
      source: reportModel.source,
      reportModel: {
        type: reportModel.type,
        name: reportModel.name,
        audience: reportModel.audience,
        funnelOrRevenueModel: reportModel.funnelOrRevenueModel,
      },
      useCaseMap: includeUseCaseMap ? reportModel.useCaseMap : undefined,
      kpiDefinitions: reportModel.kpiDefinitions,
      roleViews: reportModel.roleViews,
      recommendedPrompts: reportModel.recommendedPrompts,
      notes: [
        ...(businessReport.notes || []),
        ...reportModel.notes,
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

const COMMON_SALES_REPORT_KPIS = [
  'Total activities by user: calls, SMS, WhatsApp, email, and assigned contacts.',
  'Effective vs non-effective communication by channel and user.',
  'Daily, monthly, and yearly totals and averages for calls and messages.',
  'Open, won, lost, abandoned, and unclassified pipeline by seller.',
  'Pipeline value, closed value, stage distribution, and owner distribution.',
  'Unassigned records that require CRM hygiene or routing fixes.',
];

const SAAS_SUBSCRIPTION_REPORT_MODEL: JsonRecord = {
  type: 'saas_subscription',
  name: 'SaaS subscription sales reporting',
  source: 'saas_subscription_report',
  audience: ['setter', 'closer', 'sales_manager', 'executive_management'],
  funnelOrRevenueModel: [
    'lead capture',
    'qualification',
    'demo booked',
    'demo attended',
    'trial or pilot',
    'proposal',
    'closed won subscription',
    'closed lost',
    'expansion or renewal',
  ],
  kpiDefinitions: [
    ...COMMON_SALES_REPORT_KPIS,
    'Setter KPIs: leads contacted, conversations started, demos booked, no-shows, handoff quality, response speed proxy through outbound/inbound mix.',
    'Closer KPIs: demos handled, opportunities won/lost, pipeline value, close rate proxy, follow-up activity, stalled opportunities.',
    'SaaS revenue KPIs: new subscription bookings, pipeline MRR/ARR proxy from opportunity value, renewal or expansion pipeline when stages/tags identify it.',
  ],
  roleViews: {
    seller: [
      'My daily, monthly, and yearly calls, SMS, WhatsApp, and email totals.',
      'My effective vs non-effective calls and messages.',
      'My open pipeline, won opportunities, lost opportunities, and next follow-up workload.',
      'My assigned contacts with and without email/phone coverage.',
      'My activity gaps by day and channel.',
    ],
    salesLeader: [
      'Leaderboard of setters and closers by activity, effective conversations, and pipeline created or closed.',
      'Pipeline health by user, stage, status, and value.',
      'Call, SMS, WhatsApp, and email consistency by day, month, and year.',
      'Users with many activities but low won value, and users with pipeline but low follow-up activity.',
      'Unassigned contacts, messages, and opportunities that need cleanup.',
    ],
    management: [
      'Team production summary by period: activity, pipeline value, won value, and lost value.',
      'SaaS funnel visibility from lead/contact ownership through demo, proposal, closed won, and expansion stages.',
      'Channel productivity: calls vs SMS vs WhatsApp vs email contribution by team and user.',
      'Forecast risk: open pipeline value, stage concentration, and inactive users.',
      'Operational quality: missing ownership, failed messages, non-effective calls, and contact data completeness.',
    ],
  },
  useCaseMap: {
    seller: {
      dailyExecution: [
        'What did I do today by channel?',
        'Which calls or messages were not effective?',
        'Which open opportunities need follow-up?',
        'Which assigned contacts have no email or phone?',
      ],
      pipelineOwnership: [
        'How much open subscription pipeline do I own?',
        'What did I win or lose in this period?',
        'Which stages are overloaded or stalled?',
      ],
    },
    salesLeader: {
      coaching: [
        'Who is calling enough but not generating effective conversations?',
        'Who has low follow-up activity relative to pipeline value?',
        'Which sellers have the best channel mix?',
      ],
      operations: [
        'How many contacts or opportunities are unassigned?',
        'Which users have failed outbound messages?',
        'Where are demos, trials, proposals, and closes concentrated?',
      ],
    },
    management: {
      growth: [
        'How much pipeline and won subscription value exists by user?',
        'Which acquisition channel or communication channel supports sales activity?',
        'What is the team trend by day, month, and year?',
      ],
      risk: [
        'Where is the forecast concentrated?',
        'Which users or stages need intervention?',
        'How much sales activity is non-effective?',
      ],
    },
  },
  recommendedPrompts: [
    'Build a SaaS sales report by closer and setter for this month with calls, SMS, WhatsApp, emails, contacts, and pipeline.',
    'Show effective and non-effective calls by seller and the daily average for the period.',
    'Compare pipeline value and follow-up activity by user for my subscription sales team.',
  ],
  notes: [
    'For SaaS-specific MRR or ARR, map opportunity value/custom fields to subscription value in your CRM conventions.',
    'Setter vs closer segmentation depends on user IDs, teams, pipeline stages, tags, or naming conventions available in HighLevel.',
  ],
};

const VALUE_LADDER_REPORT_MODEL: JsonRecord = {
  type: 'value_ladder_info_product',
  name: 'Value Ladder info-product sales reporting',
  source: 'value_ladder_info_product_report',
  audience: ['setter', 'closer', 'sales_manager', 'executive_management'],
  funnelOrRevenueModel: [
    'lead magnet or entry product',
    'masterclass or webinar registration',
    'masterclass or webinar attended',
    'workshop registration',
    'workshop attended',
    'application submitted',
    'strategy call booked',
    'high-ticket offer',
    'upsell or continuity',
  ],
  kpiDefinitions: [
    ...COMMON_SALES_REPORT_KPIS,
    'Value Ladder KPIs: movement from lead magnet to webinar, workshop, call booking, application, high-ticket close, and upsell.',
    'Setter KPIs: follow-up volume, show-up recovery, applications generated, calls booked, and reactivation activity.',
    'Closer KPIs: high-ticket opportunities owned, won/lost value, objection follow-up activity, and close-stage consistency.',
  ],
  roleViews: {
    seller: [
      'My follow-up activity for webinar, workshop, application, and high-ticket leads.',
      'My effective vs non-effective calls and messages after each ladder step.',
      'My booked calls, open opportunities, won high-ticket deals, and lost opportunities.',
      'My assigned contacts without email/phone data.',
      'My daily and monthly outreach consistency.',
    ],
    salesLeader: [
      'Leaderboard by ladder stage: lead magnet, webinar, workshop, call booked, high-ticket close.',
      'Seller and setter activity after live events or launches.',
      'Channel effectiveness after webinar/workshop follow-up sequences.',
      'Pipeline value by offer, stage, seller, and close status.',
      'No-show, failed contact, and unassigned lead cleanup queues.',
    ],
    management: [
      'Full Value Ladder movement from front-end acquisition to high-ticket revenue.',
      'Team production by event, offer, pipeline stage, seller, and period.',
      'High-ticket forecast and bottlenecks by stage and user.',
      'Channel productivity and non-effective activity across launch windows.',
      'CRM data quality across event leads, applications, contacts, and opportunities.',
    ],
  },
  useCaseMap: {
    seller: {
      launchFollowUp: [
        'Which webinar or workshop leads do I need to follow up with?',
        'How many calls, SMS, WhatsApp, and emails did I send after the event?',
        'Which follow-ups were effective or non-effective?',
      ],
      highTicketPipeline: [
        'How much high-ticket pipeline do I own?',
        'Which applications or booked calls are open?',
        'What did I win or lose during this launch period?',
      ],
    },
    salesLeader: {
      eventPerformance: [
        'Which sellers converted the most event leads into opportunities?',
        'Who followed up consistently after the masterclass or workshop?',
        'Where did leads stop moving through the ladder?',
      ],
      coaching: [
        'Which users have high activity but low booked calls or won value?',
        'Which channels produce the most effective conversations after events?',
        'Which pipeline stages have too much value stuck?',
      ],
    },
    management: {
      revenueStrategy: [
        'How much revenue and pipeline came from each ladder level?',
        'Which event or offer generated the most high-ticket pipeline?',
        'What is the daily, monthly, and yearly trend for launch follow-up activity?',
      ],
      risk: [
        'Where are unassigned or incomplete leads accumulating?',
        'Which users or stages are blocking high-ticket conversion?',
        'How much communication is failing or not getting effective responses?',
      ],
    },
  },
  recommendedPrompts: [
    'Build a Value Ladder report for this launch by user, including webinar, workshop, high-ticket pipeline, calls, SMS, WhatsApp, and email.',
    'Show post-webinar follow-up activity by setter and closer with effective vs non-effective conversations.',
    'Compare high-ticket pipeline value, won deals, and communication activity by seller.',
  ],
  notes: [
    'Value Ladder segmentation depends on pipeline names, stages, tags, offers, or custom fields configured in HighLevel.',
    'Use pipelineId or userIds to narrow the report to a specific launch, offer, team, or sales pod.',
  ],
};

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
    effective: 0,
    nonEffective: 0,
    delivered: 0,
    failed: 0,
    periods: emptyActivityPeriods(),
    averages: {},
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

function getOrCreateHistoricalBucket(
  buckets: Map<string, JsonRecord>,
  id: string,
  name: string,
  email?: string
): JsonRecord {
  const existing = buckets.get(id);
  if (existing) {
    if (!existing.userEmail && email) existing.userEmail = email;
    return existing;
  }
  const bucket = {
    id,
    userId: id,
    userName: name,
    name,
    userEmail: email,
    ...emptyHistoricalMetrics(),
  };
  buckets.set(id, bucket);
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
    effective: 0,
    nonEffective: 0,
    delivered: 0,
    failed: 0,
    periods: emptyActivityPeriods(),
    averages: {},
    samples: [] as JsonRecord[],
  };
}

function emptyHistoricalMetrics(): JsonRecord {
  return {
    totalRecords: 0,
    outbound: 0,
    inbound: 0,
    unknownDirection: 0,
    sms: 0,
    email: 0,
    whatsapp: 0,
    call: 0,
    other: 0,
    effective: 0,
    nonEffective: 0,
    delivered: 0,
    failed: 0,
    answeredCalls: 0,
    missedCalls: 0,
    noAnswerCalls: 0,
    busyCalls: 0,
    voicemailCalls: 0,
    canceledCalls: 0,
    totalCallDurationSeconds: 0,
    callDurationSamples: 0,
    contactIds: new Set<string>(),
    conversationIds: new Set<string>(),
    periods: emptyActivityPeriods(),
    averages: {},
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
    effective: bucket.effective || 0,
    nonEffective: bucket.nonEffective || 0,
    delivered: bucket.delivered || 0,
    failed: bucket.failed || 0,
    periods: bucket.periods || emptyActivityPeriods(),
    averages: bucket.averages || buildPeriodAverages(bucket.periods || emptyActivityPeriods()),
    samples: bucket.samples || [],
  };
}

function historicalChannels(args: Record<string, unknown>): string[] {
  const channel = normalizeChannel(stringArg(args.channel) || 'all');
  if (channel === 'all') return ['all'];
  if (Array.isArray(args.channels) && args.channels.length) {
    const values = args.channels
      .map((value) => normalizeChannel(String(value || '')))
      .filter((value) => ['SMS', 'Email', 'WhatsApp', 'Call'].includes(value));
    return [...new Set(values.length ? values : [channel])];
  }
  return [channel];
}

function normalizeHistoricalRecord(
  message: JsonRecord,
  requestedChannel: string,
  userMap: Map<string, UserInfo>,
  leaderMap: JsonRecord,
  leaderField?: string
): JsonRecord {
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
  ]) || (userId === 'unassigned' ? 'Sin vendedor/usuario en el registro' : userId);
  const channel = normalizeChannel(firstString(message, ['channel', 'type', 'messageType', 'message_type']) || requestedChannel);
  const direction = normalizeDirection(firstString(message, ['direction', 'messageDirection', 'source', 'status']));
  const status = String(firstString(message, ['status', 'deliveryStatus', 'messageStatus', 'call.status']) || '').toLowerCase();
  const date = firstString(message, ['date', 'createdAt', 'created_at', 'dateAdded']);
  const effectiveness = classifyEffectiveness(status, channel);
  const contactId = firstString(message, ['contactId', 'contact.id']);
  const conversationId = firstString(message, ['conversationId', 'conversation.id']);
  const durationSeconds = channel === 'Call' ? callDurationSeconds(message) : 0;
  const leaderName = leaderNameFor(message, userId, leaderMap, leaderField);
  const body = firstString(message, ['body', 'message', 'text', 'content', 'lastMessageBody']) || '';

  return {
    userId,
    userName,
    userEmail: user?.email,
    leaderId: leaderName || 'unassigned_leader',
    leaderName: leaderName || 'Sin líder asignado',
    channel,
    direction,
    status,
    date,
    effectiveness,
    contactId,
    conversationId,
    durationSeconds,
    detail: {
      id: firstString(message, ['id', 'messageId', '_id']),
      date,
      userId,
      userName,
      userEmail: user?.email,
      leader: leaderName || undefined,
      channel,
      direction,
      status: status || undefined,
      effectiveness,
      contactId,
      conversationId,
      durationSeconds: durationSeconds || undefined,
      preview: preview(body),
    },
  };
}

function addHistoricalRecord(bucket: JsonRecord, record: JsonRecord, includeSamples: boolean): void {
  bucket.totalRecords++;
  incrementChannel(bucket, record.channel);
  if (record.direction === 'outbound') bucket.outbound++;
  else if (record.direction === 'inbound') bucket.inbound++;
  else bucket.unknownDirection++;
  if (String(record.status).includes('deliver')) bucket.delivered++;
  if (String(record.status).includes('fail') || String(record.status).includes('error')) bucket.failed++;
  if (record.effectiveness === 'effective') bucket.effective++;
  else if (record.effectiveness === 'nonEffective') bucket.nonEffective++;
  if (record.contactId && bucket.contactIds instanceof Set) bucket.contactIds.add(record.contactId);
  if (record.conversationId && bucket.conversationIds instanceof Set) bucket.conversationIds.add(record.conversationId);
  if (record.channel === 'Call') incrementCallOutcome(bucket, record.status, record.durationSeconds);
  incrementActivityPeriods(bucket.periods, record.date, record.channel, record.direction, record.effectiveness);
  if (includeSamples && bucket.samples.length < 3) bucket.samples.push(record.detail);
}

function incrementCallOutcome(bucket: JsonRecord, status: string, durationSeconds: number): void {
  const normalized = String(status || '').toLowerCase();
  if (normalized.includes('miss')) bucket.missedCalls++;
  if (normalized.includes('no-answer') || normalized.includes('no answer')) bucket.noAnswerCalls++;
  if (normalized.includes('busy')) bucket.busyCalls++;
  if (normalized.includes('voicemail')) bucket.voicemailCalls++;
  if (normalized.includes('cancel')) bucket.canceledCalls++;
  if (
    !normalized.includes('no-answer') &&
    !normalized.includes('no answer') &&
    (normalized.includes('answer') || normalized.includes('complete') || normalized.includes('success'))
  ) {
    bucket.answeredCalls++;
  }
  if (durationSeconds > 0) {
    bucket.totalCallDurationSeconds += durationSeconds;
    bucket.callDurationSamples++;
  }
}

function finalizeHistoricalMetrics(bucket: JsonRecord): JsonRecord {
  const contactCount = bucket.contactIds instanceof Set ? bucket.contactIds.size : 0;
  const conversationCount = bucket.conversationIds instanceof Set ? bucket.conversationIds.size : 0;
  return {
    ...bucket,
    contactIds: undefined,
    conversationIds: undefined,
    uniqueContacts: contactCount,
    uniqueConversations: conversationCount,
    averageCallDurationSeconds: bucket.callDurationSamples ? round(bucket.totalCallDurationSeconds / bucket.callDurationSamples) : 0,
    averages: buildPeriodAverages(bucket.periods || emptyActivityPeriods()),
  };
}

function historicalSummaryRow(bucket: JsonRecord): JsonRecord {
  return {
    userId: bucket.userId || bucket.id,
    userName: bucket.userName || bucket.name,
    userEmail: bucket.userEmail,
    totalRecords: bucket.totalRecords,
    calls: bucket.call,
    sms: bucket.sms,
    whatsapp: bucket.whatsapp,
    emails: bucket.email,
    outbound: bucket.outbound,
    inbound: bucket.inbound,
    effective: bucket.effective,
    nonEffective: bucket.nonEffective,
    failed: bucket.failed,
    answeredCalls: bucket.answeredCalls,
    missedCalls: bucket.missedCalls,
    noAnswerCalls: bucket.noAnswerCalls,
    totalCallDurationSeconds: bucket.totalCallDurationSeconds,
    averageCallDurationSeconds: bucket.averageCallDurationSeconds,
    uniqueContacts: bucket.uniqueContacts,
    uniqueConversations: bucket.uniqueConversations,
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

function classifyEffectiveness(status: string, channel: string): 'effective' | 'nonEffective' | 'unknown' {
  const normalized = status.toLowerCase();
  if (
    normalized.includes('fail') ||
    normalized.includes('error') ||
    normalized.includes('bounce') ||
    normalized.includes('undeliver') ||
    normalized.includes('missed') ||
    normalized.includes('no-answer') ||
    normalized.includes('no answer') ||
    normalized.includes('busy') ||
    normalized.includes('cancel')
  ) {
    return 'nonEffective';
  }
  if (
    normalized.includes('deliver') ||
    normalized.includes('sent') ||
    normalized.includes('complete') ||
    normalized.includes('answered') ||
    normalized.includes('success') ||
    normalized.includes('read') ||
    normalized.includes('open')
  ) {
    return 'effective';
  }
  if (channel === 'Call' && normalized.includes('voicemail')) return 'nonEffective';
  return 'unknown';
}

function emptyActivityPeriods(): JsonRecord {
  return {
    daily: {} as JsonRecord,
    monthly: {} as JsonRecord,
    yearly: {} as JsonRecord,
  };
}

function incrementActivityPeriods(
  periods: JsonRecord,
  date: string,
  channel: string,
  direction: 'outbound' | 'inbound' | 'unknown',
  effectiveness: 'effective' | 'nonEffective' | 'unknown'
): void {
  const parsed = Date.parse(date);
  if (!Number.isFinite(parsed)) return;
  const timestamp = new Date(parsed);
  const iso = timestamp.toISOString();
  const day = iso.slice(0, 10);
  const month = iso.slice(0, 7);
  const year = iso.slice(0, 4);

  incrementPeriodBucket(periods.daily, day, channel, direction, effectiveness);
  incrementPeriodBucket(periods.monthly, month, channel, direction, effectiveness);
  incrementPeriodBucket(periods.yearly, year, channel, direction, effectiveness);
}

function incrementPeriodBucket(
  collection: JsonRecord,
  key: string,
  channel: string,
  direction: 'outbound' | 'inbound' | 'unknown',
  effectiveness: 'effective' | 'nonEffective' | 'unknown'
): void {
  const bucket = collection[key] || {
    total: 0,
    outbound: 0,
    inbound: 0,
    unknownDirection: 0,
    sms: 0,
    email: 0,
    whatsapp: 0,
    call: 0,
    other: 0,
    effective: 0,
    nonEffective: 0,
  };
  bucket.total++;
  incrementChannel(bucket, channel);
  if (direction === 'outbound') bucket.outbound++;
  else if (direction === 'inbound') bucket.inbound++;
  else bucket.unknownDirection++;
  if (effectiveness === 'effective') bucket.effective++;
  else if (effectiveness === 'nonEffective') bucket.nonEffective++;
  collection[key] = bucket;
}

function buildPeriodAverages(periods: JsonRecord): JsonRecord {
  return {
    perDay: averageFromCollection(periods.daily),
    perMonth: averageFromCollection(periods.monthly),
    perYear: averageFromCollection(periods.yearly),
  };
}

function averageFromCollection(collection: JsonRecord): JsonRecord {
  const buckets = Object.values(collection).filter(isRecord);
  if (!buckets.length) {
    return {
      periods: 0,
      total: 0,
      effective: 0,
      nonEffective: 0,
      outbound: 0,
      inbound: 0,
    };
  }
  return {
    periods: buckets.length,
    total: round(sumField(buckets, 'total') / buckets.length),
    effective: round(sumField(buckets, 'effective') / buckets.length),
    nonEffective: round(sumField(buckets, 'nonEffective') / buckets.length),
    outbound: round(sumField(buckets, 'outbound') / buckets.length),
    inbound: round(sumField(buckets, 'inbound') / buckets.length),
  };
}

function sumField(items: JsonRecord[], field: string): number {
  return items.reduce((sum, item) => sum + (typeof item[field] === 'number' ? item[field] : 0), 0);
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
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

function leaderNameFor(message: JsonRecord, userId: string, leaderMap: JsonRecord, leaderField?: string): string {
  if (leaderField) {
    const fromField = firstString(message, [leaderField]);
    if (fromField) return fromField;
  }
  const mapped = leaderMap[userId];
  if (typeof mapped === 'string') return mapped;
  if (isRecord(mapped)) return firstString(mapped, ['name', 'leaderName', 'id', 'leaderId']);
  return firstString(message, [
    'leaderId',
    'leaderName',
    'managerId',
    'managerName',
    'assignedTo.managerName',
    'assignedTo.manager.id',
    'user.managerName',
    'user.manager.id',
  ]);
}

function callDurationSeconds(message: JsonRecord): number {
  const numeric = numberFrom(message, ['callDurationSeconds', 'durationSeconds', 'call.durationSeconds', 'call.duration']);
  if (numeric > 0) return numeric;
  const raw = firstString(message, ['callDuration', 'duration', 'call.durationText', 'call.callDuration']);
  if (!raw) return 0;
  const parts = raw.split(':').map((part) => Number(part));
  if (parts.length > 1 && parts.every((part) => Number.isFinite(part))) {
    return parts.reduce((total, value) => total * 60 + value, 0);
  }
  const parsed = Number(raw.replace(/[^0-9.]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function toCsv(rows: JsonRecord[]): string {
  if (!rows.length) return '';
  const headers = [...rows.reduce((set, row) => {
    Object.keys(row).forEach((key) => set.add(key));
    return set;
  }, new Set<string>())];
  return [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(',')),
  ].join('\n');
}

function csvCell(value: unknown): string {
  if (value === undefined || value === null) return '';
  const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
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

function buildDateWindow(args: Record<string, unknown>): DateWindow {
  const startDate = stringArg(args.startDate);
  const endDate = stringArg(args.endDate);
  const start = startDate ? Date.parse(startDate.includes('T') ? startDate : `${startDate}T00:00:00.000Z`) : undefined;
  const end = endDate ? Date.parse(endDate.includes('T') ? endDate : `${endDate}T23:59:59.999Z`) : undefined;
  return {
    start: Number.isFinite(start) ? start : undefined,
    end: Number.isFinite(end) ? end : undefined,
  };
}

function classifyDatePosition(date: unknown, window: DateWindow): 'within' | 'before' | 'after' | 'undated' {
  const raw = typeof date === 'string' || typeof date === 'number' ? String(date) : '';
  if (!raw) return 'undated';
  const time = Date.parse(raw);
  if (!Number.isFinite(time)) return 'undated';
  if (typeof window.start === 'number' && time < window.start) return 'before';
  if (typeof window.end === 'number' && time > window.end) return 'after';
  return 'within';
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
