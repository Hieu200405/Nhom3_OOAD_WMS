import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { useAuth } from '../../app/auth-context.jsx';

export function Sidebar({ routes = [], collapsed = false }) {
  const { t } = useTranslation();
  const { user } = useAuth();

  const visibleRoutes = routes.filter((route) => {
    if (route.hiddenInMenu) return false;
    if (!route.roles || route.roles.length === 0) return true;
    if (!user) return false;
    return route.roles.includes(user.role);
  });

  return (
    <aside
      className={clsx(
        'sticky top-0 h-screen border-r border-slate-200 bg-white px-3 py-6 shadow-sm transition-all dark:border-slate-800 dark:bg-slate-950',
        collapsed ? 'w-[72px]' : 'w-64',
      )}
    >
      <div className="mb-6 flex items-center gap-2 px-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white">
          W
        </span>
        {!collapsed ? (
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {t('app.title')}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t(`roles.${user?.role ?? 'Staff'}`)}
            </p>
          </div>
        ) : null}
      </div>
      <nav className="space-y-1">
        {visibleRoutes.map((route) => {
          const Icon = route.icon;
          return (
            <NavLink
              key={route.path}
              to={route.path}
              className={({ isActive }) =>
                clsx(
                  'group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition',
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
                )
              }
            >
              {Icon ? <Icon className="h-4 w-4" /> : null}
              {!collapsed ? <span>{t(route.labelKey)}</span> : null}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
