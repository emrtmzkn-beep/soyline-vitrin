'use client';
import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { logStallionActivity } from '@/lib/stallion-activity';
import StallionCard from '@/components/StallionCard';
import {
  TbSearch, TbMapPin, TbFilter, TbSortAscending, TbSortDescending,
  TbCurrencyLira, TbHeart, TbHeartFilled, TbPhoto, TbVideo, TbFlag
} from 'react-icons/tb';

export default function Vitrin() {
  const router = useRouter();
  const [allAygirlar, setAllAygirlar] = useState([]);
  const [filteredAygirlar, setFilteredAygirlar] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [sortOrder, setSortOrder] = useState('name_asc');

  const [favorites, setFavorites] = useState([]);
  const [brokenImageIds, setBrokenImageIds] = useState([]);

  // Login Wall
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const goldColor = '#fedc00';

  useEffect(() => {
    async function verileriGetir() {
      // Auth check
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setIsLoggedIn(true);

      // Aygır bilgileri + tier
      const [{ data: aygirData, error: aygirErr }, { data: mediaData }] = await Promise.all([
        supabase.from('aygir').select('*').order('aygir_adi', { ascending: true }),
        supabase.from('aygirlarim').select('aygir_id, vitrin_gorseller, video_urls, banner_url'),
      ]);

      if (!aygirErr && aygirData) {
        // medya map oluştur: aygir_id -> { photos, videos, banner }
        const mediaMap = {};
        if (mediaData) {
          mediaData.forEach(m => {
            mediaMap[m.aygir_id] = {
              photos: Array.isArray(m.vitrin_gorseller) ? m.vitrin_gorseller.filter(Boolean) : [],
              videos: Array.isArray(m.video_urls) ? m.video_urls.filter(Boolean) : [],
              banner: m.banner_url || null,
            };
          });
        }

        const enriched = aygirData.map(a => ({
          ...a,
          _tier: a.tier || 'basic',
          _media: mediaMap[a.aygir_id] || { photos: [], videos: [], banner: null },
        }));
        setAllAygirlar(enriched);
        setFilteredAygirlar(enriched);
      }
      setLoading(false);
    }
    verileriGetir();
    const savedFavs = JSON.parse(localStorage.getItem('soyline_favs') || '[]');
    setFavorites(savedFavs);
  }, []);

  useEffect(() => {
    let result = [...allAygirlar];
    if (searchTerm) {
      result = result.filter(a =>
        a.aygir_adi.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.baba && a.baba.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    if (selectedLocation !== 'all') result = result.filter(a => a.asim_yeri === selectedLocation);
    if (priceRange !== 'all') {
      result = result.filter(a => {
        if (!a.asim_ucreti) return false;
        if (priceRange === 'priced') return a.asim_ucreti !== 'Fiyat Sorunuz';
        if (priceRange === 'ask') return a.asim_ucreti === 'Fiyat Sorunuz';
        return true;
      });
    }
    result.sort((a, b) => {
      // Elite aygırlar her zaman üstte
      const TIER_RANK = { elite: 2, pro: 1, basic: 0 };
      const tierDiff = (TIER_RANK[b._tier] || 0) - (TIER_RANK[a._tier] || 0);
      if (tierDiff !== 0) return tierDiff;

      if (sortOrder === 'name_asc') return a.aygir_adi.localeCompare(b.aygir_adi);
      if (sortOrder === 'name_desc') return b.aygir_adi.localeCompare(a.aygir_adi);
      if (sortOrder === 'kazanc_desc') return (parseFloat(String(b.kazanc).replace(/[^0-9]/g, '')) || 0) - (parseFloat(String(a.kazanc).replace(/[^0-9]/g, '')) || 0);
      if (sortOrder === 'kazanan_desc') return (b.kazanan_tay || 0) - (a.kazanan_tay || 0);
      if (sortOrder === 'bt_desc') return (b.blacktype || 0) - (a.blacktype || 0);
      if (sortOrder === 'tay_desc') return (b.kosan_tay || 0) - (a.kosan_tay || 0);
      return 0;
    });
    setFilteredAygirlar(result);
  }, [searchTerm, selectedLocation, priceRange, sortOrder, allAygirlar]);

  const locations = useMemo(() => {
    const locs = allAygirlar.map(a => a.asim_yeri).filter(l => l).map(l => l.trim());
    return [...new Set(locs)].sort();
  }, [allAygirlar]);

  const getImageUrl = (aygirAdi) => {
    if (!aygirAdi) return '';
    const trMap = { 'ç': 'c', 'Ç': 'c', 'ğ': 'g', 'Ğ': 'g', 'ş': 's', 'Ş': 's', 'ü': 'u', 'Ü': 'u', 'ı': 'i', 'İ': 'i', 'ö': 'o', 'Ö': 'o' };
    let t = aygirAdi.replace(/[çÇğĞşŞüÜıİöÖ]/g, h => trMap[h]).toLowerCase().trim().replace(/\s+/g, '_').replace(/[()]/g, '');
    const { data } = supabase.storage.from('stallions').getPublicUrl(`${t}.jpg`);
    return data.publicUrl;
  };

  const toggleFavorite = (e, id) => {
    e.preventDefault(); e.stopPropagation();
    let nf = favorites.includes(id) ? favorites.filter(f => f !== id) : [...favorites, id];
    setFavorites(nf);
    localStorage.setItem('soyline_favs', JSON.stringify(nf));
  };

  const trackDetailView = (stallion) => {
    logStallionActivity({ stallionId: stallion?.aygir_id, eventType: 'vitrin_detail_view', sourceModule: 'site_vitrin', summary: `${stallion?.aygir_adi || 'Aygır'} vitrin detay kartı açıldı.`, payload: { aygir_adi: stallion?.aygir_adi || null } }).catch(() => null);
  };

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&display=swap');
        :root { --bg-dark: #020617; --gold: #fedc00; --gold-dark: #d4af37; --card-bg: #0f172a; --border: #1e293b; }
        body { background-color: var(--bg-dark); margin: 0; font-family: 'Poppins', sans-serif; color: #fff; }

        .navbar { display: flex; align-items: center; justify-content: space-between; padding: 15px 40px; background: rgba(2, 6, 23, 0.85); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(255,255,255,0.05); height: 80px; position: fixed; top: 0; width: 100%; z-index: 100; box-sizing: border-box; }
        .logo-link { text-decoration: none; display: flex; align-items: center; font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 1.8rem; line-height: 1; letter-spacing: -0.5px; }
        .soy-text { color: #ffffff; }
        .line-wrapper { position: relative; display: flex; flex-direction: column; }
        .line-text { color: var(--gold); }
        .line-swosh { position: absolute; bottom: -6px; left: -5%; width: 110%; height: auto; pointer-events: none; }
        .nav-links { display: flex; gap: 25px; }
        .nav-links a { color: #cbd5e1; text-decoration: none; font-weight: 500; font-size: 0.95rem; transition: 0.2s; }
        .nav-links a:hover { color: var(--gold); }
        .btn-login { color: #fff; text-decoration: none; padding: 8px 20px; font-weight: 600; transition: 0.2s; }
        .btn-outline-nav { color: var(--gold); border: 1px solid var(--gold); padding: 8px 24px; border-radius: 50px; text-decoration: none; font-weight: 600; transition: 0.2s; }
        .btn-outline-nav:hover { background: rgba(254, 220, 0, 0.15); box-shadow: 0 0 15px rgba(254,220,0,0.2); }

        .page-header { text-align: center; padding: 120px 20px 40px 20px; background: linear-gradient(180deg, #0f172a 0%, #020617 100%); }
        .page-title { font-family: 'Playfair Display', serif; font-size: 3.5rem; margin: 0 0 15px 0; color: #fff; }
        .page-desc { color: #94a3b8; max-width: 600px; margin: 0 auto; font-size: 1.1rem; margin-bottom: 30px; }

        .filter-bar { max-width: 1200px; margin: 0 auto 50px auto; background: #1e293b; padding: 20px; border-radius: 16px; border: 1px solid #334155; display: flex; gap: 15px; flex-wrap: wrap; align-items: center; justify-content: center; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
        .search-group { flex: 2; min-width: 250px; position: relative; }
        .filter-input { width: 100%; padding: 14px 20px 14px 45px; background: #0f172a; border: 1px solid #334155; color: #fff; border-radius: 10px; font-size: 1rem; outline: none; transition: 0.3s; box-sizing: border-box; }
        .filter-input:focus { border-color: var(--gold); box-shadow: 0 0 0 2px rgba(254, 220, 0, 0.1); }
        .search-icon { position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: #64748b; font-size: 1.2rem; }
        .filter-select { flex: 1; min-width: 180px; padding: 14px 20px; background: #0f172a; border: 1px solid #334155; color: #fff; border-radius: 10px; font-size: 1rem; outline: none; cursor: pointer; appearance: none; }
        .filter-select:focus { border-color: var(--gold); }
        .result-count { width: 100%; text-align: center; color: #64748b; font-size: 0.9rem; margin-top: 10px; }

        .vitrin-grid { padding: 0 5% 120px 5%; display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 30px; max-width: 1400px; margin: 0 auto; }

        @media (max-width: 900px) {
          .navbar { padding: 15px 20px; }
          .nav-links { display: none; }
          .navbar > div:last-child { display: none; }
          .page-title { font-size: 2.5rem; }
          .filter-bar { flex-direction: column; align-items: stretch; gap: 10px; }
          .search-group, .filter-select { width: 100%; min-width: 100%; }
          .vitrin-grid { grid-template-columns: 1fr; padding: 0 12px 100px 12px; gap: 20px; }
        }

        @media (max-width: 520px) {
          .page-header { padding: 110px 12px 30px; }
          .page-title { font-size: 2rem; }
          .page-desc { font-size: 0.95rem; }
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
        <div className="nav-links">
          <Link href="/">Ana Sayfa</Link>
          <Link href="/ozellikler">Özellikler</Link>
          <Link href="/vitrin" style={{ color: goldColor }}>Aygır Vitrini</Link>
          <Link href="/kurumsal">Kurumsal</Link>
          <Link href="/iletisim">İletişim</Link>
          <Link href="/urunler">Ürünler</Link>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/auth/login" className="btn-login">Giriş Yap</Link>
          <Link href="/auth/register" className="btn-outline-nav">Kayıt Ol</Link>
        </div>
      </nav>

      {/* HEADER */}
      <div className="page-header">
        <h1 className="page-title">Şampiyon Aygırlar</h1>
        <p className="page-desc">Türkiye'nin en seçkin aygırları SoyLine vitrininde. Genetik uyum ve performans verilerini inceleyin, doğru eşleşmeyi yapın.</p>

        <div className="filter-bar">
          <div className="search-group">
            <TbSearch className="search-icon" />
            <input type="text" placeholder="Aygır veya Baba adı ile ara..." className="filter-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <select className="filter-select" value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)}>
            <option value="all">Tüm Şehirler</option>
            {locations.map((loc, i) => <option key={i} value={loc}>{loc}</option>)}
          </select>
          <select className="filter-select" value={priceRange} onChange={(e) => setPriceRange(e.target.value)}>
            <option value="all">Tüm Fiyatlar</option>
            <option value="priced">Fiyatı Olanlar</option>
            <option value="ask">Fiyat Sorunuz</option>
          </select>
          <select className="filter-select" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
            <option value="name_asc">İsim (A-Z)</option>
            <option value="name_desc">İsim (Z-A)</option>
            <option value="kazanc_desc">Kazanç (Yüksek)</option>
            <option value="kazanan_desc">Kazanan Tay (Yüksek)</option>
            <option value="bt_desc">BlackType (Yüksek)</option>
            <option value="tay_desc">Toplam Tay (Yüksek)</option>
          </select>
        </div>

        <div className="result-count">
          Toplam <strong>{filteredAygirlar.length}</strong> aygır listeleniyor.
        </div>
      </div>

      {/* GRID */}
      <div className="vitrin-grid">
        {loading ? (
          <div style={{ color: '#d4af37', textAlign: 'center', gridColumn: '1/-1', padding: '50px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            Şampiyonlar Yükleniyor...
          </div>
        ) : filteredAygirlar.length > 0 ? (
          filteredAygirlar.map(at => (
            <StallionCard
              key={at.aygir_id}
              stallion={at}
              variant="public"
              isLocked={!isLoggedIn}
              favorites={favorites}
              onToggleFav={toggleFavorite}
              brokenImgs={brokenImageIds}
              onImgError={(id) => setBrokenImageIds(prev => prev.includes(id) ? prev : [...prev, id])}
              getImageUrl={getImageUrl}
            />
          ))
        ) : (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#64748b' }}>
            Aradığınız kriterlere uygun aygır bulunamadı.
          </div>
        )}
      </div>




    </>
  );
}
