export const guidelinesTools = [
  {
    name: 'guidelines_analysis',
    description:
      'Unified tool for guidelines analysis flow. When called without contextId, initiates the analysis flow and returns the initial prompt. When called with contextId, returns the specific prompt for that context.',
    inputSchema: {
      type: 'object',
      properties: {
        contextIds: {
          type: 'array',
          items: { type: 'number' },
          description:
            'Optional array of context IDs. If not provided, starts the analysis flow and returns the initial prompt. If provided, processes the first context ID in the array.',
        },
      },
      additionalProperties: false,
    },
    annotations: {
      title: 'Guidelines Analysis',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  {
    name: 'guidelines_save',
    description:
      'Saves a batch of new guidelines to the database for a given context ID.',
    inputSchema: {
      type: 'object',
      properties: {
        guidelines: {
          type: 'array',
          items: { type: 'string' },
          description: 'An array of guideline content strings.',
        },
        contextId: {
          type: 'number',
          description: 'The ID of the context for these guidelines.',
        },
        remainingContextIds: {
          type: 'array',
          items: { type: 'number' },
          description:
            'Array of remaining context IDs to process after this one.',
        },
      },
      required: ['guidelines', 'contextId', 'remainingContextIds'],
      additionalProperties: false,
    },
    annotations: {
      title: 'Save Guidelines',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
  },
]
