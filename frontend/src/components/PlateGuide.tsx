import './PlateGuide.css';

/**
 * Malaysian Healthy Plate (Pinggan Sihat Malaysia) from the Ministry of Health:
 * "suku-suku separuh" — a quarter grains, a quarter protein, half vegetables and fruit.
 */
export function PlateGuide() {
  return (
    <section className="card plate-guide" aria-labelledby="plate-guide-title">
      <svg viewBox="0 0 100 100" width="88" height="88" aria-hidden="true">
        <circle cx="50" cy="50" r="48" fill="#fff" />
        <circle cx="50" cy="50" r="48" fill="none" stroke="#e6e8ec" strokeWidth="2" />
        <path d="M50 8a42 42 0 0 1 0 84z" fill="#4caf50" />
        <path d="M50 50V8a42 42 0 0 0-42 42z" fill="#f2c94c" />
        <path d="M50 50H8a42 42 0 0 0 42 42z" fill="#e8743b" />
        <path d="M50 8v84M8 50h42" stroke="#fff" strokeWidth="2.5" />
        <circle cx="70" cy="38" r="5" fill="#2e7d32" />
        <circle cx="66" cy="62" r="6" fill="#ef5350" />
        <circle cx="31" cy="34" r="4" fill="#fff6d5" />
        <circle cx="31" cy="66" r="4.5" fill="#b4532a" />
      </svg>
      <div>
        <p className="plate-guide__eyebrow">Pinggan Sihat Malaysia</p>
        <h2 id="plate-guide-title" className="plate-guide__title">
          Suku-suku separuh
        </h2>
        <ul className="plate-guide__legend">
          <li>
            <span style={{ background: '#4caf50' }} /> ½ sayur & buah
          </li>
          <li>
            <span style={{ background: '#f2c94c' }} /> ¼ nasi, mee, roti
          </li>
          <li>
            <span style={{ background: '#e8743b' }} /> ¼ ikan, ayam, daging, kekacang
          </li>
        </ul>
      </div>
    </section>
  );
}
