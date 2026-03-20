'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import './PlanComparison.css';

const atSahibiRows = [
  { feature: 'Eşleşme Analizi',    standart: '10/gün',   pro: '30/gün',   lansmanStandart: '20/gün (2x)',  lansmanPro: null },
  { feature: 'Pro AI Eşleşme',     standart: '—',        pro: '15/gün',   lansmanStandart: null,           lansmanPro: null },
  { feature: 'Anne Hattı',         standart: '10/gün',   pro: '30/gün',   lansmanStandart: '20/gün (2x)',  lansmanPro: null },
  { feature: 'Şampiyon Referans',  standart: '10/gün',   pro: '20/gün',   lansmanStandart: null,           lansmanPro: null },
  { feature: 'Konformasyon AI',    standart: '—',        pro: '15/gün',   lansmanStandart: null,           lansmanPro: null },
  { feature: 'Fenotip AI',         standart: '—',        pro: '8/gün',    lansmanStandart: null,           lansmanPro: null },
  { feature: 'Akıllı Eşleşme',    standart: '—',        pro: '25/gün',   lansmanStandart: null,           lansmanPro: null },
  { feature: 'Yarış Asistanı',    standart: '—',        pro: '15/gün',   lansmanStandart: null,           lansmanPro: null },
  { feature: 'BarnOS At',          standart: '5',        pro: '20',       lansmanStandart: '10 (2x)',      lansmanPro: null },
  { feature: 'Pazar İlanı',       standart: '1/ay',     pro: '5/ay',     lansmanStandart: null,           lansmanPro: null },
  { feature: 'Günlük AI Limit',   standart: '15',       pro: '30',       lansmanStandart: null,           lansmanPro: null },
  { feature: 'Jeton/ay',           standart: '200',      pro: '1.000',    lansmanStandart: '500 (2.5x)',   lansmanPro: null },
  { feature: 'Fiyat',              standart: 'Ücretsiz', pro: '1.490 ₺/ay', lansmanStandart: 'Ücretsiz',  lansmanPro: '1.192 ₺/ay (%20↓)', isPrice: true },
];

const aygirSahibiRows = [
  { feature: 'Başvuru yönetimi',   basic: '20/ay',        elite: 'Sınırsız',          lansmanBasic: null, lansmanElite: null },
  { feature: 'Analitik dashboard', basic: '✓',            elite: '✓',                 lansmanBasic: null, lansmanElite: null },
  { feature: 'Akıllı eşleşme',    basic: '✓',            elite: '✓',                 lansmanBasic: null, lansmanElite: null },
  { feature: 'Aşım planı',        basic: '—',            elite: '✓',                 lansmanBasic: null, lansmanElite: null },
  { feature: 'İdeal kısrak havuzu',basic: '—',            elite: '✓',                 lansmanBasic: null, lansmanElite: null },
  { feature: 'Mesajlaşma',        basic: '—',            elite: '✓',                 lansmanBasic: null, lansmanElite: null },
  { feature: 'Medya',              basic: '5 fotoğraf',   elite: '20 foto + 5 video', lansmanBasic: null, lansmanElite: null },
  { feature: 'Pedigri derinlik',   basic: '3 kuşak',      elite: '5 kuşak',           lansmanBasic: null, lansmanElite: null },
  { feature: 'Eküri at sahibi',   basic: '—',            elite: '✓ Kalıcı',          lansmanBasic: null, lansmanElite: '✓ Kalıcı' },
  { feature: 'At Sahibi Kota Bonusu', basic: '—',        elite: '—',                 lansmanBasic: '90 gün 2x', lansmanElite: '90 gün 2x' },
  { feature: 'Jeton/ay',           basic: '300',          elite: '2.000',             lansmanBasic: null, lansmanElite: null },
  { feature: 'Fiyat',              basic: '1.490 ₺/ay',   elite: '4.990 ₺/ay',        lansmanBasic: '1.192 ₺/ay (%20↓)', lansmanElite: '3.992 ₺/ay (%20↓)', isPrice: true },
];

function LansmanCell({ value }) {
  if (!value) return <td className="plans-lansman-cell">—</td>;
  return (
    <td className="plans-lansman-cell plans-lansman-active">
      {value}
    </td>
  );
}

