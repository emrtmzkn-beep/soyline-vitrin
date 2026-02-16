'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; 
import { createClient } from '@supabase/supabase-js'; 
import { motion, AnimatePresence } from 'framer-motion'; 
import { TbArrowRight, TbChevronRight, TbChevronLeft, TbSearch, TbHorseToy, TbGenderMale, TbGenderFemale, TbDna } from 'react-icons/tb';

// --- SUPABASE BAĞLANTISI ---
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function searchAllHorsesByName(term, limit = 6) {
    const sources = [
        { table: 'tum_atlar', nameCol: 'ad', select: 'id, ad, baba, anne' },
        { table: 'tum_atlar', nameCol: 'at_adi', select: 'id, at_adi, baba, anne' },
        { table: 'tum_atlar', nameCol: 'ad', select: 'id, ad, baba_id, anne_id' },
        { table: 'tum_atlar', nameCol: 'at_adi', select: 'id, at_adi, baba_id, anne_id' },
        { table: 'tum_at', nameCol: 'ad', select: 'id, ad, baba, anne' },
        { table: 'tum_at', nameCol: 'at_adi', select: 'id, at_adi, baba, anne' },
        { table: 'tum_at', nameCol: 'ad', select: 'id, ad, baba_id, anne_id' },
        { table: 'tum_at', nameCol: 'at_adi', select: 'id, at_adi, baba_id, anne_id' },
    ];

    const fetchHorseNameById = async (horseId) => {
        if (!horseId) return null;

        const lookups = [
            { table: 'tum_atlar', col: 'ad' },
            { table: 'tum_atlar', col: 'at_adi' },
            { table: 'tum_at', col: 'ad' },
            { table: 'tum_at', col: 'at_adi' },
        ];

        for (const lookup of lookups) {
            const { data, error } = await supabase
                .from(lookup.table)
                .select(`id, ${lookup.col}`)
                .eq('id', horseId)
                .single();

            if (!error && data) {
                return data.ad || data.at_adi || null;
            }
        }

        return null;
    };

    for (const source of sources) {
        const { data, error } = await supabase
            .from(source.table)
            .select(source.select)
            .ilike(source.nameCol, `%${term}%`)
            .limit(limit);

        if (!error) {
            const formatted = await Promise.all((data || []).map(async (item) => {
                const babaDirect = typeof item.baba === 'string' ? item.baba : null;
                const anneDirect = typeof item.anne === 'string' ? item.anne : null;
                const baba = babaDirect || await fetchHorseNameById(item.baba_id);
                const anne = anneDirect || await fetchHorseNameById(item.anne_id);

                return {
                    id: item.id,
                    ad: item.ad || item.at_adi,
                    baba,
                    anne,
                };
            }));

            return formatted;
        }
    }

    return [];
}

// --- SLIDER VERİSİ ---
const features = [
  { id: 0, key: 'genetik', title: "SoyLine AI™ Eşleşme Analizi", desc: "9 nesil geriye dönük Impact Analysis ve genetik algoritma ile şampiyon potansiyelini keşfedin.", color: "#10b981", image: "/assets/slider/slayt1_1.png", bgPattern: "radial-gradient(circle at center, rgba(16, 185, 129, 0.15) 0%, transparent 60%)" },
  { id: 1, key: 'yonetim', title: "Dijital Haranızı Yönetin", desc: "Aşı takvimi, nalbant randevuları, personel maaşları ve idman raporları tek ekranda.", color: "#3b82f6", image: "/assets/slider/slayt2_1.png", bgPattern: "radial-gradient(circle at center, rgba(59, 130, 246, 0.15) 0%, transparent 60%)" },
  { id: 2, key: 'damizlik', title: "Profesyonel Aygır Yönetimi", desc: "Aşım performansı, rezervasyon takibi ve tayların saha başarılarının anlık analizi.", color: "#fedc00", image: "/assets/slider/slayt3_1.png", bgPattern: "radial-gradient(circle at center, rgba(254, 220, 0, 0.15) 0%, transparent 60%)" },
  { id: 3, key: 'biyomekanik', title: "Yapay Zeka Konformasyon", desc: "Fotoğraftan vücut açıları ve sakatlık risk analizi ile doğru kararlar verin.", color: "#8b5cf6", image: "/assets/slider/slayt4_1.png", bgPattern: "radial-gradient(circle at center, rgba(139, 92, 246, 0.15) 0%, transparent 60%)" },
  { id: 4, key: 'fiziksel', title: "Fenotip & Eşkal Uyumu", desc: "Sadece kağıt üstünde değil, fiziksel özelliklerin yavruya aktarımını dengeleyin.", color: "#ec4899", image: "/assets/slider/slayt5_1.png", bgPattern: "radial-gradient(circle at center, rgba(236, 72, 153, 0.15) 0%, transparent 60%)" },
  { id: 5, key: 'ticaret', title: "Premium At Pazaryeri", desc: "Veteriner raporlu ve pedigri onaylı seçkin taylar ve damızlıklar.", color: "#f97316", image: "/assets/slider/slayt6_1.png", bgPattern: "radial-gradient(circle at center, rgba(249, 115, 22, 0.15) 0%, transparent 60%)" }
];

