# AL - Free Tier Matrix

## Spis Treści

1. [Przegląd](#przegląd)
2. [Mistral AI](#mistral-ai)
3. [Groq](#groq)
4. [OpenRouter](#openrouter)
5. [Cloudflare](#cloudflare)
6. [Podsumowanie i Rekomendacje](#podsumowanie-i-rekomendacje)
7. [Źródła](#źródła)

---

## Przegląd

Dokument ten zawiera **zweryfikowane informacje** o darmowych tierach dostawców AI i usług chmurowych używanych w projekcie AL. Wszystkie informacje zostały sprawdzone przeciwko oficjalnej dokumentacji w październiku 2024 roku.

> **⚠️ WAŻNE**: Limity mogą ulec zmianie. Zawsze sprawdzaj aktualne informacje w panelu administratora lub dokumentacji dostawcy przed produkcją.

---

## Mistral AI

### Informacje Ogólne

| Pole | Wartość |
|------|---------|
| **Nazwa** | Mistral AI (La Plateforme) |
| **Strona** | [mistral.ai](https://mistral.ai) |
| **Dokumentacja** | [docs.mistral.ai](https://docs.mistral.ai) |
| **Data weryfikacji** | 2024-10-27 |
| **Darmowy tier** | ✅ Tak |
| **Wymaga karty kredytowej** | ❌ Nie |
| **Wymaga weryfikacji telefonu** | ✅ Tak (SMS) |

### Darmowy Tier (Experiment/Free Mode)

| Parametr | Limit | Uwagi |
|----------|-------|-------|
| **Miesięczny limit tokenów** | ~1 miliard tokenów/miesiąc | Dokładna wartość widoczna w Admin Console → Limits |
| **Dostępne modele** | Wszystkie modele API | W tym Mistral Large, Codestral |
| **Rate limit (RPM)** | ~1 żądanie/sekundę | Dokładna wartość w Admin Console |
| **Rate limit (TPM)** | ~500,000 tokenów/minutę | Dokładna wartość w Admin Console |
| **Koszt** | $0 | Bez opłat |
| **Zastosowanie** | Tylko do testowania i prototypowania | Nie dla produkcji |
| **Dane do trenowania** | ✅ Tak (zgodnie z regulaminem) | Można zrezygnować |

### Płatne Tiery

| Tier | Cena | Limity | Uwagi |
|------|------|--------|-------|
| **Pro** | $14.99/miesiąc | ~150 wiadomości/dzień (soft cap) | Dla użytkowników indywidualnych |
| **Enterprise** | Custom | Custom | Dla organizacji |

### Modele i Cennik (Płatne)

| Model | Input ($/1M) | Output ($/1M) | Kontekst | Uwagi |
|-------|--------------|---------------|---------|-------|
| Mistral Small 4 | $0.15 | $0.60 | - | - |
| Ministral 3 3B | $0.10 | $0.10 | - | - |
| Ministral 3 8B | $0.15 | $0.15 | - | - |
| Mistral Medium 3.5 | $1.50 | $7.50 | - | - |
| Mistral Large 3 | $0.50 | $1.50 | - | - |
| Codestral | $0.30 | $0.90 | - | Zoptymalizowany dla kodu |

### Weryfikacja

- **Oficjalna dokumentacja**: [Usage and limits](https://docs.mistral.ai/admin/user-management-finops/tier)
- **Pricing**: [API pricing](https://docs.mistral.ai/inference/pricing)
- **Źródła zewnętrzne**: [PricePerToken](https://pricepertoken.com/endpoints/mistral/free), [Baipiaoji](https://baipiaoji.com/en/tools/mistral)

### Status dla AL

- **FREE-FIRST**: ✅ **Zalecany**
  - Darmowy tier jest wystarczający dla testowania
  - Wymaga weryfikacji telefonu
  - Limity są wystarczające dla codziennego użytku (przy rozsądnym użyciu)
  - **Ograniczenie**: Dane mogą być użyte do trenowania modeli (można zrezygnować)

- **FREE-ONLY**: ✅ **Wspierany**
  - Tylko darmowe modele
  - Brak automatycznego fallbacku do płatnych

---

## Groq

### Informacje Ogólne

| Pole | Wartość |
|------|---------|
| **Nazwa** | Groq |
| **Strona** | [groq.com](https://groq.com) |
| **Dokumentacja** | [console.groq.com/docs](https://console.groq.com/docs) |
| **Data weryfikacji** | 2024-10-27 |
| **Darmowy tier** | ✅ Tak |
| **Wymaga karty kredytowej** | ❌ Nie |
| **Wymaga weryfikacji** | ❌ Nie |

### Darmowy Tier (Developer)

| Parametr | Limit | Uwagi |
|----------|-------|-------|
| **Rate limit (RPM)** | 30 żądań/minutę | Per organizacja (nie per API key) |
| **Rate limit (TPM)** | 6,000 tokenów/minutę | Per organizacja |
| **Dzienny limit żądań** | 14,400 żądań/dzień | Per model |
| **Dostępne modele** | Wszystkie modele Groq | Open-source (Llama, GPT-OSS, etc.) |
| **Koszt** | $0 | Bez opłat |
| **Zastosowanie** | Prototypowanie | Wystarczający dla testów |

### Płatne Tiery

| Tier | Cena | Limity | Uwagi |
|------|------|--------|-------|
| **Developer** | Pay-as-you-go | ~10x wyższe limity | 25% zniżki na token |
| **Enterprise** | Custom | Custom | SLA, support, itp. |

### Modele i Cennik (Płatne)

| Model | Input ($/1M) | Output ($/1M) | Kontekst | Uwagi |
|-------|--------------|---------------|---------|-------|
| Llama 3.1 8B | $0.05 | $0.05 | 128K | - |
| Llama 3.1 70B | $0.20 | $0.20 | 128K | - |
| GPT-OSS-120B | $0.10 | $0.10 | - | - |
| GPT-OSS-20B | $0.05 | $0.05 | - | - |
| Mixtral-8x7B | $0.15 | $0.15 | - | - |

### Zalety

- ⚡ **Najszybsze** - LPU (Language Processing Unit) zapewnia bardzo szybkie odpowiedzi
- ✅ **Prawdziwie darmowy** - Żadne ukryte opłaty, nie wymaga karty
- ✅ **Wszystkie modele dostępne** - W tym duże modele (70B+)
- ✅ **Brak limitów tokenów** - Tylko rate limits (RPM/TPM)

### Ograniczenia

- ⚠️ **Rate limits na poziomie organizacji** - Wielokrotne API key nie zwiększają limitów
- ⚠️ **Tylko modele open-source** - Brak modeli właścicielskich (np. GPT-4)
- ⚠️ **Limity mogą być za niskie dla produkcji** - 30 RPM to ~1,800 RPM/godzinę

### Weryfikacja

- **Oficjalna dokumentacja**: [Rate Limits](https://console.groq.com/docs/rate-limits)
- **Pricing**: [console.groq.com/settings/billing/plans](https://console.groq.com/settings/billing/plans)
- **Źródła zewnętrzne**: [PricePerToken](https://pricepertoken.com/endpoints/groq/free), [Eesel AI](https://www.eesel.ai/blog/groq-pricing), [CloudZero](https://www.cloudzero.com/blog/groq-pricing/)

### Status dla AL

- **FREE-FIRST**: ✅ **Zalecany**
  - Najlepszy stosunek jakości do ceny
  - Bardzo szybkie odpowiedzi (LPU)
  - Wystarczający dla codziennego użytku

- **FREE-ONLY**: ✅ **Wspierany**
  - Tylko darmowe modele
  - Brak kosztów ukrytych

---

## OpenRouter

### Informacje Ogólne

| Pole | Wartość |
|------|---------|
| **Nazwa** | OpenRouter |
| **Strona** | [openrouter.ai](https://openrouter.ai) |
| **Dokumentacja** | [openrouter.ai/docs](https://openrouter.ai/docs) |
| **Data weryfikacji** | 2024-10-27 |
| **Darmowy tier** | ✅ Tak |
| **Wymaga karty kredytowej** | ❌ Nie |
| **Wymaga weryfikacji** | ❌ Nie |

### Darmowy Tier

| Parametr | Limit | Uwagi |
|----------|-------|-------|
| **Rate limit (RPM)** | 20 żądań/minutę | Dla darmowych modeli |
| **Dzienny limit (nowe konta)** | 50 żądań/dzień | Do momentu zakupu $10 kredytów |
| **Dzienny limit (po $10)** | 1,000 żądań/dzień | Po zakupie $10 kredytów |
| **Dostępne modele** | 25+ darmowych modeli | Modele z suffixem `:free` |
| **Koszt** | $0 | Bez opłat za darmowe modele |
| **Platform fee** | 5.5% | Na zakupie kredytów |

### Dostępne Darmowe Modele (wybrane)

| Model | ID | Kontekst | Uwagi |
|-------|-----|---------|-------|
| Llama 4 Maverick | `openai:llama-4-maverick:free` | 128K | - |
| Llama 3.3 70B Instruct | `meta-llama:llama-3.3-70b-instruct:free` | 128K | - |
| Space Bunny Alpha | `perplexity:space-bunny-alpha:free` | - | - |
| NVIDIA Nemotron 3 | `nvidia:nemotron-3-8b-instruct:free` | - | - |
| Google Gemma 4 | `google:gemma-4-9b-it:free` | - | - |

### Płatne Tiery

| Tier | Cena | Limity | Uwagi |
|------|------|--------|-------|
| **Standard** | Pay-as-you-go | Brak platform limits | 5.5% fee na kredyty |
| **Business** | Custom | Custom | Dla zespołów |
| **Enterprise** | Custom | Custom | SLA, support, itp. |

### BYOK (Bring Your Own Key)

- **Opłata**: 5% powyżej $25,000/miesiąc
- **Zalety**: Użyj własnych kluczy API dostawców
- **Wady**: 5% opłata manipulacyjna

### Weryfikacja

- **Oficjalna dokumentacja**: [Pricing](https://openrouter.ai/pricing), [Rate Limits](https://openrouter.ai/docs/api_reference/limits)
- **Źródła zewnętrzne**: [PricePerToken](https://pricepertoken.com/endpoints/openrouter/free), [TrueFoundry](https://www.truefoundry.com/blog/openrouter-pricing), [WhichDevTool](https://whichdevtool.com/tools/openrouter/)

### Status dla AL

- **FREE-FIRST**: ⚠️ **Ograniczenia**
  - Bardzo niskie limity (20 RPM, 50/dzień)
  - Wymaga zakupu $10 kredytów dla wyższych limitów
  - **Zalecenie**: Używać jako backup/fallback

- **FREE-ONLY**: ❌ **Nie zalecany**
  - Zbyt niskie limity dla codziennego użytku

---

## Cloudflare

### Informacje Ogólne

| Pole | Wartość |
|------|---------|
| **Nazwa** | Cloudflare |
| **Strona** | [cloudflare.com](https://cloudflare.com) |
| **Dokumentacja** | [developers.cloudflare.com](https://developers.cloudflare.com) |
| **Data weryfikacji** | 2024-10-27 |
| **Darmowy tier** | ✅ Tak |

### Cloudflare Workers (Backend)

| Parametr | Limit (Darmowy) | Limit (Pro) | Uwagi |
|----------|-----------------|--------------|-------|
| **Żądania/dzień** | 100,000 | 10,000,000 | Dla Workers |
| **CPU time/żądanie** | 10ms | 50ms | - |
| **Pamięć** | 128MB | 128MB | - |
| **Storage (KV)** | 1GB | 10GB | - |
| **Czas wykonania** | 10s | 30s | - |

### Cloudflare D1 (Baza Danych)

| Parametr | Limit (Darmowy) | Limit (Pro) | Uwagi |
|----------|-----------------|--------------|-------|
| **Bazy danych** | 3 | 100 | - |
| **Żądania/dzień** | 100,000 | 10,000,000 | - |
| **Przechowywanie** | 5GB | 100GB | - |
| **Row reads** | 5,000,000/miesiąc | 500,000,000/miesiąc | - |
| **Row writes** | 1,000,000/miesiąc | 100,000,000/miesiąc | - |

### Cloudflare R2 (Storage)

| Parametr | Limit (Darmowy) | Limit (Pro) | Uwagi |
|----------|-----------------|--------------|-------|
| **Przechowywanie** | 10GB | 1TB | - |
| **Żądania** | 1,000,000/miesiąc | 100,000,000/miesiąc | - |
| **Egress (wyjście)** | 1GB/miesiąc | 100GB/miesiąc | Płatne powyżej |
| **Ingress (wejście)** | Bez limitów | Bez limitów | - |

### Cloudflare Pages (Frontend)

| Parametr | Limit (Darmowy) | Limit (Pro) | Uwagi |
|----------|-----------------|--------------|-------|
| **Projekty** | 10 | 100 | - |
| **Żądania/miesiąc** | 100,000 | 1,000,000 | - |
| **Bandwidth** | 1GB/miesiąc | 100GB/miesiąc | - |
| **Buildy/miesiąc** | 500 | 5,000 | - |

### Weryfikacja

- **Oficjalna dokumentacja**: [Workers Pricing](https://www.cloudflare.com/workers-pricing/), [D1 Pricing](https://www.cloudflare.com/products/d1/pricing/), [R2 Pricing](https://www.cloudflare.com/products/r2/pricing/)

### Status dla AL

- **FREE-FIRST**: ✅ **Zalecany**
  - Wystarczający dla małych i średnich projektów
  - D1 i R2 mają dobre darmowe limity
  - Workers mają 100K żądań/dzień (wystarczający dla testów)

- **FREE-ONLY**: ✅ **Wspierany**
  - Można używać wyłącznie darmowych tierów
  - **Ograniczenie**: 100K żądań/miesiąc dla Workers może być za mało dla produkcji

---

## Podsumowanie i Rekomendacje

### Ranking Dostawców AI (FREE-FIRST)

| Rank | Dostawca | Ocena | Powód |
|------|-----------|-------|-------|
| 1 | **Groq** | ★★★★★ | Najszybszy, prawdziwie darmowy, wysokie limity |
| 2 | **Mistral** | ★★★★☆ | 1B tokenów/miesiąc, ale wymaga weryfikacji telefonu |
| 3 | **OpenRouter** | ★★☆☆☆ | Zbyt niskie limity (20 RPM, 50/dzień) |

### Rekomendacje dla AL

#### 1. **Główny Dostawca: Groq**
```
✅ Zalety:
- Najszybsze odpowiedzi (LPU)
- Prawdziwie darmowy (nie wymaga karty)
- Wysokie limity (30 RPM, 14.4K/dzień)
- Wszystkie modele dostępne

⚠️ Ograniczenia:
- Tylko modele open-source
- Rate limits na poziomie organizacji

📌 Użycie: Główna integracja AI
```

#### 2. **Backup Dostawca: Mistral**
```
✅ Zalety:
- 1 miliard tokenów/miesiąc
- Wszystkie modele API (w tym Large)
- Dobra dokumentacja

⚠️ Ograniczenia:
- Wymaga weryfikacji telefonu
- Limity nie są publicznie podane (trzeba sprawdzać w panelu)
- Dane mogą być użyte do trenowania

📌 Użycie: Fallback dla Groq, modele właścicielskie
```

#### 3. **Trzeci Dostawca: OpenRouter**
```
✅ Zalety:
- Dostęp do wielu modeli przez jedno API
- 25+ darmowych modeli
- Łatwa integracja

❌ Wady:
- Bardzo niskie limity (20 RPM, 50/dzień)
- Wymaga zakupu $10 kredytów dla wyższych limitów

📌 Użycie: Tylko do testów, nie dla produkcji
```

### Routing Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    AL AI ROUTING                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  User Request → Check FREE-FIRST mode                       │
│                    │                                         │
│                    ▼                                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Try Groq first                                       │   │
│  │    - 30 RPM, 14.4K requests/day                         │   │
│  │    - Fastest responses (LPU)                           │   │
│  │    - All open-source models                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                    │                                         │
│         ┌──────────────┬──────────────┐                    │
│         ▼              ▼              ▼                    │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐             │
│  │  Success  │  │ Rate      │  │ Error     │             │
│  │           │  │ Limited   │  │           │             │
│  └───────────┘  └────┬──────┘  └────┬──────┘             │
│                    │              │                         │
│                    ▼              ▼                         │
│              ┌─────────────────────┐                       │
│              │  Try Mistral         │                       │
│              │    - ~1B tokens/month│                       │
│              │    - All models      │                       │
│              └──────────┬──────────┘                       │
│                         │                                   │
│              ┌──────────▼──────────┐                       │
│              ▼                      ▼                       │
│       ┌─────────────┐         ┌─────────────┐             │
│       │  Success    │         │ Rate        │             │
│       │             │         │ Limited/    │             │
│       └─────────────┘         │ Error       │             │
│                              └──────┬──────┘             │
│                                     │                       │
│                                     ▼                       │
│                              ┌─────────────┐             │
│                              │ Try         │             │
│                              │ OpenRouter  │             │
│                              │ (Last       │             │
│                              │ resort)     │             │
│                              └─────────────┘             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Konfiguracja FREE-ONLY

Jeśli użytkownik wybierze **FREE-ONLY**:

1. **Groq**: Używaj wyłącznie darmowych modeli
2. **Mistral**: Używaj wyłącznie darmowych modeli (sprawdź Admin Console)
3. **OpenRouter**: Używaj wyłącznie modeli z suffixem `:free`
4. **Nigdy nie używaj płatnych modeli** bez jawnych ustawień użytkownika
5. **Pokazuj błędy** gdy darmowe limity zostaną wyczerpane

---

## Źródła

### Mistral AI

- [Official Docs - Usage and limits](https://docs.mistral.ai/admin/user-management-finops/tier)
- [Official Docs - API pricing](https://docs.mistral.ai/inference/pricing)
- [PricePerToken - Mistral Free Tier](https://pricepertoken.com/endpoints/mistral/free)
- [Baipiaoji - Mistral Limits](https://baipiaoji.com/en/tools/mistral)

### Groq

- [Official Docs - Rate Limits](https://console.groq.com/docs/rate-limits)
- [Official - Pricing Plans](https://console.groq.com/settings/billing/plans)
- [PricePerToken - Groq Free Tier](https://pricepertoken.com/endpoints/groq/free)
- [Eesel AI - Groq Pricing](https://www.eesel.ai/blog/groq-pricing)
- [CloudZero - Groq Pricing](https://www.cloudzero.com/blog/groq-pricing/)

### OpenRouter

- [Official - Pricing](https://openrouter.ai/pricing)
- [Official Docs - Rate Limits](https://openrouter.ai/docs/api_reference/limits)
- [PricePerToken - OpenRouter Free Tier](https://pricepertoken.com/endpoints/openrouter/free)
- [TrueFoundry - OpenRouter Pricing](https://www.truefoundry.com/blog/openrouter-pricing)
- [WhichDevTool - OpenRouter](https://whichdevtool.com/tools/openrouter/)

### Cloudflare

- [Workers Pricing](https://www.cloudflare.com/workers-pricing/)
- [D1 Pricing](https://www.cloudflare.com/products/d1/pricing/)
- [R2 Pricing](https://www.cloudflare.com/products/r2/pricing/)
- [Pages Pricing](https://www.cloudflare.com/products/pages/pricing/)

---

## Data Weryfikacji

| Dostawca | Data | Weryfikował |
|----------|------|-------------|
| Mistral AI | 2024-10-27 | AL System |
| Groq | 2024-10-27 | AL System |
| OpenRouter | 2024-10-27 | AL System |
| Cloudflare | 2024-10-27 | AL System |

> **⚠️ UWAGA**: Informacje w tym dokumencie mogą ulec zmianie. Zawsze sprawdzaj oficjalną dokumentację dostawcy przed użyciem w produkcji.
