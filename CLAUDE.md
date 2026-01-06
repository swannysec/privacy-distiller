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

## User-Level Resources Available

The following user-level skills and commands are available across all projects. Project-specific guidance below may override or extend these.

**Skills** (invoke with Skill tool):
| Skill | Purpose |
|-------|---------|
| `session-lifecycle` | Session start/end workflows with incremental capture triggers |
| `debug-journal` | Structured debugging with escalation triggers |
| `error-patterns` | Quick JS/TS error recognition |
| `context7-first` | Documentation-first approach for dependencies |
| `tool-selection` | Guide for choosing between overlapping tools |
| `5-minute-planning` | Pre-task planning to avoid wasted effort |

**Commands** (invoke with `/command`):
| Command | Purpose |
|---------|---------|
| `/dep-check <package>` | Check dependency health before adding |
| `/git-safe-commit <message>` | Safe commit with build/test validation |
| `/git-branch-cleanup [mode]` | Clean up merged/stale git branches |
| `/bootstrap-project <name> [type]` | Set up new project with best practices |

**Note**: This project uses ConPort and Serena as primary tools. User-level skills that offer `.md` file fallbacks should use the project-specific ConPort/Serena workflows instead.

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

## Pre-Task Planning

**User-Level Skill**: `5-minute-planning` provides the full planning workflow. Invoke it for comprehensive planning guidance.

### 5-Minute Planning Check (Quick Reference)

Before starting any significant task, answer these questions:

1. **What does "done" look like?** - Clear success criteria
2. **What files will likely change?** - Scope assessment
3. **Are there complexity signals?** - See checklist below
4. **Should I use Context7 first?** - For any library/dependency work
5. **Can any parts be parallelized?** - Multiple agents, independent subtasks

### Complexity Signals

Check for these early warning signs before diving in:

| Signal | Implication | Action |
|--------|-------------|--------|
| Involves external library | Bundler/version issues likely | Use `context7-first` immediately |
| Error mentions "module", "import", "fetch" | Bundler configuration issue | Check Vite/build config |
| Multiple possible causes | Investigation needed | Start `debug-journal` before first attempt |
| Version numbers in error | Version mismatch | Check npm vs CDN availability |
| Works in dev, fails in production | Build/bundling issue | Test with `npm run build && npm run preview` |
| Error message is vague/generic | Root cause unclear | Research before attempting fixes |

**If 2+ signals present**: Stop, plan approach, use `debug-journal`, consider asking user for context before attempting fixes.

## Required Agents and Skills

### Phase 0: Dependency Management (Initial Setup)

**User-Level Resources**:
- **`/dep-check <package>`** command - Check dependency health before adding
- **`context7-first`** skill - Enforce documentation-first approach

**Agents**:
- **`dependency-management:legacy-modernizer`** - Update dependencies, check for security vulnerabilities, ensure latest stable versions

**Process**:
1. Run `/dep-check <package>` to evaluate dependency health before adding
2. Use `context7-first` skill to check library documentation
3. When creating package.json, use `dependency-management:legacy-modernizer` agent to validate dependency versions
4. After npm install, run `npm audit` and address any security vulnerabilities
5. Log dependency choices and version rationale in ConPort
6. Document any version constraints or compatibility requirements

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

**User-Level Resources**:
- **`pre-commit-check`** skill - Validation checklist with sub-agent triggers
- **`/git-safe-commit <message>`** command - Safe commit with build/test validation

**Project Skills**:
- **`pre-commit-check`** - MUST use before every commit to validate build, tests, and trigger appropriate review agents

**Agents**:
- **`pr-review-toolkit:code-reviewer`** - Use BEFORE every commit
- **`pr-review-toolkit:code-simplifier`** - Use after completing logical chunks of code
- **`code-review-ai:architect-review`** - Architecture integrity checks
- **`tdd-workflows:tdd-orchestrator`** - Test-driven development (if applicable)
- **`security-pro:security-auditor`** - Security review for significant changes
- **`frontend-mobile-security:frontend-security-coder`** - Frontend security for UI changes
- **`backend-api-security:backend-security-coder`** - Backend security for API changes

