# Privacy Policy Analyzer - Architecture Overview

## Core Architecture Pattern
Service-Oriented Context Architecture using React 19 + Vite 7

## Key Architectural Decisions

1. **State Management**: React Context API (2 contexts: LLMConfigContext, AnalysisContext)
   - Rationale: Sufficient for moderate complexity, no external dependencies needed
   - Optimization: Split contexts to minimize re-renders

2. **Service Layer**: Abstract provider pattern for LLM integration
   - BaseLLMProvider (abstract)
   - OpenRouterProvider, OllamaProvider, LMStudioProvider (implementations)
   - LLMProviderFactory for provider instantiation

3. **Component Organization**: 35+ components grouped by responsibility
   - Layout: Header, Main, Footer
   - Input: DocumentInput, URLInput, FileUpload
   - Config: LLMConfigPanel, ProviderSelector, APIKeyInput, ModelSelector
   - Analysis: ProgressIndicator, AnalysisSection
   - Results: ResultsDisplay, SummaryView, RiskHighlights, KeyTermsGlossary
   - Common: ErrorBoundary, Button, Input, Card, LoadingSpinner

4. **Security Strategy**:
   - Input validation at all boundaries (URLs, files)
   - DOMPurify for XSS prevention
   - API keys in sessionStorage only (never localStorage)
   - CORS proxy fallback chain for URL fetching
   - File size limits (10MB for PDFs)

5. **Accessibility**: WCAG 2.1 AA compliance
   - Semantic HTML structure
   - Keyboard navigation support
   - Screen reader compatibility
   - Focus management
   - ARIA labels and live regions

## Data Flow

1. **Document Input Flow**: User → Component validation → Hook → Service (PDFExtractor/URLFetcher) → Preprocessor → Context
2. **Analysis Flow**: User action → Context → Hook orchestration → PolicyAnalyzer → LLM Provider → ResponseParser → Context → UI update
3. **LLM Provider Flow**: Analyzer → Factory → Provider-specific impl → HTTP request → Response parsing → Structured data

## Directory Structure

```
src/
├── components/ (Layout, Input, Config, Analysis, Results, Common)
├── contexts/ (LLMConfigContext, AnalysisContext)
├── hooks/ (useDocumentExtractor, useLLMProvider, useAnalysis)
├── services/
│   ├── llm/ (BaseLLMProvider, provider implementations, factory)
│   ├── document/ (PDFExtractor, URLFetcher, TextPreprocessor)
│   └── analysis/ (PolicyAnalyzer, PromptTemplates, ResponseParser)
├── utils/ (validation, sanitization, formatting, storage, constants)
├── types/ (JSDoc type definitions)
└── styles/ (globals, theme, component styles)
```

## Implementation Phases (28 days)

1. Foundation (Days 1-2): Structure, types, utilities
2. Contexts & Hooks (Days 3-4): State management
3. Service Layer (Days 5-7): LLM providers, document processing
4. Analysis Engine (Days 8-9): Orchestration, prompt templates
5. Common Components (Days 10-11): Reusable UI components
6. Input Components (Days 12-14): File upload, URL input
7. Config Components (Days 15-16): LLM configuration
8. Results Components (Days 17-19): Analysis display
9. Analysis Components (Day 20): Progress tracking
10. Layout & Integration (Days 21-22): Full app assembly
11. Security Review (Day 23): Audit and fixes
12. Accessibility & Polish (Days 24-25): WCAG compliance
13. Testing & QA (Days 26-27): Integration tests, coverage
14. Deployment (Day 28): GitHub Pages

## Performance Targets

- Initial bundle: <200KB (gzip)
- Total bundle: <1MB
- Test coverage: >85%
- Code splitting: PDF worker, LLM providers, Results components

## Key Files to Create/Modify

- MODIFY: src/App.jsx (add providers)
- CREATE: 60+ new files across all directories
- Focus: src/contexts/, src/services/, src/components/

See full architecture blueprint for complete file listing and implementation details.
