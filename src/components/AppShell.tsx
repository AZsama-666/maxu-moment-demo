import { NavLink, Outlet, useLocation } from 'react-router-dom';

const tabs = [
  { to: '/feed', label: '主页', end: false },
  { to: '/messages', label: '消息', end: false },
  { to: '/', label: 'Moment', end: true },
  { to: '/profile', label: '我的', end: false },
];

export function AppShell() {
  const location = useLocation();
  const hideTab =
    location.pathname.startsWith('/waiting') ||
    location.pathname.startsWith('/fulfill') ||
    location.pathname.startsWith('/done') ||
    location.pathname.startsWith('/pending-accept');

  return (
    <div className="phone-frame">
      <div className="phone-status">
        <span>MAXU</span>
        <span>Demo</span>
      </div>
      <main className={`phone-main ${hideTab ? 'phone-main--full' : ''}`}>
        <Outlet />
      </main>
      {!hideTab && (
        <div className="tabbar-wrap">
          <nav className="tabbar" aria-label="主导航">
            {tabs.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  `tabbar__item ${isActive ? 'tabbar__item--active' : ''}`
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </nav>
          <NavLink to="/publish" className="tabbar-add" aria-label="发布">
            +
          </NavLink>
        </div>
      )}
    </div>
  );
}
