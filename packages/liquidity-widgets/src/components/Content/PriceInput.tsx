export default function PriceInput() {
  return (
    <div className="price-input">
      <div className="input-wrapper">
        <span>Min price</span>
        <input />
        <span>KNC per ETH</span>
      </div>

      <div className="action">
        <div role="button">+</div>
        <div role="button">-</div>
      </div>
    </div>
  );
}
