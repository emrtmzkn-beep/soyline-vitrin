'use client';
import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { TbArrowLeft, TbSearch, TbHorseToy, TbArrowRight } from 'react-icons/tb';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function searchAllHorsesByName(term, limit = 5) {
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

async function getHorseById(horseId) {
    const getKisrakBlacktype = async (id) => {
        if (!id) return null;
        const { data } = await supabase
            .from('kisrak')
            .select('blacktype')
            .eq('kisrak_id', id)
            .single();
        return data?.blacktype ?? null;
    };

    let { data, error } = await supabase
        .from('tum_at')
        .select('id, ad, baba_id, anne_id')
        .eq('id', horseId)
        .single();

    if (error || !data) {
        const fallback = await supabase
            .from('tum_atlar')
            .select('id, ad, baba_id, anne_id')
            .eq('id', horseId)
            .single();
        data = fallback.data;
    }

    if (data) {
        const blacktype = await getKisrakBlacktype(data.id);
        return { ...data, blacktype };
    }

    return data || null;
}

// --- REKÜRSİF PEDİGRİ HÜCRESİ ---
const PedigreeNode = ({ node, col, row, span, totalGens, colorMap, isMale }) => {
    if (col > totalGens) return null;
    
    const safeNode = node || {};
    const name = safeNode.ad || 'Bilinmiyor';
    const hasBlackType = !isMale && Number(safeNode.blacktype) > 0;
    
    const hasColor = colorMap[safeNode.id] && safeNode.id; 
    
    // Cinsiyet Renkleri
    const genderBorder = isMale ? '#3b82f6' : '#ec4899'; 
    const genderBg = isMale ? 'rgba(59, 130, 246, 0.15)' : 'rgba(236, 72, 153, 0.15)'; 

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
                <span className="name-inline">
                    <span>{name}</span>
                    {hasBlackType && <span className="bt-badge" title="Black Type">★ BT</span>}
                </span>
            </div>
            <PedigreeNode node={safeNode.baba} col={col + 1} row={row} span={span / 2} totalGens={totalGens} colorMap={colorMap} isMale={true} />
            <PedigreeNode node={safeNode.anne} col={col + 1} row={row + (span / 2)} span={span / 2} totalGens={totalGens} colorMap={colorMap} isMale={false} />
        </>
    );
};

function PedigreeResultContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const id = searchParams.get('id');
    const rawGen = parseInt(searchParams.get('gen') || '5');
    const genParam = [3, 5].includes(rawGen) ? rawGen : 5;
    const goldColor = '#fedc00';

    const [rootHorse, setRootHorse] = useState(null);
    const [pedigreeTree, setPedigreeTree] = useState(null);
    const [colorMap, setColorMap] = useState({});
    const [loading, setLoading] = useState(true);

    // Arama State'leri
    const [searchInput, setSearchInput] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedHorse, setSelectedHorse] = useState(null);
    const [generation, setGeneration] = useState(5);
    const searchRef = useRef(null);

    // --- Search Logic ---
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchInput.length >= 2) {
                const data = await searchAllHorsesByName(searchInput, 5);
                if (data.length > 0) {
                    setSearchResults(data);
                    setShowDropdown(true);
                } else {
                    setSearchResults([]);
                    setShowDropdown(false);
                }
            } else { setSearchResults([]); setShowDropdown(false); }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchInput]);

    // Dropdown Kapatma
    useEffect(() => {
        function handleClickOutside(event) {
            if (searchRef.current && !searchRef.current.contains(event.target)) setShowDropdown(false);
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Pedigri Çekme
    async function fetchPedigree(horseId, currentDepth, maxDepth) {
        if (currentDepth > maxDepth || !horseId) return null;
        const data = await getHorseById(horseId);
        if (!data) return null;
        const [babaNode, anneNode] = await Promise.all([
            fetchPedigree(data.baba_id, currentDepth + 1, maxDepth),
            fetchPedigree(data.anne_id, currentDepth + 1, maxDepth)
        ]);
        return { ...data, baba: babaNode, anne: anneNode };
    }

    // Renk Haritası
    function generateColorMap(tree) {
        const counts = {};
        const colors = {};
        const palette = ['#bef264', '#67e8f9', '#fca5a5', '#fdba74', '#d8b4fe', '#f0abfc']; 
        let colorIndex = 0;
        function traverseAncestors(node) {
            if (!node) return;
            if (node.id) counts[node.id] = (counts[node.id] || 0) + 1;
            traverseAncestors(node.baba); traverseAncestors(node.anne);
        }
        if(tree) { traverseAncestors(tree.baba); traverseAncestors(tree.anne); }
        Object.keys(counts).forEach(key => {
            if (counts[key] > 1) { colors[key] = palette[colorIndex % palette.length]; colorIndex++; }
        });
        return colors;
    }

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        fetchPedigree(id, 1, genParam).then(tree => {
            setPedigreeTree(tree);
            setRootHorse(tree);
            if(tree) setColorMap(generateColorMap(tree));
            setLoading(false);
        });
    }, [id, genParam]);

    const handleNewSearch = () => {
        if (selectedHorse) {
            router.push(`/pedigri?id=${selectedHorse.id}&gen=${generation}`);
            setSearchInput(''); setSelectedHorse(null); setShowDropdown(false);
        }
    };

    if (loading) return <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#020617', color:'#fedc00', fontSize:'1.5rem'}}>Pedigri Analiz Ediliyor...</div>;

    const totalRows = Math.pow(2, genParam - 1); 

    return (
        <div className="page-wrapper">
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&display=swap');
                body { background-color: #020617; color: #fff; margin: 0; font-family: 'Poppins', sans-serif; }
                
                .navbar { display: flex; align-items: center; justify-content: space-between; padding: 15px 40px; background: rgba(2, 6, 23, 0.95); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(255,255,255,0.05); height: 80px; position: fixed; top: 0; width: 100%; z-index: 100; box-sizing: border-box; }
                .logo-link { text-decoration: none; display: flex; align-items: center; font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 1.8rem; line-height: 1; letter-spacing: -0.5px; }
                .soy-text { color: #ffffff; }
                .line-wrapper { position: relative; display: flex; flex-direction: column; }
                .line-text { color: ${goldColor}; }
                .line-swosh { position: absolute; bottom: -6px; left: -5%; width: 110%; height: auto; pointer-events: none; }
                .nav-links { display: flex; gap: 25px; }
                .nav-links a { color: #cbd5e1; text-decoration: none; font-weight: 500; font-size: 0.95rem; transition: 0.2s; }
                .nav-links a:hover { color: ${goldColor}; }
                
                .page-wrapper { padding-top: 100px; padding-bottom: 80px; min-height: 100vh; display: flex; flex-direction: column; align-items: center; }
                .header-area { text-align: center; margin-bottom: 20px; }
                .p-title { font-family: 'Playfair Display', serif; font-size: 2rem; color: #fedc00; margin: 0; text-transform: uppercase; letter-spacing: 1px; }
                .p-sub { color: #94a3b8; font-size: 0.9rem; margin-top: 5px; }
                
                .back-link { position: absolute; top: 100px; left: 40px; color: #fff; text-decoration: none; display: flex; alignItems: center; gap: 5px; font-weight: bold; font-size: 0.9rem; background: rgba(255,255,255,0.05); padding: 8px 16px; border-radius: 50px; transition: 0.3s; }
                .back-link:hover { background: rgba(255,255,255,0.1); color: #fedc00; }

                .pedigree-container { width: 95%; max-width: 1400px; overflow-x: auto; padding: 10px; background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
                .pedigree-grid { display: grid; grid-template-columns: repeat(${genParam}, 1fr); grid-auto-rows: minmax(30px, auto); gap: 4px; min-width: ${genParam * 120}px; }
                .ped-cell { display: flex; align-items: center; justify-content: center; text-align: center; border-radius: 4px; transition: 0.2s; overflow: hidden; cursor: default; }
                .ped-cell:hover { transform: scale(1.05); z-index: 20; box-shadow: 0 0 10px rgba(0,0,0,0.5); }
                .name-inline { display: inline-flex; flex-direction: column; align-items: center; gap: 3px; min-width: 0; }
                .bt-badge { display: inline-flex; align-items: center; border: 1px solid rgba(254,220,0,0.65); background: #0f172a; color: #fedc00; border-radius: 999px; padding: 1px 5px; font-size: 0.5rem; font-weight: 800; line-height: 1; white-space: nowrap; }
                .bt-badge.legend { font-size: 0.62rem; padding: 2px 6px; }
                
                .legend { display: flex; gap: 15px; justify-content: center; margin-top: 15px; flex-wrap: wrap; margin-bottom: 50px; }
                .legend-item { display: flex; align-items: center; gap: 5px; font-size: 0.8rem; color: #cbd5e1; }
                .dot { width: 10px; height: 10px; border-radius: 50%; }
                .dot-blue { background: rgba(59, 130, 246, 0.5); border: 1px solid #3b82f6; }
                .dot-pink { background: rgba(236, 72, 153, 0.5); border: 1px solid #ec4899; }
                .dot-multi { background: linear-gradient(45deg, #bef264, #67e8f9); border: 1px solid #fff; }

                .new-search-section { width: 95%; max-width: 800px; background: #1e293b; padding: 30px; border-radius: 16px; border: 1px solid #334155; display: flex; flex-direction: column; align-items: center; gap: 20px; margin-top: 20px; }
                .ns-title { font-size: 1.2rem; font-weight: 700; color: #fff; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 1px; }
                .search-row { display: flex; width: 100%; gap: 10px; flex-wrap: wrap; justify-content: center; position: relative; }
                .input-group { flex: 1; min-width: 280px; position: relative; }
                .search-icon { position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: #64748b; font-size: 1.2rem; }
                .p-input { width: 100%; padding: 14px 20px 14px 45px; background: #0f172a; border: 1px solid #334155; color: #fff; border-radius: 10px; font-size: 1rem; outline: none; transition: 0.3s; box-sizing: border-box; }
                .p-input:focus { border-color: var(--gold); box-shadow: 0 0 0 2px rgba(254, 220, 0, 0.1); }

                .p-dropdown { position: absolute; top: 100%; left: 0; width: 100%; background: #1e293b; border: 1px solid #334155; border-radius: 10px; max-height: 300px; overflow-y: auto; z-index: 50; margin-top: 5px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
                .p-item { padding: 12px 20px; cursor: pointer; border-bottom: 1px solid #334155; transition: 0.2s; color: #cbd5e1; display: flex; justify-content: space-between; align-items: center; }
                .p-item:hover { background: #0f172a; color: var(--gold); }
                .pi-info { font-size: 0.8rem; color: #64748b; }

                .gen-options { display: flex; gap: 5px; background: #0f172a; padding: 5px; border-radius: 8px; border: 1px solid #334155; }
                .gen-btn { background: transparent; border: none; color: #64748b; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600; transition: 0.2s; }
                .gen-btn.active { background: #334155; color: #fff; }
                .gen-btn:hover { color: #fff; }
                
                .go-btn { background: linear-gradient(135deg, var(--gold) 0%, #b45309 100%); color: #000; border: none; padding: 0 30px; border-radius: 10px; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.3s; white-space: nowrap; }
                .go-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(234, 179, 8, 0.3); }

                @media (max-width: 900px) {
                    .navbar { padding: 15px 20px; } .nav-links { display: none; }
                    .back-link { position: static; margin-bottom: 20px; align-self: flex-start; margin-left: 20px; }
                    .search-row { flex-direction: column; }
                    .input-group { min-width: 0; width: 100%; }
                    .page-wrapper { padding-top: 90px; }
                    .p-title { font-size: 1.7rem; }
                    .pedigree-container { width: 100%; border-radius: 10px; padding: 8px; }
                    .new-search-section { width: 100%; padding: 20px 14px; border-radius: 12px; }
                    .gen-options { width: 100%; justify-content: center; }
                    .gen-btn { flex: 1; }
                    .go-btn { width: 100%; padding: 15px; justify-content: center; }
                }

                @media (max-width: 768px) {
                    .navbar { height: 72px; padding: 12px 16px; }
                    .logo-link { font-size: 1.5rem; }
                    .page-wrapper { padding-top: 86px; padding-bottom: 40px; }
                    .p-title { font-size: 1.45rem; }
                    .p-sub { font-size: 0.82rem; }
                    .pedigree-grid { min-width: ${genParam * 95}px; }
                    .legend { gap: 10px; margin-bottom: 30px; }
                    .back-link { margin-left: 12px; }
                    .p-item { flex-direction: column; align-items: flex-start; gap: 4px; }
                    .pi-info { font-size: 0.75rem; }
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
                    <svg className="line-swosh" viewBox="0 0 100 20" fill="none" preserveAspectRatio="none"><path d="M0 15 Q 50 0 100 12" stroke={goldColor} strokeWidth="3" strokeLinecap="round" /></svg>
                </div>
                </Link>
                
            </nav>

            <Link href="/" className="back-link"><TbArrowLeft /> Geri Dön</Link>

            <div className="header-area">
                <h1 className="p-title">{rootHorse?.ad || 'At'}</h1>
                <div className="p-sub">{genParam} Kuşak Detaylı Soy Ağacı</div>
            </div>

            <div className="pedigree-container custom-scrollbar">
                <div className="pedigree-grid">
                    <PedigreeNode node={pedigreeTree} col={1} row={1} span={totalRows} totalGens={genParam} colorMap={colorMap} isMale={true} />
                </div>
            </div>

            <div className="legend">
                <div className="legend-item"><span className="dot dot-blue"></span> Baba Hattı</div>
                <div className="legend-item"><span className="dot dot-pink"></span> Anne Hattı</div>
                <div className="legend-item"><span className="dot dot-multi"></span> Inbreeding (Akrabalık)</div>
                <div className="legend-item"><span className="bt-badge legend">★ BT</span> Black Type (kısrakta kalite göstergesi)</div>
            </div>

            <div className="new-search-section">
                <div>
                    <div className="ns-title" style={{textAlign:'center'}}>Yeni Pedigri Ara</div>
                    <div style={{color:'#94a3b8', fontSize:'0.9rem', textAlign:'center'}}>Başka bir atın soy ağacını incelemek için arama yapın.</div>
                </div>

                <div className="search-row" ref={searchRef}>
                    <div className="input-group">
                        <TbSearch className="search-icon" />
                        <input type="text" className="p-input" placeholder="At ismi yazmaya başlayın..." value={searchInput} onChange={(e) => { setSearchInput(e.target.value); if(!e.target.value) setSelectedHorse(null); }} onFocus={() => { if(searchResults.length>0) setShowDropdown(true); }} />
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

export default function Page() {
    return (
        <Suspense fallback={<div>Yükleniyor...</div>}>
            <PedigreeResultContent />
        </Suspense>
    );
}