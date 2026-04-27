/**
 * MCP server entry point.
 * Started by AI platforms via their MCP config, e.g.:
 *   command: "/path/to/brain/.venv/bin/python3"
 *   args: ["-m", "graphify.serve", "/path/to/brain/graphify-out/graph.json"]
 *
 * This file is not invoked directly — the MCP config written during setup
 * points directly at the graphify.serve module in the .venv.
 * This module exists as documentation and for future custom MCP tools.
 */

export const MCP_TOOLS = [
  {
    name: 'brain_update',
    description: 'Rebuild the knowledge graph from raw/ and sync via git',
  },
  {
    name: 'brain_status',
    description: 'Return health info: tool version, node/edge count, last build time',
  },
  {
    name: 'brain_query',
    description: 'Query the knowledge graph with a natural language question',
    inputSchema: {
      type: 'object',
      properties: { question: { type: 'string' } },
      required: ['question'],
    },
  },
  {
    name: 'brain_path',
    description: 'Find the shortest path between two concepts in the graph',
    inputSchema: {
      type: 'object',
      properties: {
        source: { type: 'string' },
        target: { type: 'string' },
      },
      required: ['source', 'target'],
    },
  },
  {
    name: 'brain_explain',
    description: 'Explain a concept from the knowledge graph',
    inputSchema: {
      type: 'object',
      properties: { concept: { type: 'string' } },
      required: ['concept'],
    },
  },
]