export default function PlanComparison() {
  const [activeTab, setActiveTab] = useState('at');

  const scrollToSignup = () => {
    const el = document.getElementById('lansman-basvuru');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="plans-section">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="plans-inner"
      >
        <h2 className="plans-title">Planları Karşılaştır</h2>

        <div className="plans-tabs">
          <button
            className={`plans-tab ${activeTab === 'at' ? 'plans-tab-active' : ''}`}
            onClick={() => setActiveTab('at')}
          >
            🐴 At Sahibi
          </button>
          <button
            className={`plans-tab ${activeTab === 'aygir' ? 'plans-tab-active' : ''}`}
            onClick={() => setActiveTab('aygir')}
          >
            🐎 Aygır Sahibi
          </button>
        </div>

        {activeTab === 'at' && (
          <motion.div
            key="at"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="plans-table-wrapper">
              <table className="plans-table plans-table-5col">
                <thead>
                  <tr className="plans-header-group">
                    <th rowSpan={2} className="plans-feature-th">Özellik</th>
                    <th colSpan={2} className="plans-normal-header">Standart Kotalar</th>
                    <th colSpan={2} className="plans-lansman-header">🎁 Kurucu Üye Fırsatı</th>
                  </tr>
                  <tr className="plans-header-sub">
                    <th>Standart</th>
                    <th>Pro</th>
                    <th className="plans-lansman-subheader">Standart</th>
                    <th className="plans-lansman-subheader">Pro</th>
                  </tr>
                </thead>
                <tbody>
                  {atSahibiRows.map((row, i) => (
                    <tr key={i} className={row.isPrice ? 'plans-price-row' : ''}>
                      <td className="plans-feature">{row.feature}</td>
                      <td>{row.standart}</td>
                      <td>{row.pro}</td>
                      <LansmanCell value={row.lansmanStandart} />
                      <LansmanCell value={row.lansmanPro} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="plans-note plans-note-gold">
              🎁 Kurucu üye olarak başvur — Standart plan kotaların 90 gün boyunca <strong>2 katına</strong> çıksın, Pro plana <strong>%20 indirimle</strong> başla!
            </div>
            <div className="plans-note plans-note-subtle">
              ⏳ Bonus süresi: 90 gün · Kurucu Üye rozeti kalıcı · Kontenjan: <strong>150 kişi</strong>
            </div>
            <button className="plans-cta" onClick={scrollToSignup}>Kurucu Üye Başvurusu Yap ↓</button>
          </motion.div>
        )}

        {activeTab === 'aygir' && (
          <motion.div
            key="aygir"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="plans-table-wrapper">
              <table className="plans-table plans-table-5col">
                <thead>
                  <tr className="plans-header-group">
                    <th rowSpan={2} className="plans-feature-th">Özellik</th>
                    <th colSpan={2} className="plans-normal-header">Standart Kotalar</th>
                    <th colSpan={2} className="plans-lansman-header">🎁 Kurucu Üye Fırsatı</th>
                  </tr>
                  <tr className="plans-header-sub">
                    <th>Basic</th>
                    <th>Elite</th>
                    <th className="plans-lansman-subheader">Basic</th>
                    <th className="plans-lansman-subheader">Elite</th>
                  </tr>
                </thead>
                <tbody>
                  {aygirSahibiRows.map((row, i) => (
                    <tr key={i} className={row.isPrice ? 'plans-price-row' : ''}>
                      <td className="plans-feature">{row.feature}</td>
                      <td>{row.basic}</td>
                      <td>{row.elite}</td>
                      <LansmanCell value={row.lansmanBasic} />
                      <LansmanCell value={row.lansmanElite} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="plans-note plans-note-gold">
              🎁 Kurucu üye olarak başvur — Basic ve Elite planlara <strong>%20 indirimle</strong> başla + kalıcı Kurucu Üye rozeti!
            </div>
            <div className="plans-note plans-note-subtle">
              🏆 Elite üyeler at sahibi tarafında otomatik <strong>Eküri erişimi</strong> kazanır · Kontenjan: <strong>15 kişi</strong>
            </div>
            <button className="plans-cta" onClick={scrollToSignup}>Kurucu Üye Başvurusu Yap ↓</button>
          </motion.div>
        )}
      </motion.div>
    </section>
  );
}
