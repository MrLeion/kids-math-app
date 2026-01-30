# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**数学小天才 (Math Genius)** - An educational mobile/web app for children aged 3-6, teaching math concepts through interactive games with animal and fruit themes. Built with Expo (React Native) for iOS, Android, and Web.

**Tech Stack**: React Native 0.81 + Expo 54 + TypeScript + tRPC + Drizzle ORM + MySQL + NativeWind (Tailwind)

## Development Commands

### Setup & Development
```bash
pnpm install              # Install dependencies
pnpm dev                  # Run server + Metro bundler (web dev)
pnpm dev:server           # Backend only (watch mode)
pnpm dev:metro            # Frontend only (web)
pnpm android              # Run on Android emulator
pnpm ios                  # Run on iOS simulator
```

### Build & Production
```bash
pnpm build                # Bundle server with esbuild
pnpm start                # Run production server
pnpm check                # TypeScript type checking
pnpm lint                 # Run ESLint
pnpm format               # Format with Prettier
```

### Database & Testing
```bash
pnpm db:push              # Generate & run migrations
pnpm test                 # Run Vitest tests
```

**Package Manager**: pnpm 9.12.0 (required)

## Architecture Overview

### Frontend Structure
- **Routing**: Expo Router (file-based, like Next.js)
  - `/app/(tabs)/` - Tab navigation screens
  - `/app/games/` - 12 game modules
  - `/app/modules/` - Module entry screens
  - `/app/oauth/` - Auth flow screens
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **State Management**: React Query for server state, AsyncStorage for persistence
- **Navigation**: React Navigation v7 with bottom tabs

### Backend Structure
- **API**: tRPC for end-to-end type-safe APIs
- **Database**: MySQL with Drizzle ORM
- **Auth**: Manus OAuth (token-based on native, cookie-based on web)
- **Storage**: S3 via preconfigured helpers
- **Server**: Express with bundled ESM output

### Key Directories
```
app/                # Frontend screens (Expo Router)
  games/            # 12 learning game modules
  modules/          # Module entry screens
components/         # Reusable React components
  ui/               # UI component library
server/             # Backend code
  _core/            # Framework-level (DO NOT MODIFY)
  db.ts             # Database query helpers (add here)
  routers.ts        # tRPC routes (add here)
  storage.ts        # S3 helpers (can extend)
drizzle/            # Database schema & migrations
  schema.ts         # Table definitions (add tables here)
  relations.ts      # Table relationships
shared/             # Shared types & constants
  _core/            # Framework-level (DO NOT MODIFY)
lib/                # Utility libraries
  _core/            # Framework-level (DO NOT MODIFY)
hooks/              # React custom hooks
constants/          # App constants
assets/             # Images, audio files
```

### 12 Learning Game Modules

1. **numbers.tsx** - 数字动物乐园 (Number Zoo) - Digit recognition 0-10
2. **symbols.tsx** - 符号故事 (Symbol Stories) - Math symbols
3. **matching.tsx** - 水果丰收乐园 (Fruit Harvest) - Number-object matching
4. **count.tsx** - 昆虫花园 (Bug Garden) - Basic counting
5. **compare.tsx** - 动物赛跑 (Animal Race) - Size/quantity comparison
6. **fillblank.tsx** - 火车车厢 (Number Train) - Number sequences
7. **addition.tsx** - 蝴蝶花园 (Butterfly Garden) - Addition introduction
8. **subtraction.tsx** - 苹果树 (Apple Tree) - Subtraction introduction
9. **time.tsx** - 认识时间 (Time Learning) - Clock reading
10. **money.tsx** - 玩具店 (Toy Store) - Currency & coins
11. **shopping.tsx** - 超市购物 (Supermarket) - Shopping calculations
12. **writing.tsx** - 数字书写 (Number Writing) - Digit tracing

## Critical Development Rules

### File Organization
- **DO NOT MODIFY** any files under `_core/` directories - these are framework-level
- Add database queries in `server/db.ts`
- Add API routes in `server/routers.ts`
- Add database tables in `drizzle/schema.ts`
- Add shared types in `shared/types.ts`

### Authentication
- Use `protectedProcedure` for authenticated routes (requires login)
- Use `publicProcedure` for unauthenticated routes
- Frontend: Always handle UNAUTHORIZED errors from protected endpoints
```tsx
try {
  await trpc.someProtectedEndpoint.mutate(data);
} catch (error) {
  if (error.data?.code === 'UNAUTHORIZED') {
    router.push('/login');
    return;
  }
  throw error;
}
```

### Database Operations
After modifying `drizzle/schema.ts`, always run:
```bash
pnpm db:push
```

### tRPC Usage
```tsx
// Router (server/routers.ts)
import { protectedProcedure } from "./_core/trpc";
export const appRouter = router({
  items: router({
    list: protectedProcedure.query(({ ctx }) => {
      // ctx.user.id is guaranteed to exist
    }),
  }),
});

// Frontend
const { data, isLoading } = trpc.items.list.useQuery();
```

### Audio System
- Uses `lib/audio-manager.ts` for cross-platform audio playback
- Background music and sound effects in `/assets/audio`
- Critical: Test audio on both native and web platforms

