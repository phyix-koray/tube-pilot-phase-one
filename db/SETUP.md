# TubePilot — Kendi Supabase Projeni Kurma

Bu proje kendi Supabase projene bağlanıyor (Lovable Cloud yok). Aşağıdaki adımları **bir kez** yap; sonra uygulama otomatik çalışır.

## 1) Schema'yı kur

1. Supabase Dashboard → **SQL Editor** → **New query**.
2. `db/schema.sql` dosyasının tüm içeriğini yapıştır.
3. **Run**. Idempotent olduğu için tekrar çalıştırılırsa hata vermez.

## 2) Auth ayarları

Dashboard → **Authentication** → **URL Configuration**:

- **Site URL:** `http://localhost:8080` (development) veya published URL'in.
- **Redirect URLs:** Şu listeyi ekle:
  - `http://localhost:8080/**`
  - `https://id-preview--8db88b69-8506-49ff-8cd0-b364e65e7f30.lovable.app/**`
  - Published domain'in `/**`

Dashboard → **Authentication** → **Providers** → **Email**:
- **Enable Email provider:** açık.
- **Confirm email:** kapalıysa (development'ta) kullanıcı email onayı beklemez. Production'da açman önerilir.

## 3) Google OAuth (opsiyonel ama önerilen)

1. [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials** → **Create OAuth 2.0 Client ID** (Application type: Web).
2. **Authorized redirect URIs**'a şunu ekle (Supabase Dashboard'daki `Authentication → Providers → Google` sayfasında da yazar):
   ```
   https://<PROJECT-REF>.supabase.co/auth/v1/callback
   ```
3. Elde ettiğin **Client ID** ve **Client Secret**'ı Supabase Dashboard → **Authentication → Providers → Google**'a yapıştır ve **Enable**.

## 4) Environment değerleri

Zaten Lovable secrets'a şunlar kayıtlı:
- `TUBEPILOT_SUPABASE_URL` (server)
- `TUBEPILOT_SUPABASE_SERVICE_ROLE_KEY` (server, sadece admin işlemler)

Client tarafı için **anon key** ve **URL** `src/integrations/supabase/config.ts` içine yazılıyor (publishable değerler olduğu için bu güvenli).

## 5) Bitti

Uygulamayı aç → `/auth` sayfasından kayıt ol veya Google ile giriş yap. Login sonrası veriler otomatik Supabase'e yazılır. localStorage'daki eski skill dosyaların ilk girişte otomatik migrate edilir.
