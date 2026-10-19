/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Analytics script URL. Unset = no analytics loads, whatever the visitor chose. */
  readonly VITE_ANALYTICS_SRC?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
