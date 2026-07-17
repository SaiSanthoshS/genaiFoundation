export default function ComparisonTable({ results }) {
  return (
    <div className="glass-panel animate-fade-in">
      <h2 className="text-xl font-bold mb-4">Comparison Results</h2>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Store</th>
              <th>Price</th>
              <th>Shipping</th>
              <th>Total Cost</th>
              <th>Rating</th>
            </tr>
          </thead>
          <tbody>
            {results.map((item, idx) => (
              <tr key={idx}>
                <td className="font-bold flex items-center gap-2">
                  {item.store}
                  {item.inflated_discount && (
                    <span className="badge badge-red" title="Price drop might be exaggerated based on historical data">Inflated Discount</span>
                  )}
                </td>
                <td>${item.price.toFixed(2)}</td>
                <td>{item.shipping === 0 ? <span className="text-green">Free</span> : `$${item.shipping.toFixed(2)}`}</td>
                <td className="text-green font-bold text-lg">${item.total_cost.toFixed(2)}</td>
                <td>{item.rating ? `${item.rating} / 5` : 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
