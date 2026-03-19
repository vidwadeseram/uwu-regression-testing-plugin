import { createSignal } from 'solid-js';
import type { PluginAPI } from '../types/opencode';

interface TestButtonProps {
  api: PluginAPI;
}

export function TestButton(props: TestButtonProps) {
  const [running, setRunning] = createSignal(false);
  const [report, setReport] = createSignal<any>(null);
  
  const runTests = async () => {
    setRunning(true);
    try {
      const workspace = props.api.workspace.getCurrent();
      if (!workspace) {
        props.api.ui.showNotification('No workspace selected', 'error');
        return;
      }
      
      const result = await props.api.tools.invoke('run_regression_tests', {
        workspace: workspace.name,
      });
      
      setReport(result);
      props.api.ui.showNotification(`Tests completed: ${result.passed} passed, ${result.failed} failed`, 'info');
      
      props.api.ui.sidebar.open('test-report');
    } catch (error) {
      props.api.ui.showNotification(`Tests failed: ${error}`, 'error');
    } finally {
      setRunning(false);
    }
  };
  
  return (
    <button
      onClick={runTests}
      disabled={running()}
      class="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
    >
      {running() ? 'Running Tests...' : 'Run Tests'}
    </button>
  );
}