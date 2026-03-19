# uwu-regression-testing-plugin

Automated Playwright regression testing plugin for OpenCode workspaces.

## Features

- **One-click testing**: Run Playwright tests from workspace toolbar
- **Headless execution**: Tests run in dedicated tmux windows
- **Comprehensive reports**: View pass/fail results with screenshots and traces
- **Artifact storage**: Test results stored in `.uwu/test-reports/`
- **Multi-browser support**: Chromium, Firefox, WebKit

## Installation

### For uwu-my-opencode (Injection Method)

The plugin uses uwu-daemon's injection system via workspace `.opencode` files:

1. **Deploy to server**:
   ```bash
   chmod +x deploy-to-server.sh
   ./deploy-to-server.sh
   ```

2. **Manual installation**:
   - Copy the plugin to your server: `/root/uwu-my-opencode/plugins/uwu-regression-testing-plugin/`
   - Update workspace `.opencode` files to include the plugin:

```json
{
  "plugin": [
    "oh-my-opencode",
    {
      "name": "external-plugin-loader",
      "config": {
        "enabled": true,
        "autoInstall": true,
        "plugins": [
          {
            "type": "local",
            "source": "/root/uwu-my-opencode/plugins/uwu-regression-testing-plugin",
            "enabled": true,
            "name": "uwu-regression-testing-plugin"
          }
        ]
      }
    }
  ]
}
```

### For Standalone OpenCode

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

## Testing

### After Deployment

1. **Verify deployment**:
   ```bash
   chmod +x verify-deployment.sh
   ./verify-deployment.sh
   ```

2. **Run test script on server**:
   ```bash
   ssh root@149.28.143.214
   /root/uwu-my-opencode/test-regression-plugin.sh
   ```

3. **Test Playwright execution**:
   - Access workspace: https://code.vidwadeseram.com/
   - Navigate to the "regression-testing" workspace
   - Click "Run Tests" button in toolbar
   - Check sidebar for test results

4. **Verify test artifacts**:
   - Check `.uwu/test-reports/` directory in workspace
   - Verify screenshots, traces, and videos are captured
   - Confirm test reports are displayed in UI

### Manual Testing

Create a test file in your workspace:

```typescript
// tests/example.spec.ts
import { test, expect } from '@playwright/test';

test('basic test', async ({ page }) => {
  await page.goto('https://example.com');
  await expect(page).toHaveTitle('Example Domain');
});

test('click test', async ({ page }) => {
  await page.goto('https://example.com');
  await page.click('a');
  await expect(page).toHaveURL(/iana/);
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