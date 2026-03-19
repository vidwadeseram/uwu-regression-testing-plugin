import { createSignal, createEffect } from 'solid-js';
import type { PluginAPI } from '../types/opencode';

interface TestReport {
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

interface TestReportPanelProps {
  api: PluginAPI;
}

export function TestReportPanel(props: TestReportPanelProps) {
  const [report, setReport] = createSignal<TestReport | null>(null);
  
  createEffect(() => {
    const unsubscribe = props.api.events.on('test-completed', (event) => {
      setReport(event.report);
    });
    
    return unsubscribe;
  });
  
  const openArtifact = (path: string) => {
    props.api.files.open(path);
  };
  
  const viewInTmux = () => {
    props.api.tmux.focusWindow('regression-tests');
  };
  
  return (
    <div class="p-4">
      {report() ? (
        <>
          <div class="mb-6">
            <h2 class="text-xl font-bold mb-2">Test Results</h2>
            <div class="grid grid-cols-3 gap-4 mb-4">
              <div class="bg-green-100 p-3 rounded">
                <div class="text-2xl font-bold text-green-800">{report()!.passed}</div>
                <div class="text-sm text-green-600">Passed</div>
              </div>
              <div class="bg-red-100 p-3 rounded">
                <div class="text-2xl font-bold text-red-800">{report()!.failed}</div>
                <div class="text-sm text-red-600">Failed</div>
              </div>
              <div class="bg-blue-100 p-3 rounded">
                <div class="text-2xl font-bold text-blue-800">{report()!.total}</div>
                <div class="text-sm text-blue-600">Total</div>
              </div>
            </div>
            <div class="text-sm text-gray-600">
              Duration: {report()!.duration}ms
            </div>
          </div>
          
          {report()!.failed > 0 && (
            <div class="mb-6">
              <h3 class="text-lg font-semibold mb-2">Failed Tests</h3>
              <div class="space-y-3">
                {report()!.tests
                  .filter(test => test.status === 'failed')
                  .map((test, index) => (
                    <div key={index} class="border border-red-200 rounded p-3">
                      <div class="font-medium text-red-800">{test.name}</div>
                      {test.error && (
                        <div class="text-sm text-red-600 mt-1">{test.error}</div>
                      )}
                      <div class="flex gap-2 mt-2">
                        {test.screenshot && (
                          <button
                            onClick={() => openArtifact(test.screenshot!)}
                            class="text-sm bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
                          >
                            View Screenshot
                          </button>
                        )}
                        {test.trace && (
                          <button
                            onClick={() => openArtifact(test.trace!)}
                            class="text-sm bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
                          >
                            View Trace
                          </button>
                        )}
                        {test.video && (
                          <button
                            onClick={() => openArtifact(test.video!)}
                            class="text-sm bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
                          >
                            View Video
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
          
          <div class="mb-6">
            <h3 class="text-lg font-semibold mb-2">Artifacts</h3>
            <div class="space-y-2">
              {report()!.artifacts.htmlReport && (
                <button
                  onClick={() => openArtifact(report()!.artifacts.htmlReport)}
                  class="w-full text-left bg-gray-50 hover:bg-gray-100 p-2 rounded"
                >
                  📊 HTML Report
                </button>
              )}
              {report()!.artifacts.jsonReport && (
                <button
                  onClick={() => openArtifact(report()!.artifacts.jsonReport)}
                  class="w-full text-left bg-gray-50 hover:bg-gray-100 p-2 rounded"
                >
                  📋 JSON Report
                </button>
              )}
            </div>
          </div>
          
          <button
            onClick={viewInTmux}
            class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
          >
            View in tmux
          </button>
        </>
      ) : (
        <div class="text-center py-8 text-gray-500">
          No test results yet. Run tests to see results here.
        </div>
      )}
    </div>
  );
}