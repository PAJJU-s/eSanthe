import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoaderCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const KARNATAKA_DISTRICTS = [
  "Bagalkot", "Ballari", "Belagavi", "Bengaluru Rural",
  "Bengaluru Urban", "Bidar", "Chamarajanagar", "Chikballapur",
  "Chikkamagaluru", "Chitradurga", "Dakshina Kannada", "Davanagere",
  "Dharwad", "Gadag", "Hassan", "Haveri", "Kalaburagi", "Kodagu",
  "Kolar", "Koppal", "Mandya", "Mysuru", "Raichur", "Ramanagara",
  "Shivamogga", "Tumakuru", "Udupi", "Uttara Kannada",
  "Vijayapura", "Yadgir"
];
const normalizeRole = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'farmer' || normalized === 'former') return 'farmer';
  return 'customer';
};
const PENDING_ROLE_STORAGE_KEY = 'esanthe_pending_signup_roles';

const getPendingRoles = () => {
  try {
    const raw = localStorage.getItem(PENDING_ROLE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const savePendingRole = (email, selectedRole) => {
  if (!email) return;
  const key = email.trim().toLowerCase();
  const current = getPendingRoles();
  current[key] = normalizeRole(selectedRole);
  localStorage.setItem(PENDING_ROLE_STORAGE_KEY, JSON.stringify(current));
};

const readPendingRole = (email) => {
  if (!email) return null;
  const key = email.trim().toLowerCase();
  const current = getPendingRoles();
  return current[key] || null;
};

const clearPendingRole = (email) => {
  if (!email) return;
  const key = email.trim().toLowerCase();
  const current = getPendingRoles();
  if (!(key in current)) return;
  delete current[key];
  localStorage.setItem(PENDING_ROLE_STORAGE_KEY, JSON.stringify(current));
};

export default function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    login,
    signup,
    loading,
    user,
    requestPasswordReset,
    resendVerificationEmail,
    verifyEmail,
  } = useAuth();
  const { t, i18n } = useTranslation();
  
  const [isLogin, setIsLogin] = useState(true);

  const changeLanguage = (e) => {
    i18n.changeLanguage(e.target.value);
  };
  
  // Sign up step: 1 (role), 2 (details)
  const [signUpStep, setSignUpStep] = useState(1);
  const [role, setRole] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    password: '',
    confirmPassword: ''
  });
  const [resetEmail, setResetEmail] = useState('');
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user) {
      navigate(normalizeRole(user.role) === 'farmer' ? '/dashboard' : '/marketplace');
    }
  }, [user, navigate]);

  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam) {
      setIsLogin(false);
      setRole(normalizeRole(roleParam));
      setSignUpStep(2);
    }
  }, [searchParams]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear error on change
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const validateSignup = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Valid email is required';
    }
    if (!formData.location) newErrors.location = 'Location is required';
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Min 8 characters required';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateLogin = () => {
    const newErrors = {};
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage('');
    if (isLogin) {
      if (validateLogin()) {
        try {
          await login(formData.email, formData.password);
        } catch (error) {
          if (error.message?.includes('Please verify your email')) {
            setVerificationEmail(formData.email);
            setShowEmailVerification(true);
            setIsLogin(true);
            setStatusMessage('Please verify your email before signing in. Check your inbox for a verification code.');
          } else {
            setErrors((prev) => ({ ...prev, password: error.message || 'Login failed' }));
          }
        }
      }
    } else {
      if (validateSignup()) {
        try {
          await signup({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            location: formData.location,
            role: normalizeRole(role),
            password: formData.password,
          });
        } catch (error) {
          if (error.message?.includes('Please check your email')) {
            savePendingRole(formData.email, normalizeRole(role));
            setVerificationEmail(formData.email);
            setShowEmailVerification(true);
            setIsLogin(true);
            setStatusMessage('Account created! Enter your verification code in the popup to finish setup.');
          } else {
            setErrors((prev) => ({ ...prev, email: error.message || 'Signup failed' }));
          }
        }
      }
    }
  };

  const handleResetPassword = async () => {
    if (!resetEmail.trim()) {
      setStatusMessage('Enter your email for password reset.');
      return;
    }
    try {
      await requestPasswordReset(resetEmail.trim());
      setStatusMessage('Password reset email sent. Check your inbox.');
    } catch (error) {
      setStatusMessage(error.message || 'Password reset request failed.');
    }
  };

  const handleResendVerification = async () => {
    if (!verificationEmail.trim()) {
      setStatusMessage('Enter your email to resend verification code.');
      return;
    }
    try {
      await resendVerificationEmail(verificationEmail.trim());
      setStatusMessage('Verification email sent. Check your inbox.');
    } catch (error) {
      setStatusMessage(error.message || 'Failed to resend verification email.');
    }
  };

  const handleVerifyEmail = async () => {
    if (!verificationEmail.trim() || !verificationCode.trim()) {
      setStatusMessage('Enter both email and verification code.');
      return;
    }
    try {
      const roleForVerification = normalizeRole(role || readPendingRole(verificationEmail));
      await verifyEmail(verificationEmail.trim(), verificationCode.trim(), roleForVerification);
      clearPendingRole(verificationEmail);
      setStatusMessage('Email verified successfully! You are now logged in.');
      setShowEmailVerification(false);
      setVerificationCode('');
    } catch (error) {
      setStatusMessage(error.message || 'Email verification failed.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-bg py-12 px-4 sm:px-6 lg:px-8 flex justify-center items-center">
      <div className="max-w-md w-full bg-surface p-8 rounded-[40px] shadow-2xl border border-border relative overflow-hidden">
        
        {/* Language Selector in Auth */}
        <div className="absolute top-6 right-6 z-20">
          <select
            value={i18n.resolvedLanguage || 'en'}
            onChange={changeLanguage}
            className="text-xs font-semibold border-2 border-border px-3 py-1.5 rounded-full bg-surface hover:bg-bg transition-colors outline-none cursor-pointer appearance-none text-text"
          >
            <option value="en">English</option>
            <option value="kn">ಕನ್ನಡ (Kannada)</option>
          </select>
        </div>

        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none"></div>

        {/* Header Tabs */}
        <div className="relative z-10 flex bg-bg rounded-full p-1.5 mb-8 mt-4 border border-border shadow-inner">
          <button
            onClick={() => { setIsLogin(true); setErrors({}); }}
            className={`flex-1 py-3 text-sm font-semibold rounded-full transition-all ${isLogin ? 'bg-surface text-primary shadow-sm ring-1 ring-border' : 'text-muted hover:text-text'}`}
          >
            {t('auth.signInBtn')}
          </button>
          <button
            onClick={() => { setIsLogin(false); setErrors({}); }}
            className={`flex-1 py-3 text-sm font-semibold rounded-full transition-all ${!isLogin ? 'bg-surface text-primary shadow-sm ring-1 ring-border' : 'text-muted hover:text-text'}`}
          >
            {t('auth.signUpBtn')}
          </button>
        </div>

        {/* Content */}
        <div className="relative z-10">
          {statusMessage && (
            <div className="mb-4 rounded-xl border border-border bg-bg px-4 py-3 text-sm text-text">
              {statusMessage}
            </div>
          )}
          {!isLogin && signUpStep === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <h2 className="text-2xl font-bold text-center text-text mb-2">Choose Your Role</h2>
              <p className="text-center text-muted text-sm mb-6">How do you want to use eSanthe?</p>
              
              <div className="space-y-4">
                <button
                  onClick={() => { setRole('farmer'); setSignUpStep(2); }}
                  className="w-full flex items-center p-5 border-2 border-border rounded-2xl hover:border-primary hover:bg-primary/5 hover:shadow-md transition-all text-left group"
                >
                  <div className="h-14 w-14 bg-bg rounded-full flex justify-center items-center mr-4 group-hover:scale-110 group-hover:bg-primary/10 transition-all text-primary">
                    <span className="text-2xl">🌾</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-text group-hover:text-primary transition-colors text-lg">{t('auth.iAmA')} {t('auth.farmer')}</h3>
                    <p className="text-sm text-muted">Sell fresh produce directly to consumers.</p>
                  </div>
                </button>
                <button
                  onClick={() => { setRole('customer'); setSignUpStep(2); }}
                  className="w-full flex items-center p-5 border-2 border-border rounded-2xl hover:border-primary hover:bg-primary/5 hover:shadow-md transition-all text-left group"
                >
                  <div className="h-14 w-14 bg-bg rounded-full flex justify-center items-center mr-4 group-hover:scale-110 group-hover:bg-primary/10 transition-all text-primary">
                    <span className="text-2xl">🛒</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-text group-hover:text-primary transition-colors text-lg">{t('auth.iAmA')} {t('auth.customer')}</h3>
                    <p className="text-sm text-muted">Buy fresh, local crops from farmers.</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {(!isLogin && signUpStep === 2) && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-300">
              <div className="flex items-center gap-4 mb-6">
                <button 
                  onClick={() => setSignUpStep(1)}
                  className="text-muted hover:text-text transition-colors p-2 -ml-2 rounded-full hover:bg-bg"
                  type="button"
                >
                  ← Back
                </button>
                <h2 className="text-2xl font-bold text-text">Register as {role === 'farmer' ? 'Farmer' : 'Customer'}</h2>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-text mb-1">{t('auth.fullName')}</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full p-3.5 rounded-xl border bg-bg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-muted/60 ${errors.name ? 'border-error bg-error/5' : 'border-border'}`}
                    placeholder="E.g. Ravi Kumar"
                  />
                  {errors.name && <p className="text-error text-xs mt-1 font-medium">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-text mb-1">{t('auth.email')} <span className="text-muted font-normal ml-1">(Required for Demo)</span></label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full p-3.5 rounded-xl border bg-bg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-muted/60 ${errors.email ? 'border-error bg-error/5' : 'border-border'}`}
                    placeholder="name@example.com"
                  />
                  {errors.email && <p className="text-error text-xs mt-1 font-medium">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-text mb-1">Phone Number <span className="text-muted font-normal">(Optional)</span></label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full p-3.5 rounded-xl border border-border bg-bg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-muted/60"
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-text mb-1">District (Karnataka)</label>
                  <select
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className={`w-full p-3.5 rounded-xl border bg-bg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none ${errors.location ? 'border-error bg-error/5' : 'border-border'}`}
                  >
                    <option value="">Select a district...</option>
                    {KARNATAKA_DISTRICTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  {errors.location && <p className="text-error text-xs mt-1 font-medium">{errors.location}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-text mb-1">{t('auth.password')}</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`w-full p-3.5 rounded-xl border bg-bg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-muted/60 ${errors.password ? 'border-error bg-error/5' : 'border-border'}`}
                      placeholder="••••••••"
                    />
                    {errors.password && <p className="text-error text-xs mt-1 font-medium">{errors.password}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-text mb-1">Confirm</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={`w-full p-3.5 rounded-xl border bg-bg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-muted/60 ${errors.confirmPassword ? 'border-error bg-error/5' : 'border-border'}`}
                      placeholder="••••••••"
                    />
                    {errors.confirmPassword && <p className="text-error text-xs mt-1 font-medium">{errors.confirmPassword}</p>}
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full btn-primary mt-6 text-lg py-3.5 flex justify-center items-center gap-2 hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>
              </form>
            </div>
          )}

          {isLogin && (
            <div className="animate-in fade-in slide-in-from-left-8 duration-300">
              <h2 className="text-2xl font-bold text-center text-text mb-2">{t('auth.welcomeBack')}</h2>
              <p className="text-center text-muted text-sm mb-6">{t('auth.loginDesc')}</p>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-text mb-1.5">{t('auth.email')}</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full p-3.5 rounded-xl border bg-bg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-muted/60 ${errors.email ? 'border-error bg-error/5' : 'border-border'}`}
                    placeholder="name@example.com"
                  />
                  {errors.email && <p className="text-error text-xs mt-1 font-medium">{errors.email}</p>}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-sm font-semibold text-text">Password</label>
                    <a href="#" className="text-xs text-primary font-semibold hover:text-accent transition-colors">Forgot password?</a>
                  </div>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full p-3.5 rounded-xl border bg-bg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-muted/60 ${errors.password ? 'border-error bg-error/5' : 'border-border'}`}
                    placeholder="••••••••"
                  />
                  {errors.password && <p className="text-error text-xs mt-1 font-medium">{errors.password}</p>}
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full btn-primary mt-4 text-lg py-3.5 flex justify-center items-center gap-2 hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : 'Log In'}
                </button>
              </form>

              <div className="mt-4 space-y-2 rounded-xl border border-border bg-bg p-4">
                <p className="text-sm font-semibold text-text">Forgot password</p>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full p-3 rounded-lg border border-border bg-surface outline-none"
                />
                <button type="button" onClick={handleResetPassword} className="w-full rounded-lg border border-border px-4 py-2 hover:bg-primary/5">
                  Send Reset Link
                </button>
              </div>
              
              <div className="mt-8 pt-6 border-t border-border text-center">
                <p className="text-sm text-muted">{t('auth.dontHaveAccount').split('?')[0]}? <button type="button" onClick={() => setIsLogin(false)} className="text-primary font-bold hover:text-accent ml-1 transition-colors">{t('auth.dontHaveAccount').split('?')[1] || 'Sign up'}</button></p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showEmailVerification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-text">Verify your email</h3>
            <p className="mt-1 text-sm text-muted">
              Enter the 6-digit code sent to your email to continue.
            </p>

            <div className="mt-4 space-y-3">
              <input
                type="email"
                value={verificationEmail}
                onChange={(e) => setVerificationEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-lg border border-border bg-bg p-3 outline-none focus:border-primary"
              />
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Enter 6-digit code"
                className="w-full rounded-lg border border-border bg-bg p-3 outline-none focus:border-primary"
                maxLength="6"
              />
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleVerifyEmail}
                disabled={loading}
                className="flex-1 rounded-lg border border-primary bg-primary px-4 py-2 text-white hover:bg-primary/90 disabled:opacity-70"
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>
              <button
                type="button"
                onClick={handleResendVerification}
                className="rounded-lg border border-border px-4 py-2 hover:bg-primary/5"
              >
                Resend
              </button>
              <button
                type="button"
                onClick={() => setShowEmailVerification(false)}
                className="rounded-lg border border-border px-4 py-2 hover:bg-primary/5"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
