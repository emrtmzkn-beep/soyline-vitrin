'use client';
import { Suspense, useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { TbArrowLeft, TbDna, TbGenderMale, TbGenderFemale, TbSearch } from 'react-icons/tb';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// --- PEDİGRİ HÜCRESİ ---
const PedigreeNode = ({ node, col, row, span, totalGens, colorMap, isMale }) => {
    if (col > totalGens) return null;
    
    const safeNode = node || {};
    const name = safeNode.ad || 'Bilinmiyor';
    const hasColor = colorMap[safeNode.id] && safeNode.id && safeNode.id !== 'virtual_foal';
    
    const genderBorder = isMale ? '#3b82f6' : '#ec4899'; 
    const genderBg = isMale ? 'rgba(59, 130, 246, 0.15)' : 'rgba(236, 72, 153, 0.15)'; 

    // Muhtemel Tay için özel stil
    const isVirtual = safeNode.id === 'virtual_foal';
    
    const style = {
        gridColumn: col,
        gridRow: `${row} / span ${span}`,
        backgroundColor: isVirtual ? '#fedc00' : (hasColor ? colorMap[safeNode.id] : genderBg),
        color: isVirtual ? '#000' : (hasColor ? '#000' : '#e2e8f0'),
        border: isVirtual ? '2px solid #fff' : (hasColor ? '1px solid #fff' : `1px solid ${genderBorder}`),
        fontWeight: (hasColor || isVirtual) ? '800' : '500',
        fontSize: col > 4 ? '0.65rem' : '0.75rem', 
        boxShadow: (hasColor || isVirtual) ? '0 0 15px rgba(255,255,255,0.3)' : 'none',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', padding: '0 4px',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
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

function PotentialPedigreePageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const sireIdParam = searchParams.get('sire_id');
    const damIdParam = searchParams.get('dam_id');
    const genParam = parseInt(searchParams.get('gen') || '5');
    const goldColor = '#fedc00';

    const [pedigreeTree, setPedigreeTree] = useState(null);
    const [colorMap, setColorMap] = useState({});
    const [loading, setLoading] = useState(true);

    // --- ARAMA STATE'LERİ ---
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

    // --- VERİ ÇEKME (PEDİGRİ AĞACI) ---
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
            if (node.id && node.id !== 'virtual_foal') counts[node.id] = (counts[node.id] || 0) + 1;
            traverseAncestors(node.baba);
            traverseAncestors(node.anne);
        }
        if(tree) { traverseAncestors(tree.baba); traverseAncestors(tree.anne); }
        
        Object.keys(counts).forEach(key => {
            if (counts[key] > 1) { colors[key] = palette[colorIndex % palette.length]; colorIndex++; }
        });
        return colors;
    }

    useEffect(() => {
        if (!sireIdParam || !damIdParam) return;
        setLoading(true);

        Promise.all([
            fetchPedigree(sireIdParam, 2, genParam), 
            fetchPedigree(damIdParam, 2, genParam)
        ]).then(([sireTree, damTree]) => {
            const virtualFoal = {
                id: 'virtual_foal',
                ad: 'Muhtemel Tay',
                baba: sireTree,
                anne: damTree
            };
            
            setPedigreeTree(virtualFoal);
            const map = generateColorMap(virtualFoal);
            setColorMap(map);
            setLoading(false);

            // Log pedigree view
            supabase.from('pedigree_views').insert({ page_type: 'muhtemel', horse_id: `${sireIdParam}_${damIdParam}` }).then(() => {});
        });
    }, [sireIdParam, damIdParam, genParam]);

    // --- ARAMA İŞLEVLERİ (BABA) ---
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (sireInput.length > 2) {
                const { data, error } = await supabase
                    .from('aygir')
                    .select('aygir_id, aygir_adi, baba')
                    .ilike('aygir_adi', `%${sireInput}%`)
                    .limit(5);
                
                if (!error && data) {
                    setSireResults(data);
                    setShowSireDropdown(true);
                }
            } else {
                setSireResults([]);
                setShowSireDropdown(false);
            }
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [sireInput]);

    // --- ARAMA İŞLEVLERİ (ANNE) ---
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (damInput.length > 2) {
                const { data, error } = await supabase
                    .from('kisrak')
                    .select('kisrak_id, ad, baba')
                    .ilike('ad', `%${damInput}%`)
                    .limit(5);
                
                if (!error && data) {
                    setDamResults(data);
                    setShowDamDropdown(true);
                }
            } else {
                setDamResults([]);
                setShowDamDropdown(false);
            }
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [damInput]);

    // Dropdown kapatma
    useEffect(() => {
        function handleClickOutside(event) {
            if (sireRef.current && !sireRef.current.contains(event.target)) setShowSireDropdown(false);
            if (damRef.current && !damRef.current.contains(event.target)) setShowDamDropdown(false);
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleFoalSearch = () => {
        if (selectedSire && selectedDam) {
            router.push(`/pedigri/muhtemel?sire_id=${selectedSire.aygir_id}&dam_id=${selectedDam.kisrak_id}&gen=${foalGen}`);
            setSireInput('');
            setDamInput('');
            setSelectedSire(null);
            setSelectedDam(null);
        } else {
            alert("Lütfen hem Baba hem de Anne seçiniz.");
        }
    };

    if (loading) return (
        <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#020617', color:'#fedc00', fontSize:'1.5rem'}}>
            Muhtemel Pedigri Oluşturuluyor...
        </div>
    );

    const totalRows = Math.pow(2, genParam - 1); 

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

                .pedigree-container { width: 95%; max-width: 1400px; overflow-x: auto; padding: 10px; background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
                .pedigree-grid { display: grid; grid-template-columns: repeat(${genParam}, 1fr); grid-auto-rows: minmax(30px, auto); gap: 4px; min-width: ${genParam * 120}px; }
                .ped-cell { display: flex; align-items: center; justify-content: center; text-align: center; border-radius: 4px; transition: 0.2s; overflow: hidden; cursor: default; }
                .ped-cell:hover { transform: scale(1.05); z-index: 20; box-shadow: 0 0 10px rgba(0,0,0,0.5); }
                
                .legend { display: flex; gap: 15px; justify-content: center; margin-top: 15px; flex-wrap: wrap; margin-bottom: 50px; }
                .legend-item { display: flex; align-items: center; gap: 5px; font-size: 0.8rem; color: #cbd5e1; }
                .dot { width: 10px; height: 10px; border-radius: 50%; }
                .dot-blue { background: rgba(59, 130, 246, 0.5); border: 1px solid #3b82f6; }
                .dot-pink { background: rgba(236, 72, 153, 0.5); border: 1px solid #ec4899; }
                .dot-multi { background: linear-gradient(45deg, #bef264, #67e8f9); border: 1px solid #fff; }

                /* --- YENİ MUHTEMEL TAY ARAMA BÖLÜMÜ --- */
                .new-search-section {
                    width: 95%; max-width: 900px;
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
                .search-row { display: flex; width: 100%; gap: 15px; flex-wrap: wrap; justify-content: center; position: relative; }
                
                .input-group { flex: 1; min-width: 250px; position: relative; }
                .search-icon { position: absolute; left: 15px; top: 50%; transform: translateY(-50%); font-size: 1.2rem; }
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
                    .input-group { min-width: 0; width: 100%; }
                    .gen-options { width: 100%; justify-content: center; }
                    .go-btn { width: 100%; padding: 15px; justify-content: center; }
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
                    .new-search-section { width: 100%; padding: 20px 14px; border-radius: 12px; }
                    .gen-btn { flex: 1; }
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

            <div className="header-area">
                <h1 className="p-title">Muhtemel Tay</h1>
                <div className="p-sub">{pedigreeTree?.baba?.ad} x {pedigreeTree?.anne?.ad}</div>
                <div style={{fontSize:'0.8rem', color:'#64748b', marginTop:'5px'}}>{genParam} Kuşak Detaylı Soy Ağacı</div>
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
            </div>

            {/* --- YENİ MUHTEMEL TAY ARAMA BÖLÜMÜ --- */}
            <div className="new-search-section">
                <div>
                    <div className="ns-title" style={{textAlign:'center'}}>Yeni Muhtemel Tay Oluştur</div>
                    <div style={{color:'#94a3b8', fontSize:'0.9rem', textAlign:'center'}}>Farklı bir eşleşme denemek için aşağıdan seçim yapın.</div>
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
            </div>

        </div>
    );
}

export default function PotentialPedigreePage() {
    return (
        <Suspense fallback={<div style={{minHeight:'100vh', display:'grid', placeItems:'center', color:'#fedc00', background:'#020617'}}>Yükleniyor...</div>}>
            <PotentialPedigreePageContent />
        </Suspense>
    );
}
