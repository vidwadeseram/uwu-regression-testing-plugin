// Type definitions for OpenCode SDK
// These are minimal types for development - actual types will be provided by OpenCode at runtime

export interface PluginAPI {
  workspace: {
    getCurrent(): WorkspaceInfo | null;
    listFiles(pattern: string): Promise<string[]>;
    execute(command: string): Promise<ExecuteResult>;
  };
  tmux: {
    spawn(name: string, command: string[]): Promise<TmuxPane>;
    attach(paneId: string): Promise<void>;
    focusWindow(name: string): Promise<void>;
  };
  ui: {
    showNotification(message: string, type: 'info' | 'error' | 'warning' | 'success'): void;
    sidebar: {
      open(name: string): void;
      close(name: string): void;
    };
  };
  files: {
    exists(path: string): Promise<boolean>;
    read(path: string): Promise<string>;
    write(path: string, content: string): Promise<void>;
    ensureDirectory(path: string): Promise<void>;
    list(path: string): Promise<Array<{ name: string; type: 'file' | 'directory' }>>;
    glob(pattern: string): Promise<string[]>;
    open(path: string): void;
    symlink(target: string, link: string): Promise<void>;
  };
  tools: {
    invoke(name: string, args: any): Promise<any>;
  };
  events: {
    on(event: string, handler: (data: any) => void): () => void;
    emit(event: string, data: any): Promise<void>;
  };
  mcp: {
    register(config: any): Promise<void>;
  };
}

export interface WorkspaceInfo {
  name: string;
  path: string;
  status: 'stopped' | 'starting' | 'running' | 'stopping';
}

export interface ExecuteResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface TmuxPane {
  id: string;
  execute(command: string): Promise<ExecuteResult>;
  kill(): Promise<void>;
}

export interface ToolContext {
  api: PluginAPI;
}

export interface HookContext {
  api: PluginAPI;
  workspace: WorkspaceInfo;
}

export interface Plugin {
  name: string;
  version: string;
  description?: string;
  uiSlots: Record<string, any>;
  tools: Record<string, (args: any, context: ToolContext) => Promise<any>>;
  hooks: Record<string, (context: HookContext) => Promise<void>>;
  initialize?(api: PluginAPI): Promise<{ ready: boolean; [key: string]: any }>;
  destroy?(): Promise<void>;
}