// Augment Vite's typed env (already referenced via tsconfig "types": ["vite/client"]).
interface ImportMetaEnv {
  /** Optional override of the API base path. Defaults to "/api" (same-origin). */
  readonly VITE_API_BASE_URL?: string;
}
