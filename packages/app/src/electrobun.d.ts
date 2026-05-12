// ElectroBun global type declarations
interface Window {
  __electrobun?: {
    receiveMessageFromBun?: (msg: unknown) => void
  }
  __electrobunBunBridge?: {
    postMessage: (msg: string) => void
  }
}

// Three.js module declaration (electrobun dependency)
declare module 'three'
