#!/usr/bin/env node

/**
 * SkillsMP MCP Server
 * Connects to skillsmp.com Agent Skills Marketplace API
 * Provides tools to search and discover skills for AI coding assistants
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');

const SKILLSMP_API_BASE = 'https://skillsmp.com/api/v1';
const API_KEY = process.env.SKILLSMP_API_KEY || '';

// Create MCP server
const server = new Server(
  {
    name: 'skillsmp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Helper function to make API requests
async function fetchSkillsMP(endpoint, params = {}) {
  const url = new URL(`${SKILLSMP_API_BASE}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, String(value));
    }
  });

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`SkillsMP API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Define available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'search_skills',
        description: 'Search for agent skills by keyword. Returns skills from the SkillsMP marketplace that match the query. Use this to find tools and capabilities for coding tasks.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query (keywords to find relevant skills)',
            },
            page: {
              type: 'number',
              description: 'Page number for pagination (default: 1)',
            },
            limit: {
              type: 'number',
              description: 'Number of results per page (default: 10, max: 50)',
            },
            sortBy: {
              type: 'string',
              enum: ['relevance', 'stars', 'updated'],
              description: 'Sort order: relevance, stars, or updated',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'ai_search_skills',
        description: 'AI-powered semantic search for agent skills. Uses AI to understand the intent and find the most relevant skills. Better for natural language queries.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Natural language query describing what you need',
            },
            page: {
              type: 'number',
              description: 'Page number for pagination (default: 1)',
            },
            limit: {
              type: 'number',
              description: 'Number of results per page (default: 10)',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'recommend_skills_for_task',
        description: 'Get skill recommendations for a specific task. Analyzes the task and suggests relevant skills that could help accomplish it.',
        inputSchema: {
          type: 'object',
          properties: {
            task: {
              type: 'string',
              description: 'Description of the task you want to accomplish',
            },
            context: {
              type: 'string',
              description: 'Additional context about the project or environment',
            },
          },
          required: ['task'],
        },
      },
    ],
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'search_skills': {
        const { query, page = 1, limit = 10, sortBy = 'relevance' } = args;
        const result = await fetchSkillsMP('/skills/search', {
          q: query,
          page,
          limit: Math.min(limit, 50),
          sortBy,
        });
        
        return {
          content: [
            {
              type: 'text',
              text: formatSkillsResult(result, query),
            },
          ],
        };
      }

      case 'ai_search_skills': {
        const { query, page = 1, limit = 10 } = args;
        const result = await fetchSkillsMP('/skills/ai-search', {
          q: query,
          page,
          limit,
        });
        
        return {
          content: [
            {
              type: 'text',
              text: formatSkillsResult(result, query),
            },
          ],
        };
      }

      case 'recommend_skills_for_task': {
        const { task, context = '' } = args;
        // Use AI search with enhanced query
        const enhancedQuery = context 
          ? `${task}. Context: ${context}`
          : task;
        
        const result = await fetchSkillsMP('/skills/ai-search', {
          q: enhancedQuery,
          limit: 5,
        });
        
        return {
          content: [
            {
              type: 'text',
              text: formatRecommendations(result, task),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Format skills search result
function formatSkillsResult(result, query) {
  if (!result || !result.skills || result.skills.length === 0) {
    return `No skills found for query: "${query}"`;
  }

  const lines = [
    `## Skills found for: "${query}"`,
    `Total: ${result.total || result.skills.length} skills`,
    '',
  ];

  result.skills.forEach((skill, index) => {
    lines.push(`### ${index + 1}. ${skill.name || skill.title}`);
    if (skill.description) {
      lines.push(`   ${skill.description}`);
    }
    if (skill.repository || skill.url) {
      lines.push(`   📦 ${skill.repository || skill.url}`);
    }
    if (skill.stars !== undefined) {
      lines.push(`   ⭐ ${skill.stars} stars`);
    }
    if (skill.tags && skill.tags.length > 0) {
      lines.push(`   🏷️ ${skill.tags.join(', ')}`);
    }
    lines.push('');
  });

  return lines.join('\n');
}

// Format recommendations
function formatRecommendations(result, task) {
  if (!result || !result.skills || result.skills.length === 0) {
    return `No skill recommendations found for task: "${task}"`;
  }

  const lines = [
    `## Recommended Skills for Task`,
    `Task: "${task}"`,
    '',
    'Here are the most relevant skills that could help:',
    '',
  ];

  result.skills.forEach((skill, index) => {
    lines.push(`**${index + 1}. ${skill.name || skill.title}**`);
    if (skill.description) {
      lines.push(`   ${skill.description}`);
    }
    if (skill.repository || skill.url) {
      lines.push(`   Install: \`${skill.repository || skill.url}\``);
    }
    lines.push('');
  });

  lines.push('---');
  lines.push('Use `search_skills` for more detailed searches.');

  return lines.join('\n');
}

// Start server
async function main() {
  if (!API_KEY) {
    console.error('Warning: SKILLSMP_API_KEY not set. API calls may fail.');
  }
  
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('SkillsMP MCP Server running');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});