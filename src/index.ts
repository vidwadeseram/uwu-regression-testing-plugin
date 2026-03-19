import type { Plugin } from '@opencode-ai/sdk';
import { TestButton } from './components/TestButton';
import { TestReportPanel } from './components/TestReportPanel';
import { runTests } from './tools/runTests';
import { onWorkspaceOpen } from './hooks/onWorkspaceOpen';

const plugin: Plugin = {
  name: 'uwu-regression-testing',
  version: '0.1.0',
  
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
    return {
      ready: true,
    };
  },
};

export default plugin;