# AL - Osobisty Asystent AI dla Axela

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0-purple.svg)](https://vitejs.dev/)
[![Hono](https://img.shields.io/badge/Hono-4.0-orange.svg)](https://hono.dev/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle%20ORM-0.30-green.svg)](https://orm.drizzle.team/)

## 📋 Opis

AL to **osobisty asystent AI** zaprojektowany z myślą o Axelu. Łączy w sobie funkcjonalności:
- **Partnera programistycznego** - pomoc w pisaniu kodu
- **Wsparcia muzycznego** - dla BengalLabel
- **Organizatora projektów i zadań**
- **Researchera ze źródłami**
- **Centrum pamięci, dokumentów i narzędzi**
- **Asystenta tekstowego i głosowego**

## 🚀 Szybki Start

### Wymagania

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Git

### Instalacja

```bash
# Klonowanie repozytorium
git clone <repo-url>
cd AL

# Instalacja zależności
pnpm install

# Uruchomienie bazy danych (SQLite)
# Baza zostanie utworzona automatycznie przy pierwszym uruchomieniu

# Uruchomienie serwera API
pnpm --filter @al/api dev

# W innym terminalu - uruchomienie aplikacji webowej
pnpm --filter @al/web dev
```

Aplikacja webowa będzie dostępna pod adresem: http://localhost:3000
API będzie dostępne pod adresem: http://localhost:4000

## 🏗 Architektura

### Monorepo Structure

```
AL/
├── apps/
│   ├── web/           # Aplikacja webowa (React + Vite)
│   └── api/           # Serwer API (Hono + Drizzle ORM)
├── packages/
│   ├── shared/        # Typy, schematy, narzędzia współdzielone
│   ├── ui/            # Komponenty UI
│   ├── db/            # Schemat bazy danych
│   └── tools/         # Narzędzia AI i integracje
└── package.json       # Root package.json (Turbo)
```

### Technologie

| Obszar | Technologia |
|--------|-------------|
| **Frontend** | React 18 + TypeScript + Vite |
| **Backend** | Hono (fast HTTP framework) |
| **Baza danych** | SQLite (Drizzle ORM) / Cloudflare D1 |
| **Stylizacja** | Tailwind CSS |
| **Stan aplikacji** | Zustand |
| **Build Tool** | Turbo + pnpm |
| **PWA** | Vite Plugin PWA |

## 📱 Funkcjonalności

### ✅ Zaimplementowane

- [x] **Autentykacja** - Rejestracja, logowanie, wylogowanie, JWT
- [x] **Czat** - Konwersacje, wiadomości, historia
- [x] **AI Integracja** - Mistral, Groq, OpenRouter (z obsługą kluczy API)
- [x] **Wyszukiwanie** - Globalne wyszukiwanie w konwersacjach, dokumentach, pamięci
- [x] **API REST** - Pełna dokumentacja endpointów
- [x] **PWA** - Instalowalna jako aplikacja mobilna
- [x] **Responsive Design** - Optymalizacja dla mobile (iPhone)
- [x] **Dark Mode** - Grafitowy motyw ciemny

### 🚧 W trakcie

- [ ] **Pamięć globalna** - Context Builder, przyrostowe podsumowania
- [ ] **Projekty i zadania** - Organizacja pracy
- [ ] **Pliki** - Przesyłanie, przetwarzanie, indeksowanie
- [ ] **Głos** - STT/TTS (Web Speech API / Native)
- [ ] **Integracje** - GitHub, Cloudflare, Notion
- [ ] **iOS Native** - Capacitor, natywne funkcje
- [ ] **Przypomnienia** - System powiadomień

### 📋 Planowane

- [ ] **Autonomia** - Wykonawca zadań
- [ ] **Narzędzia AI** - Funkcje call tool
- [ ] **Synchroniczacja** - Pomiędzy urządzeniami
- [ ] **Offline Mode** - Praca bez połączenia
- [ ] **Backup/Restore** - Kopie zapasowe

## 🔧 Konfiguracja

### Środowisko

```bash
# Development
cp .env.example .env

# Production
cp .env.example .env.production
```

### Zmienne środowiskowe

| Zmienna | Opis | Domyślnie |
|---------|------|----------|
| `NODE_ENV` | Środowisko | `development` |
| `PORT` | Port serwera API | `4000` |
| `DATABASE_URL` | URL bazy danych | `file:./local.db` |
| `JWT_SECRET` | Sekret JWT | *wymagane* |
| `ENCRYPTION_KEY` | Klucz szyfrowania | *wymagane* |
| `AI_ENABLED` | Włącz AI | `true` |
| `AI_DEFAULT_PROVIDER` | Domyślny dostawca | `groq` |
| `AI_DEFAULT_MODEL` | Domyślny model | `llama-3.1-70b-versatile` |

## 🔌 Integracje AI

### Obsługiwani dostawcy

| Dostawca | Typ | Darmowy | Streaming | Narzędzia |
|----------|-----|--------|----------|----------|
| **Mistral** | `mistral` | ✅ | ✅ | ✅ |
| **Groq** | `groq` | ✅ | ✅ | ❌ |
| **OpenRouter** | `openrouter` | ✅ | ✅ | ❌ |

### Dodawanie klucza API

1. Zaloguj się do aplikacji
2. Przejdź do **Ustawienia > Dostawcy AI**
3. Kliknij **Dodaj dostawcę**
4. Wpisz:
   - Nazwa: np. "Mój Mistral"
   - Typ: `mistral` / `groq` / `openrouter`
   - Base URL: np. `https://api.mistral.ai`
   - Klucz API: Twój klucz z panelu dostawcy
5. Kliknij **Zapisz**
6. Przetestuj połączenie

### Limity darmowe (FREE-FIRST)

| Dostawca | Limit dzienny | Limit na minutę |
|----------|---------------|------------------|
| Mistral | 32,000 tokenów | 10 żądań |
| Groq | 30,000 tokenów | 60 żądań |
| OpenRouter | $0.01 kredytu | 60 żądań |

## 📱 iPhone / Mobile

### PWA (Progressive Web App)

Aplikacja jest **instalowalna** na iPhonie:

1. Otwórz http://localhost:3000 w Safari
2. Kliknij **Udostępnij** (↑)
3. Wybierz **Dodaj do ekranu głównego**
4. Potwierdź

### Funkcje natywne (planowane)

- [ ] **Capacitor** - Natywna warstwa
- [ ] **Mikrofon** - Nagrywanie głosu
- [ ] **STT** - Ropoznawanie mowy
- [ ] **TTS** - Synteza mowy
- [ ] **Powiadomienia** - Push notifications
- [ ] **Safe Areas** - Obsługa wycięć
- [ ] **Haptics** - Wibracje
- [ ] **Biometria** - Face ID / Touch ID

### Ograniczenia iOS

| Funkcja | Web | Natywna | Uwagi |
|---------|-----|---------|-------|
| Czat | ✅ | ✅ | Pełna obsługa |
| Głos (STT) | ⚠️ | ✅ | Wymaga Capacitor |
| Głos (TTS) | ⚠️ | ✅ | Wymaga Capacitor |
| Powiadomienia | ❌ | ✅ | Wymaga Capacitor |
| Praca w tle | ❌ | ⚠️ | Ograniczone |
| Udostępnianie | ⚠️ | ✅ | Wymaga Capacitor |

## 🎨 UI/UX

### Design System

- **Kolory**:
  - Primary: `#1a1a1a` (Grafitowy dark)
  - Accent: `#f9a51a` (Pomarańczowy)
  - Background: `#101010`
  - Text: `#ffffff` / `#a0a0a0`

- **Typografia**:
  - Sans: Inter
  - Mono: Fira Code

- **Animacje**:
  - Subtelne przejścia
  - Reduced motion support

### Widoki

1. **Czat** - Główny interfejs rozmowy
2. **Projekty** - Organizacja projektów
3. **Pamięć** - Globalna pamięć AL
4. **Pliki** - Zarządzanie dokumentami
5. **Zadania** - Lista zadań
6. **Integracje** - Podłączenia zewnętrzne
7. **Ustawienia** - Konfiguracja

## 🔐 Bezpieczeństwo

### Autentykacja
- JWT z krótkim czasem wygaśnięcia
- Secure, HttpOnly cookies
- Rate limiting
- Blokada konta po wielu nieudanych próbach

### Dane
- Hasłowanie haseł (bcrypt)
- Szyfrowanie kluczy API
- Izolacja danych użytkowników
- Walidacja wejścia/wyjścia

### API
- Autoryzacja wszystkich endpointów
- Walidacja schematów (Zod)
- Ograniczenie rozmiaru żądań
- Ochrona przed SSRF

## 📊 API Documentation

### Base URL
```
Development: http://localhost:4000/api
Production: https://api.al.example.com/api
```

### Authentication

Wszystkie endpointy wymagają autentykacji z wyjątkiem:
- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/health/*`

```bash
# Autoryzacja
Authorization: Bearer <token>
# lub
Cookie: token=<token>
```

### Endpoints

#### Auth
| Metoda | Endpoint | Opis |
|--------|----------|------|
| POST | `/auth/register` | Rejestracja |
| POST | `/auth/login` | Logowanie |
| POST | `/auth/logout` | Wylogowanie |
| GET | `/auth/me` | Pobierz moje dane |
| POST | `/auth/refresh` | Odśwież token |
| POST | `/auth/forgot-password` | Zapomniane hasło |
| POST | `/auth/reset-password` | Reset hasła |
| POST | `/auth/change-password` | Zmień hasło |

#### Users
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | `/users/me` | Pobierz profil |
| PATCH | `/users/me` | Aktualizuj profil |
| GET | `/users/me/preferences` | Pobierz preferencje |
| PATCH | `/users/me/preferences` | Aktualizuj preferencje |
| DELETE | `/users/me` | Usuń konto |
| GET | `/users/me/stats` | Statystyki |

#### Chat
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | `/chat` | Lista konwersacji |
| POST | `/chat` | Utwórz konwersację |
| GET | `/chat/:id` | Pobierz konwersację |
| PATCH | `/chat/:id` | Aktualizuj konwersację |
| DELETE | `/chat/:id` | Usuń konwersację |
| POST | `/chat/:id/messages` | Wyślij wiadomość |
| POST | `/chat/:id/messages/stream` | Wyślij wiadomość (streaming) |
| GET | `/chat/:id/messages` | Lista wiadomości |
| PATCH | `/chat/:id/messages/:messageId` | Aktualizuj wiadomość |
| DELETE | `/chat/:id/messages/:messageId` | Usuń wiadomość |
| POST | `/chat/:id/messages/:messageId/regenerate` | Wygeneruj ponownie |

#### AI Providers
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | `/ai-providers` | Lista dostawców |
| GET | `/ai-providers/:id` | Pobierz dostawcę |
| POST | `/ai-providers` | Dodaj dostawcę |
| PATCH | `/ai-providers/:id` | Aktualizuj dostawcę |
| DELETE | `/ai-providers/:id` | Usuń dostawcę |
| POST | `/ai-providers/:id/verify` | Zweryfikuj dostawcę |
| POST | `/ai-providers/:id/test` | Test połączenia |
| GET | `/ai-providers/:id/models` | Pobierz modele |
| POST | `/ai-providers/:id/models/refresh` | Odśwież modele |
| GET | `/ai-providers/default` | Pobierz domyślny |
| POST | `/ai-providers/:id/set-default` | Ustaw domyślny |

#### Projects
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | `/projects` | Lista projektów |
| POST | `/projects` | Utwórz projekt |
| GET | `/projects/:id` | Pobierz projekt |
| PATCH | `/projects/:id` | Aktualizuj projekt |
| DELETE | `/projects/:id` | Usuń projekt |

#### Tasks
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | `/tasks` | Lista zadań |
| POST | `/tasks` | Utwórz zadanie |
| GET | `/tasks/:id` | Pobierz zadanie |
| PATCH | `/tasks/:id` | Aktualizuj zadanie |
| DELETE | `/tasks/:id` | Usuń zadanie |

#### Memory
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | `/memory` | Lista wpisów pamięci |
| POST | `/memory` | Dodaj wpis |
| GET | `/memory/:id` | Pobierz wpis |
| PATCH | `/memory/:id` | Aktualizuj wpis |
| DELETE | `/memory/:id` | Usuń wpis |

#### Files
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | `/files` | Lista plików |
| POST | `/files` | Prześlij plik |
| GET | `/files/:id` | Pobierz plik |
| DELETE | `/files/:id` | Usuń plik |

#### Search
| Metoda | Endpoint | Opis |
|--------|----------|------|
| POST | `/search` | Globalne wyszukiwanie |
| POST | `/search/conversations` | Wyszukiwanie w konwersacjach |
| POST | `/search/messages` | Wyszukiwanie w wiadomościach |
| GET | `/search/quick` | Szybkie wyszukiwanie |

#### Health
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | `/health` | Status zdrowia |
| GET | `/health/detailed` | Szczegółowy status |
| GET | `/health/version` | Wersja API |
| GET | `/health/ping` | Ping |
| GET | `/health/ready` | Gotowość |
| GET | `/health/live` | Aktywność |

## 🧪 Testy

### Uruchomienie testów

```bash
# TypeCheck
pnpm typecheck

# Lint
pnpm lint

# Testy jednostkowe
pnpm test

# Build
pnpm build
```

### Testy API

```bash
# Test health endpoint
curl http://localhost:4000/api/health

# Test login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password"}'
```

## 📦 Wdrożenie

### Cloudflare

1. **Workers** - Serwer API
2. **D1** - Baza danych
3. **R2** - Przechowywanie plików
4. **Pages** - Aplikacja webowa

### Konfiguracja Cloudflare

```bash
# Ustaw zmienną środowiskową
wrangler secret put DATABASE_URL
wrangler secret put JWT_SECRET
wrangler secret put ENCRYPTION_KEY
```

### Deployment

```bash
# Build
pnpm build

# Deploy Workers
wrangler deploy

# Deploy Pages
pnpm --filter @al/web build
# Upload to Cloudflare Pages
```

## 📄 Dokumentacja

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Architektura systemu
- [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) - Stan implementacji
- [FREE_TIER_MATRIX.md](./FREE_TIER_MATRIX.md) - Darmowe opcje
- [IOS_CAPABILITIES.md](./IOS_CAPABILITIES.md) - Funkcje iOS
- [SECURITY.md](./SECURITY.md) - Model bezpieczeństwa
- [TEST_REPORT.md](./TEST_REPORT.md) - Raport testów

## 🤝 Współpraca

### Zasady

1. **Code Review** - Wszystkie PR wymagają recenzji
2. **Testy** - Nowe funkcjonalności muszą mieć testy
3. **Type Safety** - TypeScript w trybie strict
4. **Dokumentacja** - Aktualizuj dokumentację
5. **Commity** - Czytelne, atomowe commity

### Konwencja commitów

```
feat: nowa funkcjonalność
fix: poprawka błędu
docs: dokumentacja
style: formatowanie kodu
refactor: refaktoryzacja
perf: optymalizacja wydajności
test: testy
chore: utrzymanie
```

## 📜 Licencja

MIT License - 2024 Axel

## 🙏 Podziękowania

- [React](https://reactjs.org/)
- [Vite](https://vitejs.dev/)
- [Hono](https://hono.dev/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Zustand](https://zustand-demo.pmnd.rs/)
- [TypeScript](https://www.typescriptlang.org/)
- [Mistral AI](https://mistral.ai/)
- [Groq](https://groq.com/)
- [OpenRouter](https://openrouter.ai/)

---

**AL** - Twój osobisty asystent AI

*Zbudowany z pasją dla Axela* 🎵