**Process**:
1. Invoke `pre-commit-check` skill BEFORE staging any commit
2. Use `code-reviewer` proactively after writing code
3. Use `code-simplifier` to improve clarity while preserving functionality
4. Run security agents for changes involving user input, authentication, or external APIs
5. Log refactoring decisions in ConPort
6. Link code review findings to relevant decisions in ConPort knowledge graph

**MANDATORY After Significant Changes**:
After completing any feature addition, major fix, or substantial code change:
1. **MUST** invoke `pre-commit-check` skill to run full validation
2. **MUST** use `/git-safe-commit <message>` command for the commit
3. These are NOT optional - skipping them for "small" changes that turn out significant is a common source of bugs

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

**User-Level Skill**: `session-lifecycle` provides general session start/end workflows.
**Project Override**: This project REQUIRES ConPort - use the specific steps below instead of fallback `.md` files.

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

**User-Level Skill**: `tool-selection` provides guidance for choosing between overlapping tools (Serena vs Read, Glob vs Grep, etc.)

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

## Definition of Done

Use these checklists to determine when work is complete. Different types of work have different completion criteria.

### Feature Complete Checklist

Before declaring a feature "done":

- [ ] **Functionality**: Feature works as specified in requirements
- [ ] **Tests**: Unit tests written and passing (verify with `npm test`)
- [ ] **Build**: Production build succeeds (`npm run build`)
- [ ] **No regressions**: Existing tests still pass
- [ ] **ConPort logged**: Decision logged with rationale
- [ ] **Code reviewed**: `pre-commit-check` skill invoked, all agents satisfied
- [ ] **Security reviewed**: If user input involved, security agents consulted
- [ ] **Committed**: Used `/git-safe-commit` command

### Bug Fix Complete Checklist

Before declaring a bug fix "done":

- [ ] **Root cause identified**: Not just symptoms, actual cause documented
- [ ] **Fix applied**: Code change addresses root cause
- [ ] **Test added**: Regression test prevents recurrence
- [ ] **Build passes**: `npm run build` succeeds
- [ ] **Existing tests pass**: No regressions introduced
- [ ] **Debug journal closed**: If used, root cause and solution documented
- [ ] **Post-bug reflection completed**: Invoke `post-bug-reflection` skill to analyze root cause and update project guidance
- [ ] **Committed**: Used `/git-safe-commit` command (include any documentation updates from reflection)

### Refactoring Complete Checklist

Before declaring a refactoring "done":

- [ ] **Behavior preserved**: All existing tests still pass
- [ ] **No functional changes**: Unless explicitly requested
- [ ] **Build passes**: `npm run build` succeeds
- [ ] **Code simplified**: Complexity reduced, not just moved
- [ ] **Pattern documented**: If new pattern introduced, logged in ConPort
- [ ] **Committed**: Used `/git-safe-commit` command

### Investigation/Research Complete Checklist

For exploratory tasks (not code changes):

- [ ] **Question answered**: Original question addressed
- [ ] **Findings documented**: Learnings logged in ConPort or Serena memory
- [ ] **Recommendations clear**: If applicable, next steps identified
- [ ] **No orphan work**: If code was prototyped, either commit or discard

### Session End Checklist

Before ending any session:

- [ ] **All open tasks**: Either completed or status updated in ConPort
- [ ] **No dangling state**: All debug journals closed
- [ ] **Progress logged**: Summary of what was accomplished
- [ ] **Next steps documented**: If work continues later, context preserved

## Debugging Workflow

**User-Level Resources**:
- **`debug-journal`** skill - Structured debugging workflow for complex issues
- **`error-patterns`** skill - Quick error recognition for common JS/TS patterns
- **`context7-first`** skill - Check library docs before troubleshooting

**Project Skills**:
- **`troubleshooting-bundler-compatibility`** - Use for library loading failures, CDN issues, worker errors, or bundler compatibility problems
- **`post-bug-reflection`** - **MANDATORY after any bug fix.** Analyzes root causes and updates CLAUDE.md/skills/commands to prevent recurrence. Invoked automatically per Agent Triggering Rules.

### Quick Fix vs Deep Investigation Decision Tree

When encountering an error, determine the appropriate approach:

**Quick Fix (< 5 minutes)**
Use when:
- Error message is clear and specific
- Single file/function involved
- Common error pattern (typo, missing import, syntax)
- No external dependencies involved

Process:
1. Read error message carefully
2. Locate the exact line/file
3. Apply fix
4. Test immediately

