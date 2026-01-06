---
name: post-bug-reflection
description: Self-improvement workflow after fixing any bug. Analyzes root causes and updates project guidance (CLAUDE.md, skills, commands) to prevent similar bugs. MUST be invoked after completing any bug fix before marking the fix as done.
---

# Post-Bug Reflection Skill

## Purpose

Transform every bug fix into a learning opportunity by analyzing root causes and codifying prevention strategies into project documentation. This creates a continuously improving codebase where the same class of bug cannot recur.

## When to Invoke

**MANDATORY** after completing any bug fix, before:
- Marking the bug fix as "done"
- Creating a PR for the fix
- Moving on to other work

**Trigger phrases:**
- "bug fixed"
- "fix complete"
- After any commit with "fix:" prefix
- When closing a bug-related issue

## Reflection Process

### Step 1: Root Cause Analysis

Answer these questions about the bug just fixed:

1. **What was the symptom?** (What the user observed)
2. **What was the root cause?** (The actual code/design flaw)
3. **Why did this bug get introduced?** (Process gap, assumption, oversight)
4. **Why wasn't it caught earlier?** (Missing test, review gap, unclear docs)

Document in ConPort:
```
mcp__conport__log_custom_data(
  category="BugReflection",
  key="<bug-name>-<date>",
  value={
    "symptom": "...",
    "root_cause": "...",
    "introduction_reason": "...",
    "detection_gap": "...",
    "fix_summary": "...",
    "prevention_strategy": "..."
  }
)
```

### Step 2: Pattern Recognition

Determine if this bug fits a known pattern or represents a new class:

**Known patterns (check CLAUDE.md Common Pitfalls):**
- Bundler/library issues
- Testing pitfalls (imagined APIs, wrong assumptions)
- Context management gaps
- Data flow/field propagation issues

**If known pattern:** Was the existing guidance insufficient? If so, enhance it.

**If new pattern:** This needs new documentation.

### Step 3: Determine Documentation Updates

Based on root cause, decide what needs updating:

| Root Cause Type | Update Target |
|-----------------|---------------|
| Code pattern issue | CLAUDE.md → Common Pitfalls |
| Missing verification step | CLAUDE.md → Definition of Done checklists |
| Process gap | CLAUDE.md → Workflow sections or new skill |
| Tool misuse | CLAUDE.md → Tool-specific guidance |
| Recurring complex issue | New skill in `.claude/skills/` |
| Repeated manual steps | New command in `.claude/commands/` |
| Agent behavior issue | AGENTS.md or agent-specific docs |

### Step 4: Write Prevention Guidance

When adding to documentation, ensure guidance is:

1. **Actionable** - Specific steps, not vague advice
2. **Tool-integrated** - Include actual tool invocations where applicable
3. **Pattern-based** - Show bad vs good code examples
4. **Searchable** - Use clear headings and keywords
5. **Agent-friendly** - Written so any LLM/agent can follow it

**Template for new pitfall documentation:**

```markdown
### [Pitfall Category Name]

**Critical Pattern:** [One-sentence description of the anti-pattern]

1. **[Specific pitfall]** - [Explanation]

   ```typescript
   // BAD - [why this is problematic]
   [code example]
   
   // GOOD - [why this is better]
   [code example]
   ```

**MANDATORY: [Action title]**

[Numbered steps with specific tool invocations]
```

### Step 5: Update Documentation

Make the actual changes:

1. **Read current documentation** using Serena or Read tool
2. **Identify insertion point** - find related existing content
3. **Write new guidance** following the template
4. **Verify no duplication** - don't repeat existing guidance
5. **Cross-reference** - link to related sections if applicable

### Step 6: Log the Improvement

Record what was updated in ConPort:

```
mcp__conport__log_decision(
  summary="Added bug prevention guidance for [pattern]",
  rationale="Bug [description] revealed gap in [area]. Added guidance to prevent recurrence.",
  implementation_details="Updated [file] with [specific additions]",
  tags=["bug-prevention", "documentation", "self-improvement"]
)
```

### Step 7: Commit Documentation Changes

Include documentation updates in the bug fix PR or as a follow-up commit:

```bash
git add CLAUDE.md .claude/skills/ .claude/commands/
git commit -m "docs: add prevention guidance for [bug pattern]"
```

## Quality Checklist

Before completing reflection, verify:

- [ ] Root cause identified (not just symptom)
- [ ] Pattern categorized (new or existing)
- [ ] Guidance is actionable with specific steps
- [ ] Code examples included where applicable
- [ ] Tool invocations specified where applicable
- [ ] ConPort BugReflection entry created
- [ ] Documentation changes committed

## Examples

### Example 1: Data Flow Bug

**Bug:** privacyRights field not appearing in UI
**Root cause:** Manual object transformation dropped new field
**Prevention added:** "Data Flow and Field Propagation Pitfalls" section with:
- Code examples of fragile vs robust patterns
- Mandatory field tracing steps
- Codebase-specific transformation locations

### Example 2: Test Failure Bug

**Bug:** Tests failing due to wrong method signatures
**Root cause:** Tests written without inspecting actual implementation
**Prevention added:** Enhanced "Testing Pitfalls" with:
- Mandatory Serena inspection steps before writing tests
- Specific tool invocations to verify APIs

## Anti-Patterns to Avoid

- **Vague guidance:** "Be careful with transformations" → Instead: specific steps to verify
- **Missing examples:** Abstract advice without code → Include bad/good comparisons
- **One-off notes:** Adding comments only in code → Centralize in CLAUDE.md
- **Skipping reflection:** "It was just a typo" → Even simple bugs may reveal process gaps
- **Over-documenting:** Adding guidance for truly unique one-off issues → Focus on patterns

## Integration with Bug Fix Workflow

This skill integrates with the Bug Fix Complete Checklist in CLAUDE.md. The checklist item "Debug journal closed" should trigger this reflection for any non-trivial bug.

---

**Remember:** Every bug is a gift - it reveals a gap in our defenses. Use this skill to ensure that gift keeps giving by preventing future occurrences.
