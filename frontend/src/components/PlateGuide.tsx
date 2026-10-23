import './PlateGuide.css';

/**
 * Malaysian Healthy Plate (Pinggan Sihat Malaysia) from the Ministry of Health:
 * "suku-suku separuh" — a quarter grains, a quarter protein, half vegetables and fruit.
 */
export function PlateGuide() {
  return (
    <section className="card plate-guide" aria-labelledby="plate-guide-title">
      <div className="plate-guide__head">
        <p className="eyebrow">Pinggan Sihat Malaysia · MOH</p>
        <h2 id="plate-guide-title" className="plate-guide__title">
          Suku-suku separuh
        </h2>
      </div>
      <div className="plate-guide__bar" aria-hidden="true">
        <span style={{ flexGrow: 2 }} />
        <span style={{ flexGrow: 1 }} />
        <span style={{ flexGrow: 1 }} />
      </div>
      <dl className="plate-guide__legend">
        <div>
          <dt>½</dt>
          <dd>Vegetables & fruit</dd>
        </div>
        <div>
          <dt>¼</dt>
          <dd>Rice, noodles, roti</dd>
        </div>
        <div>
          <dt>¼</dt>
          <dd>Fish, chicken, meat, legumes</dd>
        </div>
      </dl>
    </section>
  );
}
