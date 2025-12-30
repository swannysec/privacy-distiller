# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Privacy Policy Analyzer - Claude Code Instructions

## Project Overview

Build a simple web application hosted on GitHub Pages that uses LLMs (local or OpenRouter) to analyze, break down, and summarize privacy policies via URL or PDF upload for laypeople, including highlighting significant privacy risks.

## Development Environment

**This project uses devcontainers** - Anthropic's recommended best practice for Claude Code.

**Setup:**
1. Ensure Docker Desktop is running
2. Open project in Zed or VS Code
3. Select "Reopen in Container" when prompted
4. Container includes Node.js 20, all tools, and Claude Code integration

**Benefits:**
- Sandboxed environment (project files only)
- Consistent Node.js 20 environment
- Safe unattended operation with `--dangerously-skip-permissions`
- No Windows-specific npm issues

## Critical Tools - DO NOT SKIP

### ConPort (Project Context Management)

**MANDATORY**: Use ConPort tools throughout the entire project lifecycle. These tools are NOT optional. Ensure that ConPort is initialized at the start of every session.

- **`mcp__conport__log_decision`** - Log ALL architectural and implementation decisions as you make them
- **`mcp__conport__log_progress`** - Track development tasks and status (TODO, IN_PROGRESS, DONE)
- **`mcp__conport__update_product_context`** - Maintain project goals, features, and architecture
- **`mcp__conport__update_active_context`** - Track current working focus and open issues
- **`mcp__conport__semantic_search_conport`** - Search project context when resuming work or answering questions
- **`mcp__conport__log_system_pattern`** - Document coding patterns and conventions as they emerge
- **`mcp__conport__link_conport_items`** - Build knowledge graph between decisions, patterns, and progress

**Usage Pattern**: At the start of EVERY session, use `mcp__conport__get_recent_activity_summary` to understand recent work. Log decisions immediately when making them. Update progress status in real-time.

### Serena (Semantic Code Navigation)

**MANDATORY**: Use Serena tools for ALL code exploration, reading, and editing. These tools are NOT optional.

**Key Serena Tools**:
- **`mcp__plugin_serena_serena__get_symbols_overview`** - ALWAYS use this first when exploring a new file
- **`mcp__plugin_serena_serena__find_symbol`** - Find classes, functions, methods by name
- **`mcp__plugin_serena_serena__find_referencing_symbols`** - Understand dependencies and usage
- **`mcp__plugin_serena_serena__replace_symbol_body`** - Edit entire functions/methods
- **`mcp__plugin_serena_serena__replace_content`** - Regex-based edits for smaller changes
- **`mcp__plugin_serena_serena__search_for_pattern`** - Search codebase for patterns
- **`mcp__plugin_serena_serena__write_memory`** - Document important codebase learnings
- **`mcp__plugin_serena_serena__read_memory`** - Retrieve documented learnings

**Usage Pattern**: 
1. Use `get_symbols_overview` when encountering a new file
2. Use `find_symbol` with `include_body=false` to understand structure
3. Only read symbol bodies when you need to understand or edit them
4. Use `find_referencing_symbols` before modifying APIs to understand impact
5. Document architectural patterns in memories for future sessions

## Required Agents and Skills

### Phase 0: Dependency Management (Initial Setup)

**Agents**:
- **`dependency-management:legacy-modernizer`** - Update dependencies, check for security vulnerabilities, ensure latest stable versions

**Process**:
1. BEFORE creating package.json, use Context7 to verify latest stable versions of all dependencies
2. When creating package.json, use `dependency-management:legacy-modernizer` agent to validate dependency versions
3. After npm install, run `npm audit` and address any security vulnerabilities
4. Log dependency choices and version rationale in ConPort
5. Document any version constraints or compatibility requirements

**When to Use**:
- Creating initial package.json
- Adding new dependencies
- Updating existing dependencies
- Addressing security vulnerabilities
- Migrating from deprecated packages

### Phase 1: Planning and Architecture

**Agents**:
- **`feature-dev:code-architect`** - Design the overall architecture, identify files to create/modify, plan data flows
- **`api-scaffolding:backend-architect`** - If building a backend proxy for LLM API calls

**Process**:
1. Use ConPort to log the initial project goals and requirements
2. Use `feature-dev:code-architect` to create implementation blueprint
3. Log the architectural decision in ConPort with rationale
4. Create system patterns for conventions (file structure, naming, etc.)

### Phase 2: Frontend Development

**Skills**:
- **`frontend-design`** - MUST use for building the web interface with production-grade UI

**Agents**:
- **`frontend-mobile-development:frontend-developer`** - React 19, responsive design, accessibility
- **`nextjs-vercel-pro:frontend-developer`** - React components and state management

**Process**:
1. Invoke `frontend-design` skill BEFORE writing any UI code
2. Use Serena to organize component structure
3. Log UI/UX decisions in ConPort
4. Document component patterns in Serena memories

### Phase 3: LLM Integration

**Agents**:
- **`ai-ml-toolkit:ai-engineer`** - LLM application development, RAG systems, prompt pipelines
- **`llm-application-dev:ai-engineer`** - Production-ready LLM integration with vector search
- **`llm-application-dev:prompt-engineer`** - Optimize prompts for policy analysis

