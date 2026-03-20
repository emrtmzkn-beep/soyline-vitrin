'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import './CountdownTimer.css';

const TARGET = new Date('2026-03-31T23:59:00+03:00');

function getTimeLeft() {
  const now = new Date();
  const diff = TARGET - now;
  if (diff <= 0) return null;
  return {
    gun: Math.floor(diff / (1000 * 60 * 60 * 24)),
    saat: Math.floor((diff / (1000 * 60 * 60)) % 24),
    dakika: Math.floor((diff / (1000 * 60)) % 60),
    saniye: Math.floor((diff / 1000) % 60),
  };
}

export default function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (timeLeft === null) {
    return (
      <section className="countdown-section">
        <motion.div
          className="countdown-launched"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          🎉 Lansman Başladı!
        </motion.div>
      </section>
    );
  }

  const boxes = [
    { value: timeLeft.gun, label: 'GÜN' },
    { value: timeLeft.saat, label: 'SAAT' },
    { value: timeLeft.dakika, label: 'DAKİKA' },
    { value: timeLeft.saniye, label: 'SANİYE' },
  ];

  return (
    <section className="countdown-section">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="countdown-inner"
      >
        <h2 className="countdown-title">Kurucu Üye Kampanyası</h2>
        <div className="countdown-boxes">
          {boxes.map((box, i) => (
            <div key={i} className="countdown-box">
              <span className="countdown-number">{String(box.value).padStart(2, '0')}</span>
              <span className="countdown-label">{box.label}</span>
            </div>
          ))}
        </div>
        <p className="countdown-sub">İlk 165 kişiye özel kurucu üye avantajları</p>
      </motion.div>
    </section>
  );
}
