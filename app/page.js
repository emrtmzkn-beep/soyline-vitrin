'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; 
import { 
  TbDna, TbHome, TbShoppingBag, TbArrowRight, TbChevronRight, TbChevronLeft,
  TbHorse, TbCamera, TbEye, TbMail, TbSend, TbTrophy
} from 'react-icons/tb';

// SLIDER İÇERİĞİ
const features = [
  {
    id: 0,
    label: "YÖNETİM",
    title: "Dijital Hara & Eküri Yönetimi",
    desc: "Kağıt-kalem devri kapandı. Aşı takviminden nalbant randevularına, personel maaşlarından idman raporlarına kadar tüm operasyonunuzu cepten yönetin.",
    icon: <TbHome />,
    bgPattern: "radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)",
    color: "#3b82f6", 
  },
  {
    id: 1,
    label: "AYGIR",
    title: "Aygır Kariyer & Aşım Yönetimi",
    desc: "Aygırınızın marka değerini artırın. Aşım rezervasyonlarını dijital ortamda yönetin, tayların saha başarılarını anlık takip edin.",
    icon: <TbHorse />,
    bgPattern: "radial-gradient(circle, rgba(212, 175, 55, 0.15) 0%, transparent 70%)",
    color: "#d4af37", 
  },
  {
    id: 2,
    label: "GENETİK",
    title: "SoyLine AI™ Eşleşme Sihirbazı",
    desc: "Şansı değil, veriyi kullanın. Milyonlarca yarış verisi ve yapay zeka algoritmalarıyla kısrağınız için 'Altın Çapraz'ı tespit edin.",
    icon: <TbDna />,
    bgPattern: "radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)",
    color: "#10b981", 
  },
  {
    id: 3,
    label: "BİYOMEKANİK",
    title: "Yapay Zeka Konformasyon Analizi",
    desc: "Tayınızın fotoğrafını yükleyin; yapay zeka omuz açılarını ve biyomekanik yapısını analiz etsin. Sakatlık risklerini öngörün.",
    icon: <TbCamera />,
    bgPattern: "radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)",
    color: "#8b5cf6", 
  },
  {
    id: 4,
    label: "FENOTİP",
    title: "Fiziksel Uyum & Karakter Analizi",
    desc: "Sadece kağıt üzerindeki soya değil, sahadaki atlete odaklanın. Aygır ve kısrağın fiziksel özelliklerini dengeleyin.",
    icon: <TbEye />,
    bgPattern: "radial-gradient(circle, rgba(236, 72, 153, 0.15) 0%, transparent 70%)",
    color: "#ec4899", 
  },
  {
    id: 5,
    label: "TİCARET",
    title: "SoyLine Elit Pazaryeri",
    desc: "Güvenli ticaretin yeni adresi. Sadece veteriner raporlu ve pedigri onaylı taylar, damızlıklar ve aygır payları.",
    icon: <TbShoppingBag />,
    bgPattern: "radial-gradient(circle, rgba(249, 115, 22, 0.15) 0%, transparent 70%)",
    color: "#f97316", 
  }
];

