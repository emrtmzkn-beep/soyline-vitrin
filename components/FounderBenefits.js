'use client';
import { motion } from 'framer-motion';
import './FounderBenefits.css';

const atSahibiList = [
  'Standart üzelik: tüm kotalar 2x',
  'Pro ve Eküri planlara 6 ay %25 indirim',
  'Kalıcı "Kurucu Üye" rozeti',
];

const aygirSahibiList = [
  'Basic plan 6 ay ücretsiz',
  'Elite plan 6 ay %50 indirim',
  'Kalıcı "Kurucu Üye" rozeti',
];

export default function FounderBenefits() {
  const scrollToSignup = () => {
    const el = document.getElementById('lansman-basvuru');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="founder-section">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="founder-inner"
      >
        <h2 className="founder-title">Kurucu Üye Avantajları</h2>
        <p className="founder-subtitle">Sınırlı kontenjan ile sadece erken başvuru yapanlara özel fırsatlar</p>

        <div className="founder-cards">
          {/* AT SAHİBİ KARTI */}
          <motion.div
            className="founder-card"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h3 className="founder-card-title">At Sahibi</h3>
            <p className="founder-kontenjan">150 kişilik kontenjan</p>
            <ul className="founder-list">
              {atSahibiList.map((item, i) => (
                <li key={i}><span className="founder-check">✓</span> {item}</li>
              ))}
            </ul>
            <button className="founder-cta" onClick={scrollToSignup}>
              Başvuru Yap
            </button>
          </motion.div>

          {/* AYGIR SAHİBİ KARTI */}
          <motion.div
            className="founder-card"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h3 className="founder-card-title">Aygır Sahibi</h3>
            <p className="founder-kontenjan">15 kişilik kontenjan</p>
            <ul className="founder-list">
              {aygirSahibiList.map((item, i) => (
                <li key={i}><span className="founder-check">✓</span> {item}</li>
              ))}
            </ul>
            <button className="founder-cta founder-cta-silver" onClick={scrollToSignup}>
              Başvuru Yap
            </button>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
