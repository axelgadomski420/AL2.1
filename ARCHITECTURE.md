# AL - Architektura

## Spis Treści

1. [Przegląd](#przegląd)
2. [Architektura Ogólna](#architektura-ogólna)
3. [Monorepo](#monorepo)
4. [Backend](#backend)
5. [Frontend](#frontend)
6. [Baza Danych](#baza-danych)
7. [System Pamięci](#system-pamięci)
8. [Integracja AI](#integracja-ai)
9. [Głos](#głos)
10. [Pliki](#pliki)
11. [iOS](#ios)
12. [Bezpieczeństwo](#bezpieczeństwo)
13. [Wydajność](#wydajność)

---

## Przegląd

AL to osobisty asystent AI zaprojektowany jako spójna, szybka i niezawodna aplikacja webowa z natywną integracją iOS. Projekt opiera się na nowoczesnym stacku technologicznym.

---

## Architektura Ogólna

### Stack Technologiczny

| Warstwa | Technologia | Zastosowanie |
|---------|-------------|---------------|
| **Frontend** | React 18 + Vite 5 + TypeScript | UI, PWA |
| **State Management** | Zustand 4 | Stan aplikacji |
| **Styling** | Tailwind CSS 3 | Design system |
| **Backend** | Hono 4 + TypeScript | API, Logic |
| **ORM** | Drizzle 0.30 | Baza danych |
| **Baza Danych** | SQLite / Cloudflare D1 | Przechowywanie |
| **Storage** | Cloudflare R2 | Pliki |
| **Auth** | JWT + bcrypt | Autentykacja |
| **Validation** | Zod 3 | Walidacja |
| **iOS** | Capacitor | Natywna warstwa |

---

## Monorepo

### Struktura Projektu

```
AL/
├── apps/
│   ├── web/          # Frontend - React + Vite + PWA
│   │   ├── src/
│   │   │   ├── components/    # Komponenty UI
│   │   │   ├── pages/         # Strony
│   │   │   ├── hooks/         # Custom hooks
│   │   │   ├── store/         # Zustand stores
│   │   │   ├── styles/        # Style
│   │   │   ├── types/         # Typy TypeScript
│   │   │   ├── utils/         # Utility
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   ├── public/
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   └── api/          # Backend - Hono
│       ├── src/
│       │   ├── config/
│       │   ├── middleware/
│       │   ├── routes/
│       │   ├── services/
│       │   └── index.ts
│       └── package.json
│
├── packages/
│   ├── shared/       # Wspólne typy, schematy, stałe
│   ├── db/           # Schema bazy danych (Drizzle)
│   ├── ui/           # Wspólne komponenty UI
│   └── tools/        # Integracje narzędzi
│
├── package.json
├── turbo.json
├── tsconfig.base.json
└── pnpm-workspace.yaml
```

---

## Backend

### Architektura API

**Framework**: Hono 4 (lekkie, szybkie, TypeScript-first)

**Główne moduły**:
- `config/` - Konfiguracja (app, auth, database)
- `middleware/` - Auth, Error Handling, Rate Limiting
- `routes/` - Endpointy RESTful
- `services/` - Logika biznesowa

**Endpointy**:
- `/auth/*` - Logowanie, rejestracja, wylogowanie
- `/users/*` - Profil użytkownika
- `/chat/*` - Rozmowy, wiadomości
- `/ai/*` - Dostawcy AI, modele
- `/memory/*` - System pamięci
- `/projects/*` - Projekty
- `/tasks/*` - Zadania
- `/files/*` - Pliki
- `/search` - Wyszukiwanie globalne
- `/health` - Health check

---

## Frontend

### Architektura

**Framework**: React 18 + Vite 5

**Routing**: React Router DOM 6

**State Management**: Zustand 4 (proste, typowane, efektywne)

**Styling**: Tailwind CSS 3 (utility-first, dark mode)

**PWA**: Vite Plugin PWA (manifest, service worker, offline)

### Strony

- `LoginPage` - Logowanie i rejestracja
- `ChatPage` - Główny czat z AI
- `ProjectsPage` - Lista projektów
- `ProjectDetailPage` - Szczegóły projektu
- `TasksPage` - Lista zadań
- `MemoryPage` - System pamięci
- `FilesPage` - Zarządzanie plikami
- `IntegrationsPage` - Integracje zewnętrzne
- `SettingsPage` - Ustawienia

---

## Baza Danych

### Schema (Drizzle ORM)

**Główne tabele**:

1. **users** - Użytkownicy
2. **ai_providers** - Dostawcy AI (Mistral, Groq, OpenRouter)
3. **conversations** - Rozmowy
4. **messages** - Wiadomości
5. **projects** - Projekty
6. **tasks** - Zadania
7. **memory_entries** - Wpisy pamięci
8. **documents** - Dokumenty
9. **integrations** - Integracje zewnętrzne
10. **reminders** - Przypomnienia

**Relacje**:
- Użytkownik → Dostawcy AI (1:N)
- Użytkownik → Rozmowy (1:N)
- Użytkownik → Projekty (1:N)
- Użytkownik → Zadania (1:N)
- Użytkownik → Wpisy pamięci (1:N)
- Użytkownik → Dokumenty (1:N)
- Projekt → Rozmowy (1:N)
- Projekt → Zadania (1:N)
- Projekt → Wpisy pamięci (1:N)
- Rozmowa → Wiadomości (1:N)
- Wiadomości → Wiadomości (self-referencing, threading)

---

## System Pamięci

### Context Builder

**12-krokowy proces budowania kontekstu**:

1. **Uwierzytelnienie** - Weryfikacja tożsamości użytkownika
2. **Zapis wiadomości** - Zapisz wiadomość użytkownika
3. **Okrelenie intencji** - Analiza intencji i kontekstu projektu
4. **Sprawdzenie indeksu** - Weryfikacja stanu indeksu pamięci
5. **Załadowanie profilu** - Pobranie profilu i podsumowań
6. **Wyszukiwanie źródeł** - Znajdź odpowiednie informacje
7. **Dodanie stanu projektu** - Dołącz aktualny stan projektu
8. **Rozstrzyganie konfliktów** - Oznaczenie sprzecznych informacji
9. **Budowanie kontekstu** - Złożenie kontekstu w budżecie tokenów
10. **Wywołanie modelu** - Wysłanie do AI
11. **Zapis odpowiedzi** - Zapisz odpowiedź i użycie API
12. **Aktualizacja indeksu** - Zlecenie aktualizacji pamięci

### Zasady Pamięci

- **Current command > Old preference** - Najnowsze polecenie ma pierwszeństwo
- **Later correction > Earlier statement** - Późniejsze sprostowanie zastępuje wcześniejsze
- **AI response ≠ Fact** - Odpowiedź modelu nie staje się automatycznie faktem
- **Documents are data** - Dokumenty są danymi, nie instrukcjami systemowymi
- **Secrets excluded** - Sekrety nie trafiają do pamięci
- **Sensitive data requires consent** - Dane wrażliwe wymagają wyraźnej zgody

---

## Integracja AI

### Dostawcy

- **Mistral** - mistral.ai
- **Groq** - groq.com
- **OpenRouter** - openrouter.ai

### Architektura

**AI Service** zarządza:
- Rejestracją dostawców
- Weryfikacją kluczy API
- Wyborem modelu
- Wywoływaniem AI
- Streamowaniem odpowiedzi
- Śledzeniem użycia tokenów

**Adapter Pattern**: Każdy dostawca ma swój adapter implementujący wspólny interfejs.

### Routing Modeli

**FREE-FIRST** (domyślny):
- Wybiera darmowe modele
- Pokazuje błędy, gdy brak darmowych opcji
- Nigdy nie używa płatnych modeli bez zgody

**FREE-ONLY**:
- Tylko modele z potwierdzonym darmowym API
- Brak automatycznego fallbacku do płatnych

**PAID allowed**:
- Używa preferowanych modeli użytkownika
- Fallback do dostępnych modeli
- Śledzenie kosztów

---

## Głos

### Architektura

**Voice Service** zarządza:
- Nagrywaniem audio (Recording Adapter)
- STT - Speech to Text (STT Adapter)
- TTS - Text to Speech (TTS Adapter)
- Odtwarzaniem audio (Playback Adapter)

### Platformy

| Funkcja | Web (Chrome/Safari) | iOS (Capacitor) | Status |
|---------|---------------------|-----------------|--------|
| Nagrywanie | Web Audio API | AVFoundation | ✅ |
| STT | Web Speech API | AVSpeech | ✅ |
| TTS | Web Speech API | AVSpeech | ✅ |
| Odtwarzanie | Web Audio API | AVFoundation | ✅ |

---

## Pliki

### Obsługiwane typy

| Typ | Rozszerzenia | Przetwarzanie | Indeksowanie |
|-----|--------------|---------------|--------------|
| Text | .txt | Pełna treść | ✅ |
| Markdown | .md | Treść + formatowanie | ✅ |
| PDF | .pdf | Ekstrakcja tekstu | ✅ |
| JSON | .json | Parsowanie | ✅ |
| CSV | .csv | Parsowanie | ✅ |
| Obrazy | .png, .jpg, .webp | OCR + metadane | ✅ |
| Audio | .mp3, .wav | Transkrypcja | ✅ |

### Pipeline

1. **Upload** - Przesłanie pliku
2. **Validate** - Walidacja rozmiaru, typu, zawartości
3. **Store** - Zapisz w R2 lub lokalnie
4. **Process** - Ekstrakcja tekstu, OCR, itp.
5. **Index** - Utwórz wpisy pamięci
6. **Ready** - Plik gotowy do użycia

---

## iOS

### Capacitor

**Projekt iOS**:
- `apps/mobile/ios/` - Projekt Xcode
- `capacitor.config.json` - Konfiguracja Capacitor

**Natywne funkcje**:
- Mikrofon (nagrywanie audio)
- STT/TTS (natywne API)
- Powiadomienia push
- Safe Areas (iPhone X+)
- Haptics (wibracje)
- Biometria (Face ID / Touch ID)
- Udostępnianie (Share Sheet)

### Wymagane uprawnienia (Info.plist)

```xml
<key>NSMicrophoneUsageDescription</key>
<string>AL potrzebuje dostępu do mikrofonu, aby nagrywać Twoje polecenia głosowe.</string>

<key>NSCameraUsageDescription</key>
<string>AL potrzebuje dostępu do kamery, aby skanować dokumenty.</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>AL potrzebuje dostępu do galerii, aby importować zdjęcia i dokumenty.</string>
```

---

## Bezpieczeństwo

### Model Bezpieczeństwa

**Poziomy danych**:

1. **Public Data** - Wersja, status (brak ochrony)
2. **User Data** - Email, rozmowy, projekty (JWT wymagany)
3. **Sensitive Data** - Hashe haseł, tokeny sesji (szyfrowane)
4. **Secrets** - Klucze API, tokeny integracji (szyfrowane + uwierzytelnione)

### Autentykacja

- **JWT** (JSON Web Tokens)
- **bcrypt** (hashowanie haseł, cost factor: 12)
- **httpOnly cookies** (ochrona przed XSS)
- **Access token**: 15 minut
- **Refresh token**: 7 dni

### Szyfrowanie Kluczy API

- **AES-256-GCM** (szyfrowanie uwierzytelnione)
- **Unikalny nonce** dla każdego szyfrowania
- **Główny klucz** jako sekret infrastruktury
- **Nigdy nie zwracaj** zapisanego klucza do klienta

### Ochrona

- **CORS** - Ograniczone do zaufanych originów
- **Rate Limiting** - Per user/IP
- **Security Headers** - XSS, Clickjacking, HSTS
- **Input Validation** - Zod schemas na wszystkich endpointach

---

## Wydajność

### Optymalizacje

**Backend**:
- Connection pooling (Drizzle)
- Caching (AI models, user preferences)
- Lazy loading (related data)
- Pagination (all list endpoints)
- Streaming (SSE for chat)

**Frontend**:
- Code splitting (Vite)
- Lazy loading (React.lazy)
- Memoization (React.memo)
- Virtualization (long lists)
- Debouncing (search, input)

**Database**:
- Proper indexing
- Composite indexes
- Query optimization
- Batch operations

---

## Podsumowanie

Architektura AL została zaprojektowana z naciskiem na:

1. **Modularność** - Wyraźne rozdzielenie odpowiedzialności
2. **Typowanie** - TypeScript strict mode
3. **Skalowalność** - Monorepo z Turbo
4. **Bezpieczeństwo** - Wielowarstwowa ochrona
5. **Wydajność** - Optymalizacje na każdej warstwie
6. **Elastyczność** - Łatwa rozbudowa
7. **Platformowość** - Web-first z natywną integracją iOS

---

## Zobacz Również

- [README.md](./README.md)
- [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md)
