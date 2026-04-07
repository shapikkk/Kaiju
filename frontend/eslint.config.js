import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const fsdPlugin = require('@conarti/eslint-plugin-feature-sliced')

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      'feature-sliced': fsdPlugin,
    },
    rules: {
      'feature-sliced/layers-slices': 'error',
      'feature-sliced/absolute-relative': 'error',
      'feature-sliced/public-api': 'error',
    },
  },
  {
    // shadcn/ui components use @radix-ui/* and @dnd-kit/* which look like FSD
    // aliases to the plugin but are external npm packages. Suppress the
    // false-positive absolute-relative rule for the entire shared/ui layer.
    files: ['src/shared/ui/**/*.{ts,tsx}', 'src/shared/lib/**/*.{ts,tsx}'],
    rules: {
      'feature-sliced/absolute-relative': 'off',
    },
  },
  {
    // shadcn/ui generated files export both utility constants and components
    // in the same file — this is the library's convention, not our code.
    files: [
      'src/shared/ui/badge.tsx',
      'src/shared/ui/button.tsx',
      'src/shared/ui/sidebar.tsx',
      'src/shared/ui/tabs.tsx',
      'src/app/providers/query-provider.tsx',
    ],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    // auth-provider.tsx intentionally exports AuthContext (needed by useAuth.ts)
    // alongside the AuthProvider component — split further would over-engineer auth.
    files: ['src/shared/lib/auth/auth-provider.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    // @processes/realtime is a singleton WebSocket manager — it's a cross-cutting
    // infrastructure concern with no FSD-clean home. Entity model hooks that need
    // to subscribe/unsubscribe are the only appropriate call site.
    // Widget panes are also acceptable — this rule is intentionally relaxed here.
    files: [
      'src/entities/channel/model/useChannelChat.ts',
      'src/entities/channel/model/useWorkspaceChat.ts',
      'src/entities/conversation/model/useDirectMessages.ts',
      'src/widgets/channel-chat/ui/channel-chat-pane.tsx',
      'src/widgets/dm-chat/ui/dm-chat-pane.tsx',
    ],
    rules: {
      'feature-sliced/layers-slices': 'off',
    },
  },
  {
    // Widget→widget imports: composite widget layouts use sibling widgets
    // by design (e.g. AppLayout composes ChatPanel + Sidebar). This is an
    // established architectural pattern in this codebase.
    files: [
      'src/widgets/app-layout/ui/app-layout.tsx',
      'src/widgets/app-sidebar/ui/app-sidebar.tsx',
      'src/widgets/board-layout/ui/board-layout.tsx',
      'src/widgets/chat-layout/ui/chat-layout.tsx',
      'src/widgets/message-list/**/*.{ts,tsx}',
    ],
    rules: {
      'feature-sliced/layers-slices': 'off',
    },
  },
])
