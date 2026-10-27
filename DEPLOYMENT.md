# AL - Instrukcja Wdrożenia

## Spis Treści

1. [Przegląd](#przegląd)
2. [Wymagania Wstępne](#wymagania-wstępne)
3. [Konfiguracja Środowiska](#konfiguracja-środowiska)
4. [Wdrożenie Backend (Cloudflare Workers)](#wdrożenie-backend-cloudflare-workers)
5. [Wdrożenie Bazy Danych (Cloudflare D1)](#wdrożenie-bazy-danych-cloudflare-d1)
6. [Wdrożenie Storage (Cloudflare R2)](#wdrożenie-storage-cloudflare-r2)
7. [Wdrożenie Frontend (Cloudflare Pages)](#wdrożenie-frontend-cloudflare-pages)
8. [Wdrożenie iOS (App Store)](#wdrożenie-ios-app-store)
9. [Konfiguracja CI/CD](#konfiguracja-cicd)
10. [Monitoring i Logging](#monitoring-i-logging)
11. [Backup i Odzysk](#backup-i-odzysk)
12. [Rozwiązywanie Problemów](#rozwiązywanie-problemów)

---

## Przegląd

Dokument ten zawiera **krok po kroku instrukcję wdrożenia** aplikacji AL na różnych platformach. Wszystkie kroki zostały zaprojektowane dla **Cloudflare** (Workers, D1, R2, Pages) jako głównej platformy hostingowej.

> **⚠️ WAŻNE**: Przed rozpoczęciem wdrożenia upewnij się, że wszystkie sekrety i klucze API są poprawnie skonfigurowane.

---

## Wymagania Wstępne

### Konto Cloudflare

- ✅ **Darmowe konto**: Wystarczające dla większości funkcji
- ⚠️ **Płatne konto**: Wymagane dla niektórych zaawansowanych funkcji
- 🔗 [Zarejestruj się](https://dash.cloudflare.com/sign-up)

### Narzędzia

| Narzędzie | Wersja | Status | Instalacja |
|-----------|--------|--------|------------|
| **Node.js** | 18+ | ✅ Wymagane | [nodejs.org](https://nodejs.org) |
| **pnpm** | 8+ | ✅ Wymagane | `npm install -g pnpm` |
| **Wrangler CLI** | 3+ | ✅ Wymagane | `npm install -g wrangler` |
| **Git** | Latest | ✅ Wymagane | [git-scm.com](https://git-scm.com) |
| **Xcode** | 14+ | ⚠️ Opcjonalne | App Store (Mac) |
| **CocoaPods** | Latest | ⚠️ Opcjonalne | `sudo gem install cocoapods` |

### Zmienne Środowiskowe

Utwórz plik `.env` w głównym katalogu projektu:

```env
# ============================================================================
# CLOUDFLARE CONFIGURATION
# ============================================================================

# Workers
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token
CLOUDFLARE_WORKER_NAME=al-api

# D1 Database
CLOUDFLARE_D1_DATABASE=al-db
CLOUDFLARE_D1_ID=your_d1_database_id

# R2 Storage
CLOUDFLARE_R2_BUCKET=al-files
CLOUDFLARE_R2_PUBLIC_DOMAIN=https://your-account-id.r2.cloudflarestorage.com

# ============================================================================
# JWT CONFIGURATION
# ============================================================================

JWT_SECRET=generate_with_openssl_rand_hex_64
JWT_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# ============================================================================
# ENCRYPTION CONFIGURATION
# ============================================================================

ENCRYPTION_KEY=generate_with_openssl_rand_hex_32

# ============================================================================
# AI PROVIDERS (Optional - for testing)
# ============================================================================

MISTRAL_API_KEY=your_mistral_api_key
GROQ_API_KEY=your_groq_api_key
OPENROUTER_API_KEY=your_openrouter_api_key

# ============================================================================
# APP CONFIGURATION
# ============================================================================

NODE_ENV=production
PORT=4000
CORS_ORIGIN=https://al.axel.com
API_PREFIX=/api
AI_ENABLED=true
AI_DEFAULT_PROVIDER=groq
FREE_FIRST_MODE=true
FREE_ONLY_MODE=false
```

**Generowanie kluczy**:
```bash
# JWT Secret (64 characters)
openssl rand -hex 64

# Encryption Key (32 bytes = 64 hex characters)
openssl rand -hex 32
```

---

## Konfiguracja Środowiska

### 1. Instalacja Zależności

```bash
# Zainstaluj wszystkie zależności
cd /workspace/AL
pnpm install

# Zbuduj frontend
cd apps/web
pnpm run build

# Zbuduj backend
cd ../api
pnpm run build
```

### 2. Weryfikacja Konfiguracji

```bash
# Sprawdź Node.js
node --version

# Sprawdź pnpm
pnpm --version

# Sprawdź Wrangler
wrangler --version

# Sprawdź TypeScript
npx tsc --version
```

### 3. Testowanie Lokalne

```bash
# Uruchom backend lokalnie
cd apps/api
pnpm run dev

# W nowym terminalu uruchom frontend
cd ../web
pnpm run dev

# Sprawdź czy działa
curl http://localhost:4000/api/health
open http://localhost:5173
```

---

## Wdrożenie Backend (Cloudflare Workers)

### Krok 1: Zaloguj się do Cloudflare

```bash
# Zaloguj się przez Wrangler
wrangler login

# Lub użyj tokenu API
wrangler config set --token YOUR_CLOUDFLARE_API_TOKEN
```

### Krok 2: Skonfiguruj Worker

Utwórz plik `wrangler.toml` w `apps/api/`:

```toml
name = "al-api"
main = "dist/index.js"
compatibility_date = "2024-01-01"

# D1 Database binding
[[d1_databases]]
  binding = "DB"
  database_name = "al-db"
  database_id = "YOUR_D1_DATABASE_ID"

# R2 Bucket binding
[[r2_buckets]]
  binding = "R2"
  bucket_name = "al-files"

# KV Namespace (opcjonalne)
[[kv_namespaces]]
  binding = "KV"
  id = "YOUR_KV_NAMESPACE_ID"

# Variables
[vars]
  NODE_ENV = "production"
  JWT_SECRET = "@JWT_SECRET"
  ENCRYPTION_KEY = "@ENCRYPTION_KEY"
  CORS_ORIGIN = "https://al.axel.com"
  AI_ENABLED = "true"
  AI_DEFAULT_PROVIDER = "groq"
  FREE_FIRST_MODE = "true"

# Secrets (sensitive values)
# These should be set via: wrangler secret put KEY
# wrangler secret put JWT_SECRET
# wrangler secret put ENCRYPTION_KEY
```

### Krok 3: Zbuduj i Wdróż Worker

```bash
cd apps/api

# Zbuduj Worker
pnpm run build

# Wdróż do Cloudflare
wrangler deploy

# Sprawdź status
wrangler tail
```

### Krok 4: Skonfiguruj Sekrety

```bash
# Ustaw sekrety (wymaga wrangler v3+)
wrangler secret put JWT_SECRET
# Wpisz wartość when prompted

wrangler secret put ENCRYPTION_KEY
# Wpisz wartość when prompted

# Dla AI provider keys (opcjonalne)
wrangler secret put MISTRAL_API_KEY
wrangler secret put GROQ_API_KEY
wrangler secret put OPENROUTER_API_KEY
```

### Krok 5: Weryfikacja

```bash
# Sprawdź health endpoint
curl https://al-api.YOUR_ACCOUNT_ID.workers.dev/api/health

# Sprawdź logi
wrangler tail --format json
```

---

## Wdrożenie Bazy Danych (Cloudflare D1)

### Krok 1: Utwórz Bazę D1

```bash
# Utwórz nową bazę D1
wrangler d1 create al-db

# Lub użyj istniejącej
wrangler d1 list
```

### Krok 2: Skonfiguruj Schema

Utwórz plik `apps/api/migrations/001_init.sql`:

```sql
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT,
  email_verified INTEGER DEFAULT 0,
  email_verification_token TEXT,
  email_verification_token_expires INTEGER,
  password_reset_token TEXT,
  password_reset_token_expires INTEGER,
  last_login_at INTEGER,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until INTEGER,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- AI Providers table
CREATE TABLE IF NOT EXISTS ai_providers (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  base_url TEXT NOT NULL,
  encrypted_api_key TEXT,
  is_active INTEGER DEFAULT 1,
  is_verified INTEGER DEFAULT 0,
  verification_date INTEGER,
  config TEXT,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  model TEXT,
  provider TEXT,
  is_pinned INTEGER DEFAULT 0,
  is_archived INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT,
  model TEXT,
  provider TEXT,
  token_usage TEXT,
  sources TEXT,
  tool_calls TEXT,
  metadata TEXT,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  icon TEXT,
  is_archived INTEGER DEFAULT 0,
  is_pinned INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Memory Entries table
CREATE TABLE IF NOT EXISTS memory_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  scope TEXT NOT NULL,
  status TEXT NOT NULL,
  confidence REAL,
  tags TEXT,
  metadata TEXT,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Create indexes for search
CREATE INDEX IF NOT EXISTS idx_memory_entries_user_id ON memory_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_memory_entries_project_id ON memory_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_memory_entries_type ON memory_entries(type);
CREATE INDEX IF NOT EXISTS idx_memory_entries_scope ON memory_entries(scope);
CREATE INDEX IF NOT EXISTS idx_memory_entries_status ON memory_entries(status);
CREATE INDEX IF NOT EXISTS idx_memory_entries_created_at ON memory_entries(created_at);
```

### Krok 3: Wykonaj Migracje

```bash
# Wykonaj migracje na D1
wrangler d1 execute al-db --file migrations/001_init.sql

# Sprawdź tabele
wrangler d1 execute al-db --command "SELECT name FROM sqlite_master WHERE type='table'"
```

### Krok 4: Skonfiguruj Połączenie

Utwórz plik `apps/api/src/config/database.ts`:

```typescript
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '@al/db';

// For Cloudflare Workers with D1
export const db = drizzle(
  process.env.DB as unknown as D1Database,
  { schema }
);

// For local development with SQLite
import { drizzle as drizzleSQLite } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';

const localDb = new Database('local.db');
export const localDrizzle = drizzleSQLite(localDb, { schema });

// Export based on environment
export const getDb = () => {
  if (process.env.NODE_ENV === 'production') {
    return db;
  }
  return localDrizzle;
};
```

---

## Wdrożenie Storage (Cloudflare R2)

### Krok 1: Utwórz Bucket R2

```bash
# Utwórz nowy bucket R2
wrangler r2 bucket create al-files

# Sprawdź istniejące buckety
wrangler r2 bucket list
```

### Krok 2: Skonfiguruj Publiczny Dostęp

```bash
# Zezwól na publiczny dostęp (opcjonalne)
wrangler r2 bucket update al-files --public
```

### Krok 3: Skonfiguruj File Service

Utwórz plik `apps/api/src/services/fileService.ts`:

```typescript
import { R2Bucket } from '@cloudflare/workers-types';

declare const R2: R2Bucket;

interface FileUploadOptions {
  fileName: string;
  fileType: string;
  fileSize: number;
  userId: string;
  projectId?: string;
}

export const uploadFile = async (
  file: ArrayBuffer,
  options: FileUploadOptions
) => {
  const { fileName, fileType, userId, projectId } = options;
  
  // Generate unique file path
  const timestamp = Date.now();
  const filePath = projectId
    ? `users/${userId}/projects/${projectId}/${timestamp}_${fileName}`
    : `users/${userId}/${timestamp}_${fileName}`;
  
  // Upload to R2
  await R2.put(filePath, file, {
    httpMetadata: {
      contentType: fileType,
    },
    customMetadata: {
      userId,
      projectId: projectId || '',
      uploadedAt: new Date().toISOString(),
    },
  });
  
  // Generate public URL
  const publicUrl = `https://${process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN}/${filePath}`;
  
  return {
    path: filePath,
    url: publicUrl,
    size: fileSize,
    type: fileType,
  };
};

export const deleteFile = async (filePath: string) => {
  await R2.delete(filePath);
};

export const getFile = async (filePath: string) => {
  const file = await R2.get(filePath);
  return file;
};
```

---

## Wdrożenie Frontend (Cloudflare Pages)

### Krok 1: Skonfiguruj Projekt Pages

Utwórz plik `apps/web/wrangler.toml`:

```toml
name = "al-web"
pages_build_output_dir = "dist"

# For static site (PWA)
[build]
  command = "pnpm run build"
  watch = { pattern = "src/**" }

# Environment variables
[vars]
  VITE_API_URL = "https://al-api.YOUR_ACCOUNT_ID.workers.dev"
  VITE_APP_NAME = "AL"
  VITE_APP_VERSION = "1.0.0"
```

### Krok 2: Zbuduj i Wdróż

```bash
cd apps/web

# Zbuduj frontend
pnpm run build

# Wdróż do Cloudflare Pages
wrangler pages deploy dist

# Lub skonfiguruj automatyczne wdrożenia
wrangler pages project create al-web
wrangler pages project update al-web --production-branch main
```

### Krok 3: Skonfiguruj Custom Domain

```bash
# Dodaj custom domain
wrangler pages domain create al.axel.com

# Skonfiguruj DNS w Cloudflare Dashboard
# Utwórz rekord CNAME: al.axel.com -> al-web.pages.dev
```

---

## Wdrożenie iOS (App Store)

### Krok 1: Zbuduj Projekt Capacitor

```bash
cd apps/mobile

# Zainstaluj zależności
pnpm install

# Synchronizuj z web
npx cap sync ios

# Otwórz w Xcode
npx cap open ios
```

### Krok 2: Skonfiguruj w Xcode

1. **Wybierz scheme**: `App` (nie `Pods`)
2. **Wybierz team**: Wybierz swój Apple Developer Team
3. **Skonfiguruj Bundle Identifier**: `com.axel.al`
4. **Skonfiguruj Version i Build**: `1.0.0` (1)
5. **Skonfiguruj Signing & Capabilities**:
   - Enable "Automatically manage signing"
   - Wybierz Development Team
   - Wybierz Provisioning Profile

### Krok 3: Testuj na Urządzeniu

```bash
# Zbuduj i uruchom na symulatorze
npx cap run ios

# Zbuduj i uruchom na fizycznym urządzeniu
npx cap run ios --device
```

### Krok 4: Archiwizuj i Wdróż do App Store

1. **W Xcode**: Product > Archive
2. **Distribute App**: App Store Connect
3. **Wybierz**: Upload
4. **W App Store Connect**:
   - Utwórz nową aplikację
   - Wypełnij metadane (nazwa, opis, screenshots, etc.)
   - Wybierz cenę (Free)
   - Prześlij do review
5. **Czekaj na review**: 1-3 dni

---

## Konfiguracja CI/CD

### GitHub Actions Workflow

Utwórz plik `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20'
  PNPM_VERSION: '9'

jobs:
  test:
    name: Test
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v3
        with:
          version: ${{ env.PNPM_VERSION }}
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: TypeCheck
        run: pnpm run typecheck
      
      - name: Lint
        run: pnpm run lint
      
      - name: Build
        run: pnpm run build
      
      - name: Test
        run: pnpm run test

  deploy-backend:
    name: Deploy Backend
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v3
        with:
          version: ${{ env.PNPM_VERSION }}
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Build API
        run: cd apps/api && pnpm run build
      
      - name: Deploy to Cloudflare Workers
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy
          workingDirectory: apps/api
        env:
          NODE_ENV: production

  deploy-frontend:
    name: Deploy Frontend
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v3
        with:
          version: ${{ env.PNPM_VERSION }}
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Build Web
        run: cd apps/web && pnpm run build
      
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy dist --project-name al-web
          workingDirectory: apps/web
        env:
          NODE_ENV: production
```

### Secrets do GitHub

Ustaw następujące secrets w GitHub Repository Settings > Secrets:

| Secret | Opis |
|--------|------|
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Account ID |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token (Full Access) |
| `JWT_SECRET` | JWT Secret Key |
| `ENCRYPTION_KEY` | Encryption Key |

---

## Monitoring i Logging

### Cloudflare Workers Analytics

```bash
# Pokaż logi Worker
wrangler tail

# Pokaż logi z filtrem
wrangler tail --filter "error"

# Pokaż metryki
wrangler tail --metrics
```

### Cloudflare Dashboard

1. **Workers**: [https://dash.cloudflare.com/ACCOUNT_ID/workers](https://dash.cloudflare.com/ACCOUNT_ID/workers)
2. **D1**: [https://dash.cloudflare.com/ACCOUNT_ID/workers/d1](https://dash.cloudflare.com/ACCOUNT_ID/workers/d1)
3. **R2**: [https://dash.cloudflare.com/ACCOUNT_ID/r2](https://dash.cloudflare.com/ACCOUNT_ID/r2)
4. **Pages**: [https://dash.cloudflare.com/ACCOUNT_ID/pages](https://dash.cloudflare.com/ACCOUNT_ID/pages)

### Sentry (Opcjonalne)

Utwórz plik `apps/api/src/middleware/sentry.ts`:

```typescript
import * as Sentry from '@sentry/node';
import { Hono } from 'hono';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
});

export const sentryMiddleware = new Hono()
  .use('*', async (c, next) => {
    try {
      await next();
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  });
```

---

## Backup i Odzysk

### Backup D1 Database

```bash
# Eksport bazy D1 do pliku
wrangler d1 execute al-db --command ".dump" > backup_$(date +%Y%m%d_%H%M%S).sql

# Import backup
wrangler d1 execute al-db --file backup.sql
```

### Backup R2 Bucket

```bash
# List all files
wrangler r2 object list al-files

# Download specific file
wrangler r2 object get al-files PATH_TO_FILE --output local_file

# Sync entire bucket (requires rclone or similar)
# rclone copy cloudflare:al-files ./backup/r2/
```

### Backup Workers Code

```bash
# Download Worker code
wrangler code download al-api --output backup_worker_$(date +%Y%m%d).zip
```

---

## Rozwiązywanie Problemów

### Typowe Problemy

#### 1. Wrangler Login Failed

**Problem**: `Error: Failed to login`

**Rozwiązanie**:
```bash
# Wyloguj się i zaloguj ponownie
wrangler logout
wrangler login

# Lub użyj tokenu API
wrangler config set --token YOUR_API_TOKEN
```

#### 2. D1 Database Not Found

**Problem**: `Error: Database not found`

**Rozwiązanie**:
```bash
# Sprawdź listę baz D1
wrangler d1 list

# Upewnij się, że nazwa bazy jest poprawna w wrangler.toml
```

#### 3. R2 Bucket Not Found

**Problem**: `Error: Bucket not found`

**Rozwiązanie**:
```bash
# Sprawdź listę bucketów R2
wrangler r2 bucket list

# Upewnij się, że nazwa bucketu jest poprawna
```

#### 4. Secret Not Found

**Problem**: `Error: Secret not found`

**Rozwiązanie**:
```bash
# Ustaw sekrety
wrangler secret put KEY_NAME

# Sprawdź listę sekretów
wrangler secret list
```

#### 5. Build Failed

**Problem**: `Error: Build failed`

**Rozwiązanie**:
```bash
# Sprawdź TypeScript errors
pnpm run typecheck

# Sprawdź zależności
pnpm install

# Sprawdź Node.js version
node --version
```

#### 6. Deployment Failed

**Problem**: `Error: Deployment failed`

**Rozwiązanie**:
```bash
# Sprawdź logi
wrangler tail

# Sprawdź konfigurację
cat wrangler.toml

# Sprawdź czy Worker istnieje
wrangler list
```

---

## Podsumowanie

### Checklista Wdrożenia

- [ ] **Cloudflare Account**: Utworzone i skonfigurowane
- [ ] **Workers**: Wdrożony i działający
- [ ] **D1 Database**: Utworzona i z migracjami
- [ ] **R2 Bucket**: Utworzony i skonfigurowany
- [ ] **Pages**: Wdrożony i działający
- [ ] **Custom Domain**: Skonfigurowany
- [ ] **Secrets**: Ustawione w Workers
- [ ] **CI/CD**: Skonfigurowany GitHub Actions
- [ ] **Monitoring**: Skonfigurowany (opcjonalne)
- [ ] **Backup**: Regularne backupy (opcjonalne)

### Adresy Wdrożenia

| Środowisko | Adres | Status |
|------------|-------|--------|
| **Production API** | `https://al-api.YOUR_ACCOUNT_ID.workers.dev` | ❌ |
| **Production Web** | `https://al.axel.com` | ❌ |
| **Staging API** | `https://al-api-staging.YOUR_ACCOUNT_ID.workers.dev` | ❌ |
| **Staging Web** | `https://staging.al.axel.com` | ❌ |
| **Development** | `http://localhost:4000` | ✅ |

### Koszty

| Usługa | Koszt (Darmowy) | Koszt (Płatny) | Uwagi |
|--------|-----------------|----------------|-------|
| **Workers** | 100K żądań/dzień | $0.50/1M żądań | Wystarczający dla testów |
| **D1** | 5GB storage, 5M reads | $0.10/GB storage | Wystarczający dla małych projektów |
| **R2** | 10GB storage, 1M operations | $0.015/GB storage | Wystarczający dla testów |
| **Pages** | 100K żądań/miesiąc | $5/1M żądań | Wystarczający dla małych stron |

---

## Zobacz Również

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Cloudflare D1 Docs](https://developers.cloudflare.com/d1/)
- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2/)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [IOS_CAPABILITIES.md](./IOS_CAPABILITIES.md)
- [SECURITY.md](./SECURITY.md)
