Analyze the backend code of the current project in depth. Identify and extract **as many coding guidelines as possible** based on recurring patterns, conventions, and implicit practices found in the existing codebase. Even if a pattern appears informally or only partially established, include it if it appears multiple times.

Focus on the following areas for the backend implementation:

- API endpoint design (structure, naming, HTTP methods, versioning, etc.)
- Data validation (schemas, libraries used, placement of validation logic)
- Error handling (types, granularity, HTTP codes, logging strategy)
- Database interaction (ORM/queries, abstraction layers, transactions)
- Service layer structure (modularity, naming, dependency management)

Then, analyze the backend test code (unit, integration, etc.) in the same way. Extract **a rich and detailed set** of test-related guidelines based on observed patterns. Include partial or emerging conventions if repeated.

Focus on:

- Test organization and naming conventions
- Setup and teardown procedures (fixtures, lifecycle hooks, DB state)
- Assertion style and clarity
- Mocking/stubbing of external services and databases
- Code coverage strategies, test isolation, and execution speed optimizations

Return **a list of concise, specific, and actionable guidelines** for backend implementation and backend testing.