### Storage (S3)
```tsx
import { storagePut } from "./server/storage";

// Add random suffix to prevent enumeration
const fileKey = `${userId}-files/${fileName}-${randomSuffix()}.png`;
const { url } = await storagePut(fileKey, fileBuffer, "image/png");
```

### Platform Detection
```tsx
import { Platform } from 'react-native';

if (Platform.OS === 'web') {
  // Web-specific code
} else {
  // Native-specific code (iOS/Android)
}
```

## Design Guidelines (for 3-6 year olds)

### UI Requirements
- **Buttons**: Minimum 44x44pt touch targets
- **Colors**: Bright, child-friendly (see `theme.config.js`)
  - Basic Cognition: Yellow (#FFD60A)
  - Counting: Blue (#5AC8FA)
  - Arithmetic: Green (#34C759)
  - Life Skills: Pink (#FF6B9D)
- **Animations**: Bounce, slide, sparkle effects (can be disabled)
- **Fonts**: Large, readable sizes (18pt minimum)

### Feedback System
- **Success**: Green checkmark + fireworks + "真棒！" voice
- **Error**: Red X shake + "再试试！" voice
- **Complete**: Balloon animation + medal reward

### Audio
- Background music (can be muted)
- Sound effects for interactions
- Chinese voice feedback for correctness

## Environment Variables

### Server Environment
- `DATABASE_URL` - MySQL connection string
- `JWT_SECRET` - Session signing secret
- `OAUTH_SERVER_URL` - Manus OAuth backend
- `OWNER_OPEN_ID` - Owner's Manus ID
- `BUILT_IN_FORGE_API_URL` - Manus API endpoint
- `BUILT_IN_FORGE_API_KEY` - Manus API key

### Expo Public Variables (client-side)
- `EXPO_PUBLIC_APP_ID` - App ID for OAuth
- `EXPO_PUBLIC_API_BASE_URL` - API server URL
- `EXPO_PUBLIC_OAUTH_PORTAL_URL` - Login portal URL

## Backend Integrations

All integrations are preconfigured via Manus platform. Import from `server/_core/`:

### LLM Integration
```tsx
import { invokeLLM } from "./server/_core/llm";

const response = await invokeLLM({
  messages: [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "Hello!" }
  ]
});
```

### Image Generation
```tsx
import { generateImage } from "./server/_core/imageGeneration";

const { url } = await generateImage({
  prompt: "A serene landscape"
});
```

### Voice Transcription
```tsx
import { transcribeAudio } from "./server/_core/voiceTranscription";

const result = await transcribeAudio({
  audioUrl: "https://storage.example.com/audio/recording.mp3",
  language: "zh" // Chinese
});
```

### Owner Notifications
```tsx
import { notifyOwner } from "./server/_core/notification";

await notifyOwner({
  title: "New submission",
  content: "User completed a game"
});
```

## Testing

Write tests in `/tests/` using Vitest:
```tsx
import { describe, expect, it } from "vitest";
import { appRouter } from "../server/routers";

describe("feature", () => {
  it("works", async () => {
    const ctx = createMockContext({ userId: 1 });
    const caller = appRouter.createCaller(ctx);
    const result = await caller.feature.endpoint();
    expect(result).toBeDefined();
  });
});
```

## Common Patterns

### Adding a New Game Module
1. Create game file in `/app/games/yourGame.tsx`
2. Follow existing game structure (GameHeader, ScreenContainer, feedback system)
3. Add progress tracking with AsyncStorage
4. Include audio feedback for success/error
5. Add to module entry screen in `/app/modules/`

### Adding a Database Table
1. Define table in `drizzle/schema.ts`
2. Export types: `export type YourTable = typeof yourTable.$inferSelect;`
3. Add query helpers in `server/db.ts`
4. Run `pnpm db:push` to migrate
5. Add tRPC routes in `server/routers.ts`

### Adding a New API Route
1. Add route in `server/routers.ts`
2. Use Zod for input validation
3. Choose `publicProcedure` or `protectedProcedure`
4. Call from frontend using `trpc.yourRoute.useQuery()` or `.useMutation()`

## Project Status

Per `todo.md`:
- ✅ Core 12 game modules implemented
- ✅ Audio system with background music & sound effects
- ✅ Progress tracking & medal system
- ✅ Feedback system (visual & audio)
- 🚧 Digital writing with star trail effect (in progress)
- ⏳ Advanced game variants pending

## Documentation References

- **Backend Guide**: See `server/README.md` for comprehensive backend documentation (1200+ lines)
- **Design Spec**: See `design.md` for UI/UX guidelines in Chinese
- **Progress Tracking**: See `todo.md` for implementation status

## Important Notes

- This is a **child-focused educational app** - prioritize simplicity and engagement over complexity
- All UI text is in **Chinese** (target audience is Chinese-speaking children)
- **Cross-platform consistency** is critical - test on iOS, Android, and Web
- Audio files must work on all platforms (different codecs may be needed)
- Use **AsyncStorage** for local progress, database for user-specific cloud sync
- Framework code in `_core/` directories is maintained separately - avoid modifications
