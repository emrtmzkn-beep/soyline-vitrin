'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { TbArrowLeft, TbDna } from 'react-icons/tb';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function getHorseById(horseId) {
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

    return data || null;
}

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

function MuhtemelContent() {
    const searchParams = useSearchParams();
    const sireId = searchParams.get('sire_id');
    const damId = searchParams.get('dam_id');
    const rawGen = parseInt(searchParams.get('gen') || '5');
    const genParam = [3, 5].includes(rawGen) ? rawGen : 5;
    const goldColor = '#fedc00';

    const [tree, setTree] = useState(null);
    const [colorMap, setColorMap] = useState({});
    const [loading, setLoading] = useState(true);

    async function fetchPedigree(horseId, depth) {
        if (depth > genParam || !horseId) return null;
        const data = await getHorseById(horseId);
        if (!data) return null;
        const [baba, anne] = await Promise.all([
            fetchPedigree(data.baba_id, depth + 1),
            fetchPedigree(data.anne_id, depth + 1)
        ]);
        return { ...data, baba, anne };
    }

    function generateColorMap(tree) {
        const counts = {};
        const colors = {};
        const palette = ['#bef264', '#67e8f9', '#fca5a5', '#fdba74', '#d8b4fe', '#f0abfc']; 
        let cIdx = 0;
        function traverse(n) {
            if(!n) return;
            if(n.id && n.id !== 'virtual_foal') counts[n.id] = (counts[n.id] || 0) + 1;
            traverse(n.baba); traverse(n.anne);
        }
        traverse(tree);
        Object.keys(counts).forEach(k => {
            if(counts[k] > 1) { colors[k] = palette[cIdx % palette.length]; cIdx++; }
        });
        return colors;
    }

    // Aygır ve Kısrak tablolarından ID -> tum_atlar eşleşmesi
    // NOT: Veritabanında Aygır/Kısrak ID'lerinin tum_atlar ID'si ile aynı olduğunu varsayıyoruz.
    // Farklıysa önce tum_atlar'dan o ismi arayıp ID'sini bulmamız gerekir.
    // Şimdilik doğrudan ID ile sorguluyoruz:
    
    useEffect(() => {
        if(sireId && damId) {
            setLoading(true);
            Promise.all([
                fetchPedigree(sireId, 2), // 2. seviyeden başla (baba/anne olarak)
                fetchPedigree(damId, 2)
            ]).then(([sireTree, damTree]) => {
                const virtualFoal = {
                    id: 'virtual_foal',
                    ad: 'Muhtemel Tay',
                    baba: sireTree,
                    anne: damTree
                };
                setTree(virtualFoal);
                setColorMap(generateColorMap(virtualFoal));
                setLoading(false);
            });
        }
    }, [sireId, damId, genParam]);

    if(loading) return <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#020617', color:'#fedc00', fontSize:'1.5rem'}}>Muhtemel Tay Oluşturuluyor...</div>;

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
                .legend { display: flex; gap: 15px; justify-content: center; margin-top: 15px; flex-wrap: wrap; margin-bottom: 50px; }
                .legend-item { display: flex; align-items: center; gap: 5px; font-size: 0.8rem; color: #cbd5e1; }
                .dot { width: 10px; height: 10px; border-radius: 50%; }
                .dot-blue { background: rgba(59, 130, 246, 0.5); border: 1px solid #3b82f6; }
                .dot-pink { background: rgba(236, 72, 153, 0.5); border: 1px solid #ec4899; }
                .dot-multi { background: linear-gradient(45deg, #bef264, #67e8f9); border: 1px solid #fff; }

                @media (max-width: 900px) {
                    .navbar { padding: 15px 20px; } .nav-links { display: none; }
                    .back-link { position: static; margin-bottom: 20px; align-self: flex-start; margin-left: 20px; }
                    .page-wrapper { padding-top: 90px; }
                    .p-title { font-size: 1.7rem; }
                    .pedigree-container { width: 100%; border-radius: 10px; padding: 8px; }
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
                }

                @media (max-width: 480px) {
                    .p-title { font-size: 1.25rem; }
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

            <Link href="/" className="back-link"><TbArrowLeft /> Yeni Eşleşme</Link>

            <div className="header-area">
                <h1 className="p-title">Muhtemel Tay Pedigri</h1>
                <div className="p-sub">{tree?.baba?.ad} x {tree?.anne?.ad}</div>
                <div style={{fontSize:'0.8rem', color:'#64748b', marginTop:'5px'}}>{genParam} Kuşak Analiz</div>
            </div>

            <div className="pedigree-container custom-scrollbar">
                <div className="pedigree-grid">
                    <PedigreeNode node={tree} col={1} row={1} span={totalRows} totalGens={genParam} colorMap={colorMap} isMale={true} />
                </div>
            </div>

            <div className="legend">
                <div className="legend-item"><span className="dot dot-blue"></span> Baba Hattı</div>
                <div className="legend-item"><span className="dot dot-pink"></span> Anne Hattı</div>
                <div className="legend-item"><span className="dot dot-multi"></span> Inbreeding (Akrabalık)</div>
            </div>
        </div>
    );
}

export default function Page() {
    return (
        <Suspense fallback={<div>Yükleniyor...</div>}>
            <MuhtemelContent />
        </Suspense>
    );
}