# MaiHouses Project Context (GEMINI.md)

## Project Overview

**MaiHouses (邁房子)** is a comprehensive real estate platform built with modern web technologies. It features community reviews ("Community Wall"), intelligent property recommendations, and an AI assistant named "MaiMai".

The system leverages a serverless architecture for scalability and ease of deployment. It integrates advanced tracking features (UAG - User Activity & Growth) to provide insights into user behavior and lead generation.

### Key Technologies

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Vercel Serverless Functions (`api/` directory), Supabase (Database & Auth)
- **AI/LLM**: OpenAI integration (via `src/services/openai.ts`), Claude, Replicate
- **Testing**: Vitest, Playwright

### Core Modules

- **MaiMai Assistant**: AI-powered chat interface (`src/pages/Chat/`, `src/components/MaiMai/`).
- **Community Wall**: Platform for community reviews and discussions.
- **UAG System**: Advanced user tracking and analytics (v8.0) using Supabase RPC and fingerprinting.

## Building and Running

The project uses `npm` for dependency management and scripts.

### Key Commands

- **Start Development Server**: `npm run dev` (Runs Vite on localhost)
- **Build for Production**: `npm run build` (Runs typecheck and Vite build)
- **Type Check**: `npm run typecheck` (Runs `tsc`)
- **Lint Code**: `npm run lint` (Runs ESLint)
- **Run Unit Tests**: `npm run test` (Runs Vitest)
- **Quality Gate**: `npm run gate` (Runs a combination of checks, required before commits)
- **Verify UI**: `npm run lint:ui` (Runs `check-ui.sh`)

## Development Conventions

### Coding Style

- **TypeScript**: Strict mode is enabled. **No `any` types allowed.** Interfaces and types must be explicitly defined in `src/types/`.
- **React**: Use Functional Components with Hooks. Avoid Class Components.
- **Styling**: Use **Tailwind CSS** utility classes. Avoid inline styles.
- **Language**: **Traditional Chinese (Taiwan)** must be used for all UI text, error messages, and comments.

### Architectural Patterns

- **API**: Serverless functions in `api/` should be used for backend logic. Frontend calls these endpoints or uses Supabase client directly where appropriate.
- **State Management**: React Query (`@tanstack/react-query`) is used for data fetching. Zustand is used for global state.
- **Directory Structure**:
  - `src/components`: Reusable UI components.
  - `src/pages`: Route components.
  - `src/services`: API wrappers and business logic.
  - `src/hooks`: Custom React hooks.
  - `scripts`: DevOps and maintenance scripts (e.g., `ai-supervisor.sh`).

### Agent Rules (Critical)

- **Skills Search**: Always search for available tools/skills before writing code (per `.clinerules`).
- **Read-Before-Write**: Always read relevant files (including types and configs) before modifying code.
- **Safety**: Do not commit API keys. Use environment variables.
- **Validation**: Always run `npm run typecheck` and `npm run lint` after changes.

## Documentation & Configuration

- **`CLAUDE.md`**: Primary developer guide and rule set.
- **`.clinerules`**: Specific rules for AI agents (Cline/Gemini).
- **`README.md`**: General project info and deployment guides.
- **`docs/COMMUNITY_WALL_TODO.md`**: Tracking for current tasks and features.
- **`tailwind.config.cjs`**: Tailwind configuration (Theme, Colors).

## Environment Setup

- Copy `.env.example` to `.env` and populate with necessary API keys (OpenAI, Supabase, etc.) for local development.
- Verify setup with `bash scripts/check-ai.sh`.
