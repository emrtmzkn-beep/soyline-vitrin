# 🚀 SoyLine Lansman Kampanyası - Teknik Dokümantasyon

## Genel Bakış

SoyLine'ın 1 Nisan 2026 lansmanına özel, **150 + 15 kişilik** sınırlı erken kayıt kampanyası sistemi.

### Kampanya Akışı

```
1. Kullanıcı soyline.com anasayfasına girer
2. Otomatik olarak lansman kampanya modalı açılır
3. Kullanıcı Ad, Soyad, E-posta, Telefon bilgilerini girer
4. KVKK açık rıza metnini onaylar
5. Kayıt Supabase'e yazılır
6. Benzersiz kampanya kodu üretilir ve kaydedilir
7. Kod kullanıcıya e-posta ile gönderilir
8. Asıl site açıldığında, kayıt sırasında bu kod girilir
9. Kod doğrulanır ve kullanıcıya ekstra sınırlar tanınır
```

---

## Veritabanı (Supabase)

### Tablolar

#### `lansman_kayitlari`
Kampanyaya kayıt olan kullanıcıların bilgileri.

| Kolon          | Tip          | Açıklama                          |
|----------------|--------------|-----------------------------------|
| id             | uuid (PK)    | Otomatik UUID                     |
| ad             | text         | Kullanıcı adı                    |
| soyad          | text         | Kullanıcı soyadı                 |
| email          | text (UNIQUE)| E-posta adresi                    |
| telefon        | text         | Telefon numarası                  |
| kampanya_kodu  | text (UNIQUE)| Benzersiz 8 haneli kampanya kodu  |
| kod_kullanildi | boolean      | Kod asıl sitede kullanıldı mı?   |
| kvkk_onay      | boolean      | KVKK açık rıza onayı             |
| created_at     | timestamptz  | Kayıt tarihi                     |
| used_at        | timestamptz  | Kodun kullanıldığı tarih          |

---

## API Endpoint'leri

### `POST /api/lansman-kayit`

Yeni lansman kaydı oluşturur.

**Request Body:**
```json
{
  "ad": "Ahmet",
  "soyad": "Yılmaz",
  "email": "ahmet@example.com",
  "telefon": "05551234567",
  "kvkk_onay": true
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Lansman kaydınız oluşturuldu! Kampanya kodunuz e-posta adresinize gönderilecektir."
}
```

**Response (400 - Hata):**
```json
{
  "success": false,
  "message": "Bu e-posta adresi ile zaten kayıt olunmuş."
}
```

**Response (400 - Kontenjan dolu):**
```json
{
  "success": false,
  "message": "Lansman kampanyası kontenjanı dolmuştur."
}
```

---

### `POST /api/lansman-kod-dogrula` (Asıl Site İçin)

Kayıt sırasında kampanya kodunu doğrular.

**Request Body:**
```json
{
  "kampanya_kodu": "SL-A7X9K2M4"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Kampanya kodu geçerli! Ekstra sınırlarınız tanımlandı.",
  "bonus": {
    "ekstra_arama": 50,
    "ekstra_rapor": 10,
    "premium_sure_gun": 30
  }
}
```

---

## Asıl Siteye Entegrasyon (soyline.com)

Asıl site kayıt akışında kampanya kodu alanı eklenmelidir:

```
Kayıt Formu:
├── Ad / Soyad
├── E-posta
├── Şifre
├── Telefon
└── Kampanya Kodu (opsiyonel) ← Bu alan lansman kodunu kabul eder
```

### Kod Doğrulama Mantığı (Asıl Projede Uygulanacak)

```javascript
// Kayıt sırasında kampanya kodu varsa doğrula
async function validateLaunchCode(code) {
  const { data, error } = await supabase
    .from('lansman_kayitlari')
    .select('*')
    .eq('kampanya_kodu', code)
    .eq('kod_kullanildi', false)
    .single();

  if (error || !data) {
    return { valid: false, message: 'Geçersiz veya kullanılmış kod.' };
  }

  // Kodu kullanıldı olarak işaretle
  await supabase
    .from('lansman_kayitlari')
    .update({ kod_kullanildi: true, used_at: new Date().toISOString() })
    .eq('id', data.id);

  return {
    valid: true,
    bonus: {
      ekstra_arama: 50,
      ekstra_rapor: 10,
      premium_sure_gun: 30
    }
  };
}
```

---

## Kampanya Kodu Formatı

```
SL-XXXXXXXX

SL  = SoyLine prefix
-   = ayırıcı
X   = Alfanumerik karakter (A-Z, 0-9, karışık engelleme dışında)
```

Örnek: `SL-A7X9K2M4`, `SL-B3N8P5R2`

---

## E-posta Gönderimi

Kampanya kodlarını e-posta ile göndermek için önerilen yöntemler:

### Seçenek 1: Supabase Edge Functions + Resend
```
Supabase Edge Function → Resend API → Kullanıcıya mail
```

### Seçenek 2: Supabase Database Webhooks + Zapier
```
Yeni kayıt → Webhook tetiklenir → Zapier → Gmail/Mailgun ile gönderim
```

### Seçenek 3: Manuel (İlk aşama)
```
Supabase Dashboard'dan kayıtları export et → Kodları e-posta ile gönder
```

---

## Güvenlik

- Kodlar `crypto.randomBytes()` ile üretilir (tahmin edilemez)
- Her kod tekil (UNIQUE constraint)
- Kod sadece bir kez kullanılabilir (`kod_kullanildi` flag)
- Rate limiting: Aynı IP'den 5 dakikada 1 kayıt
- E-posta doğrulama: Format kontrolü
- Telefon doğrulama: Türkiye formatı kontrolü
- KVKK onayı zorunlu

---

## Dosya Yapısı (Bu Proje)

```
soyline-yakinda/
├── app/
│   ├── page.js                    ← Modal bu sayfada açılır
│   └── api/
│       └── lansman-kayit/
│           └── route.js           ← Kayıt API endpoint
├── components/
│   └── LaunchModal.js             ← Kampanya modal bileşeni
│   └── LaunchModal.css            ← Modal stilleri
└── LANSMAN-KAMPANYA-README.md     ← Bu dosya
```

---

## Kampanya Limitleri ve Bonus Değerleri

| Özellik              | Normal Kullanıcı | Lansman Kodlu Kullanıcı |
|-----------------------|-------------------|-------------------------|
| Günlük Arama          | 10                | 60                      |
| Aylık Rapor           | 5                 | 15                      |
| Premium Deneme Süresi | -                 | 30 gün                  |

*Bu değerler asıl projede ayarlanacaktır.*

---

## Zaman Çizelgesi

| Tarih       | Adım                                    |
|-------------|------------------------------------------|
| 20 Mart     | Kampanya sistemi hazır                   |
| 21-31 Mart  | Sosyal medya duyurusu, kayıt toplama     |
| 1 Nisan     | Lansman, asıl site açılış               |
| 1-7 Nisan   | Kampanya kodları e-posta ile gönderilir  |
| 1-30 Nisan  | Kodlar kayıt sırasında kullanılabilir    |
| 1 Mayıs     | Kampanya sona erer                       |
