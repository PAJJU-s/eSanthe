import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Menu, ShoppingCart, User, Sprout, LogOut, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const { t, i18n } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const farmerProfilePath = user?.id ? `/farmer/${user.id}` : '/dashboard';
  const homePath = user?.role === 'farmer' ? '/dashboard' : '/marketplace';

  const changeLanguage = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  const customerLinks = [
    { to: '/marketplace', label: t('navbar.marketplace') },
    { to: '/orders', label: t('navbar.myOrders') },
  ];

  const farmerLinks = [
    { to: '/dashboard', label: t('navbar.dashboard') },
    { to: '/profile', label: 'My Listings' },
    { to: '/farmer/add-product', label: 'Add Product' },
    { to: '/farmer/analytics', label: t('navbar.analytics') },
    { to: farmerProfilePath, label: 'Farmer Profile' },
  ];

  return (
    <>
      <nav className="sticky top-0 z-50 bg-surface/90 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="bg-primary/10 p-2 rounded-xl group-hover:bg-primary/20 transition-colors">
                <Sprout className="h-6 w-6 text-primary" />
              </div>
              <div>
                <span className="font-display font-bold text-xl tracking-tight text-text">eSanthe</span>
                <span className="text-xs block text-primary font-kannada -mt-1 font-medium">ಇಸಂತೆ</span>
              </div>
            </Link>

            {/* Desktop Links */}
            <div className="hidden md:flex items-center gap-8">
              {user?.role === 'customer' && (
                <>
                  {customerLinks.map((link) => (
                    <Link key={link.to} to={link.to} className="text-text hover:text-primary font-medium transition-colors">
                      {link.label}
                    </Link>
                  ))}
                </>
              )}
              {user?.role === 'farmer' && (
                <>
                  {farmerLinks.map((link) => (
                    <Link key={link.to} to={link.to} className="text-text hover:text-primary font-medium transition-colors">
                      {link.label}
                    </Link>
                  ))}
                </>
              )}
            </div>

            {/* Right Actions */}
            <div className="hidden md:flex items-center gap-4">
              <select
                value={i18n.resolvedLanguage || 'en'}
                onChange={changeLanguage}
                className="text-text font-medium border border-border px-3 py-1.5 rounded-full bg-surface hover:bg-bg transition-colors outline-none cursor-pointer appearance-none"
              >
                <option value="en">English</option>
                <option value="hi">हिंदी (Hindi)</option>
                <option value="kn">ಕನ್ನಡ (Kannada)</option>
              </select>

              {!user ? (
                <>
                  <Link to="/auth" className="text-primary font-medium hover:text-accent transition-colors">{t('navbar.signIn')}</Link>
                  <Link to="/auth" className="btn-primary">{t('navbar.signUpFree')}</Link>
                </>
              ) : (
                <div className="flex items-center gap-6">
                  {user.role === 'customer' && (
                    <Link to="/cart" className="relative group">
                      <div className="p-2 bg-bg rounded-full group-hover:bg-primary/10 transition-colors">
                        <ShoppingCart className="h-5 w-5 text-text group-hover:text-primary transition-colors" />
                      </div>
                      {count > 0 && (
                        <span className="absolute -top-1 -right-1 bg-warning text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                          {count}
                        </span>
                      )}
                    </Link>
                  )}
                  
                  {/* User Dropdown */}
                  <div className="relative">
                    <button 
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="flex items-center gap-2 hover:bg-bg py-1 px-2 rounded-full transition-colors"
                    >
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold overflow-hidden">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt={`${user.name} profile`} className="h-full w-full object-cover" />
                        ) : (
                          user.name.charAt(0)
                        )}
                      </div>
                      <ChevronDown className="h-4 w-4 text-muted" />
                    </button>
                    
                    {dropdownOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-surface rounded-2xl shadow-xl border border-border py-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="px-4 py-2 border-b border-border">
                          <p className="text-sm font-semibold truncate">{user.name}</p>
                          <p className="text-xs text-muted truncate capitalize">{user.role}</p>
                        </div>
                        <Link
                          to={user.role === 'farmer' ? farmerProfilePath : '/profile'}
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-text hover:bg-primary/5 transition-colors"
                        >
                          <User className="h-4 w-4" />
                          {t('navbar.profile')}
                        </Link>
                        <Link 
                          to={homePath}
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-text hover:bg-primary/5 transition-colors"
                        >
                          <User className="h-4 w-4" />
                          {t('navbar.dashboard')}
                        </Link>
                        <button 
                          onClick={() => {
                            logout();
                            setDropdownOpen(false);
                          }}
                          className="flex items-center w-full gap-2 px-4 py-2 text-sm text-error hover:bg-error/5 transition-colors text-left"
                        >
                          <LogOut className="h-4 w-4" />
                          {t('navbar.signOut')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2 text-text hover:bg-bg rounded-full transition-colors"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] flex">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-4/5 max-w-sm bg-surface h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
            <div className="p-4 border-b border-border flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Sprout className="h-6 w-6 text-primary" />
                <span className="font-display font-bold text-xl text-text">eSanthe</span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={i18n.resolvedLanguage || 'en'}
                  onChange={changeLanguage}
                  className="text-sm font-medium border border-border px-2 py-1 rounded-md bg-surface hover:bg-bg transition-colors outline-none cursor-pointer"
                >
                  <option value="en">EN</option>
                  <option value="hi">HI</option>
                  <option value="kn">KN</option>
                </select>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-muted hover:text-text p-2 bg-bg rounded-full transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {!user ? (
                <div className="flex flex-col gap-3">
                  <Link to="/auth" onClick={() => setMobileMenuOpen(false)} className="btn-primary text-center">{t('navbar.signUpOrLogin')}</Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-bg p-4 rounded-2xl flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg overflow-hidden">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={`${user.name} profile`} className="h-full w-full object-cover" />
                      ) : (
                        user.name.charAt(0)
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-sm text-muted capitalize">{user.role}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <Link to={homePath} onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 bg-bg hover:bg-primary/5 rounded-xl font-medium transition-colors">{user.role === 'farmer' ? t('navbar.dashboard') : t('navbar.marketplace')}</Link>
                    <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 bg-bg hover:bg-primary/5 rounded-xl font-medium transition-colors">{t('navbar.profile')}</Link>
                    {user.role === 'customer' ? (
                      <>
                        {customerLinks.map((link) => (
                          <Link key={link.to} to={link.to} onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 bg-bg hover:bg-primary/5 rounded-xl font-medium transition-colors">
                            {link.label}
                          </Link>
                        ))}
                        <Link to="/cart" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 bg-bg hover:bg-primary/5 rounded-xl font-medium flex justify-between transition-colors">
                          {t('navbar.cart')} {count > 0 && <span className="badge bg-warning text-white">{count}</span>}
                        </Link>
                      </>
                    ) : (
                      <>
                        {farmerLinks
                          .filter((link) => link.to !== '/dashboard')
                          .map((link) => (
                            <Link key={link.to} to={link.to} onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 bg-bg hover:bg-primary/5 rounded-xl font-medium transition-colors">
                              {link.label}
                            </Link>
                          ))}
                      </>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => { logout(); setMobileMenuOpen(false); }}
                    className="w-full mt-4 px-4 py-3 text-error bg-error/5 hover:bg-error/10 rounded-xl font-medium flex justify-center items-center gap-2 transition-colors"
                  >
                    <LogOut className="h-4 w-4" /> {t('navbar.signOut')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
