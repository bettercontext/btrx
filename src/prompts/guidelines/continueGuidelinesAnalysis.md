Let's continue with the next context: "{{nextContextName}}" (ID: {{nextContextId}}).

Please perform the following steps for this context:

1.  Call the MCP tool named 'getGuidelinesAnalysisPromptForContext' with the argument:
    ```json
    {
      "contextId": {{nextContextId}}
    }
    ```
2.  The tool will return a specific prompt for analyzing the "{{nextContextName}}" code. Use this prompt to have the AI generate a list of guidelines (as an array of strings), remembering to browse the codebase for this context.
3.  Once the guidelines are generated, call the MCP tool named 'saveGuidelines' with the arguments:
    ```json
    {
      "guidelines": <the_generated_array_of_guideline_strings>,
      "contextId": {{nextContextId}}
    }
    ```
    {{#if remainingContextsListIsNotEmpty}}
    After successfully saving the guidelines for "{{nextContextName}}" (ID: {{nextContextId}}), if there are more contexts in the list ({{remainingContextsList}}), repeat this entire 3-step process for the next context.
    If "{{nextContextName}}" (ID: {{nextContextId}}) was the last context, the process is complete.
    {{else}}
    This is the last context. Once these guidelines are saved, the process will be complete.
    {{/if}}

Proceed now with step 1 for the context "{{nextContextName}}" (ID: {{nextContextId}}).
