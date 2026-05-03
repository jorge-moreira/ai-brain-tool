import { BrowserWindow, BrowserView, Updater } from 'electrobun/bun'
import { detectPython, ensureUv } from '../../../core/src/graphify'
import { detectAll, configureSelected } from '../../../core/src/platforms'
import { homedir } from 'os'

const DEV_SERVER_PORT = 5173
const DEV_SERVER_URL = `http://localhost:${DEV_SERVER_PORT}`
const homeDir = homedir()

// Window sizes
const WIZARD_SIZE = { width: 700, height: 750 };
const DASHBOARD_SIZE = { width: 1200, height: 800 };

let mainWindow: BrowserWindow | null = null;

// Define RPC type for renderer↔bun communication
type AppRPCType = {
  bun: {
    requests: {
      'detect-python': { params: void; response: { detected: boolean; path: string | null } }
      'ensure-uv': { params: void; response: { success: boolean; error?: string } }
      'detect-ai-tools': { params: void; response: Array<{ key: string; name: string; detected: boolean; configHint: string }> }
      'install-skills': { params: string[]; response: { success: boolean; error?: string } }
      'resize-window': { params: { size: 'wizard' | 'dashboard' }; response: void }
    }
  }
  webview: {}
}

// Create RPC instance with bun-side handlers
const appRPC = BrowserView.defineRPC<AppRPCType>({
  handlers: {
    requests: {
      'detect-python': async () => {
        const pythonPath = await detectPython()
        return { detected: pythonPath !== null, path: pythonPath }
      },
      'ensure-uv': async () => {
        try {
          await ensureUv()
          return { success: true }
        } catch (error) {
          return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          }
        }
      },
      'detect-ai-tools': async () => {
        try {
          const platforms = await detectAll(homeDir)
          return platforms.map(p => ({
            key: p.key,
            name: p.name,
            detected: p.detected,
            configHint: p.configHint
          }))
        } catch (error) {
          console.error('Error detecting AI tools:', error)
          return []
        }
      },
      'install-skills': async (selectedTools: string[]) => {
        try {
          const platforms = await detectAll(homeDir)
          const selected = platforms.filter(p => selectedTools.includes(p.key))
          await configureSelected({ selected, brainPath: homeDir, homeDir })
          return { success: true }
        } catch (error) {
          return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          }
        }
      },
      'resize-window': async ({ size }) => {
        const targetSize = size === 'wizard' ? WIZARD_SIZE : DASHBOARD_SIZE
        if (mainWindow) {
          mainWindow.setSize(targetSize.width, targetSize.height)
        }
      }
    }
  }
})

// Handle raw RPC requests from renderer (for custom RPC client)
function handleRpcRequest(view: BrowserView, message: string) {
  try {
    const request = JSON.parse(message);
    if (request.type !== 'request') return;
    
    const { id, method, params } = request;
    
    Promise.resolve().then(async () => {
      let result: any;
      let error: string | undefined;
      
      try {
        // Call the handler directly based on method name
        switch (method) {
          case 'detect-python':
            const pythonPath = await detectPython()
            result = { detected: pythonPath !== null, path: pythonPath }
            break;
          case 'ensure-uv':
            await ensureUv()
            result = { success: true }
            break;
          case 'detect-ai-tools':
            const platforms = await detectAll(homeDir)
            result = platforms.map(p => ({
              key: p.key,
              name: p.name,
              detected: p.detected,
              configHint: p.configHint
            }))
            break;
          case 'install-skills':
            const allPlatforms = await detectAll(homeDir)
            const selected = allPlatforms.filter(p => params.includes(p.key))
            await configureSelected({ selected, brainPath: homeDir, homeDir })
            result = { success: true }
            break;
          case 'resize-window':
            const targetSize = params.size === 'wizard' ? WIZARD_SIZE : DASHBOARD_SIZE
            if (mainWindow) {
              mainWindow.setSize(targetSize.width, targetSize.height)
            }
            result = undefined
            break;
          default:
            error = `Unknown method: ${method}`
        }
      } catch (e) {
        error = e instanceof Error ? e.message : 'Unknown error';
      }
      
      // Send response back to renderer using ElectroBun's wire protocol
      const response = error 
        ? { type: 'response' as const, id, success: false as const, error }
        : { type: 'response' as const, id, success: true as const, payload: result };
      
      view.webview.postMessage(JSON.stringify(response));
    });
  } catch (e) {
    console.error('RPC handler Error:', e);
  }
}

// Check if Vite dev server is running for HMR
async function getMainViewUrl(): Promise<string> {
  const channel = await Updater.localInfo.channel()
  if (channel === 'dev') {
    try {
      await fetch(DEV_SERVER_URL, { method: 'HEAD' })
      console.log(`HMR enabled: Using Vite dev server at ${DEV_SERVER_URL}`)
      return DEV_SERVER_URL
    } catch {
      console.log("Vite dev server not running. Run 'bun run dev:hmr' for HMR support.")
    }
  }
  return 'views://mainview/index.html'
}

// Create the main application window with RPC
const url = await getMainViewUrl()

mainWindow = new BrowserWindow({
  title: 'AI Brain Tool',
  url,
  frame: {
    width: WIZARD_SIZE.width,
    height: WIZARD_SIZE.height,
    x: 200,
    y: 200
  },
  rpc: appRPC
})

// Set up message handler for custom RPC
mainWindow.webview.on('message', (event: { message: string }) => {
  handleRpcRequest(mainWindow.webview, event.message);
});

console.log('AI Brain Tool (ElectroBun) started!')