**MCP Tools**:
- **`mcp__mcp-server-context7__*`** - Get up-to-date documentation for LLM libraries

**Process**:
1. Use Context7 to get latest library documentation
2. Design prompt templates for policy analysis
3. Log prompt engineering decisions in ConPort
4. Document LLM integration patterns in Serena memories

### Phase 4: PDF Processing

**Skills**:
- **`pdf`** - MUST use for all PDF manipulation and text extraction

**Process**:
1. Invoke `pdf` skill for document processing requirements
2. Log document processing approach in ConPort
3. Test extraction with various policy document formats

### Phase 5: Security Implementation (Continuous)

**Agents**:
- **`security-pro:security-auditor`** - OWASP compliance, vulnerability assessment
- **`backend-api-security:backend-security-coder`** - Input validation, API security
- **`frontend-mobile-security:frontend-security-coder`** - XSS prevention, client-side security

**Process**:
1. Use security agents proactively DURING development, not just at the end
2. Review security considerations before implementing file uploads
3. Validate all user inputs (URLs, PDF files)
4. Log security decisions and rationale in ConPort
5. Document security patterns in Serena memories

### Phase 6: Code Quality and Review (Continuous)

**Agents**:
- **`pr-review-toolkit:code-reviewer`** - Use BEFORE every commit
- **`pr-review-toolkit:code-simplifier`** - Use after completing logical chunks of code
- **`code-review-ai:architect-review`** - Architecture integrity checks
- **`tdd-workflows:tdd-orchestrator`** - Test-driven development (if applicable)

**Process**:
1. Use `code-reviewer` proactively after writing code
2. Use `code-simplifier` to improve clarity while preserving functionality
3. Log refactoring decisions in ConPort
4. Link code review findings to relevant decisions in ConPort knowledge graph

### Phase 7: Testing

**Agents**:
- **`testing-suite:test-engineer`** - Test automation and quality assurance
- **`testing-suite:generate-tests`** - Generate comprehensive test suites

**CRITICAL TEST DEVELOPMENT RULES**:

**BEFORE Writing Any Tests**:
1. **ALWAYS inspect the actual implementation first** using Serena:
   ```
   mcp__plugin_serena_serena__get_symbols_overview(relative_path, depth=1)
   mcp__plugin_serena_serena__find_symbol(name_path_pattern, include_body=true)
   ```
2. **Verify the actual API** - method names, signatures, return types, static vs instance
3. **DO NOT write tests for imagined or ideal APIs** - test what actually exists
4. **DO NOT assume method behavior** - read the actual implementation

**Test Structure Requirements**:
1. **Match actual method signatures**: If class methods are static, call them as static (`ClassName.method()` not `instance.method()`)
2. **Match actual return types**: If function returns `null`, test for `null` (not `{}` or `[]`)
3. **Match actual validation structures**: Verify exact shape of return objects (e.g., `{valid, errors}` vs `{isValid, error}`)
4. **Use correct imports**: Include all needed test utilities (`describe`, `it`, `expect`, `beforeEach`, etc.)

**Common Pitfalls to Avoid**:
- ❌ Testing for methods that don't exist in the codebase
- ❌ Assuming instance methods when they're actually static
- ❌ Wrong return type expectations (null vs empty object/array)
- ❌ Using wrong property names in return objects
- ❌ Testing ideal behavior instead of actual behavior
- ❌ Missing test utility imports

**Test Validation Process**:
1. Write tests based on actual implementation
2. Tests should fail if implementation changes unexpectedly
3. Tests should accurately document what the code actually does
4. Log any discovered API gaps or missing features in ConPort for future implementation
5. Use Serena memories to document test patterns and implementation quirks

**Process**:
1. Use Serena to inspect implementation before writing tests
2. Write tests that match actual API and behavior
3. Test LLM prompt processing with actual method signatures
4. Test PDF extraction with various document formats
5. Test privacy risk detection accuracy
6. Log test coverage decisions and any API gaps discovered in ConPort
7. Document test patterns in Serena memories

### Phase 8: Performance Optimization

**Agents**:
- **`performance-optimizer:performance-engineer`** - Profile and optimize bottlenecks
- **`application-performance:frontend-developer`** - React performance, Core Web Vitals

**Process**:
1. Profile LLM response times
2. Optimize PDF processing for large documents
3. Ensure responsive UI during analysis
4. Log performance optimization decisions in ConPort

### Phase 9: Deployment

**Process**:
1. Configure GitHub Pages static site deployment
2. Set up OpenRouter API key management (environment variables)
3. Document deployment process in ConPort
4. Create deployment checklist in ConPort progress tracking

## Context Management Workflow

### Session Start (EVERY TIME)
```
1. Call: mcp__conport__get_recent_activity_summary (hours_ago=72)
2. Review recent decisions, progress, patterns
3. Call: mcp__plugin_serena_serena__list_memories
4. Read relevant memories for current work
```

