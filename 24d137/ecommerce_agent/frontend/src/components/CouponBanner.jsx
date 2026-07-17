import { Tag } from 'lucide-react';

export default function CouponBanner({ store }) {
  if (!store || !store.coupon_code) return null;
  
  return (
    <div className="glass-panel animate-fade-in flex items-center justify-between" style={{ background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, rgba(30, 41, 59, 0.7) 100%)', borderLeft: '4px solid var(--accent-green)' }}>
      <div className="flex items-center gap-3">
        <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '0.75rem', borderRadius: '50%' }}>
          <Tag size={24} className="text-green" />
        </div>
        <div>
          <h3 className="font-bold text-lg">Coupon Applied for {store.store}!</h3>
          <p className="text-muted">Code <strong className="text-main">{store.coupon_code}</strong> saved you <span className="text-green font-bold">${store.discount_amount.toFixed(2)}</span></p>
        </div>
      </div>
      <div className="text-right">
        <div className="text-muted" style={{ textDecoration: 'line-through' }}>${store.total_cost.toFixed(2)}</div>
        <div className="text-2xl font-bold text-green">${store.final_cost.toFixed(2)}</div>
      </div>
    </div>
  );
}
