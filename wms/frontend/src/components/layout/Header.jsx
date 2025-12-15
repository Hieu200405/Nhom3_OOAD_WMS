import { useTranslation } from 'react-i18next';
import { Sun, Moon, LogOut } from 'lucide-react';
import { useTheme } from '../../app/theme-context.jsx';
import { useAuth } from '../../app/auth-context.jsx';
import { Input } from '../forms/Input.jsx';

export function Header({ onSearch }) {
  const { theme, toggleTheme } = useTheme();
  const { i18n, t } = useTranslation();
  const { user, logout } = useAuth();

  const changeLanguage = (lng) => {
    void i18n.changeLanguage(lng);
  };

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between gap-4 border-b border-slate-200 bg-white/80 px-6 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="min-w-[260px] max-w-md">
        <Input
          placeholder={t('app.search')}
          onChange={(event) => onSearch?.(event.target.value)}
        />
      </div>
      <div className="flex items-center gap-3">
        <div className="flex rounded-full border border-slate-200 bg-slate-100 p-1 text-xs dark:border-slate-700 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => changeLanguage('vi')}
            className={`rounded-full px-3 py-1 font-semibold transition ${i18n.language === 'vi' ? 'bg-white text-slate-900 shadow dark:bg-slate-600 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}
          >
            VI
          </button>
          <button
            type="button"
            onClick={() => changeLanguage('en')}
            className={`rounded-full px-3 py-1 font-semibold transition ${i18n.language === 'en' ? 'bg-white text-slate-900 shadow dark:bg-slate-600 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}
          >
            EN
          </button>
        </div>
        <button
          type="button"
          onClick={toggleTheme}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
        <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/60">
          <div className="hidden text-right text-sm md:block">
            <p className="font-semibold text-slate-700 dark:text-slate-100">
              {user?.fullName}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t(`roles.${user?.role}`)}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-rose-100 text-rose-600 transition hover:bg-rose-200 dark:bg-rose-500/20 dark:text-rose-200 dark:hover:bg-rose-500/30"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
