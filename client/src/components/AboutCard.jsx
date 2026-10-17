import { useState } from 'react';

const PHOTO = '/assets/dipesh.jpg';
const INSTAGRAM = 'https://www.instagram.com/dip_esh1230';
const EMAIL = 'joshidipesh231@gmail.com';

export default function AboutCard({ compact = false }) {
  const [imgOk, setImgOk] = useState(true);

  return (
    <section className={`about-card${compact ? ' compact' : ''}`} aria-label="About the creator">
      {imgOk ? (
        <img
          src={PHOTO}
          alt="Dipesh Joshi"
          className="about-photo"
          loading="lazy"
          onError={() => setImgOk(false)}
        />
      ) : (
        <div className="about-photo fallback" aria-hidden="true">
          DJ
        </div>
      )}
      <h3 className="about-name">Dipesh Joshi</h3>
      <p className="about-role muted small">Creator of Oja</p>
      <div className="about-links">
        <a href={INSTAGRAM} target="_blank" rel="noopener noreferrer" title="Instagram">
          <span aria-hidden="true">📸</span> @dip_esh1230
        </a>
        <a href={`mailto:${EMAIL}`} title="Email">
          <span aria-hidden="true">✉️</span> {EMAIL}
        </a>
      </div>
    </section>
  );
}
