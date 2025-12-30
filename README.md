<p align="center">
  <img src="./src/assets/privacy_policy_distiller.png" alt="Privacy Policy Distiller" width="400">
</p>

A web application that uses LLMs to distill, break down, and summarize privacy policies in plain language for everyday people.  [Try it now!](https://privacydistiller.com)
## Features

- **Multi-Source Input**: Analyze policies via URL or PDF upload
- **LLM Integration**: Support for OpenRouter, Ollama, and LM Studio
- **Privacy Risk Detection**: Identify and highlight significant privacy concerns
- **Plain Language Summaries**: Multiple detail levels (brief, detailed, full)
- **Security-First**: Session-only local API key storage, XSS prevention
- **Accessible**: WCAG 2.1 AA compliant

## Tech Stack

- **Frontend**: React 19 + Vite 7
- **PDF Processing**: pdf.js (client-side)
- **Security**: DOMPurify for XSS prevention
- **Hosting**: GitHub Pages

## Screenshot
<img width="1358" height="967" alt="image" src="https://github.com/user-attachments/assets/e2793d88-aa17-490b-962a-7295a516442e" />


## Getting Started

### Prerequisites

**Option 1: Devcontainer (Recommended)**
- Docker Desktop
- Zed editor or VS Code with Dev Containers extension

**Option 2: Local Development**
- Node.js 20+ and npm

### Installation

**Using Devcontainer (Recommended)**
1. Ensure Docker Desktop is running
2. Open project in Zed or VS Code
3. When prompted, select "Reopen in Container" (or use Command Palette: "Dev Containers: Reopen in Container")
4. Wait for container build and `npm install` to complete automatically
5. Run `npm run dev` in the container terminal

**Local Development**
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Why Devcontainer?
- **Security**: Sandboxed environment for Claude Code
- **Consistency**: Exact Node.js 20 environment
- **Isolation**: Project files only, no host system access
- **Recommended**: Official Anthropic best practice

### Development Scripts

- `npm run dev` - Start dev server on port 3000
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run tests with Vitest
- `npm run test:ui` - Run tests with UI
- `npm run lint` - Lint code with ESLint
- `npm run format` - Format code with Prettier
- `npm run deploy` - Deploy to GitHub Pages

## LLM Setup

### OpenRouter
1. Get API key from [openrouter.ai](https://openrouter.ai)
2. Enter key in the app settings (stored in session storage with 60-minute inactivity timeout)

### Ollama (Local)
1. Install [Ollama](https://ollama.ai)
2. Run `ollama serve`
3. Pull a model: `ollama pull gpt-oss:20b`
4. Select Ollama in app settings

### LM Studio (Local)
1. Install [LM Studio](https://lmstudio.ai)
2. Download a model
3. Start local server
4. Select LM Studio in app settings

## Project Structure

See [CLAUDE.md](./CLAUDE.md) for detailed architecture and development guidance.

## License

MIT License with Commercial Product Restriction