**Deep Investigation (> 5 minutes)**
Use when:
- Error involves external libraries or bundlers
- Multiple possible causes
- Error persists after obvious fixes
- Version mismatches suspected

Process:
1. **Document**: Create ConPort debug log entry immediately
2. **Research**: Use Context7 for library documentation
3. **Isolate**: Create minimal reproduction if possible
4. **Track**: Log each attempt and result in debug log
5. **Escalate**: Use `troubleshooting-bundler-compatibility` skill if applicable
6. **Document**: Log final solution and root cause in ConPort

### Debug Log Pattern (ConPort Custom Data)

For complex debugging sessions, use ConPort custom data to track attempts:

```
mcp__conport__log_custom_data(
  category="DebugLog",
  key="<issue-name>-<timestamp>",
  value={
    "issue": "Description of the problem",
    "attempts": [
      {"approach": "What was tried", "result": "What happened", "timestamp": "..."}
    ],
    "root_cause": "Final determination",
    "solution": "What fixed it",
    "lessons": "What to remember for next time"
  }
)
```

## Agent Triggering Rules

### Automatic Triggers

These agents should be invoked WITHOUT user prompting:

| Trigger Condition | Agent/Skill to Invoke |
|-------------------|----------------------|
| About to write UI code | `frontend-design` skill |
| Working with PDFs | `pdf` skill |
| About to commit code | `pre-commit-check` skill (runs sub-agents for review) |
| Completing significant code chunk | `pr-review-toolkit:code-reviewer` agent |
| Library loading errors | `troubleshooting-bundler-compatibility` skill |
| Adding/updating dependencies | `dependency-management:legacy-modernizer` agent |
| Security-sensitive code | `security-pro:security-auditor` agent |
| UI changes with user input | `frontend-mobile-security:frontend-security-coder` agent |
| API/backend changes | `backend-api-security:backend-security-coder` agent |
| Structural/architectural changes | `code-review-ai:architect-review` agent |
| **After completing any bug fix** | `post-bug-reflection` skill (updates project guidance) |

### Context7 Mandatory Usage

**ALWAYS use Context7 when:**
- Adding a new npm dependency
- Encountering library-specific errors
- Configuring bundler plugins
- Working with library APIs you haven't used recently

```
mcp__mcp-server-context7__resolve-library-id (libraryName)
mcp__mcp-server-context7__get-library-docs (context7CompatibleLibraryID, topic)
```

## Parallel Agent Patterns

When multiple independent reviews are needed, launch agents in parallel to save time. Use the Task tool with multiple simultaneous invocations.

### Pre-Commit Parallel Reviews

For significant changes, launch these agents simultaneously:

```
// All in single message block for parallel execution
Task(subagent_type="pr-review-toolkit:code-reviewer", 
     prompt="Review unstaged changes for code quality...")

Task(subagent_type="security-pro:security-auditor", 
     prompt="Review changes for security vulnerabilities...")

Task(subagent_type="frontend-mobile-security:frontend-security-coder", 
     prompt="Review frontend changes for XSS prevention...")
```

### When to Parallelize

**Parallelize when:**
- Tasks have no dependencies on each other's output
- Multiple independent validations needed
- Comprehensive review required before commit
- Time-sensitive multi-faceted analysis

**Sequential when:**
- One task's output feeds into another
- Decisions need to be made between steps
- Exploring unknowns (need findings before next step)

### Common Parallel Patterns

**Pattern 1: Multi-perspective Code Review**
```
Task(subagent_type="pr-review-toolkit:code-reviewer", prompt="...")
Task(subagent_type="code-review-ai:architect-review", prompt="...")
Task(subagent_type="security-pro:security-auditor", prompt="...")
```

**Pattern 2: Full Test + Build Validation**
```
Task(subagent_type="testing-suite:test-engineer", prompt="Run and analyze test suite...")
Task(subagent_type="application-performance:frontend-developer", prompt="Check bundle size and performance...")
```

**Pattern 3: Documentation + Quality Check**
```
Task(subagent_type="documentation-generator:docs-architect", prompt="...")
Task(subagent_type="pr-review-toolkit:code-simplifier", prompt="...")
```

### Collecting Parallel Results

After launching parallel agents:
1. Use `TaskOutput` to retrieve results from each
2. Synthesize findings - look for agreement and conflicts
3. Address issues in priority order (security > functionality > style)
4. Log consolidated findings in ConPort