### During Development
```
1. When making architectural decisions:
   - Call: mcp__conport__log_decision (with summary, rationale, implementation_details)
   
2. When starting a task:
   - Call: mcp__conport__log_progress (status="TODO", description=...)
   - Call: mcp__conport__update_progress (status="IN_PROGRESS")
   
3. When completing a task:
   - Call: mcp__conport__update_progress (status="DONE")
   
4. When discovering patterns:
   - Call: mcp__conport__log_system_pattern (name, description, tags)
   
5. When learning something important about the code:
   - Call: mcp__plugin_serena_serena__write_memory (memory_file_name, content)
```

### Linking Context
```
1. Link decisions to progress items:
   - Call: mcp__conport__link_conport_items (
       source_item_type="decision",
       source_item_id=<decision_id>,
       target_item_type="progress_entry", 
       target_item_id=<progress_id>,
       relationship_type="implements"
     )

2. Link patterns to decisions:
   - Call: mcp__conport__link_conport_items (
       source_item_type="system_pattern",
       target_item_type="decision",
       relationship_type="follows_pattern"
     )
```

## Code Navigation Workflow

### Exploring New Code
```
1. Call: mcp__plugin_serena_serena__get_symbols_overview (relative_path, depth=1)
2. Review class/function structure
3. Call: mcp__plugin_serena_serena__find_symbol (name_path_pattern, include_body=false)
4. Only read bodies when needed for understanding or editing
```

### Editing Code
```
1. For whole symbol changes:
   - Call: mcp__plugin_serena_serena__find_symbol (include_body=true)
   - Call: mcp__plugin_serena_serena__replace_symbol_body (name_path, relative_path, body)

2. For small changes within symbols:
   - Call: mcp__plugin_serena_serena__replace_content (relative_path, needle, repl, mode="regex")
   - Use regex wildcards to avoid specifying full original text

3. Before changing APIs:
   - Call: mcp__plugin_serena_serena__find_referencing_symbols (name_path, relative_path)
   - Update all references or ensure backward compatibility
```

## Key Features to Implement

1. **Document Input**
   - URL input for online policies
   - PDF file upload
   - Text extraction and preprocessing

2. **LLM Analysis**
   - Support for local LLMs and OpenRouter
   - Structured prompt templates for:
     - Policy summarization
     - Privacy risk identification
     - Plain language explanations
     - Key terms extraction

3. **Results Display**
   - Layered summary (brief, detailed, full)
   - Highlighted privacy risks with severity levels
   - Key terms glossary
   - Comparison view (if multiple policies)

4. **User Experience**
   - Progress indicators during analysis
   - Responsive design for mobile
   - Accessibility compliance (WCAG 2.1)
   - Error handling with clear messages

## Security Requirements

- **Input Validation**: Sanitize all URLs and uploaded files
- **API Key Security**: Never expose keys in client-side code
- **XSS Prevention**: Sanitize all LLM outputs before rendering
- **CORS**: Proper configuration for GitHub Pages
- **File Size Limits**: Restrict PDF uploads to reasonable sizes
- **Rate Limiting**: Implement client-side rate limiting for API calls

## Documentation Requirements

Use ConPort to maintain:
- **Product Context**: Project goals, features, architecture overview
- **Active Context**: Current sprint focus, open issues, blockers
- **Decisions**: All architectural and implementation choices
- **Progress**: Task breakdown and status tracking
- **Patterns**: Code conventions, naming standards, architectural patterns

Use Serena memories to document:
- **Code Architecture**: How components interact
- **LLM Integration**: Prompt templates and processing logic
- **PDF Processing**: Extraction strategies and edge cases
- **Security Patterns**: Validation and sanitization approaches

## Success Criteria

- ✅ Functional web app hosted on GitHub Pages
- ✅ LLM integration working with OpenRouter or local models
- ✅ PDF and URL input both functional
- ✅ Clear, actionable privacy risk summaries
- ✅ Responsive and accessible UI
- ✅ Security review completed
- ✅ Code review completed
- ✅ All decisions logged in ConPort
- ✅ All patterns documented in Serena
- ✅ Comprehensive test coverage

## Forbidden Actions

- ❌ DO NOT skip ConPort logging - it's mandatory for context continuity
- ❌ DO NOT skip Serena for code navigation - it's mandatory for efficient editing
- ❌ DO NOT read entire files without using `get_symbols_overview` first
- ❌ DO NOT make architectural decisions without logging them in ConPort
- ❌ DO NOT commit code without running `code-reviewer` agent first
- ❌ DO NOT write security-sensitive code without consulting security agents
- ❌ DO NOT skip the `frontend-design` skill for UI development
- ❌ DO NOT skip the `pdf` skill for document processing
- ❌ DO NOT create helper functions or abstractions for one-time operations
- ❌ DO NOT add error handling for scenarios that can't happen
- ❌ DO NOT run `npm run dev` or `npm run preview` - user runs preview server manually
- ❌ DO NOT start any vite server - only run `npm run build` and `npm test`

## Agent Invocation Reminders

**If you think there's even a 1% chance an agent/skill applies, you MUST invoke it.**

This is not negotiable. This is not optional. Follow the workflow, use the tools, maintain context continuity.
