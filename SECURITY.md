# AL - Model Bezpieczeństwa

## Spis Treści

1. [Przegląd](#przegląd)
2. [Klasyfikacja Danych](#klasyfikacja-danych)
3. [Autentykacja i Autoryzacja](#autentykacja-i-autoryzacja)
4. [Szyfrowanie](#szyfrowanie)
5. [Ochrona API](#ochrona-api)
6. [Bezpieczeństwo Klientów](#bezpieczeństwo-klientów)
7. [Bezpieczeństwo Dostawców AI](#bezpieczeństwo-dostawców-ai)
8. [Zarządzanie Sekretami](#zarządzanie-sekretami)
9. [Ochrona Przed Atakami](#ochrona-przed-atakami)
10. [Audyt i Monitorowanie](#audyt-i-monitoring)
11. [Zgodność z RODO](#zgodność-z-rodo)
12. [Procedury Awaryjne](#procedury-awaryjne)

---

## Przegląd

Dokument opisuje **model bezpieczeństwa** aplikacji AL. Wszystkie mechanizmy zostały zaprojektowane z myślą o ochronie danych użytkowników, sekretów i integralności systemu.

> **⚠️ WAŻNE**: Bezpieczeństwo jest procesem ciągłym. Regularnie aktualizuj zależności, monitoruj zagrożenia i testuj system.

---

## Klasyfikacja Danych

### Poziomy Poufności

```
┌─────────────────────────────────────────────────────────────────────┐
│                      KLASYFIKACJA DANYCH                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Poziom 1: DANE PUBLICZNE                                            │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  - Wersja aplikacji                                              │   │
│  │  - Status API (health check)                                     │   │
│  │  - Publiczna dokumentacja                                        │   │
│  │  - Informacje o modelach AI (publiczne)                           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│  ✅ Ochrona: Brak                                                   │
│                                                                     │
│  Poziom 2: DANE UŻYTKOWNIKA                                         │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  - Adres e-mail (zahashowany w logach)                            │   │
│  │  - Imię i nazwisko                                               │   │
│  │  - Ustawienia preferencji                                        │   │
│  │  - Historia czatu                                                │   │
│  │  - Projekty i zadania                                            │   │
│  │  - Wpisy pamięci                                                 │   │
│  │  - Dokumenty (treść)                                              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│  ✅ Ochrona: JWT Auth, User Isolation, Rate Limiting               │
│                                                                     │
│  Poziom 3: DANE WRŻLIWE                                             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  - Hashe haseł (bcrypt)                                          │   │
│  │  - Tokeny sesji (JWT)                                            │   │
│  │  - Tokeny refresh                                                │   │
│  │  - Klucze API dostawców AI (zaszyfrowane)                       │   │
│  │  - Tokeny integracji (zaszyfrowane)                              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│  ✅ Ochrona: Szyfrowanie, Hashowanie, HttpOnly Cookies              │
│                                                                     │
│  Poziom 4: SEKRETY INFRASTRUKTURY                                   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  - Główny klucz szyfrujący (MASTER_KEY)                         │   │
│  │  - JWT_SECRET                                                   │   │
│  │  - Klucze bazy danych                                           │   │
│  │  - Klucze Cloudflare                                            │   │
│  │  - Konfiguracja SSL                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│  ✅ Ochrona: Zmienne środowiskowe, Secret Manager, Nie w kodzie    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Macierz Ochrony

| Poziom | Szyfrowanie | Hashowanie | Izolacja | Audyt | Retencja |
|--------|-------------|------------|----------|--------|----------|
| Public | ❌ | ❌ | ❌ | ❌ | ❌ |
| User | ❌ | ❌ | ✅ | ✅ | ✅ |
| Sensitive | ✅ | ✅ | ✅ | ✅ | ✅ |
| Secrets | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Autentykacja i Autoryzacja

### Mechanizm Autentykacji

**Technologia**: JWT (JSON Web Tokens) + bcrypt

**Proces**:

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │     │  Server  │     │  Server  │     │  Client  │
│  (Web)   │     │  (API)   │     │  (API)   │     │  (Web)   │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │               │
     │  POST /auth   │                │               │
     │  register     │                │               │
     │──────────────>│                │               │
     │                │                │               │
     │  {email,      │                │               │
     │   password}   │                │               │
     │                ▼                │               │
     │         Hash password         │               │
     │         with bcrypt (12)       │               │
     │                │                │               │
     │         Save user             │                │               │
     │                │                │               │
     │  201 Created   │                │               │
     │  <─────────────┤                │               │
     │                │                │               │
     │  POST /auth   │                │               │
     │  login        │                │               │
     │──────────────>│                │               │
     │                │                │               │
     │  {email,      │                │               │
     │   password}   │                │               │
     │                ▼                │               │
     │         Verify password        │               │
     │         against hash           │               │
     │                │                │               │
     │         Generate tokens        │               │
     │         (access + refresh)     │               │
     │                │                │               │
     │  access_token, │                │               │
     │  refresh_token│                │               │
     │  <─────────────┤                │               │
     │                │                │               │
     │  Store in      │                │               │
     │  httpOnly     │                │               │
     │  cookies      │                │               │
     │                │                │               │
```

### Tokeny JWT

**Struktura**:
```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "user_id",
    "email": "user@example.com",
    "iat": 1234567890,
    "exp": 1234571490,
    "jti": "unique_id"
  },
  "signature": "..."
}
```

**Konfiguracja**:
- **Algorytm**: HS256 (HMAC-SHA256)
- **Czas ważności access token**: 15 minut
- **Czas ważności refresh token**: 7 dni
- **Secret**: 64-znakowy losowy string (zmienna środowiskowa)

### Autoryzacja

**Mechanizm**:
- Wszystkie endpointy (oprócz `/auth/*` i `/health`) wymagają JWT
- Token przekazywany w nagłówku: `Authorization: Bearer <token>`
- Weryfikacja: Sygnatura + czas ważności + unikalny identyfikator

**Middleware Autentykacji**:
```typescript
// Pseudokod middleware
async function authMiddleware(request, next) {
  // 1. Sprawdź nagłówek Authorization
  const token = request.headers.authorization?.split(' ')[1];
  if (!token) throw UnauthorizedError();

  // 2. Zweryfikuj sygnaturę
  const payload = verifyJWT(token, JWT_SECRET);
  if (!payload) throw UnauthorizedError();

  // 3. Sprawdź czas ważności
  if (payload.exp < Date.now() / 1000) {
    throw TokenExpiredError();
  }

  // 4. Sprawdź czy token nie został zrewokowany
  const isRevoked = await checkRevokedTokens(payload.jti);
  if (isRevoked) throw UnauthorizedError();

  // 5. Dołącz użytkownika do kontekstu
  request.user = payload;
  
  next();
}
```

### Ochrona Przed Atakami na Autentykację

1. **Rate Limiting**: 10 prób logowania/minutę per IP
2. **Lockout**: 5 nieudanych prób → blokada na 15 minut
3. **CSRF**: HttpOnly cookies + SameSite=Strict
4. **Brute Force**: Unikalny salt dla każdego hasła (bcrypt)
5. **Session Fixation**: Nowy token przy każdym logowaniu
6. **Token Theft**: HttpOnly + Secure flag na cookies

---

## Szyfrowanie

### Szyfrowanie Kluczy API

**Algorytm**: AES-256-GCM (Authenticated Encryption)

**Implementacja**:
```typescript
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits for GCM

function encrypt(text: string, key: string): string {
  // Generuj losowy IV
  const iv = crypto.randomBytes(IV_LENGTH);
  
  // Utwórz cipher
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(key, 'hex'), iv);
  
  // Szyfruj
  const encrypted = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final(),
    cipher.getAuthTag()
  ]);
  
  // Zwróć IV + zaszyfrowane dane + auth tag
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(encryptedText: string, key: string): string {
  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedData = Buffer.from(parts[1], 'hex');
  
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(key, 'hex'),
    iv
  );
  
  decipher.setAuthTag(encryptedData.slice(-16));
  
  return decipher.update(encryptedData.slice(0, -16)) + decipher.final();
}
```

### Zarządzanie Kluczami

**Hierarchia Kluczy**:
```
Master Key (Infrastructure)
  │
  ├── User API Key Encryption Key (per user, derived)
  │     │
  │     └── Encrypted API Keys
  │
  └── Database Encryption Key
        │
        └── Encrypted Database Fields
```

**Rotacja Kluczy**:
- **Master Key**: Co 90 dni
- **User Keys**: Co 30 dni (opcjonalnie)
- **Session Tokens**: Co 15 minut (access), co 7 dni (refresh)

### Szyfrowanie Bazy Danych

**Pola Szyfrowane**:
- `ai_providers.encrypted_api_key`
- `integrations.config` (tokeny integracji)
- `users.password_hash` (bcrypt, nie szyfrowane)

**Metadane**:
- Wersja algorytmu
- Wersja klucza
- Timestamp szyfrowania

---

## Ochrona API

### Security Headers

**Wszystkie odpowiedzi HTTP zawierają**:
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=31536000; includeSubDomains
Permissions-Policy: microphone=(), camera=(), geolocation=()
```

### Rate Limiting

| Typ | Okno | Limit | Klucz |
|-----|------|-------|------|
| Ogólne | 1 minuta | 60 | IP + User |
| Autentykacja | 1 godzina | 10 | IP |
| AI | 1 minuta | 30 | User |
| Storage | 1 godzina | 1000 | User |

**Implementacja**:
```typescript
import { RateLimiterMemory } from 'rate-limiter-flexible';

const apiLimiter = new RateLimiterMemory({
  points: 60,
  duration: 60,
  blockDuration: 60,
});

const authLimiter = new RateLimiterMemory({
  points: 10,
  duration: 3600,
  blockDuration: 900,
});

// Użycie
app.use(async (req, res, next) => {
  try {
    if (req.path.startsWith('/auth')) {
      await authLimiter.consume(req.ip);
    } else {
      await apiLimiter.consume(req.user?.id || req.ip);
    }
    next();
  } catch {
    res.status(429).json({ error: 'Too many requests' });
  }
});
```

### CORS

**Konfiguracja**:
```typescript
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400,
};

// W produkcji: NIE używaj '*'
if (process.env.NODE_ENV === 'production') {
  corsOptions.origin = ['https://al.axel.com', 'https://www.al.axel.com'];
}
```

### Input Validation

**Zod Schemas**:
```typescript
import { z } from 'zod';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(64).optional(),
});

// Użycie w middleware
app.post('/auth/login', async (req, res) => {
  const validated = LoginSchema.parse(req.body);
  // ...
});
```

---

## Bezpieczeństwo Klientów

### Frontend

**Ochrona**:
1. **XSS**: React (auto-escaping) + DOMPurify dla HTML
2. **CSRF**: HttpOnly cookies + SameSite=Strict
3. **Clickjacking**: X-Frame-Options: DENY
4. **Storage**: HttpOnly + Secure cookies
5. **CSP**: Content Security Policy (planowane)

**Zasady CSP (Content Security Policy)**:
```
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self';
  connect-src 'self' https://api.al.axel.com;
  frame-src 'none';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
```

### PWA

**Ochrona**:
1. **Service Worker**: Tylko HTTPS
2. **Cache**: No cache dla wrażliwych danych
3. **Offline**: Oznaczanie danych offline
4. **Update**: Automatyczne sprawdzanie aktualizacji

### LocalStorage

**Zasady**:
- ❌ **Nigdy** nie przechowuj: tokenów, haseł, kluczy API
- ✅ **Można** przechowywać: preferencje UI, ostatnią konwersację (ID)
- ⚠️ **Ostrożnie**: Historia czatu (tylko jeśli użytkownik wyrazi zgodę)

**Implementacja**:
```typescript
// Bezpieczne użycie localStorage
const saveToLocalStorage = (key: string, value: unknown) => {
  const safeKeys = ['theme', 'language', 'lastConversationId'];
  
  if (!safeKeys.includes(key)) {
    console.warn(`⚠️ Próba zapisu niebezpiecznego klucza do localStorage: ${key}`);
    return;
  }
  
  localStorage.setItem(key, JSON.stringify(value));
};
```

---

## Bezpieczeństwo Dostawców AI

### Weryfikacja Dostawców

**Zaufani Dostawcy**:
- ✅ Mistral AI (zweryfikowane API)
- ✅ Groq (zweryfikowane API)
- ✅ OpenRouter (zweryfikowane API)

**Wymagania**:
1. **HTTPS**: Wszystkie połączenia muszą być szyfrowane
2. **Autoryzacja**: Klucze API przekazywane w nagłówku `Authorization`
3. **Walidacja**: Sprawdzanie sygnatury odpowiedzi
4. **Limity**: Respektowanie rate limits

### Ochrona Przed Atakami

1. **Prompt Injection**:
   - Walidacja wejścia użytkownika
   - Ograniczenie kontekstu
   - Filtrowanie potencjalnie niebezpiecznych treści

2. **Data Leakage**:
   - Nigdy nie wysyłaj sekretów w promptach
   - Szyfrowanie kluczy API
   - Ograniczenie dostępu do wrażliwych danych

3. **API Abuse**:
   - Rate limiting per użytkownik
   - Monitorowanie użycia
   - Blokowanie podejrzanych aktywności

### Szyfrowanie Komunikacji

**TLS**:
- Wersja: TLS 1.2+
- Szyfry: AES-256-GCM, ECDHE
- Certyfikaty: Ważne, zaufane CA

---

## Zarządzanie Sekretami

### Zmienne Środowiskowe

**Zasady**:
1. **Nigdy** nie commituj sekretów do repozytorium
2. **Używaj** `.env` dla lokalnego rozwoju
3. **W produkcji** używaj Secret Manager (Cloudflare, AWS, etc.)
4. **Rotuj** sekrety regularnie

**.env.example**:
```env
# Database
DATABASE_URL=file:./local.db

# JWT
JWT_SECRET=al-jwt-secret-change-in-production
JWT_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# Encryption
ENCRYPTION_KEY=al-encryption-key-change-in-production

# AI Providers (opcjonalne, dla testów)
MISTRAL_API_KEY=
GROQ_API_KEY=
OPENROUTER_API_KEY=

# Cloudflare
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=
```

### Secret Scanning

**Narzędzia**:
- `gitleaks` - Skanowanie repozytorium
- `trufflehog` - Skanowanie commitów
- GitHub Secret Scanning - Automatyczne dla publicznych repo

**Konfiguracja gitleaks**:
```toml
[extend]
useDefault = true

[[rules]]
id = "al-jwt-secret"
description = "AL JWT Secret"
regex = "al-jwt-secret-[a-zA-Z0-9]{32,}"
tags = ["jwt", "al"]

[[rules]]
id = "al-encryption-key"
description = "AL Encryption Key"
regex = "al-encryption-key-[a-zA-Z0-9]{64,}"
tags = ["encryption", "al"]
```

### Rotacja Sekretów

**Procedura**:
1. Wygeneruj nowy sekret
2. Zaktualizuj zmienne środowiskowe
3. Zrestartuj aplikację
4. Zmonitoruj logi pod kątem błędów
5. Usunięcie starego sekretu po potwierdzeniu

**Automatyzacja**:
```typescript
// Rotacja klucza szyfrującego
const rotateEncryptionKey = async () => {
  const oldKey = process.env.ENCRYPTION_KEY;
  const newKey = crypto.randomBytes(32).toString('hex');
  
  // Re-encrypt all encrypted data with new key
  const users = await db.query.aiProviders.findMany();
  for (const user of users) {
    const decrypted = decrypt(user.encryptedApiKey, oldKey);
    const reEncrypted = encrypt(decrypted, newKey);
    await db.update(aiProviders)
      .set({ encryptedApiKey: reEncrypted })
      .where(eq(aiProviders.id, user.id));
  }
  
  // Update environment variable
  process.env.ENCRYPTION_KEY = newKey;
  
  // Save new key to secret manager
  await saveToSecretManager('ENCRYPTION_KEY', newKey);
  
  // Log rotation
  await logSecurityEvent('KEY_ROTATION', { type: 'encryption_key' });
};
```

---

## Ochrona Przed Atakami

### SQL Injection

**Ochrona**: Drizzle ORM + Prepared Statements

**Przykład**:
```typescript
// ✅ BEZPIECZNE - Drizzle ORM
const users = await db.query.users.findMany({
  where: eq(users.email, userEmail), // Parametr jest escapowany
});

// ❌ NIEBEZPIECZNE - Raw SQL z concatenation
const users = await db.execute(
  sql`SELECT * FROM users WHERE email = '${userEmail}'` // SQL Injection!
);
```

### XSS (Cross-Site Scripting)

**Ochrona**:
1. React auto-escaping
2. DOMPurify dla HTML
3. Markdown sanitization

**Przykład**:
```typescript
import DOMPurify from 'dompurify';

const renderUserContent = (content: string) => {
  // Sanitize HTML
  const clean = DOMPurify.sanitize(content);
  return <div dangerouslySetInnerHTML={{ __html: clean }} />;
};

// Dla Markdown
import remark from 'remark';
import remarkHtml from 'remark-html';

const renderMarkdown = async (content: string) => {
  const processed = await remark()
    .use(remarkHtml, { sanitize: true })
    .process(content);
  return processed.toString();
};
```

### CSRF (Cross-Site Request Forgery)

**Ochrona**:
1. HttpOnly cookies
2. SameSite=Strict
3. CSRF tokens (opcjonalnie)

**Implementacja**:
```typescript
// Backend - Ustawianie cookies
res.cookie('token', accessToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 15 * 60 * 1000, // 15 minut
  path: '/',
});

// Frontend - Nie ma dostępu do cookies
// Użyj fetch z credentials: 'include'
fetch('/api/protected', {
  credentials: 'include',
});
```

### DoS (Denial of Service)

**Ochrona**:
1. Rate limiting
2. Request size limits
3. Timeout na żądania
4. Connection pooling

**Konfiguracja**:
```typescript
// Limit rozmiaru request body
app.use(express.json({ limit: '10mb' }));

// Timeout na żądania
app.use((req, res, next) => {
  req.setTimeout(30000, () => {
    res.status(408).json({ error: 'Request timeout' });
  });
  next();
});

// Connection pooling (Drizzle)
const db = new Database(pool, { max: 10 }); // Max 10 connections
```

### SSRF (Server-Side Request Forgery)

**Ochrona**:
1. Blokada adresów prywatnych
2. Walidacja URL-i
3. Whitelist dozwolonych domen

**Implementacja**:
```typescript
const isPrivateIp = (ip: string): boolean => {
  const privateRanges = [
    '10.0.0.0/8',
    '172.16.0.0/12',
    '192.168.0.0/16',
    '127.0.0.0/8',
    '169.254.0.0/16',
    '::1/128',
    'fc00::/7',
    'fe80::/10',
  ];
  
  return privateRanges.some(range => ipInRange(ip, range));
};

const fetchWithSSRFProtection = async (url: string) => {
  const parsed = new URL(url);
  
  // Sprawdź czy IP jest prywatne
  const ip = await dns.lookup(parsed.hostname);
  if (isPrivateIp(ip)) {
    throw new Error('SSRF: Private IP address');
  }
  
  // Sprawdź czy domena jest dozwolona
  const allowedDomains = ['api.mistral.ai', 'api.groq.com', 'openrouter.ai'];
  if (!allowedDomains.includes(parsed.hostname)) {
    throw new Error('SSRF: Domain not allowed');
  }
  
  return axios.get(url);
};
```

---

## Audyt i Monitorowanie

### Logowanie

**Zasady**:
1. **Nigdy** nie loguj: haseł, tokenów, kluczy API
2. **Zawsze** loguj: błedy, ostrzeżenia, informacje diagnostyczne
3. **Używaj** strukturowanych logów (JSON)
4. **Oznaczaj** logi identyfikatorem żądania

**Implementacja**:
```typescript
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  format: process.env.LOG_FORMAT || 'json',
  redact: {
    paths: ['password', 'apiKey', 'token', 'authorization'],
    censor: '[REDACTED]',
  },
});

// Użycie
app.use((req, res, next) => {
  req.log = logger.child({ requestId: generateId() });
  req.log.info({ method: req.method, path: req.path, ip: req.ip });
  next();
});
```

### Monitorowanie

**Metryki**:
- Liczba żądań
- Czas odpowiedzi
- Błędy (4xx, 5xx)
- Użycie API (tokeny)
- Aktywni użytkownicy

**Alerty**:
- Wzrost liczby błędów
- Spowolnienie odpowiedzi
- Wyczerpanie limitów API
- Nieudane logowania

### Audyt Bezpieczeństwa

**Logowane Zdarzenia**:
- Logowania (pomyślne/nieudane)
- Zmiany haseł
- Dodawanie/usuwanie kluczy API
- Zmiany ustawień
- Eksport danych

**Przykład**:
```typescript
const logSecurityEvent = async (type: string, metadata: Record<string, unknown>) => {
  await db.insert(auditLogs).values({
    id: generateId(),
    userId: metadata.userId || null,
    type,
    metadata: JSON.stringify(metadata),
    ip: metadata.ip,
    userAgent: metadata.userAgent,
    createdAt: now(),
  });
};

// Użycie
app.post('/auth/login', async (req, res) => {
  try {
    const user = await login(req.body);
    await logSecurityEvent('LOGIN_SUCCESS', {
      userId: user.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
    res.json({ token: user.token });
  } catch (error) {
    await logSecurityEvent('LOGIN_FAILURE', {
      email: req.body.email,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      error: error.message,
    });
    res.status(401).json({ error: 'Invalid credentials' });
  }
});
```

---

## Zgodność z RODO

### Zasady Przetwarzania Danych

1. **Minimalizacja**: Zbieraj tylko niezbędne dane
2. **Celowość**: Dane używane tylko do deklarowanych celów
3. **Przechowywanie**: Dane przechowywane tylko przez konieczny czas
4. **Prawa Użytkowników**: Prawo do dostępu, poprawy, usunięcia

### Implementacja RODO

**Prawa Użytkowników**:
- **Dostęp do danych**: `/api/users/data`
- **Poprawa danych**: `/api/users/update`
- **Usunięcie danych**: `/api/users/delete`
- **Eksport danych**: `/api/users/export`
- **Zapomnienie**: Automatyczne usuwanie po 30 dniach nieaktywności

**Polityka Prywatności**:
- Jasne informowanie o zbieranych danych
- Cel zbierania danych
- Podmioty, którym dane mogą być przekazywane (dostawcy AI)
- Okres przechowywania
- Prawa użytkowników

### Anonimizacja

**Dane Anonimizowane**:
- Statystyki użycia (bez identyfikatorów)
- Logi (zahashowane IP)
- Metryki (agregowane)

**Implementacja**:
```typescript
const anonymizeIp = (ip: string): string => {
  // IPv4: 192.168.1.1 -> 192.168.1.0
  if (ip.includes('.')) {
    return ip.split('.').slice(0, 3).join('.') + '.0';
  }
  // IPv6: 2001:0db8:85a3::8a2e:0370:7334 -> 2001:0db8:85a3::0
  return ip.split(':').slice(0, 4).join(':') + '::0';
};

const anonymizeEmail = (email: string): string => {
  const [local, domain] = email.split('@');
  return `${local[0]}****@${domain}`;
};
```

---

## Procedury Awaryjne

### Wyciek Sekretów

**Procedura**:
1. **Natychmiast** zrewokuj wszystkie skompromitowane sekrety
2. **Zmień** wszystkie hasła i klucze API
3. **Zrotuj** wszystkie klucze szyfrujące
4. **Zaudytuj** logi pod kątem nieautoryzowanego dostępu
5. **Powiadom** użytkowników (jeśli ich dane zostały narażone)

### Atak DDoS

**Procedura**:
1. **Skaluj** infrastrukturę (Cloudflare auto-scaling)
2. **Włącz** rate limiting (jeśli nie włączone)
3. **Zablokuj** podejrzane IP
4. **Powiadom** dostawcę chmury
5. **Monitoruj** sytuację

### Naruszenie Bezpieczeństwa

**Procedura**:
1. **Izoluj** zaatakowany system
2. **Zachowaj** logi i dowody
3. **Powiadom** zespół bezpieczeństwa
4. **Zlikwiduj** luki
5. **Poinformuj** użytkowników (jeśli wymagane prawnie)

### Utrata Danych

**Procedura**:
1. **Przywróć** z backupu
2. **Zweryfikuj** integralność danych
3. **Powiadom** użytkowników
4. **Zbadaj** przyczynę
5. **Zapobiegaj** w przyszłości

---

## Podsumowanie

### Zasady Bezpieczeństwa AL

1. **Defense in Depth**: Wielowarstwowa ochrona
2. **Least Privilege**: Minimalne uprawnienia
3. **Fail Secure**: Bezpieczne zachowanie w przypadku błędów
4. **Zero Trust**: Weryfikuj wszystko, ufaj nicemu
5. **Transparency**: Jasne informowanie o praktykach

### Checklista Bezpieczeństwa

- [ ] Wszystkie endpointy chronione autentykacją
- [ ] Sekrety nie są w kodzie
- [ ] Hasła zahashowane (bcrypt)
- [ ] Klucze API zaszyfrowane
- [ ] Rate limiting włączone
- [ ] Security headers ustawione
- [ ] Input validation na wszystkich endpointach
- [ ] Błędy nie wyciekają informacji
- [ ] Logi nie zawierają sekretów
- [ ] Backup danych działa
- [ ] Monitorowanie jest skonfigurowane

---

## Zobacz Również

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [Apple Security](https://developer.apple.com/documentation/security)
- [Cloudflare Security](https://www.cloudflare.com/security/)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [FREE_TIER_MATRIX.md](./FREE_TIER_MATRIX.md)
- [IOS_CAPABILITIES.md](./IOS_CAPABILITIES.md)
