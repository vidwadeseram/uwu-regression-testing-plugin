import type { ToolContext } from '../types/opencode';

export interface RunTestsArgs {
  workspace: string;
  testPath?: string;
  browser?: 'chromium' | 'firefox' | 'webkit';
}

export interface TestResult {
  passed: number;
  failed: number;
  total: number;
  duration: number;
  tests: Array<{
    name: string;
    status: 'passed' | 'failed' | 'skipped';
    duration: number;
    error?: string;
    screenshot?: string;
    trace?: string;
    video?: string;
  }>;
  artifacts: {
    htmlReport: string;
    jsonReport: string;
    screenshots: string[];
    traces: string[];
    videos: string[];
  };
}

export async function runTests(args: RunTestsArgs, context: ToolContext): Promise<TestResult> {
  const { workspace, testPath, browser = 'chromium' } = args;
  const { api } = context;
  
  // Get workspace information
  const workspaceInfo = api.workspace.getCurrent();
  if (!workspaceInfo) {
    throw new Error('No workspace selected');
  }
  
  if (workspaceInfo.name !== workspace) {
    throw new Error(`Workspace mismatch: expected ${workspace}, got ${workspaceInfo.name}`);
  }
  
  // Create test report directory
  const timestamp = Date.now();
  const reportDir = `.uwu/test-reports/${workspace}/${timestamp}`;
  await api.files.ensureDirectory(reportDir);
  
  // Create dedicated tmux window for test execution
  const tmuxWindow = await api.tmux.spawn('regression-tests', ['bash']);
  
  try {
    // 1. Prepare test environment in tmux
    await tmuxWindow.execute('cd "$(pwd)"');
    
    // 2. Check if Playwright is installed, install if not
    const playwrightCheck = await tmuxWindow.execute('which playwright || echo "not-installed"');
    if (playwrightCheck.stdout.includes('not-installed')) {
      await tmuxWindow.execute('bun install @playwright/test');
      await tmuxWindow.execute('bunx playwright install --with-deps');
    }
    
    // 3. Create playwright config if not exists
    const configPath = 'playwright.config.ts';
    const configExists = await api.files.exists(configPath);
    if (!configExists) {
      const defaultConfig = `import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: '${reportDir}/playwright-report' }],
    ['json', { outputFile: '${reportDir}/results.json' }],
    ['list']
  ],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    baseURL: 'http://localhost:3000',
  },
  projects: [
    {
      name: '${browser}',
      use: { browserName: '${browser}' },
    },
  ],
});`;
      await api.files.write(configPath, defaultConfig);
    }
    
    // 4. Run tests with trace on failure
    const testCmd = [
      'bunx playwright test',
      testPath || '',
      `--browser=${browser}`,
      `--output=${reportDir}`,
      '--reporter=html,json,list',
      '--trace=on-first-retry',
      '--screenshot=only-on-failure',
      '--video=retain-on-failure',
    ].filter(Boolean).join(' ');
    
    const result = await tmuxWindow.execute(testCmd);
    
    // 5. Parse results
    const jsonReportPath = `${reportDir}/results.json`;
    let report: any = { suites: [] };
    
    if (await api.files.exists(jsonReportPath)) {
      const reportContent = await api.files.read(jsonReportPath);
      report = JSON.parse(reportContent);
    }
    
    // 6. Collect artifacts
    const htmlReport = `${reportDir}/playwright-report/index.html`;
    const screenshots = await collectArtifacts(reportDir, '*.png', api);
    const traces = await collectArtifacts(reportDir, '*.zip', api);
    const videos = await collectArtifacts(reportDir, '*.webm', api);
    
    // 7. Generate summary
    const summary = generateSummary(report);
    
    // 8. Store artifacts metadata
    const testResult: TestResult = {
      passed: summary.passed,
      failed: summary.failed,
      total: summary.total,
      duration: summary.duration,
      tests: summary.tests,
      artifacts: {
        htmlReport: await api.files.exists(htmlReport) ? htmlReport : '',
        jsonReport: jsonReportPath,
        screenshots,
        traces,
        videos,
      },
    };
    
    // 9. Emit test completion event
    await api.events.emit('test-completed', {
      workspace,
      result: testResult,
      timestamp,
    });
    
    return testResult;
    
  } catch (error) {
    // Cleanup on error
    await tmuxWindow.kill();
    throw error;
  }
}

async function collectArtifacts(reportDir: string, pattern: string, api: any): Promise<string[]> {
  try {
    const files = await api.files.glob(`${reportDir}/**/${pattern}`);
    return files;
  } catch {
    return [];
  }
}

function generateSummary(report: any) {
  let passed = 0;
  let failed = 0;
  let total = 0;
  let duration = 0;
  const tests: TestResult['tests'] = [];
  
  function processSuite(suite: any) {
    if (suite.specs) {
      for (const spec of suite.specs) {
        total++;
        duration += spec.duration || 0;
        
        const testResult: TestResult['tests'][0] = {
          name: spec.title,
          status: spec.ok ? 'passed' : 'failed',
          duration: spec.duration || 0,
        };
        
        if (spec.ok) {
          passed++;
        } else {
          failed++;
          testResult.error = spec.error?.message || 'Test failed';
          
          // Collect artifact paths from test result
          if (spec.attachments) {
            for (const attachment of spec.attachments) {
              if (attachment.name === 'screenshot') {
                testResult.screenshot = attachment.path;
              } else if (attachment.name === 'trace') {
                testResult.trace = attachment.path;
              } else if (attachment.name === 'video') {
                testResult.video = attachment.path;
              }
            }
          }
        }
        
        tests.push(testResult);
      }
    }
    
    if (suite.suites) {
      for (const childSuite of suite.suites) {
        processSuite(childSuite);
      }
    }
  }
  
  for (const suite of report.suites || []) {
    processSuite(suite);
  }
  
  return { passed, failed, total, duration, tests };
}