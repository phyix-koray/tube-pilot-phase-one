
## Amaç

Kendi Supabase projene bağlanan, Lovable Cloud'a **hiç** dokunmayan bir backend katmanı kurmak. Tüm localStorage verileri (skills, chat mesajları, agent bağlantıları, run history, videos, channels, content plan) kalıcı hale gelecek. Email/şifre + Google ile giriş, RLS ile kullanıcı izolasyonu.

Not: Lovable'ın managed Supabase entegrasyon tool'unu (`supabase--enable`) **kullanmayacağım**. Bunun yerine `@supabase/supabase-js`'i doğrudan senin verdiğin credential'larla bağlayacağım.

---

## 1. Credential kurulumu

Sen `add_secret` üzerinden şunları güvenli formla yükleyeceksin:

| Secret | Nerede kullanılacak |
| --- | --- |
| `SUPABASE_URL` | Server functions |
| `SUPABASE_ANON_KEY` | Server + client (publishable) |
| `SUPABASE_SERVICE_ROLE_KEY` | Sadece server, admin işlemler |
| `VITE_SUPABASE_URL` | Client bundle |
| `VITE_SUPABASE_ANON_KEY` | Client bundle |

Google OAuth için: Supabase Dashboard → Authentication → Providers → Google'ı **kendin** açacaksın (Client ID/Secret Google Cloud Console'dan). Ben sana adım adım talimatı vereceğim, kod tarafında `signInWithOAuth({ provider: 'google' })` hazır olacak.

---

## 2. Database schema (SQL migration olarak vereceğim)

Sen kendi Supabase SQL Editor'ünde çalıştıracaksın. Şu tablolar:

```text
profiles              (id → auth.users, email, display_name, avatar_url, created_at)
skills                (id, user_id, name, description, file_md, created_at, updated_at)
skill_messages        (id, skill_id, role, content, created_at)
skill_versions        (id, skill_id, file_md, note, created_at)  -- snapshot on major edits
agent_skill_links     (id, user_id, agent_id, skill_id, created_at)
agent_skill_uploads   (id, user_id, agent_id, name, content, created_at)
channels              (id, user_id, name, provider, external_id, connected_at)
agent_runs            (id, user_id, agent_id, status, channel_id, config_json, started_at, completed_at)
content_plan_rows     (id, run_id, position, date, video_title, video_topic, video_length,
                       video_format, art_style, web_search, deep_research, updated_at)
videos                (id, user_id, channel_id, run_id, title, description, tags,
                       status, scheduled_at, published_at, thumbnail_url, video_url,
                       metadata_json, created_at, updated_at)
```

Her tabloda RLS **açık**, policy `auth.uid() = user_id` (veya join edilmiş user_id) ile scope'lu. Grant'lar `authenticated` rolüne verilir. `profiles` için signup trigger'ı (`handle_new_user`) otomatik satır oluşturur.

---

## 3. Client katmanı

- `src/integrations/supabase/client.ts` — publishable client (senin VITE_* env'inle).
- `src/integrations/supabase/types.ts` — tabloların TypeScript tipleri (elle yazacağım, `supabase gen types` çalıştırmayacağım).
- `src/hooks/use-auth.ts` — session state + `onAuthStateChange` listener (root'ta bir kez).

---

## 4. Auth UI

- `src/routes/auth.tsx` (public) — email/şifre sign-in + sign-up + Google butonu + forgot-password linki.
- `src/routes/reset-password.tsx` (public) — recovery link handler.
- `src/routes/_authenticated/route.tsx` — pathless gate; oturum yoksa `/auth`'a redirect.
- Mevcut `_app` layout'unu `_authenticated/_app` altına taşıyacağım ki tüm agent/skill/video/channel/settings sayfaları korumalı olsun.
- `index.tsx`'i landing (public) olarak bırakacağım — signed-in user'ı `/agents`'a yönlendirir.

---

## 5. Data migration: localStorage → Supabase

Kaybı önlemek için:

1. Uygulama açıldığında `src/lib/local-migration.ts` çalışır. Signed-in user için:
   - `tp:skills:v1` → `skills` + `skill_messages` tabloları.
   - `tp:agent-skills:v1` → `agent_skill_links` + `agent_skill_uploads`.
   - Migration bir kez çalışır (`localStorage.setItem('tp:migrated:v1', userId)`); tamamlanınca localStorage'ı **silmez** (fallback için tutar), sadece işaretler.
2. Zaten Supabase'de veri varsa duplicate insert olmaz (deterministic id + `on conflict do nothing`).

---

## 6. Store'ları Supabase'e bağlama

Mevcut `useSyncExternalStore` API'larını koruyacağım — çağıran component'ler değişmesin. İçini değiştireceğim:

- `src/lib/skills-store.ts` → Supabase queries + TanStack Query cache. Optimistic update, hata durumunda rollback.
- `src/lib/agent-skills-store.ts` → aynı yaklaşım.
- Yeni store'lar: `src/lib/runs-store.ts`, `src/lib/videos-store.ts`, `src/lib/channels-store.ts`, `src/lib/content-plan-store.ts`.

Realtime abonelik şimdilik yok — TanStack Query invalidation yeterli. İleride kolayca eklenir.

---

## 7. Agent run persistence

Use Agent wizard'ı **Review** adımında `Launch` butonuna basınca:
- `agent_runs` satırı insert edilir (config JSON: skill snapshot, channel, schedule, theme, video length, media prefs).
- Recurring modda content plan satırları `content_plan_rows`'a yazılır.
- Kullanıcı wizard'ı yarıda bıraksa bile draft `status='draft'` olarak saklanır — geri döndüğünde kaldığı yerden devam eder.

---

## 8. Videos + Channels

- Channels sayfasında "Connect Channel (Google OAuth)" gerçek `signInWithOAuth({ provider: 'google', scopes: 'youtube.readonly' })` çağırır; dönen token metadata'yı `channels` tablosuna yazar.
- Manual upload wizard'ı ve inline editor `videos` tablosuna yazar/okur; edit sayfası real-time save.

---

## 9. Teknik detaylar (senin için özet)

- Server-side gizli işlemler için `createServerFn` + `SUPABASE_SERVICE_ROLE_KEY` (örn. skill version snapshot temizliği, ileride cron).
- Tüm client insert/update'ler RLS ile korunuyor — service_role sadece server'da.
- `getUser()` (not `getSession()`) kimlik doğrulamalarında; `getSession()` sadece bearer attach için.
- Root'ta tek bir `onAuthStateChange` → query invalidation, sign-out'ta cache clear.
- Sign-in sonrası intended route korunur (`?redirect=` query param).

---

## Sırayla ne yapacağım (build mode'a geçince)

1. `add_secret` ile 5 credential'ı iste.
2. Sana SQL migration dosyasını `supabase/migrations/0001_init.sql` olarak repo'ya koy + Supabase SQL Editor'de çalıştırma talimatı.
3. Google OAuth kurulum rehberini chat'e ver (Dashboard'da neye tıklayacaksın).
4. Client wiring: supabase client, types, auth hooks, auth routes, protected layout taşıması.
5. Store'ları Supabase'e bağla + localStorage migration.
6. Agent runs / content plan / videos / channels persistence.
7. Manuel test checklist.

Onaylarsan bu sırayla ilerlerim. Sorun: **profiles** tablosuna `display_name` + `avatar_url` yeterli mi, yoksa başka alan (locale, timezone default, tier) istiyor musun?
