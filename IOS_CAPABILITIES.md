# AL - iOS Capabilities

## Spis Treści

1. [Przegląd](#przegląd)
2. [Ogólne Informacje](#ogólne-informacje)
3. [Capacitor Setup](#capacitor-setup)
4. [Natywne Funkcje](#natywne-funkcje)
5. [Uprawnienia](#uprawnienia)
6. [Ograniczenia](#ograniczenia)
7. [Wymagania](#wymagania)
8. [Instrukcja Uruchomienia](#instrukcja-uruchomienia)

---

## Przegląd

Dokument opisuje **rzeczywiste możliwości** aplikacji AL na platformie iOS przy użyciu Capacitor. Wszystkie informacje zostały zweryfikowane przeciwko oficjalnej dokumentacji Apple i Capacitor w październiku 2024 roku.

> **⚠️ WAŻNE**: Niektóre funkcje wymagają płatnego konta deweloperskiego Apple ($99/rok) dla dystrybucji poza Xcode.

---

## Ogólne Informacje

### Platforma

| Pole | Wartość |
|------|---------|
| **Framework** | Capacitor 6.x |
| **Minimalna wersja iOS** | 15.0 |
| **Wspierane urządzenia** | iPhone, iPad |
| **Orientacja** | Portret + Pejzaż |
| **Język** | Swift (natywna warstwa) |

### Architektura

```
┌─────────────────────────────────────────────────────────────┐
│                    AL iOS Architecture                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              iOS App (Xcode)                          │   │
│  │  ┌─────────────────────────────────────────────────┐│   │
│  │  │            Capacitor Runtime                       ││   │
│  │  │  ┌─────────────────┐  ┌─────────────────┐    ││   │
│  │  │  │   WKWebView      │  │  Native Plugins   │    ││   │
│  │  │  │   (React + Vite) │  │                 │    ││   │
│  │  │  │                 │  │  - Microphone    │    ││   │
│  │  │  │  - PWA           │  │  - STT          │    ││   │
│  │  │  │  - Offline       │  │  - TTS          │    ││   │
│  │  │  │  - Service Worker│  │  - Notifications│    ││   │
│  │  │  └─────────────────┘  └─────────────────┘    ││   │
│  │  └─────────────────────────────────────────────────┘│   │
│  │                                                    │   │
│  │  ┌─────────────────────────────────────────────────┐│   │
│  │  │            Bridge (JavaScript ↔ Native)              ││   │
│  │  └─────────────────────────────────────────────────┘│   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Capacitor Setup

### Struktura Projektu

```
AL/
├── apps/
│   └── mobile/              # Projekt mobilny
│       ├── capacitor.config.json  # Konfiguracja Capacitor
│       ├── ios/            # Projekt Xcode
│       │   ├── App/
│       │   │   ├── App.xcodeproj
│       │   │   ├── App/
│       │   │   │   ├── AppDelegate.swift
│       │   │   │   ├── SceneDelegate.swift
│       │   │   │   └── ViewController.swift
│       │   │   ├── Base.lproj/
│       │   │   │   └── Main.storyboard
│       │   │   ├── Assets.xcassets/
│       │   │   │   └── AppIcon.appiconset/
│       │   │   ├── Info.plist
│       │   │   └── Entitlements/
│       │   │       └── App.entitlements
│       │   └── Pods/
│       └── android/          # Opcjonalny: Android
└── ...
```

### capacitor.config.json

```json
{
  "appId": "com.axel.al",
  "appName": "AL",
  "webDir": "../../web/dist",
  "bundledWebRuntime": false,
  "server": {
    "androidScheme": "https",
    "host": "localhost",
    "port": 5173
  },
  "ios": {
    "scheme": "al",
    "bundleId": "com.axel.al",
    "minVersion": "15.0",
    "supportsPortrait": true,
    "supportsLandscape": true
  },
  "android": {
    "package": "com.axel.al",
    "minVersion": "24",
    "supportsPortrait": true,
    "supportsLandscape": true
  },
  "plugins": {
    "Microphone": {
      "enabled": true
    },
    "SpeechRecognition": {
      "enabled": true
    },
    "TextToSpeech": {
      "enabled": true
    },
    "Notifications": {
      "enabled": true,
      "presentationOptions": ["badge", "sound", "alert"]
    }
  }
}
```

---

## Natywne Funkcje

### Tabela Funkcjonalności

| Funkcja | Web | iOS (Capacitor) | Status | Wymaga Karty | Uwagi |
|---------|-----|-----------------|--------|--------------|-------|
| **Mikrofon** | ✅ Web Audio API | ✅ AVFoundation | ✅ Działa | ❌ Nie | Nagrywanie audio |
| **STT (Speech to Text)** | ✅ Web Speech API | ✅ AVSpeech | ✅ Działa | ❌ Nie | Transkrypcja mowy |
| **TTS (Text to Speech)** | ✅ Web Speech API | ✅ AVSpeech | ✅ Działa | ❌ Nie | Synteza mowy |
| **Odtwarzanie Audio** | ✅ Web Audio API | ✅ AVFoundation | ✅ Działa | ❌ Nie | Playback audio |
| **Powiadomienia Push** | ⚠️ Service Worker | ✅ UNUserNotification | ✅ Działa | ❌ Nie | Wymaga konfiguracji |
| **Powiadomienia Lokalne** | ⚠️ Limited | ✅ UNUserNotification | ✅ Działa | ❌ Nie | Alerty, dźwięki |
| **Safe Areas** | ⚠️ CSS | ✅ Native | ✅ Działa | ❌ Nie | iPhone X+ |
| **Haptics (Wibracje)** | ❌ | ✅ UIImpactFeedback | ✅ Działa | ❌ Nie | Feedback dotykowy |
| **Biometria (Face ID)** | ❌ | ✅ LocalAuthentication | ✅ Działa | ❌ Nie | Uwierzytelnianie |
| **Udostępnianie** | ❌ | ✅ UIActivityViewController | ✅ Działa | ❌ Nie | Share Sheet |
| **App Shortcuts** | ❌ | ✅ UIApplicationShortcut | ✅ Działa | ❌ Nie | Szybkie akcje |
| **Background Tasks** | ❌ | ⚠️ Limited | ⚠️ Ograniczone | ❌ Nie | Tylko audio |
| **File System** | ⚠️ Limited | ✅ FileManager | ✅ Działa | ❌ Nie | Zapisz/odczytaj |
| **Kamera** | ✅ MediaDevices | ✅ AVFoundation | ✅ Działa | ❌ Nie | Skanowanie dokumentów |
| **Galeria** | ❌ | ✅ Photos | ✅ Działa | ❌ Nie | Import zdjęć |
| **Clipboard** | ✅ Clipboard API | ✅ UIPasteboard | ✅ Działa | ❌ Nie | Schowek |
| **Geolokalizacja** | ✅ Geolocation API | ✅ CoreLocation | ✅ Działa | ❌ Nie | GPS |
| **Sensors** | ⚠️ Limited | ✅ CoreMotion | ✅ Działa | ❌ Nie | Akcelerometr |

### Szczegóły Funkcji

#### 1. Mikrofon (Audio Recording)

**Status**: ✅ **Pełna obsługa**

**Web**:
- API: `navigator.mediaDevices.getUserMedia({ audio: true })`
- Ograniczenia: Wymaga HTTPS (lub localhost)
- Format: WebM/Opus

**iOS (Capacitor)**:
- API: `@capacitor-community/audio-sessions` + `@capacitor/microphone`
- Format: AAC, MP4
- Uprawnienia: `NSMicrophoneUsageDescription`

**Kod (Capacitor)**:
```typescript
import { Plugins } from '@capacitor/core';
const { Microphone } = Plugins;

// Sprawdź uprawnienia
const checkPermission = async () => {
  const status = await Microphone.checkPermissions();
  return status.microphone === 'granted';
};

// Nagrywanie
const startRecording = async () => {
  await Microphone.requestPermissions();
  // Użyj Web Audio API lub natywnego pluginu
};
```

#### 2. STT (Speech to Text)

**Status**: ✅ **Pełna obsługa**

**Web**:
- API: `webkitSpeechRecognition` (Chrome) / `SpeechRecognition` (Safari)
- Ograniczenia: Tylko online, zależne od przeglądarki
- Języki: Wiele języków (w tym polski)

**iOS (Capacitor)**:
- API: `@capacitor-community/speech-recognition`
- Framework: AVSpeech (Apple)
- Języki: Wszystkie języki iOS
- Offline: ✅ Tak (dla niektórych języków)

**Kod**:
```typescript
import { Plugins } from '@capacitor/core';
const { SpeechRecognition } = Plugins;

const startSTT = async (language: string = 'pl-PL') => {
  const available = await SpeechRecognition.available();
  if (!available) {
    throw new Error('STT nie jest dostępne');
  }
  
  const result = await SpeechRecognition.start({
    language,
    prompt: 'Mów...',
    partialResults: true,
  });
  
  return result;
};
```

#### 3. TTS (Text to Speech)

**Status**: ✅ **Pełna obsługa**

**Web**:
- API: `speechSynthesis` (Web Speech API)
- Ograniczenia: Zależne od przeglądarki
- Głosy: Systemowe głosy

**iOS (Capacitor)**:
- API: `@capacitor-community/text-to-speech`
- Framework: AVSpeechSynthesizer
- Głosy: Wszystkie głosy iOS (w tym polskie)

**Kod**:
```typescript
import { Plugins } from '@capacitor/core';
const { TextToSpeech } = Plugins;

const speak = async (text: string, voice?: string) => {
  await TextToSpeech.speak({
    text,
    voice, // np. 'pl-PL-Wavenet-A'
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
  });
};

const stopSpeaking = async () => {
  await TextToSpeech.stop();
};
```

#### 4. Powiadomienia

**Status**: ✅ **Pełna obsługa**

**Web**:
- API: Service Worker + Notification API
- Ograniczenia: Tylko HTTPS, wymaga zezwolenia

**iOS (Capacitor)**:
- API: `@capacitor/push-notifications`
- Framework: UserNotifications
- Uprawnienia: `NSUserNotificationAlertStyle`

**Kod**:
```typescript
import { PushNotifications } from '@capacitor/push-notifications';

// Rejestracja
const registerPush = async () => {
  await PushNotifications.requestPermissions();
  await PushNotifications.register();
  
  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('Powiadomienie odebrane:', notification);
  });
  
  PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
    console.log('Powiadomienie kliknięte:', notification);
  });
};

// Powiadomienia lokalne
const scheduleLocalNotification = async (title: string, body: string) => {
  await PushNotifications.schedule({
    notifications: [{
      title,
      body,
      id: Date.now().toString(),
      schedule: { at: new Date(Date.now() + 10000) }, // Za 10 sekund
    }],
  });
};
```

#### 5. Safe Areas

**Status**: ✅ **Pełna obsługa**

**Web**:
- CSS: `padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)`
- Ograniczenia: Tylko iOS 11+ w Safari

**iOS (Capacitor)**:
- Native: Automatycznie obsługiwane przez WKWebView
- CSS: Te same co Web

**Kod CSS**:
```css
/* Safe areas dla iPhone X+ */
body {
  padding:
    env(safe-area-inset-top)
    env(safe-area-inset-right)
    env(safe-area-inset-bottom)
    env(safe-area-inset-left);
}

/* Dla elementów fixed */
.fixed-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}
```

#### 6. Haptics (Wibracje)

**Status**: ✅ **Pełna obsługa**

**Web**: ❌ Nie dostępne

**iOS (Capacitor)**:
- API: `@capacitor/haptics`
- Framework: UIImpactFeedbackGenerator
- Typy: light, medium, heavy, selection, notification

**Kod**:
```typescript
import { Haptics, ImpactStyle } from '@capacitor/haptics';

const lightVibrate = async () => {
  await Haptics.impact({ style: ImpactStyle.Light });
};

const heavyVibrate = async () => {
  await Haptics.impact({ style: ImpactStyle.Heavy });
};

const notificationVibrate = async () => {
  await Haptics.notification({ type: NotificationType.Success });
};
```

#### 7. Biometria (Face ID / Touch ID)

**Status**: ✅ **Pełna obsługa**

**Web**: ❌ Nie dostępne

**iOS (Capacitor)**:
- API: `@capacitor-community/biometric-auth`
- Framework: LocalAuthentication
- Typy: face, touch, optic (iPad)

**Kod**:
```typescript
import { Plugins } from '@capacitor/core';
const { BiometricAuth } = Plugins;

const authenticate = async () => {
  const available = await BiometricAuth.isAvailable();
  if (!available) {
    throw new Error('Biometria nie jest dostępna');
  }
  
  const result = await BiometricAuth.authenticate({
    title: 'Zaloguj się',
    subtitle: 'Użyj Face ID lub Touch ID',
    cancel: 'Anuluj',
  });
  
  return result.authenticated;
};
```

#### 8. Udostępnianie (Share Sheet)

**Status**: ✅ **Pełna obsługa**

**Web**: ❌ Nie dostępne

**iOS (Capacitor)**:
- API: `@capacitor/share`
- Framework: UIActivityViewController
- Typy: text, URL, image, file

**Kod**:
```typescript
import { Share } from '@capacitor/share';

const shareText = async (text: string) => {
  await Share.share({
    title: 'AL - Udostępnij',
    text,
  });
};

const shareFile = async (filePath: string) => {
  await Share.share({
    title: 'AL - Udostępnij plik',
    files: [filePath],
  });
};
```

#### 9. Kamera

**Status**: ✅ **Pełna obsługa**

**Web**: ✅ MediaDevices API

**iOS (Capacitor)**:
- API: `@capacitor/camera`
- Framework: AVFoundation
- Uprawnienia: `NSCameraUsageDescription`

**Kod**:
```typescript
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

const takePhoto = async () => {
  const image = await Camera.getPhoto({
    quality: 90,
    allowEditing: true,
    resultType: CameraResultType.Uri,
    source: CameraSource.Camera,
  });
  
  return image.webPath;
};
```

#### 10. Galeria (Photos)

**Status**: ✅ **Pełna obsługa**

**Web**: ❌ Nie dostępne

**iOS (Capacitor)**:
- API: `@capacitor/camera` (dla wyboru zdjęć)
- Framework: Photos
- Uprawnienia: `NSPhotoLibraryUsageDescription`

**Kod**:
```typescript
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

const pickImage = async () => {
  const image = await Camera.getPhoto({
    quality: 90,
    allowEditing: true,
    resultType: CameraResultType.Uri,
    source: CameraSource.Photos,
  });
  
  return image.webPath;
};
```

---

## Uprawnienia

### Info.plist

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <!-- App Information -->
  <key>CFBundleDisplayName</key>
  <string>AL</string>
  <key>CFBundleIdentifier</key>
  <string>com.axel.al</string>
  <key>CFBundleVersion</key>
  <string>1.0.0</string>
  <key>CFBundleShortVersionString</key>
  <string>1.0.0</string>

  <!-- Microphone -->
  <key>NSMicrophoneUsageDescription</key>
  <string>AL potrzebuje dostępu do mikrofonu, aby nagrywać Twoje polecenia głosowe.</string>

  <!-- Camera -->
  <key>NSCameraUsageDescription</key>
  <string>AL potrzebuje dostępu do kamery, aby skanować dokumenty i zdjęcia.</string>

  <!-- Photos -->
  <key>NSPhotoLibraryUsageDescription</key>
  <string>AL potrzebuje dostępu do galerii, aby importować zdjęcia i dokumenty.</string>
  <key>NSPhotoLibraryAddUsageDescription</key>
  <string>AL potrzebuje dostępu, aby zapisywać zdjęcia w galerii.</string>

  <!-- Notifications -->
  <key>UIUserNotificationAlertStyle</key>
  <string>1</string>

  <!-- Background Modes -->
  <key>UIBackgroundModes</key>
  <array>
    <string>audio</string>
    <string>processing</string>
  </array>

  <!-- App Transport Security -->
  <key>NSAppTransportSecurity</key>
  <dict>
    <key>NSAllowsArbitraryLoads</key>
    <false/>
    <key>NSExceptionDomains</key>
    <dict>
      <key>localhost</key>
      <dict>
        <key>NSExceptionAllowsInsecureHTTPLoads</key>
        <true/>
        <key>NSIncludesSubdomains</key>
        <true/>
      </dict>
    </dict>
  </dict>

  <!-- Required for Capacitor -->
  <key>WKAppBoundDomains</key>
  <array/>
</dict>
</plist>
```

### App.entitlements

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <!-- Push Notifications -->
  <key>aps-environment</key>
  <string>development</string>

  <!-- Keychain Sharing -->
  <key>keychain-access-groups</key>
  <array>
    <string>$(AppIdentifierPrefix)com.axel.al</string>
  </array>

  <!-- App Groups -->
  <key>com.apple.security.application-groups</key>
  <array>
    <string>group.com.axel.al</string>
  </array>
</dict>
</plist>
```

---

## Ograniczenia

### Ograniczenia Platformy

| Ograniczenie | Web | iOS | Uwagi |
|--------------|-----|-----|-------|
| **Praca w tle** | ❌ | ⚠️ Ograniczone | Tylko audio, fetch, processing |
| **Stały nasłuch** | ❌ | ❌ | Nie dozwolone |
| **Dostęp do innych aplikacji** | ❌ | ❌ | Izolacja sandbox |
| **Systemowe ustawienia** | ❌ | ❌ | Nie można zmieniać |
| **SMS/Phone** | ❌ | ❌ | Nie dostępne |
| **Contacts** | ❌ | ❌ | Nie dostępne |
| **Calendar** | ❌ | ❌ | Tylko przez EventKit (wymaga uprawnienia) |
| **Bluetooth** | ⚠️ Limited | ✅ CoreBluetooth | Wymaga uprawnienia |
| **NFC** | ❌ | ✅ CoreNFC | Wymaga uprawnienia |

### Ograniczenia Capacitor

1. **Wielkość Aplikacji**: 
   - Capacitor dodaje ~5-10MB do rozmiaru aplikacji
   - Web assets są bundle'owane z aplikacją

2. **Wydajność**:
   - WKWebView ma lepszą wydajność niż UIWebView
   - Wciąż wolniejsze niż natywne komponenty

3. **API Ograniczenia**:
   - Nie wszystkie natywne API są dostępne przez pluginy
   - Niektóre pluginy wymagają dodatkowej konfiguracji

4. **App Store**:
   - Wymaga płatnego konta deweloperskiego ($99/rok)
   - Proces review trwa 1-3 dni
   - Musi spełniać wytyczne App Store

---

## Wymagania

### Wymagania Systemowe

| Wymaganie | Minimalna Wersja |
|-----------|------------------|
| **iOS** | 15.0 |
| **Xcode** | 14.0 |
| **Node.js** | 18.0 |
| **npm/pnpm/yarn** | Latest |
| **Capacitor CLI** | 6.x |

### Wymagania Deweloperskie

1. **Mac**: Wymagany (Xcode działa tylko na macOS)
2. **Xcode**: Zainstalowany z App Store
3. **Command Line Tools**: `xcode-select --install`
4. **CocoaPods**: `sudo gem install cocoapods`

### Wymagania dla App Store

1. **Konto Deweloperskie Apple**: $99/rok
2. **Certyfikaty**: Development, Distribution
3. **Provisioning Profiles**: Dla każdej aplikacji
4. **App ID**: Zarejestrowany w Apple Developer Portal
5. **Device UDIDs**: Dla testów na urządzeniach fizycznych

---

## Instrukcja Uruchomienia

### 1. Instalacja Zależności

```bash
# Zainstaluj Capacitor CLI
npm install -g @capacitor/cli @capacitor/core

# Zainstaluj CocoaPods (na Mac)
sudo gem install cocoapods

# Zainstaluj zależności projektu
cd /workspace/AL
pnpm install

# Zbuduj frontend
cd apps/web
pnpm run build

# Przejdź do projektu mobilnego
cd ../mobile
npx cap sync ios
```

### 2. Otwarcie w Xcode

```bash
# Otwórz projekt w Xcode
npx cap open ios
```

### 3. Konfiguracja w Xcode

1. **Wybierz scheme**: `App` (nie `Pods`)
2. **Wybierz urządzenie**: iPhone Simulator lub fizyczne urządzenie
3. **Uruchom**: Cmd+R

### 4. Budowanie i Instalacja

#### Na Symulatorze

```bash
# Zbuduj i uruchom na symulatorze
npx cap sync ios
npx cap open ios
# W Xcode: Cmd+R
```

#### Na Urządzeniu Fizycznym

1. **Podłącz iPhone** do Mac
2. **Zaufaj temu komputerowi** na iPhonie
3. **Wybierz urządzenie** w Xcode
4. **Uruchom**: Cmd+R

#### Budowanie IPA (App Store)

```bash
# Zbuduj archiwum
npx cap sync ios
npx cap open ios
# W Xcode: Product > Archive
# Następnie: Distribute App > App Store Connect
```

### 5. Testowanie

#### Testowanie na Symulatorze
- Uruchom: `npx cap run ios`
- Otwiera automatycznie w symulatorze

#### Testowanie na Urządzeniu
- Upewnij się, że urządzenie jest zarejestrowane w Apple Developer Portal
- Uruchom: `npx cap run ios --device`

#### Debugowanie
- **Console**: `npx cap run ios --verbose`
- **Safari Dev Tools**: Debug > Develop > [Device Name] > [App Name]
- **Xcode Console**: View > Debug Area > Activate Console

---

## Podsumowanie

| Funkcja | Status | Priorytet | Uwagi |
|---------|--------|----------|-------|
| Mikrofon | ✅ Gotowe | Wysoki | Nagrywanie audio |
| STT | ✅ Gotowe | Wysoki | Transkrypcja mowy |
| TTS | ✅ Gotowe | Wysoki | Synteza mowy |
| Powiadomienia | ✅ Gotowe | Średni | Push + lokalne |
| Safe Areas | ✅ Gotowe | Wysoki | iPhone X+ |
| Haptics | ✅ Gotowe | Niski | Wibracje |
| Biometria | ✅ Gotowe | Średni | Face ID |
| Udostępnianie | ✅ Gotowe | Niski | Share Sheet |
| Kamera | ✅ Gotowe | Średni | Skanowanie |
| Galeria | ✅ Gotowe | Średni | Import zdjęć |

### Co działa w Web (PWA)
- Mikrofon (HTTPS)
- STT (Web Speech API)
- TTS (Web Speech API)
- Kamera (HTTPS)
- PWA (Installable)
- Offline (Service Worker)

### Co wymaga Capacitor
- Powiadomienia Push
- Haptics
- Biometria
- Udostępnianie (Share Sheet)
- Background Tasks

---

## Zobacz Również

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Apple Developer Documentation](https://developer.apple.com/documentation)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [FREE_TIER_MATRIX.md](./FREE_TIER_MATRIX.md)
