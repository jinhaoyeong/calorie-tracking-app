import { BowlFood, Camera, ChartBar, House, User, type Icon } from '@phosphor-icons/react';
import { Link, NavLink } from 'react-router-dom';
import './TabBar.css';

const TABS: { to: string; label: string; icon: Icon }[] = [
  { to: '/', label: 'Home', icon: House },
  { to: '/progress', label: 'Progress', icon: ChartBar },
  { to: '/foods', label: 'Foods', icon: BowlFood },
  { to: '/me', label: 'Me', icon: User },
];

function Tab({ to, label, icon: TabIcon }: (typeof TABS)[number]) {
  return (
    <NavLink to={to} end={to === '/'} className="tabbar__item">
      {({ isActive }) => (
        <>
          <TabIcon size={24} weight={isActive ? 'fill' : 'regular'} />
          <span>{label}</span>
        </>
      )}
    </NavLink>
  );
}

export function TabBar() {
  return (
    <nav className="tabbar" aria-label="Main">
      <Tab {...TABS[0]} />
      <Tab {...TABS[1]} />
      <Link to="/scan" className="tabbar__scan" aria-label="Scan food">
        <Camera size={24} weight="bold" />
      </Link>
      <Tab {...TABS[2]} />
      <Tab {...TABS[3]} />
    </nav>
  );
}
