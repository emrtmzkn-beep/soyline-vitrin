'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; 
import { 
  TbDna, TbHome, TbShoppingBag, TbArrowRight, TbChevronRight, TbChevronLeft,
  TbHorse, TbCamera, TbEye 
} from 'react-icons/tb';

// SLIDER İÇERİĞİ
const features = [
  {
    id: 0,
    label: "YÖNETİM",
    title: "Hipodrom & Hara Yönetimi",
    desc: "SoyLine BarnOS ile haranızı ve ekürinizi cebinizden yönetin. Aşı takvimi, nalbant randevuları, personel maaşları, idman kayıtları ve gelir-gider finans takibi tek ekranda.",
    icon: <TbHome />,
    bgPattern: "radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)",
    color: "#3b82f6", // Mavi
  },
  {
    id: 1,
    label: "DAMIZLIK",
    title: "Profesyonel Aygır Yönetimi",
    desc: "Aygırınızın aşım performansını, rezervasyonlarını ve taylarının saha başarılarını takip edin. Aşım sertifikaları ve veteriner kontrollerini dijitalleştirin.",
    icon: <TbHorse />,
    bgPattern: "radial-gradient(circle, rgba(212, 175, 55, 0.15) 0%, transparent 70%)",
    color: "#d4af37", // Altın
  },
  {
    id: 2,
    label: "GENETİK",
    title: "SoyLine AI™ Eşleşme Analizi",
    desc: "9 nesil geriye dönük Impact Analysis, Dosage profili ve Chef-de-Race verilerini yapay zeka ile birleştirerek kısrağınız için şampiyon genetiğini tespit edin.",
    icon: <TbDna />,
    bgPattern: "radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)",
    color: "#10b981", // Yeşil
  },
  {
    id: 3,
    label: "BİYOMEKANİK",
    title: "SoyLine AI™ Konformasyon Analizi",
    desc: "Tayınızın fotoğrafını yükleyin, yapay zeka vücut açılarını, omuz eğimini ve sağrı yapısını analiz etsin. Sakatlık riski ve mesafe yatkınlığı raporunu alın.",
    icon: <TbCamera />,
    bgPattern: "radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)",
    color: "#8b5cf6", // Mor
  },
  {
    id: 4,
    label: "FİZİKSEL",
    title: "SoyLine AI™ Fenotip Analizi",
    desc: "Sadece kağıt üzerindeki soya değil, fiziksel uyuma da bakın. Aygır ve kısrağın fiziksel özelliklerinin (renk, eşkal, vücut tipi) yavruya aktarım olasılıklarını hesaplayın.",
    icon: <TbEye />,
    bgPattern: "radial-gradient(circle, rgba(236, 72, 153, 0.15) 0%, transparent 70%)",
    color: "#ec4899", // Pembe
  },
  {
    id: 5,
    label: "TİCARET",
    title: "Premium Pazaryeri",
    desc: "Türkiye'nin en seçkin tayları, damızlık kısrakları ve aygır payları burada el değiştiriyor. Video destekli, veteriner raporlu ve pedigri onaylı güvenli ticaret.",
    icon: <TbShoppingBag />,
    bgPattern: "radial-gradient(circle, rgba(249, 115, 22, 0.15) 0%, transparent 70%)",
    color: "#f97316", // Turuncu
  }
];

