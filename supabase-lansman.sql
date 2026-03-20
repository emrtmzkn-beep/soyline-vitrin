-- ============================================
-- SoyLine Lansman Kampanyası - Supabase SQL
-- ============================================

-- 1. Lansman Kayıtları Tablosu
CREATE TABLE lansman_kayitlari (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ad TEXT NOT NULL,
  soyad TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  telefon TEXT NOT NULL,
  kampanya_kodu TEXT NOT NULL UNIQUE,
  user_type TEXT DEFAULT 'horse_owner'
    CHECK (user_type IN ('horse_owner', 'stallion_owner')),
  kod_kullanildi BOOLEAN DEFAULT FALSE,
  kvkk_onay BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  used_at TIMESTAMPTZ
);

-- 2. Index'ler (hız için)
CREATE INDEX idx_lansman_email ON lansman_kayitlari(email);
CREATE INDEX idx_lansman_kampanya_kodu ON lansman_kayitlari(kampanya_kodu);
CREATE INDEX idx_lansman_kod_kullanildi ON lansman_kayitlari(kod_kullanildi);

-- 3. Row Level Security (RLS) Aktif Et
ALTER TABLE lansman_kayitlari ENABLE ROW LEVEL SECURITY;

-- 4. Anonim kullanıcılar sadece INSERT yapabilsin (kayıt olma)
CREATE POLICY "Anonim kullanıcılar kayıt olabilir"
  ON lansman_kayitlari
  FOR INSERT
  TO anon
  WITH CHECK (TRUE);

-- 5. Anonim kullanıcılar kontenjan kontrolü için COUNT yapabilsin
CREATE POLICY "Anonim kullanıcılar kayıt sayısını görebilir"
  ON lansman_kayitlari
  FOR SELECT
  TO anon
  USING (TRUE);

-- 6. Kampanya kodu doğrulama için SELECT ve UPDATE izni (authenticated kullanıcılar)
CREATE POLICY "Authenticated kullanıcılar kod doğrulayabilir"
  ON lansman_kayitlari
  FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Authenticated kullanıcılar kodu kullanabilir"
  ON lansman_kayitlari
  FOR UPDATE
  TO authenticated
  USING (TRUE)
  WITH CHECK (TRUE);

-- 7. Kontenjan kontrolü için fonksiyon
CREATE OR REPLACE FUNCTION lansman_kontenjan_kontrol()
RETURNS TRIGGER AS $$
DECLARE
  current_count INT;
  max_limit INT;
BEGIN
  IF NEW.user_type = 'stallion_owner' THEN
    max_limit := 15;
  ELSE
    max_limit := 150;
  END IF;

  SELECT COUNT(*) INTO current_count
    FROM lansman_kayitlari
    WHERE user_type = NEW.user_type;

  IF current_count >= max_limit THEN
    RAISE EXCEPTION 'Lansman kontenjanı dolmuştur. (%/%)' , current_count, max_limit;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Trigger: Yeni kayıt öncesi kontenjan kontrolü
CREATE TRIGGER lansman_kontenjan_trigger
  BEFORE INSERT ON lansman_kayitlari
  FOR EACH ROW
  EXECUTE FUNCTION lansman_kontenjan_kontrol();

-- ============================================
-- NOTLAR:
-- ============================================
-- Bu SQL'i Supabase Dashboard > SQL Editor'de çalıştırın.
-- 
-- Kampanya kodu üretimi uygulama tarafında (API route) yapılır.
-- Kod formatı: SL-XXXXXXXX (8 alfanumerik karakter)
--
-- E-posta gönderimi için öneriler:
-- - Supabase Edge Functions + Resend (resend.com)
-- - Supabase Database Webhooks + Zapier
-- - Manuel export + toplu mail
-- ============================================
