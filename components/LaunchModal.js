'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './LaunchModal.css';

export default function LaunchModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    ad: '',
    soyad: '',
    email: '',
    telefon: '',
  });
  const [kvkkOnay, setKvkkOnay] = useState(false);
  const [kvkkDetay, setKvkkDetay] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.ad.trim()) newErrors.ad = 'Ad alanı zorunludur.';
    if (!formData.soyad.trim()) newErrors.soyad = 'Soyad alanı zorunludur.';
    if (!formData.email.trim()) {
      newErrors.email = 'E-posta alanı zorunludur.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Geçerli bir e-posta adresi giriniz.';
    }
    if (!formData.telefon.trim()) {
      newErrors.telefon = 'Telefon alanı zorunludur.';
    } else if (!/^(05\d{9}|\+905\d{9})$/.test(formData.telefon.replace(/\s/g, ''))) {
      newErrors.telefon = 'Geçerli bir telefon numarası giriniz. (05XX XXX XX XX)';
    }
    if (!kvkkOnay) newErrors.kvkk = 'KVKK aydınlatma metnini onaylamanız gerekmektedir.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/lansman-kayit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, kvkk_onay: kvkkOnay }),
      });
      const data = await res.json();
      setResult(data);
      if (data.success) {
        setFormData({ ad: '', soyad: '', email: '', telefon: '' });
        setKvkkOnay(false);
      }
    } catch {
      setResult({ success: false, message: 'Bir hata oluştu. Lütfen tekrar deneyiniz.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="launch-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="launch-modal"
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Kapatma butonu */}
            <button className="launch-modal-close" onClick={onClose} aria-label="Kapat">✕</button>

            {/* Başarı durumu */}
            {result?.success ? (
              <div className="launch-modal-success">
                <div className="launch-success-icon">🎉</div>
                <h2>Kayıt Başarılı!</h2>
                <p>{result.message}</p>
                <p className="launch-success-note">
                  Kampanya kodunuz kayıtlı e-posta adresinize gönderilecektir.
                </p>
                <button className="launch-btn-primary" onClick={onClose}>Tamam</button>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="launch-modal-header">
                  <div className="launch-badge">🚀 LANSMANA ÖZEL</div>
                  <h2>SoyLine Erken Kayıt</h2>
                  <p>
                    1 Nisan&apos;da başlayacak <strong>SoyLine</strong> platformunda
                    ilk <strong>150 kişi</strong> arasına katılın.
                    Özel kampanya kodunuzla ekstra ayrıcalıklarla başlayın!
                  </p>
                  <div className="launch-benefits">
                    <div className="launch-benefit-item">
                      <span className="launch-benefit-icon">⚡</span>
                      <span>6x Günlük Arama</span>
                    </div>
                    <div className="launch-benefit-item">
                      <span className="launch-benefit-icon">📊</span>
                      <span>3x Aylık Rapor</span>
                    </div>
                    <div className="launch-benefit-item">
                      <span className="launch-benefit-icon">👑</span>
                      <span>30 Gün Premium</span>
                    </div>
                  </div>
                </div>

                {/* Form */}
                <form className="launch-modal-form" onSubmit={handleSubmit}>
                  <div className="launch-form-row">
                    <div className="launch-form-group">
                      <label htmlFor="launch-ad">Ad</label>
                      <input
                        id="launch-ad"
                        type="text"
                        placeholder="Adınız"
                        value={formData.ad}
                        onChange={e => handleChange('ad', e.target.value)}
                        maxLength={50}
                        autoComplete="given-name"
                      />
                      {errors.ad && <span className="launch-error">{errors.ad}</span>}
                    </div>
                    <div className="launch-form-group">
                      <label htmlFor="launch-soyad">Soyad</label>
                      <input
                        id="launch-soyad"
                        type="text"
                        placeholder="Soyadınız"
                        value={formData.soyad}
                        onChange={e => handleChange('soyad', e.target.value)}
                        maxLength={50}
                        autoComplete="family-name"
                      />
                      {errors.soyad && <span className="launch-error">{errors.soyad}</span>}
                    </div>
                  </div>

                  <div className="launch-form-group">
                    <label htmlFor="launch-email">E-posta</label>
                    <input
                      id="launch-email"
                      type="email"
                      placeholder="ornek@email.com"
                      value={formData.email}
                      onChange={e => handleChange('email', e.target.value)}
                      maxLength={100}
                      autoComplete="email"
                    />
                    {errors.email && <span className="launch-error">{errors.email}</span>}
                  </div>

                  <div className="launch-form-group">
                    <label htmlFor="launch-telefon">Telefon</label>
                    <input
                      id="launch-telefon"
                      type="tel"
                      placeholder="05XX XXX XX XX"
                      value={formData.telefon}
                      onChange={e => handleChange('telefon', e.target.value)}
                      maxLength={15}
                      autoComplete="tel"
                    />
                    {errors.telefon && <span className="launch-error">{errors.telefon}</span>}
                  </div>

                  {/* KVKK Onay */}
                  <div className="launch-kvkk-section">
                    <label className="launch-checkbox-label">
                      <input
                        type="checkbox"
                        checked={kvkkOnay}
                        onChange={e => {
                          setKvkkOnay(e.target.checked);
                          if (errors.kvkk) setErrors(prev => ({ ...prev, kvkk: undefined }));
                        }}
                      />
                      <span>
                        <button
                          type="button"
                          className="launch-kvkk-link"
                          onClick={() => setKvkkDetay(!kvkkDetay)}
                        >
                          Kişisel Verilerin Korunması Aydınlatma Metni
                        </button>
                        &apos;ni okudum ve kabul ediyorum.
                      </span>
                    </label>
                    {errors.kvkk && <span className="launch-error">{errors.kvkk}</span>}

                    {/* KVKK Detay Metni */}
                    <AnimatePresence>
                      {kvkkDetay && (
                        <motion.div
                          className="launch-kvkk-text"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <h4>KİŞİSEL VERİLERİN KORUNMASI AYDINLATMA METNİ</h4>
                          <p>
                            <strong>Veri Sorumlusu:</strong> SoyLine Dijital Atçılık Platformu
                          </p>
                          <p>
                            6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) kapsamında, 
                            kişisel verileriniz aşağıda açıklanan çerçevede işlenmektedir:
                          </p>
                          <p>
                            <strong>1. İşlenen Kişisel Veriler:</strong> Ad, soyad, e-posta adresi, telefon numarası.
                          </p>
                          <p>
                            <strong>2. İşleme Amacı:</strong> SoyLine platformunun lansmanına özel erken kayıt 
                            kampanyasının yürütülmesi, kampanya kodunun iletilmesi, lansman hakkında bilgilendirme 
                            yapılması.
                          </p>
                          <p>
                            <strong>3. Hukuki Dayanak:</strong> Açık rızanız (KVKK m.5/1).
                          </p>
                          <p>
                            <strong>4. Verilerin Aktarımı:</strong> Kişisel verileriniz, e-posta gönderim hizmeti 
                            sağlayıcılarına (kampanya kodu iletimi amacıyla) ve yasal zorunluluk halinde yetkili 
                            kamu kurum ve kuruluşlarına aktarılabilir.
                          </p>
                          <p>
                            <strong>5. Saklama Süresi:</strong> Kişisel verileriniz, kampanya süresinin sona 
                            ermesinin ardından en geç 6 (altı) ay içinde silinecek veya anonim hale getirilecektir.
                          </p>
                          <p>
                            <strong>6. Haklarınız (KVKK m.11):</strong> Kişisel verilerinizin işlenip 
                            işlenmediğini öğrenme, işlenme amacını ve amacına uygun kullanılıp kullanılmadığını 
                            öğrenme, yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme, eksik 
                            veya yanlış işlenmiş olması halinde düzeltilmesini isteme, KVKK&apos;nın 7. maddesindeki 
                            şartlar çerçevesinde silinmesini/yok edilmesini isteme, işlenen verilerin münhasıran 
                            otomatik sistemler vasıtasıyla analiz edilmesi suretiyle aleyhinize bir sonucun ortaya 
                            çıkmasına itiraz etme ve kanuna aykırı işleme sebebiyle zarara uğramanız halinde 
                            zararın giderilmesini talep etme haklarına sahipsiniz.
                          </p>
                          <p>
                            <strong>7. Başvuru:</strong> Yukarıda belirtilen haklarınızı kullanmak için 
                            <strong> bilgi@soyline.com </strong> adresine yazılı olarak başvurabilirsiniz.
                          </p>
                          <p>
                            <strong>8. Açık Rıza:</strong> İşbu aydınlatma metnini okuduğumu, anladığımı ve 
                            kişisel verilerimin yukarıda belirtilen amaçlarla işlenmesine açık rızam olduğunu 
                            beyan ve kabul ederim.
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Hata mesajı */}
                  {result && !result.success && (
                    <div className="launch-error-box">{result.message}</div>
                  )}

                  {/* Gönder butonu */}
                  <button
                    type="submit"
                    className="launch-btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="launch-spinner" />
                    ) : (
                      '🚀 Lansmana Kayıt Ol'
                    )}
                  </button>

                  <p className="launch-footer-note">
                    Sınırlı kontenjan: <strong>150 kişi.</strong> Kontenjan dolduğunda kayıtlar kapanacaktır.
                  </p>
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
