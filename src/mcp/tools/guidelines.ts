export const guidelinesTools = [
  {
    name: 'start_guidelines_analysis_flow',
    title: 'Start Guidelines Analysis Flow',
    description:
      'Initiates the guidelines analysis flow by fetching repository contexts and returning the initial prompt to guide client-side processing of the first context.',
    inputSchema: {
      type: 'object',
      properties: {},
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
            'An array containing a single content block with instructions to start the sequential analysis loop for the first context, or a message if no contexts are found.',
        },
      },
      required: ['content'],
      additionalProperties: false,
    },
  },
  {
    name: 'get_guidelines_analysis_prompt_for_context',
    title: 'Get Guidelines Analysis Prompt for Context',
    description:
      'Returns a specific prompt for the LLM to perform guidelines analysis for a given context ID.',
    inputSchema: {
      type: 'object',
      properties: {
        contextId: {
          type: 'number',
          description:
            'The ID of the context for which to generate the analysis prompt.',
        },
      },
      required: ['contextId'],
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
            'An array containing a single content block with the generated prompt for the specified context.',
        },
      },
      required: ['content'],
      additionalProperties: false,
    },
  },
  {
    name: 'save_guidelines',
    title: 'Save Guidelines Batch',
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
      },
      required: ['guidelines', 'contextId'],
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
            'An array containing a single content block with a success message.',
        },
      },
      required: ['content'],
      additionalProperties: false,
    },
  },
]
