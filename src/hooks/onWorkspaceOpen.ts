import type { HookContext } from '../types/opencode';

export async function onWorkspaceOpen(context: HookContext): Promise<void> {
  const { api, workspace } = context;
  await initializeTestEnvironment(api, workspace.name);
}

async function initializeTestEnvironment(api: any, workspaceName: string): Promise<void> {
  try {
    const baseReportDir = `.uwu/test-reports/${workspaceName}`;
    await api.files.ensureDirectory(baseReportDir);
    
    const latestLink = `${baseReportDir}/latest`;
    const reports = await api.files.list(baseReportDir);
    const timestampDirs = reports
      .filter(dir => /^\d+$/.test(dir.name))
      .sort((a, b) => parseInt(b.name) - parseInt(a.name));
    
    if (timestampDirs.length > 0) {
      const latestDir = `${baseReportDir}/${timestampDirs[0].name}`;
      await api.files.symlink(latestDir, latestLink);
    }
    
    const configPath = 'playwright.config.ts';
    const configExists = await api.files.exists(configPath);
    
    if (!configExists) {
      await api.files.ensureDirectory('tests');
      
      const testFiles = await api.files.list('tests');
      if (testFiles.length === 0) {
        const sampleTest = `import { test, expect } from '@playwright/test';

test('homepage has correct title', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page).toHaveTitle(/.*/);
});

test('basic navigation', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.getByRole('heading')).toBeVisible();
});`;
        
        await api.files.write('tests/example.spec.ts', sampleTest);
      }
    }
    
    api.events.on('test-completed', async (event: any) => {
      if (event.workspace === workspaceName) {
        const reportDir = `.uwu/test-reports/${workspaceName}/${event.timestamp}`;
        await api.files.symlink(reportDir, latestLink);
        
        const { result } = event;
        const message = result.failed > 0 
          ? `Tests completed with ${result.failed} failures`
          : `All ${result.passed} tests passed`;
        
        api.ui.showNotification(message, result.failed > 0 ? 'warning' : 'success');
      }
    });
    
    console.log(`Test environment initialized for workspace: ${workspaceName}`);
    
  } catch (error) {
    console.error(`Failed to initialize test environment for ${workspaceName}:`, error);
  }
}