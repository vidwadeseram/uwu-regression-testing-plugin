# uwu-regression-testing-plugin

Automated Playwright regression testing plugin for OpenCode workspaces.

## Features

- **One-click testing**: Run Playwright tests from workspace toolbar
- **Headless execution**: Tests run in dedicated tmux windows
- **Comprehensive reports**: View pass/fail results with screenshots and traces
- **Artifact storage**: Test results stored in `.uwu/test-reports/`
- **Multi-browser support**: Chromium, Firefox, WebKit

## Installation

Add to your workspace `.opencode` file:

```json
{
  "plugin": ["oh-my-opencode", "uwu-regression-testing-plugin"]
}
```

## Usage

1. **Write tests**: Create Playwright tests in your workspace
2. **Run tests**: Click "Run Tests" button in workspace toolbar
3. **View results**: Check sidebar panel for detailed reports

## Configuration

Create `playwright.config.ts` in your workspace:

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
});
```

## Development

```bash
# Install dependencies
bun install

# Build plugin
bun run build

# Run tests
bun test

# Lint and format
bun run lint
bun run format
```

## Architecture

The plugin uses OpenCode's headless execution API to:
1. Spawn dedicated tmux window for test execution
2. Install Playwright dependencies
3. Run tests with comprehensive reporting
4. Capture screenshots, traces, and videos
5. Display results in UI

## License

MIT