'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; 
import { createClient } from '@supabase/supabase-js'; 
import { motion, AnimatePresence } from 'framer-motion'; 
import { TbArrowRight, TbSearch, TbHorseToy, TbGenderMale, TbGenderFemale, TbDna, TbHorse, TbTrophy, TbChartBar, TbEye } from 'react-icons/tb';
import { HiOutlineSparkles, HiOutlinePresentationChartLine, HiOutlineShoppingBag, HiOutlineMap, HiOutlineCamera, HiOutlineFingerPrint, HiOutlineClock, HiOutlineHeart, HiOutlineBriefcase, HiOutlineMicrophone } from 'react-icons/hi2';

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
const heroCards = [
    // --- 1. SOYLINE AI VE GENETİK (Üst Satır) ---
    { title: "Pedigri Mühendisliği", desc: "9 nesile kadar inebilen derin soy ağacı analizi ve inbreeding (akrabalık) tespiti.", color: "#10b981", icon: HiOutlineSparkles },
    { title: "Eşleşme Uyumu", desc: "Soyline AI ile aygır ve kısrağınızın genetik uyumunu, başarı potansiyelini sayılarla görün.", color: "#fedc00", icon: HiOutlinePresentationChartLine },
    { title: "Pist ve Mesafe Optimizasyonu", desc: "Kan hatlarının pist türü (kum/çim/sentetik) ve mesafe yatkınlıklarını kanıtlanmış verilerle analiz edin.", color: "#6366f1", icon: HiOutlineMap },
    { title: "Soyline Vision: Konformasyon", desc: "Özel görüntü işleme teknolojimizle fotoğraftan vücut açıları, biyomekanik ve fiziksel risk tespiti.", color: "#ec4899", icon: HiOutlineCamera },
    { title: "Soyline AI: Fenotip Motoru", desc: "Safkanın fiziksel özelliklerinin kan hattıyla uyumunu ölçen, atınıza özel fenotipik değerlendirme.", color: "#8b5cf6", icon: HiOutlineFingerPrint },
    // --- 2. YÖNETİM, TİCARET VE TOPLULUK (Alt Satır) ---
    { title: "Hipodrom Takip Sistemi", desc: "Günlük hipodrom rutinleri, idman dereceleri, yarış kayıtları ve kişisel yarış asistanınız tek ekranda.", color: "#3b82f6", icon: HiOutlineClock },
    { title: "Damızlık ve Tay Takibi", desc: "Gebelik süreçleri, aşım takvimleri ve tay gelişim aşamaları için profesyonel yönetim modülü.", color: "#f43f5e", icon: HiOutlineHeart },
    { title: "Aygır Sahibi Paneli", desc: "Aygırınıza özel hat uyumu analizleri, aşım planlaması ve gücünüzü göstereceğiniz dijital vitrin.", color: "#0ea5e9", icon: HiOutlineBriefcase },
    { title: "Kapalı Devre Pazar Yeri", desc: "Sadece doğrulanmış üyelere özel; güvenli safkan, pay ve aşım hakkı ticareti.", color: "#f97316", icon: HiOutlineShoppingBag },
    { title: "Soyline Spaces & Topluluk", desc: "Canlı ses odaları, atçı sözlüğü, yarış oyunları ve interaktif camia deneyimi.", color: "#06b6d4", icon: HiOutlineMicrophone },
];

