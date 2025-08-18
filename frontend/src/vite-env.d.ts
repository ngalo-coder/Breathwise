/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_ARCGIS_API_KEY?: string
  readonly VITE_AUTH0_DOMAIN?: string
  readonly VITE_AUTH0_CLIENT_ID?: string
  readonly VITE_ENABLE_AUTH?: string
  readonly VITE_ENABLE_REALTIME?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}