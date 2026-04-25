import { useState, useEffect, useRef } from 'react';
import { ArrowRight, Leaf, ShieldCheck, Truck, Users, Sprout, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// ── Language options ──────────────────────────────────────────────────────────
const LANGUAGES = [
  {
    code: 'en',
    label: 'English',
    nativeLabel: 'English',
    flag: '🇬🇧',
    tagline: 'Continue in English',
    script: 'Latin',
  },
  {
    code: 'hi',
    label: 'Hindi',
    nativeLabel: 'हिंदी',
    flag: '🇮🇳',
    tagline: 'हिंदी में जारी रखें',
    script: 'Devanagari',
  },
  {
    code: 'kn',
    label: 'Kannada',
    nativeLabel: 'ಕನ್ನಡ',
    flag: '🇮🇳',
    tagline: 'ಕನ್ನಡದಲ್ಲಿ ಮುಂದುವರೆಯಿರಿ',
    script: 'Kannada',
  },
];

// ── Animated counter component ────────────────────────────────────────────────
const CountUpItem = ({ endValue, suffix = '', label }) => {
  const [count, setCount] = useState(0);
  const nodeRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          let startTimestamp = null;
          const duration = 2000;
          const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            setCount(Math.floor(easeProgress * endValue));
            if (progress < 1) window.requestAnimationFrame(step);
          };
          window.requestAnimationFrame(step);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (nodeRef.current) observer.observe(nodeRef.current);
    return () => observer.disconnect();
  }, [endValue]);

  return (
    <div className="p-6 text-center" ref={nodeRef}>
      <div className="text-4xl font-display font-bold text-white mb-2">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-primary-100 font-medium text-green-100">{label}</div>
    </div>
  );
};

// ── Language Selector Overlay ─────────────────────────────────────────────────
const LanguageSelector = ({ onSelect }) => {
  const { t, i18n } = useTranslation();
  const [selected, setSelected] = useState(i18n.resolvedLanguage || 'en');
  const [hovered, setHovered] = useState(null);

  const handleSelect = (code) => {
    setSelected(code);
    // Immediately switch the whole app into this language so user sees a live preview
    i18n.changeLanguage(code);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, #0f1f0f 0%, #1a3320 40%, #0d2b18 100%)',
      }}
    >
      {/* Decorative circles */}
      <div
        className="absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle, #4ade80, transparent)' }}
      />
      <div
        className="absolute bottom-[-10%] right-[-10%] w-80 h-80 rounded-full opacity-15"
        style={{ background: 'radial-gradient(circle, #22c55e, transparent)' }}
      />

      <div className="relative z-10 w-full max-w-lg mx-4">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="p-3 rounded-2xl"
              style={{ background: 'rgba(74, 222, 128, 0.15)', border: '1px solid rgba(74,222,128,0.3)' }}
            >
              <Sprout className="w-8 h-8 text-green-400" />
            </div>
            <span className="text-4xl font-bold text-white tracking-tight">eSanthe</span>
          </div>
          <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
            <Globe className="w-4 h-4" />
            <span>Choose your language · भाषा चुनें · ಭಾಷೆ ಆಯ್ಕೆ ಮಾಡಿ</span>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">{t('landing.langSelectorTitle')}</h1>
          <p className="text-green-300 text-sm opacity-80">
            {t('landing.langSelectorSubtitle')}
          </p>
        </div>

        {/* Language cards */}
        <div className="flex flex-col gap-4 mb-8">
          {LANGUAGES.map((lang) => {
            const isSelected = selected === lang.code;
            const isHovered = hovered === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                onMouseEnter={() => setHovered(lang.code)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  background: isSelected
                    ? 'linear-gradient(135deg, rgba(74,222,128,0.2), rgba(34,197,94,0.1))'
                    : isHovered
                    ? 'rgba(255,255,255,0.07)'
                    : 'rgba(255,255,255,0.04)',
                  border: isSelected
                    ? '2px solid #4ade80'
                    : '2px solid rgba(255,255,255,0.1)',
                  transition: 'all 0.2s ease',
                  transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                }}
                className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-left"
              >
                <span className="text-3xl">{lang.flag}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold text-lg">{lang.nativeLabel}</span>
                    {lang.nativeLabel !== lang.label && (
                      <span className="text-green-400 text-sm font-medium">· {lang.label}</span>
                    )}
                  </div>
                  <span className="text-green-300 text-sm opacity-70">{lang.tagline}</span>
                </div>
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: isSelected ? '#4ade80' : 'rgba(255,255,255,0.1)',
                    border: isSelected ? 'none' : '2px solid rgba(255,255,255,0.2)',
                  }}
                >
                  {isSelected && <span className="text-black text-xs font-bold">✓</span>}
                </div>
              </button>
            );
          })}
        </div>

        {/* Continue button */}
        <button
          onClick={() => onSelect(selected)}
          style={{
            background: 'linear-gradient(135deg, #4ade80, #16a34a)',
            boxShadow: '0 4px 24px rgba(74,222,128,0.35)',
          }}
          className="w-full py-4 rounded-2xl text-black font-bold text-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-95"
        >
          {t('landing.continueBtn')}
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

