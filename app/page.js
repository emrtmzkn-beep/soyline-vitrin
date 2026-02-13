'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; 
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { 
  TbDna, TbHome, TbArrowRight, TbChevronRight, TbChevronLeft,
  TbHorse, TbEye, TbSend, TbTrophy,
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
    color: "#d4af37", // Altın rengiyle uyumlu
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

  // --- STATE'LER: HIZLI PEDİGRİ ---
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedHorse, setSelectedHorse] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [generation, setGeneration] = useState(5);
  const searchRef = useRef(null);

  // --- STATE'LER: MUHTEMEL TAY ---
  const [sireInput, setSireInput] = useState('');
  const [damInput, setDamInput] = useState('');
  const [sireResults, setSireResults] = useState([]);
  const [damResults, setDamResults] = useState([]);
  const [selectedSire, setSelectedSire] = useState(null);
  const [selectedDam, setSelectedDam] = useState(null);
  const [showSireDropdown, setShowSireDropdown] = useState(false);
  const [showDamDropdown, setShowDamDropdown] = useState(false);
  const [foalGen, setFoalGen] = useState(5);
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

  // --- ARAMA FONKSİYONLARI ---
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchInput.length > 2) {
        const { data, error } = await supabase
          .from('tum_atlar')
          .select('id, ad, baba:baba_id(ad), anne:anne_id(ad)')
          .ilike('ad', `%${searchInput}%`)
          .limit(5);
        if (!error && data) {
          setSearchResults(data.map(d => ({...d, baba: d.baba?.ad, anne: d.anne?.ad})));
          setShowDropdown(true);
        }
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

  const handlePedigreeSearch = () => {
    if (selectedHorse) router.push(`/pedigri?id=${selectedHorse.id}&gen=${generation}`);
    else alert("Lütfen listeden bir at seçiniz.");
  };

  const handleFoalSearch = () => {
    if (selectedSire && selectedDam) router.push(`/muhtemel-pedigri?sire_id=${selectedSire.aygir_id}&dam_id=${selectedDam.kisrak_id}&gen=${foalGen}`);
    else alert("Lütfen hem Baba hem de Anne seçiniz.");
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    if(email) { setSubmitted(true); }
  };

  return (
    <>
      <style jsx global>{`
        :root { --bg-dark: #020617; --text-main: #f8fafc; --accent: #d4af37; --accent-glow: rgba(212, 175, 55, 0.4); }
        body { background: var(--bg-dark); color: var(--text-main); margin:0; font-family: 'Inter', sans-serif; overflow-x: hidden; }
        
        /* NAVBAR */
        .navbar { display: flex; align-items: center; justify-content: space-between; padding: 15px 40px; background: rgba(2, 6, 23, 0.8); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255,255,255,0.05); height: 80px; position: fixed; top: 0; width: 100%; z-index: 100; box-sizing: border-box; }
        .logo-link { text-decoration: none; display: flex; align-items: center; font-family: 'Playfair Display', serif; font-weight: 700; font-size: 1.8rem; line-height: 1; letter-spacing: -0.5px; }
        .soy-text { color: #ffffff; }
        .line-wrapper { position: relative; display: flex; flex-direction: column; }
        .line-text { color: var(--accent); }
        .line-swosh { position: absolute; bottom: -8px; left: -10%; width: 120%; height: auto; pointer-events: none; }
        .nav-links { display: flex; gap: 30px; }
        .nav-item { color: #cbd5e1; text-decoration: none; font-size: 0.9rem; transition:0.3s; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
        .nav-item:hover { color: var(--accent); }

        /* HERO & SLIDER */
        .hero-section {
            padding-top: 140px; 
            padding-bottom: 80px;
            background: radial-gradient(circle at top center, #1e293b 0%, #020617 80%);
            text-align: center;
            min-height: 90vh;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
        }
        .coming-soon-badge {
            background: rgba(212, 175, 55, 0.1); color: var(--accent);
            padding: 8px 24px; border-radius: 100px; font-weight: 600; letter-spacing: 3px; font-size: 0.8rem;
            margin-bottom: 30px; border: 1px solid rgba(212, 175, 55, 0.3);
            box-shadow: 0 0 15px rgba(212, 175, 55, 0.1);
        }
        
        .hero-title { font-size: clamp(2.5rem, 6vw, 4.5rem); margin: 0; font-family: 'Playfair Display', serif; line-height: 1.2; }
        .hero-subtitle { color: var(--accent); font-style: italic; font-weight: 400; }

        .slider-wrapper {
            max-width: 1000px; width: 90%; margin-top: 50px;
            display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 50px; align-items: center;
            background: rgba(255, 255, 255, 0.03); 
            border: 1px solid rgba(255, 255, 255, 0.05);
            padding: 50px; border-radius: 30px; 
            backdrop-filter: blur(20px);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
        .slider-text { text-align: left; }
        .slider-text h2 { font-size: 2rem; font-family: 'Playfair Display', serif; margin: 0 0 15px 0; color: #fff; }
        .slider-text p { color: #94a3b8; line-height: 1.7; font-size: 1.05rem; }
        .slider-visual { font-size: 9rem; display: flex; justify-content: center; align-items: center; filter: drop-shadow(0 0 20px rgba(212, 175, 55, 0.2)); }
        .slider-nav { display: flex; gap: 15px; margin-top: 30px; }
        .nav-btn { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 12px; border-radius: 50%; cursor: pointer; transition: 0.3s; display: flex; align-items: center; justify-content: center; }
        .nav-btn:hover { background: var(--accent); color: #000; border-color: var(--accent); transform: scale(1.1); }

        /* LANSMAN BAR */
        .launch-bar {
            width: 100%; padding: 80px 20px; 
            background: linear-gradient(180deg, #0f172a 0%, #020617 100%);
            border-top: 1px solid #1e293b; border-bottom: 1px solid #1e293b;
            text-align: center; display: flex; flex-direction: column; align-items: center;
            position: relative;
        }
        .launch-icon { display: flex; alignItems: center; gap: 10px; color: #94a3b8; margin-bottom: 20px; font-size: 0.9rem; letter-spacing: 2px; text-transform: uppercase; }
        .launch-title { font-size: 2.2rem; margin: 0; font-family: 'Playfair Display', serif; }
        .mail-input-group { display: flex; gap: 10px; margin-top: 30px; width: 100%; max-width: 500px; }
        .mail-input { flex: 1; background: rgba(0,0,0,0.3); border: 1px solid #334155; padding: 18px 25px; border-radius: 12px; color: white; outline: none; font-size: 1rem; transition: 0.3s; }
        .mail-input:focus { border-color: var(--accent); box-shadow: 0 0 15px rgba(212, 175, 55, 0.2); }
        .submit-btn { background: linear-gradient(135deg, var(--accent) 0%, #b45309 100%); color: #fff; border: none; padding: 0 30px; border-radius: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 10px; font-size: 0.9rem; transition: 0.3s; text-shadow: 0 1px 2px rgba(0,0,0,0.3); }
        .submit-btn:hover { transform: translateY(-3px); box-shadow: 0 10px 25px rgba(212, 175, 55, 0.4); }

        /* TOOLS SECTION (KARTLAR) */
        .tools-section { padding: 100px 20px; background: #020617; display: flex; flex-direction: column; align-items: center; gap: 60px; }
        .section-header { text-align: center; max-width: 700px; }
        .section-title { font-size: 2.5rem; color: #fff; font-family: 'Playfair Display', serif; margin-bottom: 15px; }
        .section-desc { color: #64748b; font-size: 1.1rem; }
        
        .pedigree-box {
            background: rgba(30, 41, 59, 0.4); /* Glassmorphism */
            border: 1px solid rgba(255, 255, 255, 0.05);
            /* İSTENİLEN ALTIN ÇİZGİ */
            border-top: 4px solid var(--accent); 
            padding: 50px; border-radius: 20px;
            max-width: 900px; width: 100%; 
            box-shadow: 0 20px 50px rgba(0,0,0,0.4);
            position: relative; backdrop-filter: blur(10px);
            transition: 0.3s;
        }
        .pedigree-box:hover { transform: translateY(-5px); box-shadow: 0 30px 60px rgba(0,0,0,0.5); }

        .pb-title { color: #fff; font-size: 1.6rem; margin: 0 0 15px 0; font-family: 'Playfair Display', serif; display: flex; align-items: center; gap: 15px; }
        .pb-desc { color: #94a3b8; margin-bottom: 35px; font-size: 1rem; line-height: 1.6; max-width: 600px; }
        
        .search-row { display: flex; gap: 20px; flex-wrap: wrap; align-items: flex-start; }
        .input-group { flex: 1; min-width: 280px; position: relative; }
        .search-icon { position: absolute; left: 20px; top: 50%; transform: translateY(-50%); font-size: 1.4rem; color: #64748b; transition: 0.3s; }
        
        /* INPUT STİLİ GÜZELLEŞTİRİLDİ */
        .p-input { 
            width: 100%; padding: 18px 20px 18px 55px; 
            background: #0f172a; border: 1px solid #334155; 
            border-radius: 12px; color: #fff; font-size: 1.05rem; 
            outline: none; transition: 0.3s; box-sizing: border-box; 
        }
        .p-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.15); background: #1e293b; }
        .p-input:focus + .search-icon { color: var(--accent); }
        
        /* DROPDOWN */
        .p-dropdown { 
            position: absolute; top: 115%; left: 0; width: 100%; 
            background: #1e293b; border: 1px solid #475569; border-radius: 12px; 
            max-height: 280px; overflow-y: auto; z-index: 50; 
            box-shadow: 0 20px 40px rgba(0,0,0,0.6); 
        }
        .p-item { padding: 15px 20px; border-bottom: 1px solid rgba(255,255,255,0.05); cursor: pointer; transition: 0.2s; color: #cbd5e1; display: flex; justify-content: space-between; align-items: center; }
        .p-item:hover { background: rgba(212, 175, 55, 0.1); color: var(--accent); padding-left: 25px; }
        .pi-info { font-size: 0.85rem; color: #64748b; }

        /* KUŞAK BUTONLARI */
        .gen-options { display: flex; gap: 8px; background: #0f172a; padding: 6px; border-radius: 12px; border: 1px solid #334155; height: 56px; align-items: center; box-sizing: border-box; }
        .gen-btn { 
            background: transparent; border: none; color: #64748b; 
            padding: 0 20px; height: 100%; border-radius: 8px; 
            cursor: pointer; font-weight: 600; transition: 0.3s; white-space: nowrap; font-size: 0.9rem;
        }
        .gen-btn.active { background: #334155; color: #fff; box-shadow: 0 2px 10px rgba(0,0,0,0.2); }
        .gen-btn:hover:not(.active) { color: #fff; background: rgba(255,255,255,0.05); }

        /* ANA BUTON (GO) */
        .go-btn { 
            background: linear-gradient(135deg, var(--accent) 0%, #b45309 100%); 
            color: #fff; border: none; padding: 0 40px; height: 56px; 
            border-radius: 12px; font-weight: 700; cursor: pointer; 
            display: flex; align-items: center; gap: 10px; transition: 0.3s; 
            white-space: nowrap; font-size: 1rem; text-transform: uppercase; letter-spacing: 1px;
            text-shadow: 0 1px 2px rgba(0,0,0,0.2);
        }
        .go-btn:hover { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(212, 175, 55, 0.3); filter: brightness(1.1); }

        @media (max-width: 900px) {
            .slider-wrapper { grid-template-columns: 1fr; text-align: center; padding: 30px; }
            .slider-text { text-align: center; }
            .slider-nav { justify-content: center; }
            .mail-input-group { flex-direction: column; }
            .submit-btn { padding: 15px; justify-content: center; }
            .nav-links { display: none; }
            .search-row { flex-direction: column; }
            .gen-options { width: 100%; }
            .gen-btn { flex: 1; }
            .go-btn { width: 100%; justify-content: center; }
        }
      `}</style>

      {/* 1. NAVBAR (LOGO) */}
      <nav className="navbar">
        <Link href="/" className="logo-link">
          <span className="soy-text">Soy</span>
          <div className="line-wrapper">
            <span className="line-text">Line</span>
            <svg className="line-swosh" viewBox="0 0 100 20" fill="none"><path d="M0 15 Q 50 0 100 12" stroke="#d4af37" strokeWidth="3" strokeLinecap="round" /></svg>
          </div>
        </Link>
        <div className="nav-links">
            <Link href="#" className="nav-item">Özellikler</Link>
            <Link href="#" className="nav-item">Aygır Vitrini</Link>
            <Link href="#" className="nav-item">İletişim</Link>
        </div>
      </nav>

      {/* 2. HERO SECTION & SLIDER */}
      <section className="hero-section">
          <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{duration:0.8}}>
            <div className="coming-soon-badge">DİJİTAL ATÇILIK PLATFORMU</div>
            <h1 className="hero-title">
                Geleceğin Şampiyonunu <br/> <span className="hero-subtitle">Bugünden Keşfet</span>
            </h1>
          </motion.div>

          <div className="slider-wrapper">
            <div className="text-side">
                <AnimatePresence mode='wait'>
                    <motion.div key={activeTab} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                        <h2 style={{color: features[activeTab].color}}>{features[activeTab].title}</h2>
                        <p>{features[activeTab].desc}</p>
                    </motion.div>
                </AnimatePresence>
                <div className="slider-nav">
                    <button onClick={() => setActiveTab((prev) => (prev === 0 ? features.length - 1 : prev - 1))} className="nav-btn"><TbChevronLeft size={20}/></button>
                    <button onClick={() => setActiveTab((prev) => (prev + 1) % features.length)} className="nav-btn"><TbChevronRight size={20}/></button>
                </div>
            </div>
            <div className="visual-side" style={{ color: features[activeTab].color }}>
                {features[activeTab].icon}
            </div>
          </div>
      </section>

      {/* 3. LANSMAN (SUBSCRIPTION) */}
      <section className="launch-bar">
          <div className="launch-icon">
              <TbTrophy color="var(--accent)" size={24} /> LANSMAN FIRSATI
          </div>
          <h3 className="launch-title">Kurucu Üye Ol, <span style={{color:'var(--accent)', fontStyle:'italic'}}>Sınırları Kaldır</span></h3>
          <p style={{color:'#64748b', maxWidth:'600px', marginTop:'15px'}}>İlk 100 eküri arasına katılın, ömür boyu ücretsiz analiz hakkı ve SoyLine Elite statüsü kazanın.</p>
          
          {!submitted ? (
            <form className="mail-input-group" onSubmit={handleSubscribe}>
              <input type="email" placeholder="E-posta adresiniz" className="mail-input" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <button type="submit" className="submit-btn">KAYDOL <TbArrowRight /></button>
            </form>
          ) : (
            <div style={{marginTop:'20px', color:'#10b981', fontWeight:'bold', fontSize:'1.2rem'}}>✓ Kaydınız başarıyla alındı!</div>
          )}
      </section>

      {/* 4. TOOLS SECTION */}
      <section className="tools-section">
          <div className="section-header">
              <div className="section-title">Profesyonel Pedigri Araçları</div>
              <p className="section-desc">Veritabanımızdaki 300.000+ at verisi ve yapay zeka destekli algoritmalarımızla eşleşmelerinizi şansa bırakmayın.</p>
          </div>

          {/* TEK AT ARAMA */}
          <motion.div className="pedigree-box" initial={{opacity:0, y:30}} whileInView={{opacity:1, y:0}} viewport={{once:true}}>
              <div className="pb-title"><TbSearch color="var(--accent)" size={28}/> Hızlı Pedigri Görüntüle</div>
              <p className="pb-desc">Veritabanımızdaki herhangi bir atı arayın, soy ağacını ve inbreeding (akrabalık) katsayılarını anında görüntüleyin.</p>
              
              <div className="search-row" ref={searchRef}>
                  <div className="input-group">
                      <TbSearch className="search-icon" />
                      <input type="text" className="p-input" placeholder="At ismi yazın..." value={searchInput} onChange={(e) => { setSearchInput(e.target.value); if(!e.target.value) setSelectedHorse(null); }} onFocus={() => { if(searchResults.length>0) setShowDropdown(true); }} />
                      <AnimatePresence>
                        {showDropdown && searchResults.length > 0 && (
                            <motion.div className="p-dropdown custom-scrollbar" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:10}}>
                                {searchResults.map(h => ( 
                                    <div key={h.id} className="p-item" onClick={() => { setSearchInput(h.ad); setSelectedHorse(h); setShowDropdown(false); }}>
                                        <div style={{fontWeight:'bold', display:'flex', alignItems:'center', gap:'10px'}}><TbHorseToy color="var(--accent)"/> {h.ad}</div>
                                        <span className="pi-info">{h.baba}</span>
                                    </div> 
                                ))}
                            </motion.div>
                        )}
                      </AnimatePresence>
                  </div>
                  <div className="gen-options">
                      {[3,5,7].map(g=>(
                          <button key={g} className={`gen-btn ${generation===g?'active':''}`} onClick={()=>setGeneration(g)}>
                              {g} Kuşak {/* BURASI DÜZELTİLDİ: 3K yerine 3 Kuşak */}
                          </button>
                      ))}
                  </div>
                  <button className="go-btn" onClick={handlePedigreeSearch}>İNCELE <TbArrowRight/></button>
              </div>
          </motion.div>

          {/* MUHTEMEL TAY */}
          <motion.div className="pedigree-box" initial={{opacity:0, y:30}} whileInView={{opacity:1, y:0}} viewport={{once:true}}>
              <div className="pb-title"><TbDna color="var(--accent)" size={28}/> Muhtemel Tay Oluştur</div>
              <p className="pb-desc">Aygır ve Kısrak seçimi yaparak doğacak tayın sanal genetiğini analiz edin. Eşleşme uyumunu önceden görün.</p>

              <div className="search-row">
                  <div className="input-group" ref={sireRef}>
                      <TbGenderMale className="search-icon" style={{color:'#3b82f6'}} />
                      <input type="text" className="p-input" placeholder="Baba (Aygır) Seç..." value={sireInput} onChange={(e) => { setSireInput(e.target.value); if(!e.target.value) setSelectedSire(null); }} onFocus={() => { if(sireResults.length>0) setShowSireDropdown(true); }} />
                      <AnimatePresence>{showSireDropdown && sireResults.length > 0 && (<motion.div className="p-dropdown custom-scrollbar" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:10}}>{sireResults.map(h=>(<div key={h.aygir_id} className="p-item" onClick={()=>{setSireInput(h.aygir_adi); setSelectedSire(h); setShowSireDropdown(false);}}><span style={{fontWeight:'bold'}}>{h.aygir_adi}</span></div>))}</motion.div>)}</AnimatePresence>
                  </div>
                  <div className="input-group" ref={damRef}>
                      <TbGenderFemale className="search-icon" style={{color:'#ec4899'}} />
                      <input type="text" className="p-input" placeholder="Anne (Kısrak) Seç..." value={damInput} onChange={(e) => { setDamInput(e.target.value); if(!e.target.value) setSelectedDam(null); }} onFocus={() => { if(damResults.length>0) setShowDamDropdown(true); }} />
                      <AnimatePresence>{showDamDropdown && damResults.length > 0 && (<motion.div className="p-dropdown custom-scrollbar" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:10}}>{damResults.map(h=>(<div key={h.kisrak_id} className="p-item" onClick={()=>{setDamInput(h.ad); setSelectedDam(h); setShowDamDropdown(false);}}><span style={{fontWeight:'bold'}}>{h.ad}</span></div>))}</motion.div>)}</AnimatePresence>
                  </div>
                  <div className="gen-options">
                      {[3,5,7].map(g=>(
                          <button key={g} className={`gen-btn ${foalGen===g?'active':''}`} onClick={()=>setFoalGen(g)}>
                              {g} Kuşak {/* BURASI DÜZELTİLDİ */}
                          </button>
                      ))}
                  </div>
                  <button className="go-btn" onClick={handleFoalSearch}>OLUŞTUR <TbDna/></button>
              </div>
          </motion.div>
      </section>

      {/* FOOTER */}
      <footer style={{textAlign:'center', padding:'40px', borderTop:'1px solid #1e293b', color:'#64748b', fontSize:'0.8rem', background:'#020617'}}>
        <p>&copy; 2026 SoyLine Teknoloji. Tüm Hakları Saklıdır.</p>
      </footer>
    </>
  );
}