## Common Pitfalls

### Bundler and Library Issues

1. **npm version != CDN version** - npm packages release faster than CDNs update. Always verify CDN has your version before using CDN URLs.

2. **Protocol-relative URLs** - `//cdn.example.com` can resolve to `http:` in some contexts, causing mixed content or fetch failures.

3. **Vite ?url vs ?raw** - `?url` returns a URL reference to the bundled asset, NOT the content. Use `?raw` to get actual file content as a string.

4. **ES module workers** - Some workers must load as classic scripts, not ES modules. Use blob URL pattern when workers fail to load.

5. **Dynamic imports in production** - Files in `public/` served as static files, not bundled. Dynamic `import()` of public files fails.

### Testing Pitfalls

1. **Testing imagined APIs** - Always inspect actual implementation with Serena before writing tests.

2. **Static vs instance methods** - Verify whether methods are static (`Class.method()`) or instance (`obj.method()`).

3. **Return type assumptions** - Check actual return types; `null` is not the same as `{}` or `[]`.

**MANDATORY: Before Writing Any Test**

```
# Step 1: Get overview of the file being tested
mcp__plugin_serena_serena__get_symbols_overview(relative_path="src/path/to/file.ts", depth=1)

# Step 2: Inspect specific method signatures and implementations
mcp__plugin_serena_serena__find_symbol(name_path_pattern="ClassName/methodName", include_body=true)

# Step 3: Only then write tests that match the ACTUAL:
#   - Method signatures (static vs instance)
#   - Parameter types and names
#   - Return types (null vs undefined vs empty object/array)
#   - Property names in return objects
```

Never write tests based on what the API *should* look like. Test what it *actually* looks like.

### Context Management Pitfalls

1. **Forgetting to log decisions** - Log decisions IMMEDIATELY when making them, not at end of session.

2. **Stale progress entries** - Update progress status in real-time as work completes.

3. **Missing links** - Connect related ConPort items to build the knowledge graph.

### Data Flow and Field Propagation Pitfalls

**Critical Pattern:** When data flows through multiple layers (Service → Hook → Context → Component), fields can be silently dropped at transformation boundaries.

1. **Manual object transformation drops new fields** - When code explicitly lists fields during transformation (instead of using spread operators), new fields added upstream won't propagate downstream.

   ```typescript
   // FRAGILE - new fields must be manually added here
   const result: AnalysisResult = {
     id: analysisResult.id,
     risks: analysisResult.risks,
     // privacyRights was added to PolicyAnalyzerResult but forgotten here
   };
   
   // BETTER - new fields automatically included
   const result: AnalysisResult = {
     ...analysisResult,
     documentMetadata: { ... },  // Only override what differs
   };
   ```

2. **Assuming intermediate layers "just work"** - Never assume that adding a field to a service automatically makes it available in the UI. Trace the full path.

**MANDATORY: When Adding a New Field to Any Data Type**

Before considering the feature complete:

1. **Trace the full data path** - Use Serena to identify all transformation points:
   ```
   search_for_pattern("TypeName = {")
   find_referencing_symbols("TypeName")
   ```

2. **Verify at each transformation boundary** - Check that the field is explicitly included or spread operator is used.

3. **Test end-to-end** - Add a simple test or manual verification that the field arrives at the consumption point.

4. **Common transformation locations in this codebase:**
   - `src/hooks/useAnalysisOrchestrator.ts` - transforms `PolicyAnalyzerResult` → `AnalysisResult`
   - `src/contexts/AnalysisContext.tsx` - spreads results (usually safe)
   - `src/utils/pdfExport.ts` - consumes fields for PDF generation

**Red Flag:** Any code that looks like `{ field1: source.field1, field2: source.field2, ... }` is a maintenance risk. Either refactor to use spread operators or add a comment marking it as a transformation boundary that needs updating when new fields are added.

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
- ❌ DO NOT skip `pre-commit-check` skill after feature additions or major fixes
- ❌ DO NOT commit significant changes without using `/git-safe-commit` command

## Agent Invocation Reminders

**If you think there's even a 1% chance an agent/skill applies, you MUST invoke it.**

This is not negotiable. This is not optional. Follow the workflow, use the tools, maintain context continuity.
