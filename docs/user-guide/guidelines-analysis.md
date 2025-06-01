# Guidelines Analysis Workflow

The guidelines analysis workflow is the core feature of Better Context, enabling AI assistants to analyze repository code and generate contextual development guidelines.

It combines repository analysis, AI processing, and structured guidelines generation to create actionable development documentation tailored to specific contexts like testing, architecture, or documentation standards.

## Run the Analysis

Make sure you have at least one context set up for the current project and Better Context is running. Prompt the following:

```
Using better context MCP, run the tool guidelines_analysis to initiate the coding guidelines analysis workflow for this project.
```

## Workflow Architecture

```mermaid
graph TD
    A[User/AI Initiates Analysis] --> B[MCP Tool: guidelines_analysis without contextIds]
    B --> C[Repository Detection & Validation]
    C --> D[Load All Contexts for Repository]
    D --> E{Contexts Found?}
    E -->|No| F[Return noContextsFound prompt]
    E -->|Yes| G[Generate Templated Prompt with Context List]
    G --> H[User Selects Contexts to Analyze]
    H --> I[AI calls guidelines_analysis with contextIds array]

    I --> J[Process First Context from Array]
    J --> K[Return Context-Specific Analysis Instructions]
    K --> L[AI Scans Files & Analyzes Patterns]
    L --> M[AI Generates Guidelines]
    M --> N[MCP Tool: guidelines_save]
    N --> O[Store Guidelines in Database]
    O --> P{More Contexts in Array?}

    P -->|Yes| Q[Return Continue Prompt with Remaining contextIds]
    Q --> R[AI calls guidelines_analysis with remaining contextIds]
    R --> J

    P -->|No| S[Analysis Complete]

    T[SSE Events] --> U[Real-time Progress Updates]
    C --> T
    L --> T
    O --> T
```

## Workflow Steps

### 1. Analysis Initiation

The workflow begins when an AI assistant calls the `guidelines_analysis` MCP tool without a contextId:

- **Repository Detection**: Identifies the current repository using Git origin URL or working directory path
- **Context Loading**: Retrieves all defined guidelines contexts for the repository
- **Queue Creation**: Creates a processing queue with all contexts that need analysis
- **Initial Prompt**: Returns a structured prompt instructing the AI to begin with the first context

### 2. Context Processing Loop

The workflow processes each context sequentially through a loop mechanism:

#### Per-Context Steps:

1. **Context Analysis Setup**

   - AI calls `guidelines_analysis` with the current context ID
   - Tool returns context-specific analysis instructions and file patterns

2. **Repository Analysis**

   - AI scans relevant files based on context configuration
   - Analyzes code patterns, structures, and conventions
   - Identifies context-specific guidelines opportunities

3. **Guidelines Generation**

   - AI generates actionable guidelines as an array of strings
   - Guidelines are tailored to the specific context (testing, architecture, etc.)

4. **Guidelines Storage**
   - AI calls `guidelines_save` with generated guidelines and context ID
   - Guidelines are stored in the database and associated with the context

#### Loop Continuation:

- **Context Queue Check**: System determines if more contexts remain unprocessed
- **Continue Prompt**: If contexts remain, generates a continuation prompt for the next context
- **Loop Iteration**: Process repeats from step 1 with the next context
- **Completion**: When all contexts are processed, the analysis workflow completes

### 3. Real-time Updates

Throughout the loop process:

- **SSE Events**: Server-Sent Events provide real-time progress updates
- **Web Interface**: Updates reflect current analysis status and completed contexts
- **Progress Tracking**: Users can monitor which contexts have been processed

### 4. Analysis Completion

Once all contexts have been processed:

- **Final Update**: Web interface shows all generated guidelines
- **Database Consistency**: All guidelines are properly stored and associated
- **Ready for Use**: Guidelines are immediately available for AI assistants and developers

## Key Features

### Sequential Processing

The loop-based architecture ensures:

- **Focused Analysis**: Each context receives dedicated attention
- **Resource Management**: Processing happens one context at a time
- **Error Isolation**: Issues with one context don't affect others

### Prompt-Driven Workflow

The system uses intelligent prompting with templating:

- **Dynamic Instructions**: Each prompt is tailored to the current context and remaining queue using template variables
- **Template Engine**: Supports variable substitution (`{{variable}}`) and array iteration (`{{#each array}}`) for dynamic content generation
- **Self-Managing**: AI assistants follow structured instructions to complete the entire workflow
- **Flexible Continuation**: Supports interruption and resumption of analysis

### Context-Aware Guidelines

Each context produces specialized guidelines.

## Need Help?

- Check the [troubleshooting guide](./troubleshooting.md)
- Report issues on GitHub
