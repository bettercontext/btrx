# Contexts and Guidelines

## Understanding Contexts vs Guidelines

**Better Context** utilizes a two-stage approach to generate coding guidelines:

### Contexts

**Contexts** define _how_ to analyze your codebase. They are specialized prompts that tell the AI what to look for when examining your code. Think of them as "analysis instructions" that focus on specific aspects of your project.

### Guidelines

**Guidelines** are the _result_ of applying a context to your codebase. They contain the actual coding rules, patterns, and best practices extracted from your code by the AI analysis.

**Key relationship**: Context → AI Analysis → Guidelines

## Why Contexts Are Essential

You **must** create at least one context before you can generate any guidelines. Without a context, Better Context doesn't know how to analyze your code or what patterns to extract.

## Available Presets

Better Context includes two built-in presets to get you started quickly:

### Frontend Preset

The **Front** preset analyzes your frontend codebase and focuses on:

**Code Analysis:**

- Component structure and composition (file organization, folder hierarchy, atomic design principles)
- State management (local vs. global, libraries used, separation of concerns)
- Props and data flow (typing, destructuring, default values, immutability)
- UI consistency (reusable components, design tokens, layout strategies, theming)

**Testing Analysis:**

- Test structure and file placement
- Naming and grouping of tests (describe blocks, titles, hierarchy)
- Assertion patterns and style
- Mocking/stubbing strategies (services, APIs, local storage)
- Test clarity and expressiveness
- Usage of testing libraries and setup utilities

### Backend Preset

The **Back** preset analyzes your backend codebase and focuses on:

**Code Analysis:**

- API endpoint design (structure, naming, HTTP methods, versioning)
- Data validation (schemas, libraries used, placement of validation logic)
- Error handling (types, granularity, HTTP codes, logging strategy)
- Database interaction (ORM/queries, abstraction layers, transactions)
- Service layer structure (modularity, naming, dependency management)

**Testing Analysis:**

- Test organization and naming conventions
- Setup and teardown procedures (fixtures, lifecycle hooks, DB state)
- Assertion style and clarity
- Mocking/stubbing of external services and databases
- Code coverage strategies, test isolation, and execution speed optimizations

## Managing Contexts

### Accessing Context Management

1. Navigate to the **Guidelines** page in Better Context
2. Click the **"Manage Contexts"** button in the top right corner
3. The context management dialog will open

### Adding Your First Context

Since at least one context is required, here's how to create one:

#### Using a Preset (Recommended)

1. In the context management dialog, click **"New Context"**
2. Enter a descriptive name (e.g., "Frontend Analysis", "API Guidelines")
3. Click **"Load Preset"** and choose either:
   - **Front** - for frontend/UI code analysis
   - **Back** - for backend/API code analysis
4. Review the loaded prompt and modify if needed
5. Click **"Save"**

#### Creating a Custom Context

1. In the context management dialog, click **"New Context"**
2. Enter a descriptive name
3. Write your own analysis prompt that describes:
   - What aspects of the code to examine
   - What patterns to look for
   - What type of guidelines to extract
4. Click **"Save"**

### Context Best Practices

**Naming Conventions:**

- Use descriptive names that indicate the analysis focus
- Examples: "React Components", "API Endpoints", "Database Layer", "Testing Strategy"

**Prompt Writing Tips:**

- Be specific about what patterns to look for
- Include both positive patterns (what to do) and anti-patterns (what to avoid)
- Focus on one area at a time for better results
- Use action words: "Analyze", "Identify", "Extract", "Focus on"

**Multiple Contexts Strategy:**

- Create separate contexts for different code areas (frontend, backend, testing)
- Use specialized contexts for specific frameworks or libraries
- Consider contexts for different aspects (performance, security, maintainability)

### Modifying Contexts

1. Open the context management dialog
2. Click the **edit icon** next to the context you want to modify
3. Update the name or prompt as needed
4. Click **"Save"**

**Note:** Modifying a context will affect future guideline generations but won't change existing guidelines.

### Deleting Contexts

1. Open the context management dialog
2. Click the **delete icon** next to the context
3. Confirm the deletion

**Warning:** Deleting a context will also delete all associated guidelines permanently.

## Working with Multiple Contexts

### Context Tabs

Once you have multiple contexts, they appear as tabs in the Guidelines view:

- Each tab represents a different context
- Click between tabs to view guidelines from different analyses
- The tab name matches your context name

### Repository-Specific Contexts

Contexts are tied to specific repositories:

- Each repository has its own set of contexts
- Context names must be unique within a repository
- You can have the same context name in different repositories

## Context Workflow Example

Here's a typical workflow for setting up contexts:

1. **Start with Frontend Analysis**

   - Create a context named "Frontend"
   - Use the "Front" preset
   - Generate guidelines to establish UI patterns

2. **Add Backend Analysis**

   - Create a context named "Backend"
   - Use the "Back" preset
   - Generate guidelines for API and data patterns

3. **Specialize Further** (Optional)
   - Create "Testing Strategy" context for test-specific guidelines
   - Create "Performance" context for optimization patterns
   - Create framework-specific contexts (e.g., "Vue Components", "Express APIs")

## Next Step

- [Generate coding guidelines](./guidelines-analysis.md)

## Need Help?

- Check the [troubleshooting guide](./troubleshooting.md)
- Report issues on GitHub
