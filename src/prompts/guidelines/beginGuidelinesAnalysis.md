You are about to begin an analysis of the project's guidelines. This repository has the following contexts available for analysis:

{{#each contexts}}
- **{{name}}** (ID: {{id}})
{{/contexts}}

**IMPORTANT: You must ask the user which contexts they want to analyze before proceeding.**

Ask the user to select which contexts they would like to analyze. They can:

- Select specific contexts by name (e.g., "Frontend and Backend only")
- Choose all contexts (e.g., "All contexts" or "Everything")
- Pick just one context (e.g., "Just the Frontend context")

**Do not make this selection yourself. Wait for the user's response, then translate their selection into the appropriate context IDs and start the analysis workflow:**

**After the user selects contexts, process them sequentially:**

1. **Call `guidelines_analysis`** with the full array of selected context IDs (e.g., `{"contextIds": [1, 2]}`)
2. **The tool will return analysis instructions for the first context** - EXECUTE these instructions by:
   - Using available tools (read_file, Grep, etc.) to examine the codebase
   - Analyzing patterns, conventions, and practices as instructed
   - Generating a comprehensive list of specific, actionable guidelines
3. **Save the results** using `guidelines_save` with:
   - The generated guidelines array
   - The current contextId (first from the array)
   - The remaining contextIds (rest of the array)
4. **The system will automatically continue** with the next context until all are processed

**Start immediately after context selection by calling guidelines_analysis with the contextIds array.**
