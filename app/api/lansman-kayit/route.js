import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const KONTENJAN_AT_SAHIBI = 150;
const KONTENJAN_AYGIR_SAHIBI = 15;

function generateKampanyaKodu() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'SL-';
  const array = new Uint8Array(8);
  crypto.getRandomValues(array);
  for (let i = 0; i < 8; i++) {
    code += chars[array[i] % chars.length];
  }
  return code;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { ad, soyad, email, telefon, kvkk_onay, user_type } = body;

    // Validasyon
    if (!ad || !soyad || !email || !telefon) {
      return NextResponse.json(
        { success: false, message: 'Tüm alanlar zorunludur.' },
        { status: 400 }
      );
    }

    if (!kvkk_onay) {
      return NextResponse.json(
        { success: false, message: 'KVKK aydınlatma metnini onaylamanız gerekmektedir.' },
        { status: 400 }
      );
    }

    // Email format kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Geçerli bir e-posta adresi giriniz.' },
        { status: 400 }
      );
    }

    // Telefon format kontrolü
    const telefonClean = telefon.replace(/\s/g, '');
    const telefonRegex = /^(05\d{9}|\+905\d{9})$/;
    if (!telefonRegex.test(telefonClean)) {
      return NextResponse.json(
        { success: false, message: 'Geçerli bir telefon numarası giriniz.' },
        { status: 400 }
      );
    }

    // Kontenjan kontrolü (user_type bazlı)
    const currentType = user_type === 'stallion_owner' ? 'stallion_owner' : 'horse_owner';
    const kontenjanLimit = currentType === 'stallion_owner' ? KONTENJAN_AYGIR_SAHIBI : KONTENJAN_AT_SAHIBI;

    const { count, error: countError } = await supabase
      .from('lansman_kayitlari')
      .select('*', { count: 'exact', head: true })
      .eq('user_type', currentType);

    if (countError) {
      return NextResponse.json(
        { success: false, message: 'Bir hata oluştu. Lütfen tekrar deneyiniz.' },
        { status: 500 }
      );
    }

    if (count >= kontenjanLimit) {
      const label = currentType === 'stallion_owner' ? 'Aygır sahibi' : 'At sahibi';
      return NextResponse.json(
        { success: false, message: `${label} lansman kontenjanı dolmuştur. (${kontenjanLimit}/${kontenjanLimit})` },
        { status: 400 }
      );
    }

    // Aynı email kontrolü
    const { data: existing } = await supabase
      .from('lansman_kayitlari')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { success: false, message: 'Bu e-posta adresi ile zaten kayıt olunmuş.' },
        { status: 400 }
      );
    }

    // Kampanya kodu üret (benzersiz olana kadar)
    let kampanyaKodu;
    let isUnique = false;
    for (let i = 0; i < 10; i++) {
      kampanyaKodu = generateKampanyaKodu();
      const { data: kodCheck } = await supabase
        .from('lansman_kayitlari')
        .select('id')
        .eq('kampanya_kodu', kampanyaKodu)
        .maybeSingle();
      if (!kodCheck) {
        isUnique = true;
        break;
      }
    }

    if (!isUnique) {
      return NextResponse.json(
        { success: false, message: 'Kod üretiminde hata. Lütfen tekrar deneyiniz.' },
        { status: 500 }
      );
    }

    // Kayıt oluştur
    const { error: insertError } = await supabase
      .from('lansman_kayitlari')
      .insert({
        ad: ad.trim(),
        soyad: soyad.trim(),
        email: email.toLowerCase().trim(),
        telefon: telefonClean,
        kampanya_kodu: kampanyaKodu,
        kvkk_onay: true,
        ...(user_type ? { user_type } : {}),
      });

    if (insertError) {
      if (insertError.message?.includes('unique') || insertError.message?.includes('duplicate')) {
        return NextResponse.json(
          { success: false, message: 'Bu e-posta adresi ile zaten kayıt olunmuş.' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { success: false, message: 'Kayıt oluşturulurken bir hata oluştu.' },
        { status: 500 }
      );
    }

    // Resend ile kurumsal e-posta gönder
    const planLabel = currentType === 'stallion_owner' ? 'Aygır Sahibi' : 'At Sahibi';

    const avantajlar = currentType === 'stallion_owner'
      ? [
          'Basic plan 6 ay ücretsiz',
          'Elite plan 6 ay %50 indirim',
          'Kalıcı "Kurucu Üye" rozeti',
        ]
      : [
          'Standart üzelik: tüm kotalar 2x',
          'Pro ve Eküri planlara 6 ay %25 indirim',
          'Kalıcı "Kurucu Üye" rozeti',
        ];

    if (resend) {
      try {
        await resend.emails.send({
          from: 'SoyLine <bilgi@soyline.com>',
          to: [email.toLowerCase().trim()],
          subject: 'SoyLine Kurucu Üye Kodunuz Hazır 🎉',
          html: buildLaunchEmail({
            ad: ad.trim(),
            kampanyaKodu,
            planLabel,
            avantajlar,
          }),
        });
      } catch (emailErr) {
        console.error('Resend email error:', emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Başvurunuz alındı! Kurucu üye kodunuz e-posta adresinize gönderildi.',
    });

  } catch {
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası. Lütfen tekrar deneyiniz.' },
      { status: 500 }
    );
  }
}

