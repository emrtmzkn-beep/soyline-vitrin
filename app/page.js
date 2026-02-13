'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; 
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { 
  TbDna, TbHome, TbArrowRight, TbChevronRight, TbChevronLeft,
  TbHorse, TbEye, TbTrophy,
  TbSearch, TbHorseToy, TbGenderMale, TbGenderFemale
} from 'react-icons/tb';

// --- SUPABASE BAĞLANTISI ---
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// SLIDER İÇERİĞİ
const features = [
  {
    id: 0,
    label: "YÖNETİM",
    title: "Dijital Hara Yönetimi",
    desc: "Kağıt-kalem devri kapandı. Aşı takviminden personel maaşlarına tüm operasyonu cepten yönetin.",
    icon: <TbHome />,
    color: "#d4af37",
  },
  {
    id: 1,
    label: "AYGIR",
    title: "Aygır Kariyer Yönetimi",
    desc: "Aşım rezervasyonlarını dijital ortamda yönetin, tayların saha başarılarını anlık takip edin.",
    icon: <TbHorse />,
    color: "#d4af37", 
  },
  {
    id: 2,
    label: "GENETİK",
    title: "SoyLine AI™ Eşleşme",
    desc: "Şansı değil, veriyi kullanın. Yapay zeka ile kısrağınız için 'Altın Çapraz'ı (Nick) tespit edin.",
    icon: <TbDna />,
    color: "#d4af37", 
  },
  {
    id: 3,
    label: "FENOTİP",
    title: "Fiziksel Uyum Analizi",
    desc: "Sadece kağıt üzerindeki soya değil, sahadaki atlete odaklanın. Fiziksel özellikleri dengeleyin.",
    icon: <TbEye />,
    color: "#d4af37", 
  }
];

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // --- ARAMA STATE'LERİ ---
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedHorse, setSelectedHorse] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [generation, setGeneration] = useState(5);
  
  const [sireInput, setSireInput] = useState('');
  const [damInput, setDamInput] = useState('');
  const [sireResults, setSireResults] = useState([]);
  const [damResults, setDamResults] = useState([]);
  const [selectedSire, setSelectedSire] = useState(null);
  const [selectedDam, setSelectedDam] = useState(null);
  const [showSireDropdown, setShowSireDropdown] = useState(false);
  const [showDamDropdown, setShowDamDropdown] = useState(false);
  const [foalGen, setFoalGen] = useState(5);

  const searchRef = useRef(null);
  const sireRef = useRef(null);
  const damRef = useRef(null);

  // Slider Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % features.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Dropdown Kapatma
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) setShowDropdown(false);
      if (sireRef.current && !sireRef.current.contains(event.target)) setShowSireDropdown(false);
      if (damRef.current && !damRef.current.contains(event.target)) setShowDamDropdown(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- ARAMA SORGULARI ---
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchInput.length > 2) {
        const { data, error } = await supabase.from('tum_atlar').select('id, ad, baba:baba_id(ad), anne:anne_id(ad)').ilike('ad', `%${searchInput}%`).limit(5);
        if (!error && data) { setSearchResults(data.map(d => ({...d, baba: d.baba?.ad, anne: d.anne?.ad}))); setShowDropdown(true); }
      } else { setSearchResults([]); setShowDropdown(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (sireInput.length > 2) {
        const { data, error } = await supabase.from('aygir').select('aygir_id, aygir_adi, baba').ilike('aygir_adi', `%${sireInput}%`).limit(5);
        if (!error && data) { setSireResults(data); setShowSireDropdown(true); }
      } else { setSireResults([]); setShowSireDropdown(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [sireInput]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (damInput.length > 2) {
        const { data, error } = await supabase.from('kisrak').select('kisrak_id, ad, baba').ilike('ad', `%${damInput}%`).limit(5);
        if (!error && data) { setDamResults(data); setShowDamDropdown(true); }
      } else { setDamResults([]); setShowDamDropdown(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [damInput]);

  const handlePedigreeSearch = () => { if (selectedHorse) router.push(`/pedigri?id=${selectedHorse.id}&gen=${generation}`); else alert("Lütfen listeden bir at seçiniz."); };
  const handleFoalSearch = () => { if (selectedSire && selectedDam) router.push(`/muhtemel-pedigri?sire_id=${selectedSire.aygir_id}&dam_id=${selectedDam.kisrak_id}&gen=${foalGen}`); else alert("Lütfen hem Baba hem de Anne seçiniz."); };
  const handleSubscribe = (e) => { e.preventDefault(); if(email) { setSubmitted(true); } };

  return (
    <>
      <style jsx global>{`
        /* CSS RESET VE TEMEL AYARLAR */
        :root { --accent: #d4af37; --accent-glow: rgba(212, 175, 55, 0.5); }
        
        /* NAVBAR */
        .navbar { 
            display: flex; align-items: center; justify-content: space-between; 
            padding: 0 40px; height: 80px; 
            background: rgba(2, 6, 23, 0.85); backdrop-filter: blur(15px); 
            border-bottom: 1px solid rgba(255,255,255,0.08); 
            position: fixed; top: 0; width: 100%; z-index: 1000; 
        }
        .logo-link { text-decoration: none; display: flex; align-items: center; font-family: 'Times New Roman', serif; font-weight: 700; font-size: 1.8rem; letter-spacing: -0.5px; }
        .soy-text { color: #ffffff; }
        .line-wrapper { position: relative; display: flex; flex-direction: column; }
        .line-text { color: var(--accent); }
        .line-swosh { position: absolute; bottom: -8px; left: -10%; width: 120%; height: auto; pointer-events: none; }
        .nav-links { display: flex; gap: 30px; }
        .nav-item { color: #cbd5e1; text-decoration: none; font-size: 0.9rem; font-weight: 500; transition:0.3s; text-transform: uppercase; letter-spacing: 1px; }
        .nav-item:hover { color: var(--accent); }

        /* HERO SECTION */
        .hero-section {
            padding-top: 140px; 
            padding-bottom: 100px;
            background: radial-gradient(ellipse at top, #1e293b 0%, #020617 70%);
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            min-height: 95vh;
            width: 100%;
        }
        .coming-soon-badge {
            background: rgba(212, 175, 55, 0.15); color: var(--accent);
            padding: 8px 24px; border-radius: 50px; font-weight: 600; letter-spacing: 2px; font-size: 0.85rem;
            margin-bottom: 30px; border: 1px solid rgba(212, 175, 55, 0.3);
            box-shadow: 0 0 20px rgba(212, 175, 55, 0.1);
        }
        .hero-title { font-size: clamp(3rem, 6vw, 5rem); margin: 0; font-family: 'Times New Roman', serif; line-height: 1.1; text-align: center; color: #fff; }
        .hero-subtitle { color: var(--accent); font-style: italic; }

        /* --- SLIDER KARTI (DÜZELTİLEN KISIM) --- */
        .slider-wrapper {
            /* GENİŞLİK AYARLARI */
            width: 90%; 
            max-width: 1200px; /* Genişliği artırdık */
            margin-top: 60px;
            min-height: 450px; /* Yükseklik çökmesini engellemek için */
            
            /* GRID YAPISI */
            display: grid; 
            grid-template-columns: 1.2fr 1fr; /* Sol taraf yazı, sağ taraf ikon */
            gap: 40px; 
            align-items: center;
            
            /* GÖRÜNÜM */
            background: rgba(30, 41, 59, 0.3); /* Daha koyu transparan */
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-left: 4px solid var(--accent); /* Sol tarafa şık çizgi */
            padding: 60px; 
            border-radius: 24px; 
            backdrop-filter: blur(20px);
            box-shadow: 0 30px 60px -15px rgba(0, 0, 0, 0.6); /* Derin gölge */
            position: relative;
            overflow: hidden;
        }
        
        /* Slider Arkaplan Efekti */
        .slider-wrapper::after {
            content: ''; position: absolute; top: -50%; right: -20%; width: 600px; height: 600px;
            background: radial-gradient(circle, rgba(212, 175, 55, 0.05) 0%, transparent 70%);
            z-index: -1;
        }

        .slider-text { text-align: left; z-index: 2; }
        .slider-text h2 { font-size: 2.8rem; font-family: 'Times New Roman', serif; margin: 0 0 20px 0; color: #fff; letter-spacing: -1px; }
        .slider-text p { color: #cbd5e1; line-height: 1.8; font-size: 1.2rem; max-width: 90%; }
        
        .slider-visual { 
            font-size: 12rem; /* İkonu büyüttük */
            display: flex; justify-content: center; align-items: center; 
            filter: drop-shadow(0 0 30px rgba(212, 175, 55, 0.15));
            opacity: 0.9;
        }
        
        .slider-nav { display: flex; gap: 15px; margin-top: 40px; }
        .nav-btn { 
            background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); 
            color: #fff; width: 50px; height: 50px; border-radius: 50%; 
            cursor: pointer; transition: 0.3s; display: flex; align-items: center; justify-content: center; 
        }
        .nav-btn:hover { background: var(--accent); color: #000; border-color: var(--accent); transform: scale(1.1); box-shadow: 0 0 15px var(--accent-glow); }

        /* LANSMAN BAR */
        .launch-bar {
            width: 100%; padding: 80px 20px; 
            background: linear-gradient(180deg, #0f172a 0%, #020617 100%);
            border-top: 1px solid #1e293b; border-bottom: 1px solid #1e293b;
            text-align: center; display: flex; flex-direction: column; align-items: center;
        }
        .launch-title { font-size: 2.5rem; margin: 10px 0; font-family: 'Times New Roman', serif; color: #fff; }
        .mail-input-group { display: flex; gap: 10px; margin-top: 30px; width: 100%; max-width: 500px; }
        .mail-input { flex: 1; background: rgba(255,255,255,0.05); border: 1px solid #334155; padding: 18px 25px; border-radius: 12px; color: white; outline: none; font-size: 1rem; }
        .mail-input:focus { border-color: var(--accent); }
        .submit-btn { background: var(--accent); color: #000; border: none; padding: 0 35px; border-radius: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 10px; }

        /* TOOLS SECTION */
        .tools-section { padding: 120px 20px; background: #020617; display: flex; flex-direction: column; align-items: center; gap: 80px; }
        .section-title { font-size: 3rem; color: #fff; font-family: 'Times New Roman', serif; text-align: center; margin-bottom: 10px; }
        .pedigree-box {
            background: rgba(15, 23, 42, 0.6); 
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-top: 3px solid var(--accent); /* Üst çizgi */
            padding: 60px; border-radius: 24px;
            max-width: 1000px; width: 90%; 
            box-shadow: 0 20px 50px rgba(0,0,0,0.5);
            backdrop-filter: blur(10px);
        }
        .pb-title { color: #fff; font-size: 1.8rem; margin: 0 0 15px 0; font-family: 'Times New Roman', serif; display: flex; align-items: center; gap: 15px; }
        .pb-desc { color: #94a3b8; margin-bottom: 40px; font-size: 1.1rem; line-height: 1.6; }
        
        .search-row { display: flex; gap: 20px; flex-wrap: wrap; }
        .input-group { flex: 1; min-width: 280px; position: relative; }
        .p-input { width: 100%; padding: 20px 20px 20px 55px; background: #020617; border: 1px solid #334155; border-radius: 12px; color: #fff; font-size: 1.1rem; outline: none; transition: 0.3s; box-sizing: border-box; }
        .p-input:focus { border-color: var(--accent); box-shadow: 0 0 0 4px rgba(212, 175, 55, 0.1); }
        .search-icon { position: absolute; left: 20px; top: 50%; transform: translateY(-50%); font-size: 1.5rem; color: #64748b; }

        /* DROPDOWN */
        .p-dropdown { position: absolute; top: 110%; left: 0; width: 100%; background: #1e293b; border: 1px solid #475569; border-radius: 12px; max-height: 300px; overflow-y: auto; z-index: 50; box-shadow: 0 20px 50px rgba(0,0,0,0.7); }
        .p-item { padding: 15px 20px; border-bottom: 1px solid rgba(255,255,255,0.05); cursor: pointer; color: #cbd5e1; display: flex; justify-content: space-between; align-items: center; }
        .p-item:hover { background: rgba(212, 175, 55, 0.1); color: var(--accent); }

        .gen-options { display: flex; gap: 10px; background: #020617; padding: 8px; border-radius: 14px; border: 1px solid #334155; }
        .gen-btn { background: transparent; border: none; color: #64748b; padding: 10px 20px; border-radius: 10px; cursor: pointer; font-weight: 600; font-size: 0.95rem; white-space: nowrap; transition: 0.3s; }
        .gen-btn.active { background: #1e293b; color: #fff; box-shadow: 0 2px 10px rgba(0,0,0,0.3); }

        .go-btn { background: linear-gradient(135deg, var(--accent) 0%, #b45309 100%); color: #fff; border: none; padding: 0 40px; border-radius: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 10px; font-size: 1.1rem; white-space: nowrap; }

        @media (max-width: 900px) {
            .hero-title { font-size: 3rem; }
            .slider-wrapper { grid-template-columns: 1fr; text-align: center; padding: 40px; height: auto; }
            .slider-visual { margin-top: 30px; font-size: 8rem; }
            .slider-nav { justify-content: center; }
            .nav-links { display: none; }
            .search-row { flex-direction: column; }
            .gen-options { width: 100%; justify-content: space-between; }
            .go-btn { width: 100%; justify-content: center; padding: 20px; }
        }
      `}</style>

      {/* NAVBAR */}
      <nav className="navbar">
        <Link href="/" className="logo-link">
          <span className="soy-text">Soy</span>
          <div className="line-wrapper"><span className="line-text">Line</span><svg className="line-swosh" viewBox="0 0 100 20" fill="none"><path d="M0 15 Q 50 0 100 12" stroke="#d4af37" strokeWidth="3" strokeLinecap="round" /></svg></div>
        </Link>
        
      </nav>

      {/* HERO SECTION */}
      <section className="hero-section">
          <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{duration:0.8}} style={{display:'flex', flexDirection:'column', alignItems:'center'}}>
            <div className="coming-soon-badge">DİJİTAL ATÇILIK PLATFORMU</div>
            <h1 className="hero-title">
                Geleceğin Şampiyonunu <br/> <span className="hero-subtitle">Bugünden Keşfet</span>
            </h1>
          </motion.div>

          {/* SLIDER WRAPPER - DÜZELTİLEN KISIM */}
          <div className="slider-wrapper">
            <div className="slider-text">
                <AnimatePresence mode='wait'>
                    <motion.div key={activeTab} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                        <h2 style={{color: features[activeTab].color}}>{features[activeTab].title}</h2>
                        <p>{features[activeTab].desc}</p>
                    </motion.div>
                </AnimatePresence>
                <div className="slider-nav">
                    <button onClick={() => setActiveTab((prev) => (prev === 0 ? features.length - 1 : prev - 1))} className="nav-btn"><TbChevronLeft size={24}/></button>
                    <button onClick={() => setActiveTab((prev) => (prev + 1) % features.length)} className="nav-btn"><TbChevronRight size={24}/></button>
                </div>
            </div>
            <div className="slider-visual" style={{ color: features[activeTab].color }}>
                {features[activeTab].icon}
            </div>
          </div>
      </section>

      {/* LANSMAN */}
      <section className="launch-bar">
          <div style={{color:'var(--accent)', letterSpacing:'2px', fontWeight:'bold', marginBottom:'10px'}}>LANSMAN FIRSATI</div>
          <h3 className="launch-title">Kurucu Üye Ol, <span style={{color:'var(--accent)', fontStyle:'italic'}}>Sınırları Kaldır</span></h3>
          <p style={{color:'#94a3b8', maxWidth:'600px', marginTop:'10px'}}>İlk 100 eküri arasına katılın, ömür boyu ücretsiz analiz hakkı kazanın.</p>
          {!submitted ? (
            <form className="mail-input-group" onSubmit={handleSubscribe}>
              <input type="email" placeholder="E-posta adresiniz" className="mail-input" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <button type="submit" className="submit-btn">KAYDOL <TbArrowRight /></button>
            </form>
          ) : ( <div style={{marginTop:'20px', color:'#10b981', fontWeight:'bold', fontSize:'1.2rem'}}>✓ Kayıt Başarılı!</div> )}
      </section>

      {/* TOOLS */}
      <section className="tools-section">
          <div className="section-title">Profesyonel Pedigri Araçları</div>
          
          <motion.div className="pedigree-box" initial={{opacity:0, y:30}} whileInView={{opacity:1, y:0}} viewport={{once:true}}>
              <div className="pb-title"><TbSearch color="var(--accent)" size={32}/> Hızlı Pedigri Görüntüle</div>
              <p className="pb-desc">Veritabanımızdaki atı bulun, soy ağacını ve inbreeding katsayılarını inceleyin.</p>
              <div className="search-row" ref={searchRef}>
                  <div className="input-group">
                      <TbSearch className="search-icon" />
                      <input type="text" className="p-input" placeholder="At ismi..." value={searchInput} onChange={(e) => { setSearchInput(e.target.value); if(!e.target.value) setSelectedHorse(null); }} onFocus={() => { if(searchResults.length>0) setShowDropdown(true); }} />
                      <AnimatePresence>{showDropdown && searchResults.length > 0 && (<motion.div className="p-dropdown custom-scrollbar" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>{searchResults.map(h => (<div key={h.id} className="p-item" onClick={() => { setSearchInput(h.ad); setSelectedHorse(h); setShowDropdown(false); }}><span>{h.ad}</span><span style={{fontSize:'0.8rem', opacity:0.7}}>{h.baba}</span></div>))}</motion.div>)}</AnimatePresence>
                  </div>
                  <div className="gen-options">{[3,5,7].map(g=><button key={g} className={`gen-btn ${generation===g?'active':''}`} onClick={()=>setGeneration(g)}>{g} Kuşak</button>)}</div>
                  <button className="go-btn" onClick={handlePedigreeSearch}>İNCELE <TbArrowRight/></button>
              </div>
          </motion.div>

          <motion.div className="pedigree-box" initial={{opacity:0, y:30}} whileInView={{opacity:1, y:0}} viewport={{once:true}}>
              <div className="pb-title"><TbDna color="var(--accent)" size={32}/> Muhtemel Tay Oluştur</div>
              <p className="pb-desc">Aygır ve Kısrak seçerek doğacak tayın sanal genetiğini analiz edin.</p>
              <div className="search-row">
                  <div className="input-group" ref={sireRef}>
                      <TbGenderMale className="search-icon" style={{color:'#3b82f6'}} />
                      <input type="text" className="p-input" placeholder="Baba (Aygır)..." value={sireInput} onChange={(e) => { setSireInput(e.target.value); if(!e.target.value) setSelectedSire(null); }} onFocus={() => { if(sireResults.length>0) setShowSireDropdown(true); }} />
                      <AnimatePresence>{showSireDropdown && sireResults.length > 0 && (<motion.div className="p-dropdown custom-scrollbar" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>{sireResults.map(h=>(<div key={h.aygir_id} className="p-item" onClick={()=>{setSireInput(h.aygir_adi); setSelectedSire(h); setShowSireDropdown(false);}}>{h.aygir_adi}</div>))}</motion.div>)}</AnimatePresence>
                  </div>
                  <div className="input-group" ref={damRef}>
                      <TbGenderFemale className="search-icon" style={{color:'#ec4899'}} />
                      <input type="text" className="p-input" placeholder="Anne (Kısrak)..." value={damInput} onChange={(e) => { setDamInput(e.target.value); if(!e.target.value) setSelectedDam(null); }} onFocus={() => { if(damResults.length>0) setShowDamDropdown(true); }} />
                      <AnimatePresence>{showDamDropdown && damResults.length > 0 && (<motion.div className="p-dropdown custom-scrollbar" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>{damResults.map(h=>(<div key={h.kisrak_id} className="p-item" onClick={()=>{setDamInput(h.ad); setSelectedDam(h); setShowDamDropdown(false);}}>{h.ad}</div>))}</motion.div>)}</AnimatePresence>
                  </div>
                  <div className="gen-options">{[3,5,7].map(g=><button key={g} className={`gen-btn ${foalGen===g?'active':''}`} onClick={()=>setFoalGen(g)}>{g} Kuşak</button>)}</div>
                  <button className="go-btn" onClick={handleFoalSearch}>OLUŞTUR <TbDna/></button>
              </div>
          </motion.div>
      </section>

      <footer style={{textAlign:'center', padding:'40px', color:'#64748b', fontSize:'0.8rem', background:'#020617'}}>
        <p>&copy; 2026 SoyLine Teknoloji. Tüm Hakları Saklıdır.</p>
      </footer>
    </>
  );
}