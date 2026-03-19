import type { Plugin } from './types/opencode';
import { TestButton } from './components/TestButton';
import { TestReportPanel } from './components/TestReportPanel';
import { runTests } from './tools/runTests';
import { onWorkspaceOpen } from './hooks/onWorkspaceOpen';

const plugin: Plugin = {
  name: 'uwu-regression-testing',
  version: '0.1.0',
  description: 'Automated Playwright regression testing for OpenCode workspaces',
  
  uiSlots: {
    'workspace-toolbar': TestButton,
    'workspace-sidebar': TestReportPanel,
  },
  
  tools: {
    run_regression_tests: runTests,
  },
  
  hooks: {
    onWorkspaceOpen,
  },
  
  async initialize(api) {
    console.log('Regression testing plugin initialized');
    
    // Register MCP server if configured
    const mcpConfig = {
      name: 'playwright-mcp',
      transport: 'stdio',
      command: 'bun',
      args: ['./dist/mcp/playwright-server.js'],
    };
    
    try {
      await api.mcp.register(mcpConfig);
      console.log('Playwright MCP server registered');
    } catch (error) {
      console.warn('Failed to register MCP server (MCP may not be supported):', error);
    }
    
    // Set up global event listeners
    api.events.on('workspace.created', async (event) => {
      console.log(`Workspace created: ${event.workspace.name}`);
      await initializeTestEnvironment(api, event.workspace.name);
    });
    
    api.events.on('workspace.destroyed', async (event) => {
      console.log(`Workspace destroyed: ${event.workspace.name}`);
      // Clean up test artifacts if needed
    });
    
    return {
      ready: true,
      api: {
        runTests: (workspace: string, options?: any) => 
          api.tools.invoke('run_regression_tests', { workspace, ...options }),
        getLatestReport: async (workspace: string) => {
          const reportDir = `.uwu/test-reports/${workspace}/latest`;
          try {
            const exists = await api.files.exists(`${reportDir}/results.json`);
            if (exists) {
              const content = await api.files.read(`${reportDir}/results.json`);
              return JSON.parse(content);
            }
          } catch (error) {
            console.error('Error getting latest report:', error);
          }
          return null;
        },
      },
    };
  },
  
  async destroy() {
    console.log('Regression testing plugin destroyed');
    // Clean up any resources
  },
};

async function initializeTestEnvironment(api: any, workspaceName: string): Promise<void> {
  try {
    const baseReportDir = `.uwu/test-reports/${workspaceName}`;
    await api.files.ensureDirectory(baseReportDir);
    console.log(`Test environment initialized for workspace: ${workspaceName}`);
  } catch (error) {
    console.error(`Failed to initialize test environment for ${workspaceName}:`, error);
  }
}

export default plugin;