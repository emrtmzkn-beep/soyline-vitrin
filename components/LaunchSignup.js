'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import './LaunchSignup.css';

const STORAGE_KEY = 'soyline_launch_registered';

export default function LaunchSignup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [userType, setUserType] = useState('horse_owner');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY)) setSubmitted(true);
    } catch { /* noop */ }
  }, []);

  const isFormValid = name.trim() && email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/lansman-kayit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ad: name.trim().split(' ')[0] || name.trim(),
          soyad: name.trim().split(' ').slice(1).join(' ') || '-',
          email: email.trim().toLowerCase(),
          telefon: phone.trim() || '05000000000',
          kvkk_onay: true,
          user_type: userType,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || 'Bir hata oluştu. Lütfen tekrar deneyin.');
        setLoading(false);
        return;
      }

      setSubmitted(true);
      try { localStorage.setItem(STORAGE_KEY, email.trim().toLowerCase()); } catch { /* noop */ }

      // Confetti
      try {
        const confetti = (await import('canvas-confetti')).default;
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#fedc00', '#fff7a0', '#b45309', '#10b981', '#fff'] });
      } catch { /* noop */ }
    } catch {
      setError('Bağlantı hatası. Lütfen tekrar deneyin.');
    }
    setLoading(false);
  };

  if (submitted) {
    return (
      <section className="launch-signup-section" id="lansman-basvuru">
        <motion.div className="launch-signup-inner" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}>
          <div className="launch-signup-success">
            <div className="launch-signup-emoji">🎉</div>
            <h2 className="launch-signup-success-title">Başvurunuz Alındı!</h2>
            <p className="launch-signup-success-text">Kişisel lansman kodunuz e-posta adresinize gönderilecektir.</p>
            <p className="launch-signup-success-sub">Lansman günü hesabınız otomatik olarak hazır olacak.</p>
          </div>
        </motion.div>
      </section>
    );
  }

  return (
    <section className="launch-signup-section" id="lansman-basvuru">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="launch-signup-inner"
      >
        <h2 className="launch-signup-title">Kurucu Üye Başvurusu</h2>
        <p className="launch-signup-subtitle">Başvurunu yap, kişisel lansman kodun e-postana gelsin.</p>

        <form className="launch-signup-form" onSubmit={handleSubmit}>
          <div className="launch-signup-type-selector">
            <button
              type="button"
              className={`launch-type-btn ${userType === 'horse_owner' ? 'launch-type-active' : ''}`}
              onClick={() => setUserType('horse_owner')}
            >
              🐴 At Sahibi
            </button>
            <button
              type="button"
              className={`launch-type-btn ${userType === 'stallion_owner' ? 'launch-type-active launch-type-active-silver' : ''}`}
              onClick={() => setUserType('stallion_owner')}
            >
              🐎 Aygır Sahibi
            </button>
          </div>

          <div className="launch-signup-field">
            <label className="launch-signup-label">Ad Soyad</label>
            <input
              type="text"
              className="launch-signup-input"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              placeholder="Adınız Soyadınız"
              required
            />
          </div>

          <div className="launch-signup-field">
            <label className="launch-signup-label">E-posta</label>
            <input
              type="email"
              className="launch-signup-input"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              placeholder="ornek@email.com"
              required
            />
          </div>

          <div className="launch-signup-field">
            <label className="launch-signup-label">Telefon <span className="launch-signup-optional">(opsiyonel)</span></label>
            <input
              type="tel"
              className="launch-signup-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="05XX XXX XX XX"
            />
          </div>

          {error && <p className="launch-signup-error">{error}</p>}

          <button type="submit" className="launch-signup-submit" disabled={!isFormValid || loading}>
            {loading ? 'Kaydediliyor...' : 'Kurucu Üye Başvurusu Yap →'}
          </button>

          <p className="launch-signup-info">
            Başvuru sonrası kişisel lansman kodunuz e-posta adresinize otomatik olarak iletilecektir.
          </p>
        </form>
      </motion.div>
    </section>
  );
}
