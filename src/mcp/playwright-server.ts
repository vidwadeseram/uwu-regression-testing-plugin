import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ToolSchema,
} from '@modelcontextprotocol/sdk/types.js';

// MCP server for Playwright test execution
// This allows external tools to trigger regression tests via MCP protocol

const server = new Server(
  {
    name: 'uwu-regression-testing-plugin',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define MCP tools
const tools: ToolSchema[] = [
  {
    name: 'run_playwright_tests',
    description: 'Run Playwright regression tests for a workspace',
    inputSchema: {
      type: 'object',
      properties: {
        workspace: {
          type: 'string',
          description: 'Workspace name to run tests for',
        },
        testPath: {
          type: 'string',
          description: 'Optional specific test file or directory to run',
        },
        browser: {
          type: 'string',
          enum: ['chromium', 'firefox', 'webkit'],
          default: 'chromium',
          description: 'Browser to run tests in',
        },
      },
      required: ['workspace'],
    },
  },
  {
    name: 'get_test_report',
    description: 'Get the latest test report for a workspace',
    inputSchema: {
      type: 'object',
      properties: {
        workspace: {
          type: 'string',
          description: 'Workspace name to get report for',
        },
      },
      required: ['workspace'],
    },
  },
  {
    name: 'list_test_artifacts',
    description: 'List available test artifacts (screenshots, traces, videos)',
    inputSchema: {
      type: 'object',
      properties: {
        workspace: {
          type: 'string',
          description: 'Workspace name',
        },
        reportId: {
          type: 'string',
          description: 'Optional specific report ID (timestamp)',
        },
      },
      required: ['workspace'],
    },
  },
];

// Tool: Run Playwright tests
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === 'run_playwright_tests') {
    const { workspace, testPath, browser = 'chromium' } = request.params.arguments as any;
    
    try {
      // In a real implementation, this would call the actual test runner
      // For now, simulate test execution
      console.log(`Starting Playwright tests for workspace: ${workspace}`);
      console.log(`Test path: ${testPath || 'all tests'}`);
      console.log(`Browser: ${browser}`);
      
      // Simulate test execution delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate test results
      const result = {
        workspace,
        timestamp: Date.now(),
        result: {
          passed: 5,
          failed: 1,
          total: 6,
          duration: 2345,
          tests: [
            { name: 'homepage title', status: 'passed', duration: 123 },
            { name: 'basic navigation', status: 'passed', duration: 234 },
            { name: 'form submission', status: 'passed', duration: 345 },
            { name: 'api endpoint', status: 'passed', duration: 456 },
            { name: 'user authentication', status: 'passed', duration: 567 },
            { name: 'mobile responsive', status: 'failed', duration: 678, error: 'Viewport mismatch' },
          ],
          artifacts: {
            htmlReport: `.uwu/test-reports/${workspace}/latest/playwright-report/index.html`,
            jsonReport: `.uwu/test-reports/${workspace}/latest/results.json`,
            screenshots: [`.uwu/test-reports/${workspace}/latest/test-failed-1.png`],
            traces: [`.uwu/test-reports/${workspace}/latest/trace.zip`],
            videos: [`.uwu/test-reports/${workspace}/latest/video.webm`],
          },
        },
      };
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
      
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error running tests: ${error}`,
          },
        ],
        isError: true,
      };
    }
  }
  
  if (request.params.name === 'get_test_report') {
    const { workspace } = request.params.arguments as any;
    
    try {
      // Simulate getting latest report
      const reportPath = `.uwu/test-reports/${workspace}/latest/results.json`;
      console.log(`Getting test report from: ${reportPath}`);
      
      // Simulate report data
      const report = {
        workspace,
        reportPath,
        summary: {
          passed: 5,
          failed: 1,
          total: 6,
          duration: 2345,
        },
        timestamp: Date.now() - 3600000, // 1 hour ago
      };
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(report, null, 2),
          },
        ],
      };
      
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error getting report: ${error}`,
          },
        ],
        isError: true,
      };
    }
  }
  
  if (request.params.name === 'list_test_artifacts') {
    const { workspace, reportId } = request.params.arguments as any;
    
    try {
      const reportDir = reportId 
        ? `.uwu/test-reports/${workspace}/${reportId}`
        : `.uwu/test-reports/${workspace}/latest`;
      
      console.log(`Listing artifacts from: ${reportDir}`);
      
      // Simulate artifact listing
      const artifacts = {
        workspace,
        reportDir,
        artifacts: {
          screenshots: [
            `${reportDir}/test-failed-1.png`,
            `${reportDir}/test-failed-2.png`,
          ],
          traces: [
            `${reportDir}/trace.zip`,
          ],
          videos: [
            `${reportDir}/video.webm`,
          ],
          reports: [
            `${reportDir}/playwright-report/index.html`,
            `${reportDir}/results.json`,
          ],
        },
      };
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(artifacts, null, 2),
          },
        ],
      };
      
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error listing artifacts: ${error}`,
          },
        ],
        isError: true,
      };
    }
  }
  
  return {
    content: [
      {
        type: 'text',
        text: `Unknown tool: ${request.params.name}`,
      },
    ],
    isError: true,
  };
});

// Tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Start MCP server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('uwu-regression-testing-plugin MCP server started');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});