export default function Home() {
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

  // --- 3. SAYAÇ STATE'LERİ ---
  const [horseCount, setHorseCount] = useState(0);
  const [btCount, setBtCount] = useState(0);
  const [analysisCount, setAnalysisCount] = useState(0);
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef(null);

  // Animated counter hook
  const useCountUp = (target, duration = 2000, start = false) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
      if (!start || target === 0) { setCount(0); return; }
      let startTime = null;
      let raf;
      const step = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setCount(Math.floor(eased * target));
        if (progress < 1) { raf = requestAnimationFrame(step); }
      };
      raf = requestAnimationFrame(step);
      return () => cancelAnimationFrame(raf);
    }, [target, duration, start]);
    return count;
  };

  const animatedHorse = useCountUp(horseCount, 2200, statsVisible);
  const animatedBt = useCountUp(btCount, 2200, statsVisible);
  const animatedAnalysis = useCountUp(analysisCount, 2200, statsVisible);

  // --- SAYAÇ VERİLERİNİ ÇEK ---
  useEffect(() => {
    (async () => {
      const [horsesRes, btRes, analysisReportsRes, stallionLogRes, viewsRes] = await Promise.all([
        supabase.from('tum_atlar').select('*', { count: 'exact', head: true }),
        supabase.from('gruplisted').select('*', { count: 'exact', head: true }),
        supabase.from('analysis_reports').select('*', { count: 'exact', head: true }),
        supabase.from('stallion_activity_log').select('*', { count: 'exact', head: true }),
        supabase.from('pedigree_views').select('*', { count: 'exact', head: true }),
      ]);
      setHorseCount(horsesRes.count || 0);
      setBtCount(btRes.count || 0);
      setAnalysisCount((analysisReportsRes.count || 0) + (stallionLogRes.count || 0) + (viewsRes.count || 0));
    })();
  }, []);

  // IntersectionObserver for stats section
  useEffect(() => {
    if (!statsRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStatsVisible(true); observer.disconnect(); } },
      { threshold: 0.3 }
    );
    observer.observe(statsRef.current);
    return () => observer.disconnect();
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

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&display=swap');
        :root { --bg-dark: #020617; --text-main: #fff; --gold: #fedc00; }
        body { background: var(--bg-dark); color: var(--text-main); margin:0; font-family: 'Poppins', sans-serif; overflow-x: hidden; }
        
        /* NAVBAR */
        .navbar {
          display: flex; align-items: center; justify-content: center;
          padding: 15px 40px; background: rgba(2, 6, 23, 0.85); backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255,255,255,0.05); height: 90px;
          position: fixed; top: 0; width: 100%; z-index: 100; box-sizing: border-box;
        }
        .logo-link {
          text-decoration: none; display: flex; align-items: center;
          font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 2.6rem;
          line-height: 1; letter-spacing: -0.5px;
          position: relative;
        }
        .soy-text {
          color: #ffffff;
          text-shadow: 0 0 20px rgba(255,255,255,0.15);
        }
        .line-wrapper { position: relative; display: flex; flex-direction: column; }
        .line-text {
          color: var(--gold);
          text-shadow: 0 0 20px rgba(254,220,0,0.4), 0 0 40px rgba(254,220,0,0.15);
          background: linear-gradient(90deg, #fedc00, #fff7a0, #fedc00);
          background-size: 200% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: logoShimmer 3s ease-in-out infinite;
        }
        @keyframes logoShimmer {
          0%, 100% { background-position: 0% 50%; filter: drop-shadow(0 0 8px rgba(254,220,0,0.3)); }
          50% { background-position: 100% 50%; filter: drop-shadow(0 0 20px rgba(254,220,0,0.6)); }
        }
        .line-swosh {
          position: absolute; bottom: -8px; left: -5%; width: 110%; height: 14px;
          pointer-events: none; overflow: visible;
          filter: drop-shadow(0 0 6px rgba(254,220,0,0.5));
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
        .hero { min-height: 100vh; text-align: center; display: flex; flex-direction: column; justify-content: center; align-items: center; position: relative; overflow: hidden; background: #020617; padding: 80px 0 40px; box-sizing: border-box; }
        .hero-video { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0; opacity: 0.55; mix-blend-mode: hard-light; filter: contrast(1.1); }
        .overlay-gradient { position: absolute; inset: 0; background: radial-gradient(circle, transparent 20%, #020617 100%); z-index: 1; }
        .hero-content { position: relative; z-index: 2; max-width: 1300px; padding: 0 20px; margin-top: 30px; width: 100%; }
                @keyframes pulseGlow {
                    0%, 100% { box-shadow: 0 0 20px rgba(254, 220, 0, 0.15), 0 0 60px rgba(254, 220, 0, 0.05); border-color: rgba(254, 220, 0, 0.5); }
                    50% { box-shadow: 0 0 30px rgba(254, 220, 0, 0.35), 0 0 80px rgba(254, 220, 0, 0.15); border-color: rgba(254, 220, 0, 0.9); }
                }
                @keyframes dotPulse {
                    0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 8px rgba(254, 220, 0, 0.8); }
                    50% { opacity: 0.5; transform: scale(0.7); box-shadow: 0 0 20px rgba(254, 220, 0, 1); }
                }
                .coming-soon-banner {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 36px;
                    margin-top: -20px;
                }
                .coming-soon-chip {
                    display: inline-flex;
                    align-items: center;
                    gap: 10px;
                    background: rgba(254, 220, 0, 0.08);
                    border: 2px solid rgba(254, 220, 0, 0.5);
                    color: var(--gold);
                    padding: 14px 28px;
                    border-radius: 999px;
                    font-weight: 700;
                    font-size: 1rem;
                    letter-spacing: 2px;
                    text-transform: uppercase;
                    animation: pulseGlow 2.5s ease-in-out infinite;
                }
                .chip-dot {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    background: var(--gold);
                    animation: dotPulse 1.5s ease-in-out infinite;
                }
                .coming-soon-sub {
                    color: #94a3b8;
                    font-size: 1.05rem;
                    letter-spacing: 0.5px;
                    font-weight: 500;
                }
                .coming-soon-sub span {
                    color: var(--gold);
                    font-weight: 700;
                }

        /* HERO FEATURE BOXES */
        .hero-boxes {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 14px;
            width: 100%;
            max-width: 1200px;
            margin: 0 auto 30px;
        }
        .hero-box {
            background: rgba(15, 23, 42, 0.7);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(254, 220, 0, 0.25);
            border-radius: 14px;
            padding: 20px 14px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            text-align: center;
            cursor: default;
            transition: transform 0.35s cubic-bezier(.4,0,.2,1), box-shadow 0.35s ease, border-color 0.35s ease;
        }
        .hero-box:hover {
            transform: translateY(-8px) scale(1.03);
            border-color: rgba(254, 220, 0, 0.7);
            box-shadow: 0 8px 30px -6px rgba(254, 220, 0, 0.2), 0 16px 40px -8px var(--box-glow);
        }
        .hero-box-icon {
            width: 42px;
            height: 42px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--box-glow);
            color: var(--box-color);
            font-size: 1.4rem;
            flex-shrink: 0;
        }
        .hero-box h3 {
            margin: 0;
            font-size: 0.82rem;
            font-weight: 700;
            color: #fff;
            letter-spacing: 0.2px;
            line-height: 1.25;
        }
        .hero-box p {
            margin: 0;
            font-size: 0.72rem;
            color: #94a3b8;
            line-height: 1.4;
        }
        .hero-sub {
            font-size: 1rem;
            color: #64748b;
            margin: 0 auto;
            max-width: 600px;
            line-height: 1.6;
        }

        /* SAYAÇ BÖLÜMÜ */
        .stats-wrapper {
            position: relative;
            z-index: 10;
            margin-top: -60px;
            padding: 0 20px 50px;
        }
        .stats-section {
            display: flex;
            justify-content: center;
            gap: 20px;
            flex-wrap: wrap;
            width: 100%;
            max-width: 1000px;
            margin: 0 auto;
        }
        .stat-card {
            flex: 1;
            min-width: 180px;
            max-width: 230px;
            background: rgba(15, 23, 42, 0.6);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(254, 220, 0, 0.15);
            border-radius: 20px;
            padding: 28px 20px 24px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
            position: relative;
            overflow: hidden;
            transition: all 0.4s cubic-bezier(.4,0,.2,1);
        }
        .stat-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 60%;
            height: 2px;
            background: linear-gradient(90deg, transparent, var(--gold), transparent);
        }
        .stat-card:hover {
            transform: translateY(-6px);
            border-color: rgba(254, 220, 0, 0.4);
            box-shadow: 0 12px 35px rgba(254, 220, 0, 0.1);
        }
        .stat-icon {
            width: 48px;
            height: 48px;
            border-radius: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.4rem;
            margin-bottom: 4px;
        }
        .stat-number {
            font-family: 'Poppins', sans-serif;
            font-size: 2.4rem;
            font-weight: 800;
            background: linear-gradient(135deg, var(--gold), #fff7a0);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            line-height: 1.1;
            letter-spacing: -0.5px;
        }
        .stat-label {
            font-size: 0.78rem;
            color: #94a3b8;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1.5px;
        }
        @media (max-width: 900px) {
            .stats-section { gap: 14px; }
            .stat-card { min-width: 140px; padding: 22px 14px 20px; }
            .stat-number { font-size: 1.7rem; }
            .stat-icon { width: 40px; height: 40px; }
        }
        @media (max-width: 600px) {
            .stats-section { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
            .stat-card { min-width: 0; max-width: none; }
            .stat-number { font-size: 1.6rem; }
            .stat-label { font-size: 0.68rem; letter-spacing: 1px; }
        }

        @media (max-width: 1100px) {
            .hero-boxes { grid-template-columns: repeat(3, 1fr); gap: 12px; }
        }
        @media (max-width: 768px) {
            .hero-boxes { grid-template-columns: repeat(2, 1fr); gap: 10px; }
            .hero-box { padding: 16px 12px; }
            .hero-box h3 { font-size: 0.78rem; }
            .hero-box p { font-size: 0.68rem; }
        }
        @media (max-width: 480px) {
            .hero-boxes { grid-template-columns: repeat(2, 1fr); gap: 8px; }
            .hero-box { padding: 14px 10px; }
            .hero-box-icon { width: 36px; height: 36px; }
            .hero-box h3 { font-size: 0.72rem; }
            .hero-box p { font-size: 0.64rem; }
        }

        /* --- PEDİGRİ ARAMA BÖLÜMÜ --- */
        .pedigree-search-section {
            position: relative; 
            z-index: 50;
            margin-top: 0; 
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

        @media (max-width: 1024px) {
          .pedigree-box { padding: 30px 20px; }
          .search-row { flex-direction: column; }
          .go-btn { width: 100%; }
          .navbar { padding: 15px 20px; }
          .nav-links { display: none; }
        }

                @media (max-width: 768px) {
                    .navbar { height: 78px; padding: 12px 16px; }
                    .logo-link { font-size: 2rem; }
                    .hero { min-height: auto; height: auto; padding: 100px 0 40px; }
                    .hero-content { margin-top: 10px; max-width: 100%; padding: 0 16px; }

                    .pedigree-search-section { margin-top: -35px; padding: 0 14px 60px; gap: 20px; }
                    .pedigree-box { padding: 20px 16px; border-radius: 16px; }
                    .pb-title { font-size: 1.7rem; }
                    .search-row { gap: 10px; }
                    .input-group { min-width: 0; width: 100%; }
                    .p-input { font-size: 1rem; padding: 14px 14px 14px 42px; }
                    .gen-options { width: 100%; justify-content: center; }
                    .gen-btn { flex: 1; padding: 10px 12px; }
                    .go-btn { width: 100%; padding: 14px 18px; font-size: 1rem; }
                }

                @media (max-width: 480px) {
                    .pb-title { font-size: 1.5rem; }
                    .pb-desc { font-size: 0.9rem; }
                    .p-item { padding: 12px 14px; flex-direction: column; align-items: flex-start; gap: 4px; }
                    .pi-info { max-width: 100%; text-align: left; }
                    .coming-soon-chip { font-size: 0.85rem; padding: 10px 20px; letter-spacing: 1.5px; }
                    .coming-soon-sub { font-size: 0.9rem; }
                }

                /* FOOTER */
                .site-footer {
                    width: 100%;
                    background: #020617;
                    border-top: 1px solid #1e293b;
                    padding: 50px 20px 30px;
                    box-sizing: border-box;
                }
                .footer-inner {
                    max-width: 1100px;
                    margin: 0 auto;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 24px;
                }
                .footer-brand {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-family: 'Poppins', sans-serif;
                    font-weight: 700;
                    font-size: 1.4rem;
                }
                .footer-divider {
                    width: 80px;
                    height: 2px;
                    background: linear-gradient(90deg, transparent, var(--gold), transparent);
                    border: none;
                }
                .footer-links {
                    display: flex;
                    gap: 28px;
                    flex-wrap: wrap;
                    justify-content: center;
                }
                .footer-links a {
                    color: #64748b;
                    text-decoration: none;
                    font-size: 0.88rem;
                    font-weight: 500;
                    transition: color 0.2s;
                }
                .footer-links a:hover { color: var(--gold); }
                .footer-copy {
                    color: #475569;
                    font-size: 0.82rem;
                    letter-spacing: 0.3px;
                    text-align: center;
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
                        <div className="coming-soon-banner">
                            <div className="coming-soon-chip">
                                <span className="chip-dot"></span>
                                Çok Yakında
                            </div>
                            <p className="coming-soon-sub">Türk atçılığının hizmetinde, <span>yepyeni bir deneyim</span> başlıyor.</p>
                        </div>
          </motion.div>

          <motion.div className="hero-boxes" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }}>
              {heroCards.map((card, i) => {
                  const Icon = card.icon;
                  return (
                      <div key={i} className="hero-box" style={{ '--box-color': card.color, '--box-glow': `${card.color}22` }}>
                          <div className="hero-box-icon"><Icon size={24} /></div>
                          <h3>{card.title}</h3>
                          <p>{card.desc}</p>
                      </div>
                  );
              })}
          </motion.div>

          <motion.p className="hero-sub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.6 }}>
              Hepsi tek platformda, <span style={{color:'var(--gold)', fontWeight:700}}>SoyLine</span> ile.
          </motion.p>

        </div>
      </header>

      {/* --- SAYAÇ KARTLARI --- */}
      <div className="stats-wrapper">
          <motion.div ref={statsRef} className="stats-section" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
              <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}><TbHorse size={24} /></div>
                  <span className="stat-number">{animatedHorse.toLocaleString('tr-TR')}</span>
                  <span className="stat-label">Kayıtlı At</span>
              </div>
              <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'rgba(254,220,0,0.12)', color: '#fedc00' }}><TbTrophy size={24} /></div>
                  <span className="stat-number">{animatedBt.toLocaleString('tr-TR')}</span>
                  <span className="stat-label">BlackType Yarış</span>
              </div>
              <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.12)', color: '#6366f1' }}><TbChartBar size={24} /></div>
                  <span className="stat-number">{animatedAnalysis.toLocaleString('tr-TR')}</span>
                  <span className="stat-label">Analiz</span>
              </div>
          </motion.div>
      </div>

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



      {/* FOOTER */}
      <footer className="site-footer">
          <div className="footer-inner">
              <div className="footer-brand">
                  <span style={{color:'#fff'}}>Soy</span><span style={{color:'var(--gold)'}}>Line</span>
              </div>
              <p className="footer-copy">&copy; 2026 SoyLine Teknoloji A.Ş. &mdash; Tüm hakları saklıdır.</p>
          </div>
      </footer>
    </>
  );
}