export default function Home() {
  const [activeTab, setActiveTab] = useState(0);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % features.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if(email) {
      setSubmitted(true);
      // Burada mail servisi API'nizi çağırabilirsiniz
    }
  };

  return (
    <>
      <style jsx global>{`
        :root { --bg-dark: #020617; --text-main: #fff; --accent: #d4af37; }
        body { background: var(--bg-dark); color: var(--text-main); margin:0; font-family: 'Inter', sans-serif; overflow-x: hidden; }
        
        .hero { 
            height: 100vh; width: 100%; position: relative; overflow: hidden;
            display: flex; flex-direction: column; justify-content: flex-end; align-items: center;
            padding-bottom: 80px; background-color: #000;
        }

        .hero-video {
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            object-fit: contain !important; z-index: 0; 
        }

        .coming-soon { position: relative; z-index: 10; text-align: center; width: 90%; }
        .cs-text {
            font-family: 'Inter', sans-serif; font-weight: 900; 
            font-size: clamp(2.5rem, 10vw, 5rem); letter-spacing: clamp(2px, 1vw, 10px);
            background: linear-gradient(to bottom, #fff 0%, #94a3b8 100%);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }

        .intro-section { padding: 80px 20px; text-align: center; background: #020617; }
        .intro-title { font-size: clamp(2rem, 5vw, 3.5rem); font-weight: 800; font-family: serif; }

        .feature-section { padding: 50px 20px 100px 20px; background: #0f172a; border-top: 1px solid #1e293b; }
        .slider-container { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 50px; align-items: center; }

        /* --- YENİ EKLENEN STİLLER --- */
        .launch-section {
          padding: 100px 20px;
          background: radial-gradient(circle at top, #1e293b 0%, #020617 100%);
          display: flex; flex-direction: column; align-items: center;
        }
        .cta-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(212, 175, 55, 0.3);
          padding: 40px; border-radius: 24px;
          max-width: 800px; width: 100%; text-align: center;
          backdrop-filter: blur(10px);
        }
        .mail-input-group {
          display: flex; gap: 10px; margin-top: 30px; width: 100%; max-width: 500px; margin-inline: auto;
        }
        .mail-input {
          flex: 1; background: rgba(0,0,0,0.5); border: 1px solid #334155;
          padding: 15px 20px; border-radius: 12px; color: white; outline: none; transition: 0.3s;
        }
        .mail-input:focus { border-color: var(--accent); box-shadow: 0 0 15px rgba(212,175,55,0.2); }
        .submit-btn {
          background: var(--accent); color: #000; border: none; padding: 0 25px;
          border-radius: 12px; font-weight: 700; cursor: pointer; transition: 0.3s;
          display: flex; align-items: center; gap: 8px;
        }
        .submit-btn:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(212,175,55,0.4); }
        
        .special-badge {
          background: rgba(212, 175, 55, 0.1); color: var(--accent);
          padding: 8px 16px; border-radius: 100px; font-size: 0.8rem; font-weight: 700;
          display: inline-flex; align-items: center; gap: 8px; margin-bottom: 20px;
        }

        @media (max-width: 900px) {
            .slider-container { grid-template-columns: 1fr; }
            .mail-input-group { flex-direction: column; }
            .submit-btn { padding: 15px; justify-content: center; }
        }
      `}</style>

      {/* HERO SECTION */}
      <header className="hero">
        <video className="hero-video" autoPlay loop muted playsInline>
            <source src="/horse.mp4" type="video/mp4" />
        </video>
        <div className="coming-soon">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}>
                <div className="cs-text">ÇOK YAKINDA</div>
                <div style={{ color: '#d4af37', letterSpacing: '4px', fontWeight: 'bold' }}>GELECEK BURADA KOŞUYOR</div>
            </motion.div>
        </div>
      </header>

      {/* INTRO SECTION */}
      <section className="intro-section">
        <h1 className="intro-title">
            Geleceğin Şampiyonunu<br />
            <span style={{ color: '#d4af37', fontStyle:'italic' }}>Bugünden Keşfet</span>
        </h1>
      </section>

      {/* SLIDER SECTION (Mevcut kodunuzu korur) */}
      <section className="feature-section">
        <div className="slider-container">
            <div className="text-side">
                <AnimatePresence mode='wait'>
                    <motion.div key={activeTab} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                        <h2 style={{ fontFamily: "serif", fontSize: '2.5rem', color: features[activeTab].color }}>{features[activeTab].title}</h2>
                        <p style={{ color: '#94a3b8', lineHeight: 1.8 }}>{features[activeTab].desc}</p>
                    </motion.div>
                </AnimatePresence>
                <div style={{ display: 'flex', gap: '15px', marginTop: '40px' }}>
                    <button onClick={() => setActiveTab((prev) => (prev === 0 ? features.length - 1 : prev - 1))} style={{background:'none', border:'1px solid #334155', color:'white', padding:'10px', borderRadius:'50%', cursor:'pointer'}}><TbChevronLeft /></button>
                    <button onClick={() => setActiveTab((prev) => (prev + 1) % features.length)} style={{background:'none', border:'1px solid #334155', color:'white', padding:'10px', borderRadius:'50%', cursor:'pointer'}}><TbChevronRight /></button>
                </div>
            </div>
            <div className="visual-side" style={{ display:'flex', justifyContent:'center', fontSize:'8rem', color: features[activeTab].color }}>
                {features[activeTab].icon}
            </div>
        </div>
      </section>

      {/* --- LANSMAN ÖZEL & MAIL BÖLÜMÜ --- */}
      <section className="launch-section">
        <motion.div 
          initial={{ opacity: 0, y: 30 }} 
          whileInView={{ opacity: 1, y: 0 }} 
          viewport={{ once: true }}
          className="cta-card"
        >
          <div className="special-badge">
            <TbTrophy /> LANSMAN ÖZEL AVANTAJI
          </div>
          
          <h2 style={{ fontSize: '2.5rem', marginBottom: '15px', fontFamily: 'serif' }}>
            Erken Erişimle <span style={{color: 'var(--accent)'}}>Sınırları Aşın</span>
          </h2>
          
          <p style={{ color: '#94a3b8', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
            SoyLine dünyasına ilk adım atan 100 eküri arasına katılın. Ücretsiz pedigri analizi ve ömür boyu "Kurucu Üye" statüsü kazanma şansını yakalayın.
          </p>

          {!submitted ? (
            <form className="mail-input-group" onSubmit={handleSubscribe}>
              <input 
                type="email" 
                placeholder="E-posta adresiniz" 
                className="mail-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="submit" className="submit-btn">
                BİLGİ AL <TbSend />
              </button>
            </form>
          ) : (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }}
              style={{ marginTop: '30px', color: '#10b981', fontWeight: 'bold' }}
            >
              ✓ Talebiniz alındı. Şampiyonların dünyasına davet edileceksiniz.
            </motion.div>
          )}

          <p style={{ marginTop: '20px', fontSize: '0.7rem', color: '#475569' }}>
            * Kaydolarak gizlilik politikamızı ve lansman duyurularını almayı kabul etmiş olursunuz.
          </p>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer style={{textAlign:'center', padding:'40px', borderTop:'1px solid #1e293b', color:'#64748b', fontSize:'0.8rem', background:'#020617'}}>
        <div style={{ marginBottom: '10px', fontSize:'1.5rem', fontFamily:'serif', color:'#fff' }}>
          Soy<span style={{color:'#d4af37', fontFamily:'sans-serif', fontWeight:'bold', fontStyle:'italic'}}>Line</span>
        </div>
        <p>&copy; 2026 SoyLine Teknoloji. Tüm Hakları Saklıdır.</p>
      </footer>
    </>
  );
}