export default function Home() {
  const [activeTab, setActiveTab] = useState(0);

  // Otomatik geçiş
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % features.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <style jsx global>{`
        :root { --bg-dark: #020617; --text-main: #fff; }
        body { background: var(--bg-dark); color: var(--text-main); margin:0; font-family: 'Inter', sans-serif; overflow-x: hidden; }
        
        /* HERO (VİDEO ALANI) */
        .hero { 
            height: 100vh; width: 100%; position: relative; overflow: hidden;
            display: flex; flex-direction: column; justify-content: flex-end; align-items: center;
            padding-bottom: 40px; /* Yazıyı en alta yaklaştırdık */
        }

        .hero-video {
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            object-fit: cover; z-index: 0;
            opacity: 1; /* Videoyu tamamen net yaptık */
        }

        /* LOGO (Üst Ortada Sabit) */
        .logo-container {
            position: absolute; top: 40px; left: 50%; transform: translateX(-50%); z-index: 10;
            display: flex; gap: 5px;
        }
        .logo-soy { font-family: serif; font-size: 2.5rem; color: #fff; font-weight: 400; text-shadow: 0 2px 10px rgba(0,0,0,0.5); }
        .logo-line { font-family: sans-serif; font-size: 2.5rem; color: #d4af37; font-weight: 700; font-style: italic; text-shadow: 0 2px 10px rgba(0,0,0,0.5); }

        .coming-soon {
            position: relative; z-index: 10; text-align: center;
            margin-bottom: 0px; /* Alttaki boşluğu sıfırladık */
        }
        
        .cs-text {
            font-family: 'Inter', sans-serif; font-weight: 900; font-size: 5rem; 
            letter-spacing: 5px; line-height: 1;
            /* Yazı daha net okunsun diye hafif gölge ve parlaklık */
            color: #fff;
            text-shadow: 0 10px 40px rgba(0,0,0,0.8);
        }
        
        .cs-sub {
            color: #d4af37; letter-spacing: 4px; font-size: 1.2rem; font-weight: bold; margin-bottom: 5px;
            text-transform: uppercase;
            text-shadow: 0 2px 10px rgba(0,0,0,0.8);
        }

        /* INTRO SECTION (YAZI ALANI) */
        .intro-section {
            padding: 100px 20px; text-align: center; background: #020a2c; position: relative; z-index: 5;
        }
        .intro-title {
            font-size: 3.5rem; line-height: 1.2; margin-bottom: 20px; font-weight: 800; letter-spacing: -1px;
            font-family: serif;
        }
        .intro-desc {
            font-size: 1.2rem; color: #cbd5e1; max-width: 700px; margin: 0 auto; line-height: 1.6;
        }

        /* FEATURE SLIDER SECTION */
        .feature-section {
            padding: 50px 20px 100px 20px;
            background: #020a2c;
            position: relative; overflow: hidden;
            border-top: 1px solid #1e293b;
        }

        .slider-container {
            max-width: 1200px; margin: 0 auto;
            display: grid; grid-template-columns: 1fr 1fr; gap: 50px;
            align-items: center; min-height: 500px;
        }

        .dots-grid {
            display: grid; grid-template-columns: repeat(12, 1fr); gap: 12px;
            opacity: 0.2; width: 400px; margin: 0 auto; position: absolute; inset: 0; z-index: 0;
            mask-image: radial-gradient(circle, black 40%, transparent 80%);
        }
        .dot { width: 4px; height: 4px; background: #fff; border-radius: 50%; }
        
        .nav-btn {
            background: transparent; border: 1px solid #334155; color: #94a3b8;
            width: 50px; height: 50px; border-radius: 50%; display: flex; alignItems: center; justifyContent: center;
            cursor: pointer; transition: 0.3s;
        }
        .nav-btn:hover { border-color: #d4af37; color: #d4af37; background: rgba(212,175,55,0.1); }

        @media (max-width: 900px) {
            .cs-text { font-size: 3rem; letter-spacing: 2px; }
            .intro-title { font-size: 2.2rem; }
            .slider-container { grid-template-columns: 1fr; text-align: center; }
            .visual-side { order: -1; margin-bottom: 30px; }
            .dots-grid { display: none; }
            .text-side { padding: 0 20px; }
        }
      `}</style>

      {/* --- HERO SECTION --- */}
      <header className="hero">
        
        {/* VİDEO (Filtresiz, Net) */}
        <video className="hero-video" autoPlay loop muted playsInline>
            <source src="/horse.mp4" type="video/mp4" />
        </video>

        
        {/* ÇOK YAKINDA YAZISI (En altta, Okun hemen üstünde) */}
        <div className="coming-soon">
             <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
             >
                
                <div className="cs-text">ÇOK YAKINDA</div>
             </motion.div>
             
             {/* Aşağı Kaydır İkonu */}
             <motion.div 
                animate={{ y: [0, 10, 0] }} 
                transition={{ repeat: Infinity, duration: 2 }}
                style={{ marginTop: '10px', color: '#d4af37', fontSize: '2rem' }}
             >
                ↓
             </motion.div>
        </div>
      </header>


      {/* --- INTRO SECTION (Geleceğin Şampiyonu Buraya Geldi) --- */}
      <section className="intro-section">
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
        >
            <h1 className="intro-title">
                Geleceğin Şampiyonunu<br />
                <span style={{ color: '#d4af37', fontStyle:'italic' }}>Bugünden Keşfet</span>
            </h1>
            
        </motion.div>
      </section>


      {/* --- SLIDER BÖLÜMÜ --- */}
      <section className="feature-section">
        <div className="slider-container">
            
            {/* SOL TARAF: METİN */}
            <div className="text-side" style={{position:'relative', zIndex:2}}>
                <div style={{marginBottom:'20px', fontSize:'0.9rem', color: features[activeTab].color, fontWeight:'bold', letterSpacing:'2px', display:'flex', alignItems:'center', gap:'10px'}}>
                    <span style={{width:'30px', height:'2px', background: features[activeTab].color}}></span>
                    MODÜL {activeTab + 1} / {features.length}
                </div>
                
                <AnimatePresence mode='wait'>
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.4 }}
                    >
                        <h2 style={{ fontFamily: "serif", fontSize: '3rem', margin: '0 0 20px 0', lineHeight: 1.1, color:'#fff' }}>
                            {features[activeTab].title}
                        </h2>
                        <p style={{ fontSize: '1.1rem', color: '#94a3b8', lineHeight: 1.8, marginBottom: '40px', maxWidth:'500px' }}>
                            {features[activeTab].desc}
                        </p>
                    </motion.div>
                </AnimatePresence>

                {/* Navigasyon */}
                <div style={{ display: 'flex', gap: '15px', marginTop: '60px', alignItems:'center' }}>
                    <button className="nav-btn" onClick={() => setActiveTab((prev) => (prev === 0 ? features.length - 1 : prev - 1))}>
                        <TbChevronLeft size={24} />
                    </button>
                    <button className="nav-btn" onClick={() => setActiveTab((prev) => (prev + 1) % features.length)}>
                        <TbChevronRight size={24} />
                    </button>
                    <div style={{display:'flex', gap:'8px', marginLeft:'15px'}}>
                        {features.map((_, index) => (
                            <div 
                                key={index} 
                                onClick={() => setActiveTab(index)}
                                style={{
                                    width: activeTab === index ? '40px' : '10px', 
                                    height: '4px', 
                                    background: activeTab === index ? features[activeTab].color : '#334155', 
                                    borderRadius: '4px', 
                                    transition: '0.3s', 
                                    cursor:'pointer'
                                }}
                            ></div>
                        ))}
                    </div>
                </div>
            </div>

            {/* SAĞ TARAF: GÖRSEL / GRAFİK */}
            <div className="visual-side" style={{ display:'flex', justifyContent:'center', alignItems:'center', position:'relative', height:'400px' }}>
                <AnimatePresence mode='wait'>
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.4 }}
                        style={{
                            width: '100%', height:'100%',
                            background: features[activeTab].bgPattern,
                            borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            position: 'relative',
                            border: `1px solid ${features[activeTab].color}20`
                        }}
                    >
                        <div className="dots-grid" style={{position:'absolute', display:'grid', placeItems:'center'}}>
                            {[...Array(144)].map((_, i) => (
                                <div key={i} className="dot" style={{backgroundColor: features[activeTab].color}}></div>
                            ))}
                        </div>
                        <div style={{ fontSize: '10rem', color: features[activeTab].color, zIndex:1, filter: `drop-shadow(0 0 40px ${features[activeTab].color}60)` }}>
                            {features[activeTab].icon}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer style={{textAlign:'center', padding:'40px', borderTop:'1px solid #1e293b', color:'#64748b', fontSize:'0.8rem', background:'#020a2c'}}>
        <div style={{ marginBottom: '10px', fontSize:'1.5rem', fontFamily:'serif', color:'#fff' }}>
          Soy<span style={{color:'#d4af37', fontFamily:'sans-serif', fontWeight:'bold', fontStyle:'italic'}}>Line</span>
        </div>
        <p>&copy; 2026 SoyLine Technology. Tüm Hakları Saklıdır.</p>
      </footer>
    </>
  );
}