// ─── Kurumsal HTML Email Template ───────────────────────────
function buildLaunchEmail({ ad, kampanyaKodu, planLabel, avantajlar }) {
  return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SoyLine Kurucu Üye Kodu</title>
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0f172a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background:#1e293b;border-radius:16px;overflow:hidden;border:1px solid rgba(254,220,0,0.15);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);padding:40px 40px 30px;text-align:center;border-bottom:1px solid rgba(254,220,0,0.15);">
              <div style="font-size:32px;font-weight:700;letter-spacing:-0.5px;">
                <span style="color:#ffffff;">Soy</span><span style="color:#fedc00;">Line</span>
              </div>
              <p style="color:#94a3b8;font-size:14px;margin:8px 0 0;letter-spacing:0.5px;">Dijital Atçılık Platformu</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h1 style="color:#ffffff;font-size:22px;margin:0 0 8px;font-weight:700;">Hoş geldiniz, ${ad}! 🎉</h1>
              <p style="color:#94a3b8;font-size:15px;line-height:1.7;margin:0 0 28px;">
                SoyLine kurucu üye başvurunuz onaylandı. Aşağıdaki kodunuz 1 Nisan'da platform açıldığında size özel avantajlar sunar.
              </p>

              <!-- Paket Bilgisi -->
              <div style="background:rgba(254,220,0,0.06);border:1px solid rgba(254,220,0,0.2);border-radius:12px;padding:16px 20px;margin-bottom:24px;">
                <p style="color:#94a3b8;font-size:13px;margin:0 0 4px;text-transform:uppercase;letter-spacing:1px;">Paketiniz</p>
                <p style="color:#fedc00;font-size:17px;font-weight:700;margin:0;">${planLabel}</p>
              </div>

              <!-- Kod Kutusu -->
              <div style="background:#0f172a;border:2px solid #fedc00;border-radius:12px;padding:28px;text-align:center;margin-bottom:28px;">
                <p style="color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px;">Kurucu Üye Kodunuz</p>
                <div style="font-size:32px;font-weight:800;color:#fedc00;letter-spacing:4px;font-family:'Courier New',monospace;">
                  ${kampanyaKodu}
                </div>
              </div>

              <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 24px;">
                Bu kod size özeldir. Platform 1 Nisan'da yayına alındığında, kayıt sırasında bu kodu kullanarak kurucu üye avantajlarınızı aktif edebilirsiniz:
              </p>

              <!-- Avantajlar -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:28px;">
                ${avantajlar.map(a => `
                <tr>
                  <td style="padding:8px 0;color:#10b981;font-size:14px;">✓ <span style="color:#e2e8f0;">${a}</span></td>
                </tr>`).join('')}
              </table>

              <!-- CTA Button -->
              <div style="text-align:center;margin-bottom:12px;">
                <a href="https://soyline.com" style="display:inline-block;background:#fedc00;color:#0f172a;font-weight:700;font-size:15px;padding:14px 36px;border-radius:8px;text-decoration:none;letter-spacing:0.3px;">
                  soyline.com
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0f172a;padding:28px 40px;border-top:1px solid rgba(254,220,0,0.1);text-align:center;">
              <p style="color:#475569;font-size:12px;margin:0 0 8px;line-height:1.6;">
                Bu e-posta SoyLine kurucu üye başvurunuz nedeniyle gönderilmiştir.
              </p>
              <p style="color:#334155;font-size:11px;margin:0;">
                &copy; 2026 SoyLine Teknoloji A.Ş. &mdash; Tüm hakları saklıdır.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
