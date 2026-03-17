'use client';
import { Suspense, useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { TbArrowLeft, TbSearch, TbHorseToy, TbArrowRight, TbLock } from 'react-icons/tb';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// --- REKÜRSİF PEDİGRİ HÜCRESİ ---
const PedigreeNode = ({ node, col, row, span, totalGens, colorMap, isMale }) => {
    if (col > totalGens) return null;
    
    const safeNode = node || {};
    const name = safeNode.ad || 'Bilinmiyor';
    
    // Inbreeding (Akrabalık) var mı?
    const hasColor = colorMap[safeNode.id] && safeNode.id; 
    
    // Cinsiyet Renkleri (Erkek: Mavi, Dişi: Pembe)
    const genderBorder = isMale ? '#3b82f6' : '#ec4899'; 
    const genderBg = isMale ? 'rgba(59, 130, 246, 0.15)' : 'rgba(236, 72, 153, 0.15)'; 

    // Stil Mantığı
    const style = {
        gridColumn: col,
        gridRow: `${row} / span ${span}`,
        backgroundColor: hasColor ? colorMap[safeNode.id] : genderBg,
        color: hasColor ? '#000' : '#e2e8f0',
        border: hasColor ? '1px solid #fff' : `1px solid ${genderBorder}`,
        fontWeight: hasColor ? '800' : '500',
        fontSize: col > 4 ? '0.65rem' : '0.75rem', 
        boxShadow: hasColor ? '0 0 10px rgba(255,255,255,0.3)' : 'none',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        padding: '0 4px'
    };

    return (
        <>
            <div className="ped-cell" style={style} title={name}>
                {name}
            </div>
            <PedigreeNode node={safeNode.baba} col={col + 1} row={row} span={span / 2} totalGens={totalGens} colorMap={colorMap} isMale={true} />
            <PedigreeNode node={safeNode.anne} col={col + 1} row={row + (span / 2)} span={span / 2} totalGens={totalGens} colorMap={colorMap} isMale={false} />
        </>
    );
};

function PedigreeResultPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const id = searchParams.get('id');
    const genParam = parseInt(searchParams.get('gen') || '5');
    const goldColor = '#fedc00';

    const [rootHorse, setRootHorse] = useState(null);
    const [pedigreeTree, setPedigreeTree] = useState(null);
    const [colorMap, setColorMap] = useState({});
    const [loading, setLoading] = useState(true);

    // --- YENİ ARAMA STATE'LERİ ---
    const [searchInput, setSearchInput] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedHorse, setSelectedHorse] = useState(null);
    const [generation, setGeneration] = useState(5);
    const searchRef = useRef(null);

    // --- DETAY VERİLERİ ---
    const [horseDetail, setHorseDetail] = useState(null);
    const [grupListedHome, setGrupListedHome] = useState([]);
    const [racesCount, setRacesCount] = useState(0);
    const [offspringCount, setOffspringCount] = useState(0);
    const [btSet, setBtSet] = useState(new Set());

    // --- SEARCH EFFECT (Debounce) ---
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchInput.length > 2) {
                const { data, error } = await supabase
                    .from('tum_atlar')
                    .select('id, ad, baba, anne')
                    .ilike('ad', `%${searchInput}%`)
                    .limit(5);
                
                if (!error && data) {
                    setSearchResults(data);
                    setShowDropdown(true);
                }
            } else {
                setSearchResults([]);
                setShowDropdown(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchInput]);

    // --- DROPDOWN KAPATMA (Dışarı tıklayınca) ---
    useEffect(() => {
        function handleClickOutside(event) {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // --- PEDİGRİ VERİ ÇEKME ---
    async function fetchPedigree(horseId, currentDepth, maxDepth) {
        if (currentDepth > maxDepth || !horseId) return null;
        const { data } = await supabase.from('tum_atlar').select('id, ad, baba_id, anne_id').eq('id', horseId).single();
        if (!data) return null;
        const [babaNode, anneNode] = await Promise.all([
            fetchPedigree(data.baba_id, currentDepth + 1, maxDepth),
            fetchPedigree(data.anne_id, currentDepth + 1, maxDepth)
        ]);
        return { ...data, baba: babaNode, anne: anneNode };
    }

    function generateColorMap(tree) {
        const counts = {};
        const colors = {};
        const palette = ['#bef264', '#67e8f9', '#fca5a5', '#fdba74', '#d8b4fe', '#f0abfc']; 
        let colorIndex = 0;
        function traverseAncestors(node) {
            if (!node) return;
            if (node.id) counts[node.id] = (counts[node.id] || 0) + 1;
            traverseAncestors(node.baba);
            traverseAncestors(node.anne);
        }
        if(tree) { traverseAncestors(tree.baba); traverseAncestors(tree.anne); }
        Object.keys(counts).forEach(key => {
            if (counts[key] > 1) { colors[key] = palette[colorIndex % palette.length]; colorIndex++; }
        });
        return colors;
    }

    async function detectBTMothers(tree) {
        const femaleIds = new Set();
        function collect(node, isFemale) {
            if (!node) return;
            if (isFemale && node.id) femaleIds.add(node.id);
            collect(node.baba, false);
            collect(node.anne, true);
        }
        if (tree) { collect(tree.baba, false); collect(tree.anne, true); }
        if (femaleIds.size === 0) return new Set();
        const ids = Array.from(femaleIds);
        const btIds = new Set();
        for (let i = 0; i < ids.length; i += 80) {
            const batch = ids.slice(i, i + 80);
            const [{ data: kData }, { data: gData }] = await Promise.all([
                supabase.from('kisrak').select('id, blacktype').in('id', batch).gt('blacktype', 0),
                supabase.from('gruplisted').select('anne_id').in('anne_id', batch)
            ]);
            if (kData) kData.forEach(d => btIds.add(d.id));
            if (gData) gData.forEach(d => { if (d.anne_id) btIds.add(d.anne_id); });
        }
        return btIds;
    }

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        const currentGen = genParam;
        (async () => {
            const [tree, detailRes, racesRes] = await Promise.all([
                fetchPedigree(id, 1, currentGen),
                supabase.from('tum_atlar').select('*').eq('id', id).single(),
                supabase.from('kosular').select('id').eq('id', id).limit(200),
            ]);
            setPedigreeTree(tree);
            setRootHorse(tree);
            if (tree) {
                setColorMap(generateColorMap(tree));
                setBtSet(await detectBTMothers(tree));
            }

            const detail = detailRes?.data;
            if (detail) {
                setHorseDetail(detail);
                const male = (detail.cinsiyet || '').toLowerCase().includes('erkek') || (detail.cinsiyet || '').toLowerCase().includes('aygır');
                const pcol = male ? 'baba_id' : 'anne_id';

                let resolvedAygirId = null;
                if (male) {
                    const { data: ayg } = await supabase.from('aygir').select('aygir_id').eq('aygir_id', id).maybeSingle();
                    if (ayg) { resolvedAygirId = ayg.aygir_id; }
                    else {
                        const cleanName = (detail.ad || '').replace(/\s*\(.*?\)/g, '').trim();
                        const { data: ayg2 } = await supabase.from('aygir').select('aygir_id').ilike('aygir_adi', cleanName).maybeSingle();
                        if (ayg2) { resolvedAygirId = ayg2.aygir_id; }
                    }
                }

                const lookupIdsOff = new Set([id]);
                if (resolvedAygirId && String(resolvedAygirId) !== String(id)) lookupIdsOff.add(resolvedAygirId);
                let totalOff = 0;
                for (const lid of lookupIdsOff) {
                    const { count } = await supabase.from('tum_atlar').select('id', { count: 'exact', head: true }).eq(pcol, lid);
                    totalOff += (count || 0);
                }
                setOffspringCount(totalOff);

                const lookupIds = new Set([id]);
                if (resolvedAygirId && String(resolvedAygirId) !== String(id)) lookupIds.add(resolvedAygirId);
                const glPromises = [];
                for (const lid of lookupIds) {
                    glPromises.push(supabase.from('gruplisted').select('*').eq('id', lid));
                    glPromises.push(supabase.from('gruplisted').select('*').eq('baba_id', lid));
                    glPromises.push(supabase.from('gruplisted').select('*').eq('anne_id', lid));
                }
                const glResults = await Promise.all(glPromises);
                const allGL = [];
                const seenKosuIds = new Set();
                glResults.forEach(r => {
                    if (r.data) r.data.forEach(item => {
                        const key = item.kosu_id;
                        if (!seenKosuIds.has(key)) { seenKosuIds.add(key); allGL.push(item); }
                    });
                });
                const sMap = { 'G 1': 1, 'G 2': 2, 'G 3': 3, 'A2': 4, 'A3': 5, 'KV-9': 6, 'KV-8': 7, 'KV-7': 8, 'KV-6': 9 };
                const sn = (c) => { if (!c) return 99; for (const k of Object.keys(sMap)) { if (c.startsWith(k)) return sMap[k]; } return 99; };
                allGL.sort((a, b) => sn(a.kosu_cins) - sn(b.kosu_cins));
                setGrupListedHome(allGL);
            } else { setGrupListedHome([]); }

            setRacesCount(racesRes?.data?.length || 0);
            setLoading(false);

            // Log pedigree view
            supabase.from('pedigree_views').insert({ page_type: 'pedigri', horse_id: String(id) }).then(() => {});
        })();
    }, [id, genParam]);

    const handleNewSearch = () => {
        if (selectedHorse) {
            router.push(`/pedigri?id=${selectedHorse.id}&gen=${generation}`);
            setSearchInput('');
            setSelectedHorse(null);
            setShowDropdown(false);
        }
    };

    if (loading) return (
        <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#020617', color:'#fedc00', fontSize:'1.5rem'}}>
            Pedigri Analiz Ediliyor...
        </div>
    );

    const totalRows = Math.pow(2, genParam - 1);
    const isMaleHorse = horseDetail && ((horseDetail.cinsiyet || '').toLowerCase().includes('erkek') || (horseDetail.cinsiyet || '').toLowerCase().includes('aygır'));

    return (
        <div className="page-wrapper">
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&display=swap');

                body { background-color: #020617; color: #fff; margin: 0; font-family: 'Poppins', sans-serif; }
                
                .navbar { display: flex; align-items: center; justify-content: center; padding: 15px 40px; background: rgba(2, 6, 23, 0.95); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(255,255,255,0.05); height: 80px; position: fixed; top: 0; width: 100%; z-index: 100; box-sizing: border-box; }
                .logo-link { text-decoration: none; display: flex; align-items: center; font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 2.2rem; line-height: 1; letter-spacing: -0.5px; }
                .soy-text { color: #ffffff; text-shadow: 0 0 20px rgba(255,255,255,0.15); }
                .line-wrapper { position: relative; display: flex; flex-direction: column; }
                .line-text { color: ${goldColor}; background: linear-gradient(90deg, #fedc00, #fff7a0, #fedc00); background-size: 200% 100%; -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
                .line-swosh { position: absolute; bottom: -6px; left: -5%; width: 110%; height: auto; pointer-events: none; filter: drop-shadow(0 0 6px rgba(254,220,0,0.5)); }
                
                .page-wrapper { padding-top: 100px; padding-bottom: 80px; min-height: 100vh; display: flex; flex-direction: column; align-items: center; }
                .header-area { text-align: center; margin-bottom: 20px; }
                .p-title { font-family: 'Playfair Display', serif; font-size: 2rem; color: #fedc00; margin: 0; text-transform: uppercase; letter-spacing: 1px; }
                .p-sub { color: #94a3b8; font-size: 0.9rem; margin-top: 5px; }
                
                .back-link { 
                    position: absolute; top: 100px; left: 40px; 
                    color: #fff; text-decoration: none; display: flex; align-items: center; gap: 5px; font-weight: bold; font-size: 0.9rem;
                    background: rgba(255,255,255,0.05); padding: 8px 16px; border-radius: 50px; transition: 0.3s;
                }
                .back-link:hover { background: rgba(255,255,255,0.1); color: #fedc00; }

                .pedigree-container {
                    width: 95%; max-width: 1400px;
                    overflow-x: auto; 
                    padding: 10px;
                    background: #0f172a;
                    border: 1px solid #1e293b;
                    border-radius: 12px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                }

                .pedigree-grid {
                    display: grid;
                    grid-template-columns: repeat(${genParam}, 1fr);
                    grid-auto-rows: minmax(30px, auto);
                    gap: 4px;
                    min-width: ${genParam * 120}px;
                }

                .ped-cell {
                    display: flex; align-items: center; justify-content: center;
                    text-align: center; 
                    border-radius: 4px;
                    transition: 0.2s;
                    overflow: hidden;
                    cursor: default;
                }
                .ped-cell:hover { transform: scale(1.05); z-index: 20; box-shadow: 0 0 10px rgba(0,0,0,0.5); }
                
                .legend { display: flex; gap: 15px; justify-content: center; margin-top: 15px; flex-wrap: wrap; margin-bottom: 50px; }
                .legend-item { display: flex; align-items: center; gap: 5px; font-size: 0.8rem; color: #cbd5e1; }
                .dot { width: 10px; height: 10px; border-radius: 50%; }
                .dot-blue { background: rgba(59, 130, 246, 0.5); border: 1px solid #3b82f6; }
                .dot-pink { background: rgba(236, 72, 153, 0.5); border: 1px solid #ec4899; }
                .dot-multi { background: linear-gradient(45deg, #bef264, #67e8f9); border: 1px solid #fff; }

                /* --- AT BİLGİ KARTI --- */
                .horse-hero-card { width: 95%; max-width: 1400px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%); border: 1px solid #1e293b; border-radius: 18px; padding: 24px 32px; margin-bottom: 20px; position: relative; overflow: hidden; }
                .horse-hero-card::before { content: ''; position: absolute; top: -40%; right: -10%; width: 300px; height: 300px; background: radial-gradient(circle, rgba(254,220,0,0.06) 0%, transparent 70%); pointer-events: none; }
                .hero-name-row { display: flex; align-items: center; gap: 12px; margin-bottom: 6px; }
                .hero-gender { display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 8px; font-size: 1.3rem; font-weight: 700; }
                .hero-horse-name { font-family: 'Playfair Display', serif; font-size: 1.8rem; font-weight: 900; color: #fff; margin: 0; text-transform: uppercase; letter-spacing: 1px; }
                .hero-pedigree-line { font-size: 1rem; color: #cbd5e1; font-style: italic; margin-bottom: 12px; }
                .hero-tags-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
                .hero-tag { padding: 4px 12px; border-radius: 20px; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.3px; background: rgba(255,255,255,0.06); color: #cbd5e1; }
                .hero-tag.gold { background: rgba(254,220,0,0.12); color: #fedc00; }
                .hero-tag.bt { background: rgba(251,191,36,0.15); color: #fbbf24; font-weight: 800; }
                .hero-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; }
                .hero-stat { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 14px; text-align: center; }
                .hero-stat-val { font-size: 1rem; font-weight: 800; color: #fff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .hero-stat-lbl { font-size: 0.65rem; color: #64748b; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.5px; }

                /* --- BLUR DETAY BÖLÜMÜ --- */
                .blurred-details-wrapper { position: relative; width: 95%; max-width: 1400px; border-radius: 16px; overflow: hidden; margin-top: 20px; margin-bottom: 30px; }
                .blurred-content { filter: blur(6px); pointer-events: none; user-select: none; padding: 20px; }
                .detail-preview-box { background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; padding: 20px; margin-bottom: 16px; }
                .detail-preview-box h2 { color: #fedc00; font-size: 1rem; margin: 0 0 12px; font-family: 'Playfair Display', serif; }
                .preview-row { color: #cbd5e1; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 0.85rem; }
                .blur-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(2,6,23,0.6); z-index: 10; }
                .blur-overlay-content { text-align: center; padding: 30px; }
                .blur-title { font-family: 'Playfair Display', serif; font-size: 1.4rem; color: #fff; margin-bottom: 8px; }
                .blur-sub { color: #94a3b8; font-size: 0.9rem; margin-bottom: 20px; max-width: 400px; line-height: 1.5; }
                .blur-cta { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #fedc00 0%, #b45309 100%); color: #000; border-radius: 12px; font-weight: 800; text-decoration: none; transition: 0.3s; font-size: 0.95rem; cursor: default; }

                /* --- YENİ ARAMA KUTUSU --- */
                .new-search-section {
                    width: 95%; max-width: 800px;
                    background: #1e293b;
                    padding: 30px;
                    border-radius: 16px;
                    border: 1px solid #334155;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 20px;
                    margin-top: 20px;
                }
                .ns-title { font-size: 1.2rem; font-weight: 700; color: #fff; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 1px; }
                .search-row { display: flex; width: 100%; gap: 10px; flex-wrap: wrap; justify-content: center; position: relative; }
                
                .input-group { flex: 1; min-width: 280px; position: relative; }
                .search-icon { position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: #64748b; font-size: 1.2rem; }
                .p-input { width: 100%; padding: 14px 20px 14px 45px; background: #0f172a; border: 1px solid #334155; color: #fff; border-radius: 10px; font-size: 1rem; outline: none; transition: 0.3s; box-sizing: border-box; }
                .p-input:focus { border-color: #fedc00; box-shadow: 0 0 0 2px rgba(254, 220, 0, 0.1); }

                .p-dropdown { position: absolute; top: 100%; left: 0; width: 100%; background: #1e293b; border: 1px solid #334155; border-radius: 10px; max-height: 300px; overflow-y: auto; z-index: 50; margin-top: 5px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
                .p-item { padding: 12px 20px; cursor: pointer; border-bottom: 1px solid #334155; transition: 0.2s; color: #cbd5e1; display: flex; justify-content: space-between; align-items: center; }
                .p-item:hover { background: #0f172a; color: #fedc00; }
                .pi-info { font-size: 0.8rem; color: #64748b; }

                .gen-options { display: flex; gap: 5px; background: #0f172a; padding: 5px; border-radius: 8px; border: 1px solid #334155; }
                .gen-btn { background: transparent; border: none; color: #64748b; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600; transition: 0.2s; }
                .gen-btn.active { background: #334155; color: #fff; }
                .gen-btn:hover { color: #fff; }

                .go-btn { background: linear-gradient(135deg, #fedc00 0%, #b45309 100%); color: #000; border: none; padding: 0 30px; border-radius: 10px; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.3s; white-space: nowrap; }
                .go-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(234, 179, 8, 0.3); }

                @media (max-width: 900px) {
                    .navbar { padding: 15px 20px; }
                    .back-link { position: static; margin-bottom: 20px; align-self: flex-start; margin-left: 20px; }
                    .search-row { flex-direction: column; }
                    .gen-options { width: 100%; justify-content: center; }
                    .go-btn { width: 100%; padding: 15px; justify-content: center; }
                    .horse-hero-card { padding: 18px 16px; }
                    .hero-horse-name { font-size: 1.3rem; }
                    .hero-stats { grid-template-columns: repeat(2, 1fr); }
                }

                @media (max-width: 768px) {
                    .navbar { height: 72px; padding: 12px 16px; }
                    .logo-link { font-size: 1.8rem; }
                    .page-wrapper { padding-top: 86px; padding-bottom: 40px; }
                    .p-title { font-size: 1.45rem; }
                    .p-sub { font-size: 0.82rem; }
                    .pedigree-grid { min-width: ${genParam * 95}px; }
                    .legend { gap: 10px; margin-bottom: 30px; }
                    .back-link { margin-left: 12px; }
                    .p-item { flex-direction: column; align-items: flex-start; gap: 4px; }
                    .pi-info { font-size: 0.75rem; }
                    .input-group { min-width: 0; width: 100%; }
                    .gen-btn { flex: 1; }
                    .new-search-section { width: 100%; padding: 20px 14px; border-radius: 12px; }
                }

                @media (max-width: 480px) {
                    .p-title { font-size: 1.25rem; }
                    .gen-btn { padding: 8px 10px; font-size: 0.85rem; }
                    .ns-title { font-size: 1rem; }
                }
            `}</style>

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

            <Link href="/" className="back-link"><TbArrowLeft /> Geri Dön</Link>

            {/* AT BİLGİ KARTI */}
            {horseDetail ? (
                <div className="horse-hero-card">
                    <div className="hero-name-row">
                        <span className="hero-gender" style={{
                            background: isMaleHorse ? 'rgba(59,130,246,0.15)' : 'rgba(236,72,153,0.15)',
                            color: isMaleHorse ? '#3b82f6' : '#ec4899'
                        }}>
                            {isMaleHorse ? '♂' : '♀'}
                        </span>
                        <h1 className="hero-horse-name">{horseDetail.ad}</h1>
                    </div>
                    <div className="hero-pedigree-line">{horseDetail.baba || '?'} × {horseDetail.anne || '?'}</div>
                    <div className="hero-tags-row">
                        {horseDetail.cinsiyet && <span className="hero-tag">{horseDetail.cinsiyet}</span>}
                        {horseDetail.don && <span className="hero-tag">{horseDetail.don}</span>}
                        {horseDetail.yas && <span className="hero-tag">{horseDetail.yas} yaş</span>}
                        {horseDetail.irk && <span className="hero-tag gold">{horseDetail.irk}</span>}
                        {grupListedHome.length > 0 && <span className="hero-tag bt">🏆 Grup/Listed</span>}
                    </div>
                    <div className="hero-stats">
                        <div className="hero-stat"><div className="hero-stat-val">{horseDetail.handikap || '—'}</div><div className="hero-stat-lbl">HANDİKAP</div></div>
                        <div className="hero-stat"><div className="hero-stat-val" style={{color:'#22c55e'}}>{horseDetail.kazanc ? `${Number(horseDetail.kazanc).toLocaleString('tr-TR')} TL` : '—'}</div><div className="hero-stat-lbl">KAZANÇ</div></div>
                        <div className="hero-stat"><div className="hero-stat-val">{racesCount}</div><div className="hero-stat-lbl">BİRİNCİLİK</div></div>
                        <div className="hero-stat"><div className="hero-stat-val" style={{color: grupListedHome.length > 0 ? '#fbbf24' : '#64748b'}}>{grupListedHome.length || '—'}</div><div className="hero-stat-lbl">GRUP/LİSTED</div></div>
                        <div className="hero-stat"><div className="hero-stat-val">{offspringCount || '—'}</div><div className="hero-stat-lbl">YAVRU</div></div>
                    </div>
                    <div className="p-sub" style={{marginTop: 12, textAlign:'center'}}>{genParam} Kuşak Detaylı Soy Ağacı</div>
                </div>
            ) : (
                <div className="header-area">
                    <h1 className="p-title">{rootHorse?.ad || 'At'}</h1>
                    <div className="p-sub">{genParam} Kuşak Detaylı Soy Ağacı</div>
                </div>
            )}

            <div className="pedigree-container custom-scrollbar">
                <div className="pedigree-grid">
                    <PedigreeNode 
                        node={pedigreeTree} 
                        col={1} 
                        row={1} 
                        span={totalRows} 
                        totalGens={genParam} 
                        colorMap={colorMap} 
                        isMale={true}
                        btSet={btSet}
                    />
                </div>
            </div>

            <div className="legend">
                <div className="legend-item"><span className="dot dot-blue"></span> Baba Hattı</div>
                <div className="legend-item"><span className="dot dot-pink"></span> Anne Hattı</div>
                <div className="legend-item"><span className="dot dot-multi"></span> Inbreeding (Akrabalık)</div>
                <div className="legend-item"><span style={{color:'#fedc00', fontSize:'0.85rem', fontWeight:900}}>★</span> BlackType Anne</div>
            </div>

            {/* DETAY BÖLÜMÜ - BLUR */}
            {horseDetail && (grupListedHome.length > 0 || racesCount > 0 || offspringCount > 0) && (
                <div className="blurred-details-wrapper">
                    <div className="blurred-content">
                        {racesCount > 0 && (
                            <div className="detail-preview-box">
                                <h2>🏇 Koşu Geçmişi — {racesCount} Birincilik</h2>
                                <div className="preview-row">Birincilik koşu detayları</div>
                                <div className="preview-row">Pist ve mesafe bilgileri</div>
                                <div className="preview-row">Şehir ve tarih verileri</div>
                            </div>
                        )}
                        {grupListedHome.length > 0 && (
                            <div className="detail-preview-box">
                                <h2>🏆 Grup & Listed — {grupListedHome.length} Başarı</h2>
                                {grupListedHome.slice(0, 3).map((g, i) => (
                                    <div key={i} className="preview-row">{g.kazanan_at} — {g.kosu_cins} — {g.mesafe}m</div>
                                ))}
                            </div>
                        )}
                        {offspringCount > 0 && (
                            <div className="detail-preview-box">
                                <h2>🐴 Yavrular — {offspringCount} Kayıt</h2>
                                <div className="preview-row">Yavru listesi ve kazanç bilgileri</div>
                                <div className="preview-row">Performans istatistikleri</div>
                            </div>
                        )}
                    </div>
                    <div className="blur-overlay">
                        <div className="blur-overlay-content">
                            <div style={{fontSize:'2.5rem', marginBottom: 12}}>🔒</div>
                            <div className="blur-title">Detaylı Bilgiler</div>
                            <div className="blur-sub">Koşu geçmişi, grup başarıları ve yavru bilgilerine erişmek için SoyLine tam sürümünü bekleyin.</div>
                            <span className="blur-cta">Çok Yakında</span>
                        </div>
                    </div>
                </div>
            )}

            {/* --- YENİ ARAMA BÖLÜMÜ --- */}
            <div className="new-search-section">
                <div>
                    <div className="ns-title" style={{textAlign:'center'}}>Yeni Pedigri Ara</div>
                    <div style={{color:'#94a3b8', fontSize:'0.9rem', textAlign:'center'}}>Başka bir atın soy ağacını incelemek için arama yapın.</div>
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
                    <button className="go-btn" onClick={handleNewSearch}>ARA <TbArrowRight /></button>
                </div>
            </div>

        </div>
    );
}

export default function PedigreeResultPage() {
    return (
        <Suspense fallback={<div style={{minHeight:'100vh', display:'grid', placeItems:'center', color:'#fedc00', background:'#020617'}}>Yükleniyor...</div>}>
            <PedigreeResultPageContent />
        </Suspense>
    );
}
