import { Link, NavLink } from 'react-router-dom';
import { Icon, type IconName } from './Icon';
import './TabBar.css';

const TABS: { to: string; label: string; icon: IconName }[] = [
  { to: '/', label: 'Diary', icon: 'diary' },
  { to: '/progress', label: 'Progress', icon: 'progress' },
  { to: '/dishes', label: 'Dishes', icon: 'dishes' },
  { to: '/profile', label: 'Profile', icon: 'profile' },
];

function Tab({ to, label, icon }: (typeof TABS)[number]) {
  return (
    <NavLink to={to} end={to === '/'} className="tabbar__item">
      <Icon name={icon} size={24} />
      <span>{label}</span>
    </NavLink>
  );
}

export function TabBar() {
  return (
    <nav className="tabbar" aria-label="Main">
      <Tab {...TABS[0]} />
      <Tab {...TABS[1]} />
      <Link to="/scan" className="tabbar__scan" aria-label="Scan a dish">
        <span className="tabbar__scan-button">
          <Icon name="camera" size={26} strokeWidth={1.9} />
        </span>
        <span>Scan</span>
      </Link>
      <Tab {...TABS[2]} />
      <Tab {...TABS[3]} />
    </nav>
  );
}
