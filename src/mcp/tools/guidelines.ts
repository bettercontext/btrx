export const guidelinesTools = [
  {
    name: 'guidelines_analysis',
    title: 'Guidelines Analysis',
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
    outputSchema: {
      type: 'object',
      properties: {
        content: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['text'] },
              text: { type: 'string' },
            },
            required: ['type', 'text'],
            additionalProperties: false,
          },
          minItems: 1,
          maxItems: 1,
          description:
            'An array containing a single content block with analysis instructions or context-specific prompt.',
        },
      },
      required: ['content'],
      additionalProperties: false,
    },
  },
  {
    name: 'guidelines_save',
    title: 'Save Guidelines',
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
    outputSchema: {
      type: 'object',
      properties: {
        content: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['text', 'json'] },
              text: { type: 'string' },
            },
            required: ['type', 'text'],
            additionalProperties: false,
          },
          minItems: 1,
          maxItems: 1,
          description:
            'An array containing a single content block with a success message and next steps.',
        },
      },
      required: ['content'],
      additionalProperties: false,
    },
  },
]
