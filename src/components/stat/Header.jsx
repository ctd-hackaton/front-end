import { ChefHat } from 'lucide-react';

export function Header({ week, setWeek }) {
  return (
    <div className="header">
      <div className="header-top">
        <div className="brand">
          <ChefHat className="brand-icon" size={28} />
          <h1 className="brand-name">Chef Jul</h1>
        </div>
        
        <select className="week-select" value={week} onChange={(e) => setWeek(e.target.value)}>
          <option value="nov1-7">Week of Nov 1–7</option>
          <option value="oct25-31">Week of Oct 25–31</option>
          <option value="oct18-24">Week of Oct 18–24</option>
        </select>
      </div>
    </div>
  );
}
