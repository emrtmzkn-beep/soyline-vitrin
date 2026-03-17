'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  TbMapPin, TbCurrencyLira, TbHeart, TbHeartFilled,
  TbPhoto, TbVideo, TbFlag, TbLock,
} from 'react-icons/tb';
import './StallionCard.css';

export default function StallionCard({
  stallion: s,
  variant = 'public',
  isLocked = false,
  favorites = [],
  onToggleFav,
  brokenImgs = [],
  onImgError,
  getImageUrl,
  panelMeta = {},
}) {
  const [showOverlay, setShowOverlay] = useState(false);

  const isPanel = variant === 'panel';
  const tier = s._tier || 'basic';
  const isElite = tier === 'elite';
  const isPro = tier === 'pro';
  const winRate = s.kosan_tay ? ((s.kazanan_tay || 0) / s.kosan_tay * 100).toFixed(0) : 0;
  const isFav = favorites.includes(s.aygir_id);

  const photos = isPanel ? (s._photos || []) : (s._media?.photos || []);
  const videos = isPanel ? (s._videos || []) : (s._media?.videos || []);
  const heroImg = photos.length > 0 ? photos[0] : (getImageUrl ? getImageUrl(s.aygir_adi) : '');
  const isBroken = brokenImgs.includes(s.aygir_id);

  const SEZON_META = panelMeta.sezonMeta || {};
  const sezon = isPanel ? (SEZON_META[s._sezon] || { label: 'Aktif Sezon', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' }) : null;
  const isOwner = isPanel && s._isOwner;

  const href = isPanel ? `/panel/vitrin/${s.aygir_id}` : `/aygir/${s.aygir_id}`;

  const borderStyle = isElite
    ? { borderColor: 'rgba(139,92,246,0.5)', boxShadow: '0 8px 30px rgba(139,92,246,0.12)' }
    : isPro
      ? { borderColor: 'rgba(212,175,55,0.4)', boxShadow: '0 8px 25px rgba(212,175,55,0.08)' }
      : {};

  const cardContent = (
    <>
      {isElite && <div className={`sc-tier sc-tier-elite${isPanel ? ' sc-tier-panel' : ''}`}>{isPanel ? '👑 ELİTE' : '⭐ Elite'}</div>}
      {isPro && !isElite && <div className={`sc-tier sc-tier-pro${isPanel ? ' sc-tier-panel' : ''}`}>🏆 {isPanel ? 'PRO' : 'Pro'}</div>}

      {isPanel && sezon && (
        <div className="sc-sezon" style={{ background: sezon.bg, color: sezon.color }}>{sezon.label}</div>
      )}

      {!isPanel && s.sahip === 'TJK' && (
        <div className="sc-tjk"><Image src="/tjk_logo.png" alt="TJK" width={32} height={32} /></div>
      )}

      {(photos.length > 1 || videos.length > 0 || (isPanel && (s._duyuruCount || 0) > 0)) && (
        <div className={isPanel ? 'sc-media-badges sc-media-bottom' : 'sc-media-badges sc-media-top'}>
          {photos.length > 1 && <span className="sc-mbadge"><TbPhoto size={13} /> {photos.length}</span>}
          {videos.length > 0 && <span className="sc-mbadge sc-mbadge-vid"><TbVideo size={13} /> {videos.length}</span>}
          {isPanel && s._duyuruCount > 0 && <span className="sc-mbadge sc-mbadge-ann"><TbFlag size={13} /> {s._duyuruCount}</span>}
        </div>
      )}

      <div className="sc-img-wrap">
        {!isBroken ? (
          <Image
            src={heroImg}
            alt={s.aygir_adi}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            style={{ objectFit: 'cover' }}
            onError={() => onImgError && onImgError(s.aygir_id)}
          />
        ) : (
          <div className="sc-img-fallback">{String(s.aygir_adi || '?').charAt(0)}</div>
        )}
        <div className="sc-img-gradient" />
      </div>

      <div className={`sc-info${showOverlay ? ' sc-info-blur' : ''}`}>
        <button
          className={`sc-fav-btn ${isFav ? 'active' : ''}`}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleFav && onToggleFav(e, s.aygir_id); }}
        >
          {isFav ? <TbHeartFilled size={18} /> : <TbHeart size={18} />}
        </button>

        <h3 className="sc-name">{s.aygir_adi}</h3>

        {isPanel && s._ownerTitle && (
          <p className="sc-owner-title">"{s._ownerTitle}"</p>
        )}

        <div className="sc-pedigree">
          <span style={{ color: '#d4af37' }}>{isPanel ? 'B:' : 'Baba:'}</span> {s.baba || '?'}
          {s.anne && <><span className="sc-sep">|</span><span style={{ color: '#d4af37' }}>{isPanel ? 'A:' : 'Anne:'}</span> {s.anne}</>}
        </div>

        {!isPanel && s.cidago && (
          <div className="sc-cidago">
            <span>📏</span>
            <span className="sc-cidago-lbl">Cidago:</span>
            <span className="sc-cidago-val">{s.cidago} cm</span>
          </div>
        )}

        <div className="sc-stats">
          <div className="sc-stat"><span className="sc-stat-val">{s.kosan_tay || 0}</span><span className="sc-stat-lbl">{isPanel ? 'Tay' : 'Koşan Tay'}</span></div>
          <div className="sc-stat"><span className="sc-stat-val">{s.kazanan_tay || 0}</span><span className="sc-stat-lbl">Kazanan</span></div>
          <div className="sc-stat">
            <span className="sc-stat-val" style={{ color: (s.blacktype || 0) >= 10 ? '#fedc00' : (s.blacktype || 0) >= 5 ? '#f59e0b' : '#fff' }}>{s.blacktype || 0}</span>
            <span className="sc-stat-lbl">BT</span>
          </div>
          <div className="sc-stat">
            <span className="sc-stat-val sc-stat-sm" style={{ color: s.en_iyi_derece?.includes('Grup') ? '#fedc00' : '#94a3b8' }}>{s.en_iyi_derece || '-'}</span>
            <span className="sc-stat-lbl">Derece</span>
          </div>
        </div>

        {!isPanel && (s.puan_cim || s.puan_kum) && (
          <div className="sc-puan-bars">
            <div className="sc-puan-item"><div className="sc-puan-lbl">Çim</div><div className="sc-puan-track"><div className="sc-puan-fill" style={{ width: `${s.puan_cim || 0}%`, background: '#10b981' }} /></div></div>
            <div className="sc-puan-item"><div className="sc-puan-lbl">Kum</div><div className="sc-puan-track"><div className="sc-puan-fill" style={{ width: `${s.puan_kum || 0}%`, background: '#f59e0b' }} /></div></div>
            <div className="sc-puan-item"><div className="sc-puan-lbl">Kısa</div><div className="sc-puan-track"><div className="sc-puan-fill" style={{ width: `${s.puan_kisa || 0}%`, background: '#3b82f6' }} /></div></div>
            <div className="sc-puan-item"><div className="sc-puan-lbl">Uzun</div><div className="sc-puan-track"><div className="sc-puan-fill" style={{ width: `${s.puan_uzun || 0}%`, background: '#8b5cf6' }} /></div></div>
          </div>
        )}

        <div className="sc-wr-row">
          <span className="sc-wr-lbl">{isPanel ? 'Kazanma' : 'Kazanma Oranı'}</span>
          <div className="sc-wr-track"><div className="sc-wr-fill" style={{ width: `${Math.min(winRate, 100)}%` }} /></div>
          <span className="sc-wr-val">%{winRate}</span>
        </div>

        <div className="sc-footer">
          <span className="sc-loc"><TbMapPin size={14} /> {s.asim_yeri || (isPanel ? 'MRK' : 'MERKEZ')}</span>
          <span className="sc-price">
            {!isPanel && s.asim_ucreti && s.asim_ucreti !== 'Fiyat Sorunuz' && <TbCurrencyLira />}
            {isPanel
              ? (s._ownerPrice || s.asim_ucreti || 'Fiyat Sorunuz')
              : (s.asim_ucreti ? `${s.asim_ucreti}` : 'Fiyat Sorunuz')
            }
          </span>
        </div>

        {isOwner && <div className="sc-owner-badge">Sizin Aygırınız</div>}
      </div>

      {showOverlay && (
        <div className="sc-lock-overlay">
          <div className="sc-lock-icon"><TbLock size={28} /></div>
          <h4 className="sc-lock-title">Detayları Keşfet</h4>
          <ul className="sc-lock-features">
            <li>📊 Detaylı performans analizi</li>
            <li>🧬 Pedigri & genetik uyum</li>
            <li>🏇 Eşleşme önerileri</li>
            <li>📸 Galeri & video içerikleri</li>
            <li>💰 Güncel aşım ücretleri</li>
          </ul>
          <span className="sc-lock-cta" style={{ cursor: 'default' }}>
            Çok Yakında
          </span>
          <button className="sc-lock-close" onClick={(e) => { e.stopPropagation(); setShowOverlay(false); }}>✕</button>
        </div>
      )}
    </>
  );

  if (isLocked) {
    return (
      <div
        className="sc-card sc-card-locked"
        style={{ ...borderStyle, cursor: 'pointer' }}
        onClick={() => setShowOverlay(true)}
      >
        {cardContent}
      </div>
    );
  }

  return (
    <Link href={href} className="sc-card" style={borderStyle}>
      {cardContent}
    </Link>
  );
}