// ── Landing page ──────────────────────────────────────────────────────────────
export default function Landing() {
  const { t, i18n } = useTranslation();

  // Show language selector if no language has been explicitly set by the user
  const [showLangSelector, setShowLangSelector] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('i18nextLng');
    // Show selector only if nothing has been saved yet
    if (!saved) {
      setShowLangSelector(true);
    }
  }, []);

  const handleLanguageSelect = (code) => {
    i18n.changeLanguage(code);
    setShowLangSelector(false);
  };

  return (
    <>
      {/* Language selector overlay */}
      {showLangSelector && <LanguageSelector onSelect={handleLanguageSelect} />}

      <div className="min-h-screen">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-bg py-20 lg:py-32">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2689&auto=format&fit=crop')] bg-cover bg-center opacity-10"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent"></div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white shadow-sm border border-border mb-6 animate-fade-in-up">
              <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
              <span className="text-sm font-medium text-text">{t('landing.liveAcross')}</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-display font-bold text-text mb-4 tracking-tight drop-shadow-sm">
              {t('landing.heroTitle')}
              <span className="block mt-4 text-3xl md:text-5xl text-primary font-kannada">{t('landing.tagline')}</span>
            </h1>
            <p className="mt-6 text-xl text-muted max-w-2xl mx-auto font-medium">
              {t('landing.heroSubtitle')}
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/auth?role=customer" className="w-full sm:w-auto px-8 py-4 bg-primary text-white rounded-full font-semibold text-lg hover:bg-accent hover:-translate-y-1 hover:shadow-xl transition-all flex justify-center items-center gap-2 group">
                {t('landing.shopNow')}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/auth?role=farmer" className="w-full sm:w-auto px-8 py-4 bg-white text-primary border-2 border-primary rounded-full font-semibold text-lg hover:bg-primary/5 hover:-translate-y-1 transition-all flex justify-center items-center gap-2">
                <Leaf className="w-5 h-5" />
                {t('landing.areYouFarmer')}
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="bg-primary py-12 relative z-20 shadow-2xl -mt-6 mx-4 md:mx-auto max-w-5xl rounded-3xl overflow-hidden border border-white/20">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-white/20">
            <CountUpItem endValue={1200} suffix="+" label={t('landing.statsActiveFarmers')} />
            <CountUpItem endValue={50} suffix="+" label={t('landing.statsProducts')} />
            <CountUpItem endValue={12} label="Districts" />
            <CountUpItem endValue={10} suffix="k+" label={t('landing.statsHappyCustomers')} />
          </div>
        </div>

        {/* How it Works Section */}
        <div className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-text">{t('landing.howItWorks')}</h2>
              <div className="h-1.5 w-24 bg-accent mt-6 mx-auto rounded-full"></div>
            </div>

            <div className="grid md:grid-cols-3 gap-12 relative">
              {/* Connection Line */}
              <div className="hidden md:block absolute top-[40px] left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-border via-primary to-border" />

              <div className="relative bg-bg p-8 rounded-3xl border border-border text-center group hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                <div className="w-20 h-20 mx-auto bg-white rounded-2xl shadow-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform rotate-3">
                  <Leaf className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-text mb-3">{t('landing.step1Title')}</h3>
                <p className="text-muted">{t('landing.step1Desc')}</p>
              </div>

              <div className="relative bg-bg p-8 rounded-3xl border border-border text-center group hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                <div className="w-20 h-20 mx-auto bg-white rounded-2xl shadow-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform -rotate-3">
                  <Users className="w-10 h-10 text-accent" />
                </div>
                <h3 className="text-xl font-bold text-text mb-3">{t('landing.step2Title')}</h3>
                <p className="text-muted">{t('landing.step2Desc')}</p>
              </div>

              <div className="relative bg-bg p-8 rounded-3xl border border-border text-center group hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                <div className="w-20 h-20 mx-auto bg-white rounded-2xl shadow-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform rotate-3">
                  <Truck className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-text mb-3">{t('landing.step3Title')}</h3>
                <p className="text-muted">{t('landing.step3Desc')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Trust & Safety Section */}
        <div className="py-20 bg-bg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row">
              <div className="md:w-1/2 p-12 md:p-16 flex flex-col justify-center">
                <ShieldCheck className="w-16 h-16 text-primary mb-6" />
                <h2 className="text-3xl md:text-4xl font-bold text-text mb-4">{t('landing.trustTitle')}</h2>
                <p className="text-lg text-muted mb-8 leading-relaxed">
                  {t('landing.trustDesc')}
                </p>
                <ul className="space-y-4">
                  {[t('landing.trust1'), t('landing.trust2'), t('landing.trust3')].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-border flex items-center justify-center text-primary">✓</div>
                      <span className="font-medium text-text">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="md:w-1/2 relative min-h-[400px]">
                <img
                  src="https://images.unsplash.com/photo-1595856405786-89d5d1c3fa68?q=80&w=2000&auto=format&fit=crop"
                  alt="Farmer picking vegetables"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-white via-white/20 to-transparent"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-text py-12 text-center text-white/60">
          <div className="flex justify-center items-center gap-2 text-white mb-4">
            <Sprout className="w-6 h-6 text-accent" />
            <span className="text-2xl font-bold font-display">eSanthe</span>
          </div>
          <p className="mb-6 max-w-sm mx-auto">{t('landing.footerTagline')}</p>
          <p className="text-sm">{t('landing.footerCopy')}</p>
        </footer>
      </div>
    </>
  );
}
