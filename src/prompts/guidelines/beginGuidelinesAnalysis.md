You are about to begin an analysis of the project's guidelines. This process will be done sequentially, focusing on different 'contexts' of the codebase. We will guide you through each context.

Okay, we will now process the following guidelines contexts sequentially: {{allContextsList}}.

Let's start with the first context: "{{firstContextName}}" (ID: {{firstContextId}}).

Please perform the following steps for the context "{{firstContextName}}" (ID: {{firstContextId}}):

1.  Call the MCP tool named 'getGuidelinesAnalysisPromptForContext' with the argument:
    ```json
    {
      "contextId": {{firstContextId}}
    }
    ```
2.  The tool will return a specific prompt for analyzing the "{{firstContextName}}" code. Use this prompt to have the AI generate a list of guidelines (as an array of strings).
3.  Once the guidelines are generated, call the MCP tool named 'saveGuidelines' with the arguments:
    ```json
    {
      "guidelines": <the_generated_array_of_guideline_strings>,
      "contextId": {{firstContextId}}
    }
    ```
4.  After successfully saving the guidelines for "{{firstContextName}}" (ID: {{firstContextId}}), if there are more contexts in the list ({{remainingContextsList}}), repeat this entire 4-step process for the next context in the list (using its specific ID and name).
    If "{{firstContextName}}" (ID: {{firstContextId}}) was the last context, the process is complete.

Proceed now with step 1 for the context "{{firstContextName}}" (ID: {{firstContextId}}).