export default function Home() {
  const [activeTab, setActiveTab] = useState(0);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const goldColor = '#fedc00';
  const router = useRouter();

  // --- 1. TEK AT PEDİGRİ STATE'LERİ ---
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedHorse, setSelectedHorse] = useState(null);
  const [generation, setGeneration] = useState(5);
  const searchRef = useRef(null);

  // --- 2. MUHTEMEL TAY STATE'LERİ ---
  const [sireInput, setSireInput] = useState("");
  const [damInput, setDamInput] = useState("");
  const [sireResults, setSireResults] = useState([]);
  const [damResults, setDamResults] = useState([]);
  const [showSireDropdown, setShowSireDropdown] = useState(false);
  const [showDamDropdown, setShowDamDropdown] = useState(false);
  const [selectedSire, setSelectedSire] = useState(null);
  const [selectedDam, setSelectedDam] = useState(null);
  const [foalGen, setFoalGen] = useState(5);
  
  const sireRef = useRef(null);
  const damRef = useRef(null);

  // Slider Timer
  useEffect(() => {
    const timer = setInterval(() => setActiveTab((prev) => (prev + 1) % features.length), 7000);
    return () => clearInterval(timer);
  }, []);

  // --- 1. GENEL AT ARAMA (tum_atlar) ---
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
        if (searchInput.length < 2) {
            setSearchResults([]);
            setShowDropdown(false);
            return;
        }
        // Eğer zaten seçiliyse tekrar arama yapma
        if (selectedHorse && selectedHorse.ad === searchInput) return;

        const data = await searchAllHorsesByName(searchInput, 6);

        if (data.length > 0) {
            setSearchResults(data);
            setShowDropdown(true);
        } else {
            setSearchResults([]);
            setShowDropdown(false);
        }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchInput]);

  // --- 2. AYGIR ARAMA (aygir tablosu) ---
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
        if (sireInput.length < 2) {
            setSireResults([]);
            setShowSireDropdown(false);
            return;
        }
        if (selectedSire && selectedSire.aygir_adi === sireInput) return;

        const { data } = await supabase
            .from('aygir')
            .select('aygir_id, aygir_adi, baba')
            .ilike('aygir_adi', `%${sireInput}%`)
            .limit(6);
        
        if (data) {
            setSireResults(data);
            setShowSireDropdown(true);
        }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [sireInput]);

  // --- 3. KISRAK ARAMA (kisrak tablosu) ---
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
        if (damInput.length < 2) {
            setDamResults([]);
            setShowDamDropdown(false);
            return;
        }
        if (selectedDam && selectedDam.ad === damInput) return;

        const { data } = await supabase
            .from('kisrak')
            .select('kisrak_id, ad, baba') 
            .ilike('ad', `%${damInput}%`)
            .limit(6);
        
        if (data) {
            setDamResults(data);
            setShowDamDropdown(true);
        }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [damInput]);


  // Click Outside (Dropdown kapatma)
  useEffect(() => {
      const handleClickOutside = (e) => {
          if (searchRef.current && !searchRef.current.contains(e.target)) setShowDropdown(false);
          if (sireRef.current && !sireRef.current.contains(e.target)) setShowSireDropdown(false);
          if (damRef.current && !damRef.current.contains(e.target)) setShowDamDropdown(false);
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- YÖNLENDİRMELER ---
  const handlePedigreeSearch = () => {
      if (!selectedHorse) return alert("Lütfen listeden bir at seçiniz.");
      router.push(`/pedigri?id=${selectedHorse.id}&gen=${generation}`);
  };

  const handleFoalSearch = () => {
      if (!selectedSire || !selectedDam) return alert("Lütfen hem Baba hem Anne seçiniz.");
      router.push(`/pedigri/muhtemel?sire_id=${selectedSire.aygir_id}&dam_id=${selectedDam.kisrak_id}&gen=${foalGen}`);
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    if(email) setSubmitted(true);
  };

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&display=swap');
        :root { --bg-dark: #020617; --text-main: #fff; --gold: #fedc00; }
        body { background: var(--bg-dark); color: var(--text-main); margin:0; font-family: 'Poppins', sans-serif; overflow-x: hidden; }
        
        /* NAVBAR */
        .navbar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 15px 40px; background: rgba(2, 6, 23, 0.85); backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255,255,255,0.05); height: 80px;
          position: fixed; top: 0; width: 100%; z-index: 100; box-sizing: border-box;
        }
        .logo-link {
          text-decoration: none; display: flex; align-items: center;
          font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 1.8rem;
          line-height: 1; letter-spacing: -0.5px;
        }
        .soy-text { color: #ffffff; }
        .line-wrapper { position: relative; display: flex; flex-direction: column; }
        .line-text { color: var(--gold); }
        .line-swosh {
          position: absolute; bottom: -6px; left: -5%; width: 110%; height: auto;
          pointer-events: none;
        }
        .nav-links { display: flex; gap: 30px; }
        .nav-links a {
          color: #cbd5e1; text-decoration: none; font-weight: 500; font-size: 0.95rem; transition: 0.2s;
        }
        .nav-links a:hover { color: var(--gold); }
        .btn-login { color: #fff; text-decoration: none; padding: 8px 20px; font-weight: 600; transition: 0.2s; }
        .btn-outline {
          color: var(--gold); border: 1px solid var(--gold); padding: 8px 24px; border-radius: 50px;
          text-decoration: none; font-weight: 600; transition: 0.2s;
        }
        .btn-outline:hover { background: rgba(254, 220, 0, 0.15); box-shadow: 0 0 15px rgba(254,220,0,0.2); }

        /* HERO */
        .hero { min-height: 620px; height: 90vh; text-align: center; display: flex; flex-direction: column; justify-content: center; align-items: center; position: relative; overflow: hidden; background: #020617; padding: 100px 0 40px; box-sizing: border-box; }
        .hero-video { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0; opacity: 0.55; mix-blend-mode: hard-light; filter: contrast(1.1); }
        .overlay-gradient { position: absolute; inset: 0; background: radial-gradient(circle, transparent 20%, #020617 100%); z-index: 1; }
        .hero-content { position: relative; z-index: 2; max-width: 900px; padding: 0 20px; margin-top: 60px; }
        .hero-title { font-size: clamp(2.2rem, 6vw, 4.5rem); margin-bottom: 20px; line-height: 1.1; font-family: 'Playfair Display', serif; text-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        .hero-desc { font-size: 1.25rem; color: #cbd5e1; margin-bottom: 40px; line-height: 1.6; max-width: 700px; margin-left: auto; margin-right: auto; }
        .hero-btns { display: flex; gap: 20px; justify-content: center; flex-wrap: wrap; }
        .btn-main { background: linear-gradient(135deg, var(--gold), #eab308); color: #000; padding: 16px 45px; border-radius: 50px; font-weight: 800; text-decoration: none; box-shadow: 0 10px 30px rgba(254, 220, 0, 0.3); transition: 0.3s; }
        .btn-main:hover { transform: translateY(-3px); box-shadow: 0 20px 40px rgba(254, 220, 0, 0.5); }
        .btn-hero-outline { color: #fff; border: 1px solid #fff; padding: 16px 45px; border-radius: 50px; text-decoration: none; font-weight: 600; transition: 0.2s; }
        .btn-hero-outline:hover { background: rgba(255,255,255,0.1); }

        /* --- PEDİGRİ ARAMA BÖLÜMÜ --- */
        .pedigree-search-section {
            position: relative; 
            z-index: 50;
            margin-top: -80px; 
            padding-bottom: 80px;
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            gap: 40px; 
            padding: 0 20px;
        }
        
        .pedigree-box {
            background: rgba(15, 23, 42, 0.95); 
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1); 
            border-radius: 24px;
            padding: 40px; 
            width: 100%; 
            max-width: 900px;
            box-shadow: 0 20px 50px rgba(0,0,0,0.5);
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            gap: 20px;
            transition: 0.3s;
            border-top: 4px solid #fedc00;
            position: relative;
        }
        .pedigree-box:hover { border-color: rgba(254, 220, 0, 0.8); }

        /* Dropdown için Z-Index Yönetimi */
        .pedigree-box:first-of-type { z-index: 20; }
        .pedigree-box:last-of-type { z-index: 10; }

        .pb-title { font-family: 'Playfair Display', serif; font-size: 2rem; color: var(--gold); margin: 0; text-align: center; }
        .pb-desc { color: #94a3b8; text-align: center; max-width: 600px; font-size: 0.95rem; margin-bottom: 10px; }
        
        .search-row { display: flex; width: 100%; gap: 15px; position: relative; flex-wrap: wrap; justify-content: center; }
        .input-group { flex: 1; position: relative; min-width: 220px; }
        
        .p-input {
            width: 100%; background: #1e293b; border: 1px solid #334155; color: #fff;
            padding: 18px 20px 18px 50px; border-radius: 12px; font-size: 1.1rem;
            outline: none; transition: 0.3s; box-sizing: border-box;
        }
        .p-input:focus { border-color: var(--gold); box-shadow: 0 0 0 3px rgba(254, 220, 0, 0.1); }
        .search-icon { position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: #64748b; font-size: 1.4rem; }

        /* DROPDOWN STİLİ */
        .p-dropdown {
            position: absolute; 
            top: 100%; 
            left: 0; 
            width: 100%;
            background: #1e293b; 
            border: 1px solid var(--gold); 
            border-radius: 12px;
            margin-top: 8px; 
            max-height: 300px; 
            overflow-y: auto; 
            z-index: 9999;
            box-shadow: 0 10px 40px rgba(0,0,0,0.8);
        }
        .p-item {
            padding: 15px 20px; border-bottom: 1px solid rgba(255,255,255,0.05);
            cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: 0.2s;
        }
        .p-item:hover { background: var(--gold); color: #000; }
        .pi-info { font-size: 0.85rem; opacity: 0.7; max-width: 45%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: right; }

        .gen-options { display: flex; background: #1e293b; padding: 5px; border-radius: 12px; border: 1px solid #334155; height: fit-content; align-self: center;}
        .gen-btn {
            background: transparent; border: none; color: #94a3b8; padding: 12px 18px;
            border-radius: 8px; cursor: pointer; font-weight: 600; transition: 0.3s;
        }
        .gen-btn.active { background: var(--gold); color: #000; box-shadow: 0 2px 10px rgba(254, 220, 0, 0.3); }

        .go-btn {
            background: linear-gradient(135deg, var(--gold), #b45309); color: #000;
            border: none; padding: 18px 40px; border-radius: 12px; font-weight: 800;
            font-size: 1.1rem; cursor: pointer; transition: 0.3s; display: flex; align-items: center; gap: 10px;
            white-space: nowrap; height: 100%; justify-content: center;
        }
        .go-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(212, 175, 55, 0.3); }

        /* LANSMAN BAR */
        .launch-bar {
            width: 100%; padding: 80px 20px; 
            background: linear-gradient(180deg, #0f172a 0%, #020617 100%);
            border-top: 1px solid #1e293b; border-bottom: 1px solid #1e293b;
            text-align: center; display: flex; flex-direction: column; align-items: center; margin-top: 40px;
        }
        .mail-input-group { display: flex; gap: 10px; margin-top: 30px; width: 100%; max-width: 500px; }
        .mail-input { flex: 1; background: rgba(255,255,255,0.05); border: 1px solid #334155; padding: 18px 25px; border-radius: 12px; color: white; outline: none; font-size: 1rem; }
        .mail-input:focus { border-color: var(--gold); }
        .submit-btn { background: var(--gold); color: #000; border: none; padding: 0 35px; border-radius: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 10px; }

        /* SLIDER STYLES */
        .feature-section { padding: 80px 20px 120px 20px; background: #0b1121; position: relative; border-top: 1px solid #1e293b; }
        .slider-container { max-width: 1300px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1.1fr; gap: 80px; align-items: center; min-height: 600px; }
        .text-side { position: relative; z-index: 2; display: flex; flex-direction: column; justify-content: center; }
        .nav-btn { background: transparent; border: 1px solid #334155; color: #94a3b8; width: 50px; height: 50px; border-radius: 50%; display: flex; alignItems: center; justifyContent: center; cursor: pointer; transition: 0.3s; }
        .nav-btn:hover { border-color: var(--gold); color: var(--gold); background: rgba(254, 220, 0, 0.1); }
        .visual-frame { width: 100%; height: 550px; border-radius: 30px; display: flex; alignItems: center; justifyContent: center; position: relative; backdrop-filter: blur(20px); box-shadow: 0 30px 80px rgba(0,0,0,0.6); overflow: hidden; border: 1px solid rgba(255,255,255,0.05); }
        .dots-grid { display: grid; grid-template-columns: repeat(20, 1fr); gap: 20px; opacity: 0.1; width: 140%; height: 140%; position: absolute; top: -20%; left: -20%; z-index: 0; mask-image: radial-gradient(circle, black 30%, transparent 70%); }
        .dot { width: 4px; height: 4px; background: #fff; border-radius: 50%; }
        .main-img { width: 92%; height: 92%; object-fit: cover; border-radius: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.5); z-index: 2; transition: transform 0.7s ease; }
        .main-img:hover { transform: scale(1.02); }

        @media (max-width: 1024px) {
          .slider-container { grid-template-columns: 1fr; text-align: center; gap: 50px; }
          .visual-frame { height: 400px; width: 100%; }
          .hero-title { font-size: 3rem; }
          .pedigree-box { padding: 30px 20px; }
          .search-row { flex-direction: column; }
          .go-btn { width: 100%; }
          .navbar { padding: 15px 20px; }
          .nav-links { display: none; }
        }

                @media (max-width: 768px) {
                    .navbar { height: 72px; padding: 12px 16px; }
                    .logo-link { font-size: 1.5rem; }
                    .hero { min-height: auto; height: auto; padding: 120px 0 60px; }
                    .hero-content { margin-top: 20px; max-width: 100%; padding: 0 16px; }
                    .hero-title { font-size: 2.4rem; }
                    .hero-desc { font-size: 1rem; margin-bottom: 28px; }
                    .hero-btns { flex-direction: column; width: 100%; max-width: 320px; margin: 0 auto; }
                    .btn-main, .btn-hero-outline { width: 100%; padding: 14px 20px; box-sizing: border-box; }

                    .pedigree-search-section { margin-top: -35px; padding: 0 14px 60px; gap: 20px; }
                    .pedigree-box { padding: 20px 16px; border-radius: 16px; }
                    .pb-title { font-size: 1.7rem; }
                    .search-row { gap: 10px; }
                    .input-group { min-width: 0; width: 100%; }
                    .p-input { font-size: 1rem; padding: 14px 14px 14px 42px; }
                    .gen-options { width: 100%; justify-content: center; }
                    .gen-btn { flex: 1; padding: 10px 12px; }
                    .go-btn { width: 100%; padding: 14px 18px; font-size: 1rem; }

                    .mail-input-group { flex-direction: column; max-width: 320px; }
                    .submit-btn { padding: 14px 18px; justify-content: center; }

                    .feature-section { padding: 60px 16px 90px 16px; }
                    .slider-container { gap: 30px; }
                    .text-side h2 { font-size: 2.2rem !important; }
                    .text-side p { font-size: 1rem !important; }
                    .visual-frame { height: 300px; border-radius: 20px; }
                    .nav-btn { width: 42px; height: 42px; }
                }

                @media (max-width: 480px) {
                    .hero-title { font-size: 2rem; }
                    .pb-title { font-size: 1.5rem; }
                    .pb-desc { font-size: 0.9rem; }
                    .p-item { padding: 12px 14px; flex-direction: column; align-items: flex-start; gap: 4px; }
                    .pi-info { max-width: 100%; text-align: left; }
                    .visual-frame { height: 240px; }
                    .text-side h2 { font-size: 1.8rem !important; }
                    .nav-btn { width: 38px; height: 38px; }
                }
      `}</style>

      {/* NAVBAR */}
      <nav className="navbar">
        <Link href="/" className="logo-link">
          <span className="soy-text">Soy</span>
          <div className="line-wrapper">
            <span className="line-text">Line</span>
            <svg className="line-swosh" viewBox="0 0 100 20" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
              <path d="M0 15 Q 50 0 100 12" stroke={goldColor} strokeWidth="3" strokeLinecap="round" />
            </svg>
          </div>
        </Link>
        
      </nav>

      {/* HERO SECTION */}
      <header className="hero">
        <div className="overlay-gradient"></div>
        <video className="hero-video" autoPlay loop muted playsInline>
           <source src="/assets/anime/horserun.mp4" type="video/mp4" />
        </video>
        <div className="hero-content">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: "easeOut" }}>
            <h1 className="hero-title">Şampiyonun Genetiğini<br /><span style={{ color: goldColor }}>Veriyle Keşfet</span></h1>
            <p className="hero-desc">SoyLine; yapay zeka destekli eşleşme analizi, kapsamlı ahır yönetimi ve güvenli ticaret platformu ile atçılıkta şansa yer bırakmaz.</p>
            <div className="hero-btns">
              <Link href="/vitrin" className="btn-main">AYGIRLARI İNCELE</Link>
              <Link href="/analiz" className="btn-hero-outline">HEMEN ANALİZ YAP</Link>
            </div>
          </motion.div>
        </div>
      </header>

      {/* --- PEDİGRİ ARAMA BÖLÜMÜ --- */}
      <section className="pedigree-search-section">
          
          {/* KART 1: HIZLI PEDİGRİ (TEK AT) */}
          <motion.div className="pedigree-box" initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
              <div>
                  <h2 className="pb-title">Hızlı Pedigri Görüntüle</h2>
                  <p className="pb-desc">Veritabanımızdaki herhangi bir atı arayın, soy ağacını detaylı inceleyin. Akrabalıkları (inbreeding) renk kodlarıyla keşfedin.</p>
              </div>
              <div className="search-row" ref={searchRef}>
                  <div className="input-group">
                      <TbSearch className="search-icon" />
                      <input 
                          type="text" className="p-input" placeholder="At ismi yazmaya başlayın..." 
                          value={searchInput} onChange={(e) => { setSearchInput(e.target.value); if(!e.target.value) setSelectedHorse(null); }}
                          onFocus={() => { if(searchResults.length>0) setShowDropdown(true); }}
                      />
                      <AnimatePresence>
                          {showDropdown && searchResults.length > 0 && (
                              <motion.div className="p-dropdown custom-scrollbar" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
                                  {searchResults.map((horse) => (
                                      <div key={horse.id} className="p-item" onClick={() => { setSearchInput(horse.ad); setSelectedHorse(horse); setShowDropdown(false); }}>
                                          <div style={{fontWeight:'bold', display:'flex', alignItems:'center', gap:'8px'}}><TbHorseToy /> {horse.ad}</div>
                                          <div className="pi-info">{horse.baba || '?'} - {horse.anne || '?'}</div>
                                      </div>
                                  ))}
                              </motion.div>
                          )}
                      </AnimatePresence>
                  </div>
                  <div className="gen-options">
                      {[3, 5].map(g => ( <button key={g} className={`gen-btn ${generation === g ? 'active' : ''}`} onClick={() => setGeneration(g)}>{g} Kuşak</button> ))}
                  </div>
                  <button className="go-btn" onClick={handlePedigreeSearch}>PEDİGRİ BUL <TbArrowRight /></button>
              </div>
          </motion.div>

          {/* KART 2: MUHTEMEL TAY (ÇİFT AT) */}
          <motion.div className="pedigree-box" initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.2 }}>
              <div>
                  <h2 className="pb-title">Muhtemel Tay Pedigrisi Oluştur</h2>
                  <p className="pb-desc">Aklınızdaki eşleşmeyi hayata geçirin. Bir Aygır ve bir Kısrak seçin, doğacak tayın sanal soyağacını ve genetik kesişimlerini görün.</p>
              </div>
              <div className="search-row">
                  {/* BABA SEÇİMİ */}
                  <div className="input-group" ref={sireRef}>
                      <TbGenderMale className="search-icon" style={{color:'#3b82f6'}} />
                      <input 
                          type="text" className="p-input" placeholder="Baba (Aygır) Seçiniz..." 
                          value={sireInput} onChange={(e) => { setSireInput(e.target.value); if(!e.target.value) setSelectedSire(null); }}
                          onFocus={() => { if(sireResults.length>0) setShowSireDropdown(true); }}
                      />
                      <AnimatePresence>
                          {showSireDropdown && sireResults.length > 0 && (
                              <motion.div className="p-dropdown custom-scrollbar" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
                                  {sireResults.map((horse) => (
                                      <div key={horse.aygir_id} className="p-item" onClick={() => { setSireInput(horse.aygir_adi); setSelectedSire(horse); setShowSireDropdown(false); }}>
                                          <div style={{fontWeight:'bold', display:'flex', alignItems:'center', gap:'8px'}}><TbGenderMale color="#3b82f6"/> {horse.aygir_adi}</div>
                                          <div className="pi-info">{horse.baba || '?'}</div>
                                      </div>
                                  ))}
                              </motion.div>
                          )}
                      </AnimatePresence>
                  </div>

                  {/* ANNE SEÇİMİ */}
                  <div className="input-group" ref={damRef}>
                      <TbGenderFemale className="search-icon" style={{color:'#ec4899'}} />
                      <input 
                          type="text" className="p-input" placeholder="Anne (Kısrak) Seçiniz..." 
                          value={damInput} onChange={(e) => { setDamInput(e.target.value); if(!e.target.value) setSelectedDam(null); }}
                          onFocus={() => { if(damResults.length>0) setShowDamDropdown(true); }}
                      />
                      <AnimatePresence>
                          {showDamDropdown && damResults.length > 0 && (
                              <motion.div className="p-dropdown custom-scrollbar" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
                                  {damResults.map((horse) => (
                                      <div key={horse.kisrak_id} className="p-item" onClick={() => { setDamInput(horse.ad); setSelectedDam(horse); setShowDamDropdown(false); }}>
                                          <div style={{fontWeight:'bold', display:'flex', alignItems:'center', gap:'8px'}}><TbGenderFemale color="#ec4899"/> {horse.ad}</div>
                                          <div className="pi-info">{horse.baba || '?'}</div>
                                      </div>
                                  ))}
                              </motion.div>
                          )}
                      </AnimatePresence>
                  </div>
                  <div className="gen-options">
                      {[3, 5].map(g => ( <button key={g} className={`gen-btn ${foalGen === g ? 'active' : ''}`} onClick={() => setFoalGen(g)}>{g} Kuşak</button> ))}
                  </div>
                  <button className="go-btn" onClick={handleFoalSearch}>OLUŞTUR <TbDna /></button>
              </div>
          </motion.div>
      </section>

      {/* LANSMAN BAR */}
      <section className="launch-bar">
          <div style={{color:'var(--gold)', letterSpacing:'2px', fontWeight:'bold', marginBottom:'10px'}}>LANSMAN FIRSATI</div>
          <h3 style={{fontSize:'2.2rem', margin:'10px 0', fontFamily:'"Playfair Display", serif', color:'#fff'}}>Kurucu Üye Ol, <span style={{color:'var(--gold)', fontStyle:'italic'}}>Sınırları Kaldır</span></h3>
          <p style={{color:'#94a3b8', maxWidth:'600px', marginTop:'10px'}}>İlk 100 eküri arasına katılın, ömür boyu ücretsiz analiz hakkı kazanın.</p>
          {!submitted ? (
            <form className="mail-input-group" onSubmit={handleSubscribe}>
              <input type="email" placeholder="E-posta adresiniz" className="mail-input" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <button type="submit" className="submit-btn">KAYDOL <TbArrowRight /></button>
            </form>
          ) : ( <div style={{marginTop:'20px', color:'#10b981', fontWeight:'bold', fontSize:'1.2rem'}}>✓ Kayıt Başarılı!</div> )}
      </section>

      {/* SLIDER SECTION */}
      <section className="feature-section">
        <div className="slider-container">
            <div className="text-side">
                <div style={{marginBottom:'25px', fontSize:'0.85rem', color: features[activeTab].color, fontWeight:'bold', letterSpacing:'3px', display:'flex', alignItems:'center', gap:'12px'}}>
                    <span style={{width:'40px', height:'2px', background: features[activeTab].color}}></span>
                    MODÜL 0{activeTab + 1}
                </div>
                <AnimatePresence mode='wait'>
                    <motion.div key={activeTab} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }} transition={{ duration: 0.5 }}>
                        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '3.5rem', margin: '0 0 25px 0', lineHeight: 1.1, color:'#fff' }}>{features[activeTab].title}</h2>
                        <p style={{ fontSize: '1.15rem', color: '#94a3b8', lineHeight: 1.8, marginBottom: '50px', maxWidth:'550px' }}>{features[activeTab].desc}</p>
                        <Link href={`/ozellikler?tab=${features[activeTab].key}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', background: `linear-gradient(90deg, ${features[activeTab].color}20, transparent)`, color: features[activeTab].color, textDecoration: 'none', fontWeight: 'bold', fontSize: '1rem', padding:'12px 25px', borderRadius:'8px', borderLeft:`4px solid ${features[activeTab].color}`}}>
                            DETAYLI BİLGİ AL <TbArrowRight size={20} />
                        </Link>
                    </motion.div>
                </AnimatePresence>
                <div style={{ display: 'flex', gap: '20px', marginTop: '60px', alignItems:'center' }}>
                    <button className="nav-btn" onClick={() => setActiveTab((prev) => (prev === 0 ? features.length - 1 : prev - 1))}><TbChevronLeft size={24} /></button>
                    <div style={{display:'flex', gap:'8px'}}>
                        {features.map((_, index) => (<div key={index} onClick={() => setActiveTab(index)} style={{ width: activeTab === index ? '40px' : '8px', height: '6px', background: activeTab === index ? features[activeTab].color : '#334155', borderRadius: '4px', transition: '0.4s', cursor:'pointer' }}></div>))}
                    </div>
                    <button className="nav-btn" onClick={() => setActiveTab((prev) => (prev + 1) % features.length)}><TbChevronRight size={24} /></button>
                </div>
            </div>
            <div className="visual-side" style={{ display:'flex', justifyContent:'center', alignItems:'center' }}>
                <AnimatePresence mode='wait'>
                    <motion.div key={activeTab} className="visual-frame" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} transition={{ duration: 0.6, ease: "circOut" }} style={{ background: features[activeTab].bgPattern, boxShadow: `0 30px 60px -20px ${features[activeTab].color}30` }}>
                        <div className="dots-grid">{[...Array(400)].map((_, i) => (<div key={i} className="dot" style={{backgroundColor: features[activeTab].color}}></div>))}</div>
                        <motion.img src={features[activeTab].image} alt={features[activeTab].title} className="main-img" initial={{ filter: 'blur(10px)' }} animate={{ filter: 'blur(0px)' }} transition={{ duration: 0.4 }} />
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
      </section>
    </>
  );
}