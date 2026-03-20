'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import './PlanComparison.css';

const atSahibiRows = [
  { feature: 'Eşleşme Analizi',    standart: '5/gün',    pro: '30/gün',     ekuri: 'Sınırsız',    lansmanStandart: '10/gün (2x)',  lansmanPro: null,                    lansmanEkuri: null },
  { feature: 'Pro AI Eşleşme',     standart: '1/gün',    pro: '5/gün',      ekuri: '15/gün',      lansmanStandart: '2/gün (2x)',   lansmanPro: null,                    lansmanEkuri: null },
  { feature: 'Anne Hattı',         standart: '10/gün',   pro: '30/gün',     ekuri: 'Sınırsız',    lansmanStandart: '20/gün (2x)',  lansmanPro: null,                    lansmanEkuri: null },
  { feature: 'Şampiyon Referans',  standart: '5/gün',    pro: '20/gün',     ekuri: 'Sınırsız',    lansmanStandart: '10/gün (2x)',  lansmanPro: null,                    lansmanEkuri: null },
  { feature: 'Konformasyon AI',    standart: '1/gün',    pro: '3/gün',      ekuri: '10/gün',      lansmanStandart: '2/gün (2x)',   lansmanPro: null,                    lansmanEkuri: null },
  { feature: 'Fenotip AI',         standart: '1/gün',    pro: '5/gün',      ekuri: '10/gün',      lansmanStandart: '2/gün (2x)',   lansmanPro: null,                    lansmanEkuri: null },
  { feature: 'Akıllı Eşleşme',    standart: '1/gün',    pro: '5/gün',      ekuri: '15/gün',      lansmanStandart: '2/gün (2x)',   lansmanPro: null,                    lansmanEkuri: null },
  { feature: 'Yarış Asistanı',    standart: '1/gün',    pro: '5/gün',      ekuri: '15/gün',      lansmanStandart: '2/gün (2x)',   lansmanPro: null,                    lansmanEkuri: null },
  { feature: 'BarnOS At',          standart: '5',        pro: '20',         ekuri: '50',           lansmanStandart: '10 (2x)',      lansmanPro: null,                    lansmanEkuri: null },
  { feature: 'Pazar İlanı',       standart: '1/ay',     pro: '5/ay',       ekuri: '15/ay',        lansmanStandart: null,           lansmanPro: null,                    lansmanEkuri: null },
  { feature: 'Jeton/ay',           standart: '200',      pro: '1.000',      ekuri: '3.000',        lansmanStandart: '400 (2x)',     lansmanPro: null,                    lansmanEkuri: null },
  { feature: 'Fiyat',              standart: 'Ücretsiz', pro: '1.490 ₺/ay', ekuri: '3.490 ₺/ay',   lansmanStandart: 'Ücretsiz',     lansmanPro: '6 ay %25 → 1.118 ₺/ay',  lansmanEkuri: '6 ay %25 → 2.618 ₺/ay', isPrice: true },
];

const aygirSahibiRows = [
  { feature: 'Analitik dashboard', basic: '✓',            elite: '✓',                 lansmanBasic: null, lansmanElite: null },
  { feature: 'Akıllı eşleşme',    basic: '✓',            elite: '✓',                 lansmanBasic: null, lansmanElite: null },
  { feature: 'Aşım planı',        basic: '—',            elite: '✓',                 lansmanBasic: null, lansmanElite: null },
  { feature: 'İdeal kısrak havuzu',basic: '—',            elite: '✓',                 lansmanBasic: null, lansmanElite: null },
  { feature: 'Mesajlaşma',        basic: '—',            elite: '✓',                 lansmanBasic: null, lansmanElite: null },
  { feature: 'Hat Sorgulama',      basic: '✓',            elite: '✓',                 lansmanBasic: null, lansmanElite: null },
  { feature: 'Vitrine Çıkar',     basic: '—',            elite: '✓',                 lansmanBasic: null, lansmanElite: null },
  { feature: 'Medya',              basic: '5 fotoğraf',   elite: '20 foto + 5 video', lansmanBasic: null, lansmanElite: null },
  { feature: 'Jeton/ay',           basic: '300',          elite: '2.000',             lansmanBasic: null, lansmanElite: null },
  { feature: 'Fiyat',              basic: '1.490 ₺/ay',   elite: '4.990 ₺/ay',        lansmanBasic: '6 ay Ücretsiz', lansmanElite: '6 ay %50 → 2.495 ₺/ay', isPrice: true },
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
              <table className="plans-table plans-table-7col">
                <thead>
                  <tr className="plans-header-group">
                    <th rowSpan={2} className="plans-feature-th">Özellik</th>
                    <th colSpan={3} className="plans-normal-header">Standart Kotalar</th>
                    <th colSpan={3} className="plans-lansman-header">🎁 Kurucu Üye Fırsatı</th>
                  </tr>
                  <tr className="plans-header-sub">
                    <th>Standart</th>
                    <th>Pro</th>
                    <th>Eküri</th>
                    <th className="plans-lansman-subheader">Standart</th>
                    <th className="plans-lansman-subheader">Pro</th>
                    <th className="plans-lansman-subheader">Eküri</th>
                  </tr>
                </thead>
                <tbody>
                  {atSahibiRows.map((row, i) => (
                    <tr key={i} className={row.isPrice ? 'plans-price-row' : ''}>
                      <td className="plans-feature">{row.feature}</td>
                      <td>{row.standart}</td>
                      <td>{row.pro}</td>
                      <td>{row.ekuri}</td>
                      <LansmanCell value={row.lansmanStandart} />
                      <LansmanCell value={row.lansmanPro} />
                      <LansmanCell value={row.lansmanEkuri} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="plans-note plans-note-gold">
              🎁 Kurucu üye olarak başvur — Standart 2x kota bonusu, Pro ve Eküri planlara <strong>6 ay %25 indirim</strong> + kalıcı Kurucu Üye rozeti!
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
              🎁 Kurucu üye olarak başvur — Basic plan <strong>6 ay ücretsiz</strong>, Elite plan <strong>6 ay %50 indirimle</strong> başla + kalıcı Kurucu Üye rozeti!
            </div>
            <div className="plans-note plans-note-subtle">
              🏆 Kurucu üye rozeti kalıcı · Kontenjan: <strong>15 kişi</strong>
            </div>
            <button className="plans-cta" onClick={scrollToSignup}>Kurucu Üye Başvurusu Yap ↓</button>
          </motion.div>
        )}
      </motion.div>
    </section>
  );
}
