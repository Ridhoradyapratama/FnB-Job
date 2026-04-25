import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate,
  Link,
  useLocation
} from 'react-router-dom';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { 
  UserProfile, 
  JobPost, 
  JobCategory, 
  JobType, 
  UserRole, 
  ApplicationStatus,
  JobApplication
} from './types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Utensils, 
  Search, 
  Briefcase, 
  User as UserIcon, 
  PlusSquare, 
  LogOut,
  Coffee,
  ChefHat,
  Users,
  BadgeDollarSign,
  Trash2,
  Menu,
  X,
  CheckCircle2,
  Phone,
  FileText,
  Languages,
  Clock,
  Eye,
  CheckCircle,
  XCircle,
  MessageSquare,
  ShieldCheck,
  Settings,
  Mail,
  ExternalLink,
  BadgeCheck
} from 'lucide-react';
import { cn } from './lib/utils';
import { updateDoc } from 'firebase/firestore';

// --- Constants ---
export const PROVINCES_CITIES = {
  "DKI Jakarta": ["Jakarta Selatan", "Jakarta Pusat", "Jakarta Barat", "Jakarta Timur", "Jakarta Utara"],
  "Jawa Barat": ["Bandung", "Bogor", "Depok", "Bekasi", "Tangerang", "Cimahi", "Sukabumi"],
  "Jawa Tengah": ["Semarang", "Solo", "Yogyakarta", "Magelang", "Salatiga"],
  "Jawa Timur": ["Surabaya", "Malang", "Sidoarjo", "Gresik", "Batu", "Kediri"],
  "Bali": ["Denpasar", "Badung", "Ubud", "Kuta", "Seminyak"],
  "Sumatera Utara": ["Medan", "Binjai", "Deli Serdang"],
  "Sulawesi Selatan": ["Makassar", "Gowa", "Maros"],
};

// --- Language Context ---
type Language = 'EN' | 'ID';

const translations = {
  EN: {
    heroTitle: "Serve Your Future with Purpose.",
    heroSubtitle: "Skip the social media noise. Find professional roles in Indonesia's vibrant Food & Beverage scene.",
    browseJobs: "Browse Jobs",
    postVacancy: "Post a Vacancy",
    seekers: "Job Seekers",
    businesses: "Businesses",
    profile: "Profile",
    dashboard: "Dashboard",
    history: "History",
    logout: "Logout",
    signIn: "Sign In",
    category: "Category",
    all: "All",
    partTime: "Part-time",
    fullTime: "Full-time",
    applyNow: "Apply Now",
    applied: "Applied",
    whatsAppDirect: "Apply via WhatsApp",
    verified: "Verified",
    searchPlaceholder: "Search roles, outlets, or locations...",
    noJobs: "No jobs found",
    saveChanges: "Save Changes",
    name: "Full Name",
    whatsapp: "WhatsApp Number",
    cvLink: "CV / Portfolio Link",
    role: "I am a...",
    updated: "Profile Updated!",
    applications: "Applications",
    province: "Province",
    city: "City",
    coverLetter: "Cover Letter / Introduction",
    selectCv: "Select CV",
    addCv: "Add New CV",
    viewDetails: "View Details",
    applyToJob: "Apply to this Position",
    alreadyApplied: "You have applied for this position",
    poster: "Job Poster (Optional)",
  },
  ID: {
    heroTitle: "Sajikan Masa Depanmu dengan Tujuan.",
    heroSubtitle: "Lewati kebisingan media sosial. Temukan peran profesional di dunia Food & Beverage Indonesia.",
    browseJobs: "Cari Lowongan",
    postVacancy: "Pasang Lowongan",
    seekers: "Pencari Kerja",
    businesses: "Bisnis",
    profile: "Profil",
    dashboard: "Dasbor",
    history: "Riwayat",
    logout: "Keluar",
    signIn: "Masuk",
    category: "Kategori",
    all: "Semua",
    partTime: "Paruh-waktu",
    fullTime: "Penuh-waktu",
    applyNow: "Lamar Sekarang",
    applied: "Sudah Melamar",
    whatsAppDirect: "Lamar via WhatsApp",
    verified: "Terverifikasi",
    searchPlaceholder: "Cari posisi, gerai, atau lokasi...",
    noJobs: "Lowongan tidak ditemukan",
    saveChanges: "Simpan Perubahan",
    name: "Nama Lengkap",
    whatsapp: "Nomor WhatsApp",
    cvLink: "Link CV / Portofolio",
    role: "Saya adalah...",
    updated: "Profil Diperbarui!",
    applications: "Lamaran",
    province: "Provinsi",
    city: "Kota",
    coverLetter: "Surat Lamaran / Pendahuluan",
    selectCv: "Pilih CV",
    addCv: "Tambah CV Baru",
    viewDetails: "Lihat Detail",
    applyToJob: "Lamar Posisi Ini",
    alreadyApplied: "Anda telah melamar posisi ini",
    poster: "Poster Lowongan (Opsional)",
  }
};

interface LanguageContextType {
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: keyof typeof translations.EN) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLang = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLang must be used within LanguageProvider');
  return context;
};

const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Language>('EN');
  const t = (key: keyof typeof translations.EN) => translations[lang][key];

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// --- Auth Context ---
interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logOut: () => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const docRef = doc(db, 'users', u.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        } else {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
  }, []);

  const signIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Auth Error:", error);
      if (error.code === 'auth/network-request-failed') {
        alert("Network Error: This usually happens when third-party cookies are blocked or you are behind a restrictive firewall. Please try opening the app in a NEW TAB or disabling content blockers.");
      } else {
        alert(`Login failed: ${error.message}`);
      }
    }
  };

  const logOut = () => signOut(auth);

  const updateProfile = async (p: Partial<UserProfile>) => {
    if (!user) return;
    const docRef = doc(db, 'users', user.uid);
    const newProfile = { 
      ...p, 
      id: user.uid, 
      email: user.email!,
      name: p.name || user.displayName || 'User' 
    };
    await setDoc(docRef, newProfile, { merge: true });
    setProfile(newProfile as UserProfile);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, logOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

// --- Components ---

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, signIn, logOut } = useAuth();
  const { lang, setLang, t } = useLang();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: t('browseJobs'), path: '/jobs', icon: Search },
    ...(profile?.role === 'owner' ? [{ name: t('dashboard'), path: '/dashboard', icon: PlusSquare }] : []),
    ...(profile?.role === 'seeker' ? [{ name: t('history'), path: '/seeker-dashboard', icon: Clock }] : []),
    ...(profile?.role === 'admin' ? [{ name: 'Admin', path: '/admin', icon: ShieldCheck }] : []),
    { name: t('profile'), path: '/profile', icon: UserIcon },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <nav className="bg-white border-b border-cream-dark sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 bg-terracotta rounded-xl flex items-center justify-center text-white group-hover:rotate-6 transition-transform">
                <Utensils size={24} />
              </div>
              <span className="text-2xl font-serif font-bold text-clay tracking-tight">BitesBoard</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <div className="flex items-center bg-cream rounded-full p-1 mr-4">
                {(['EN', 'ID'] as Language[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    className={cn(
                      "px-3 py-1 text-[10px] font-bold rounded-full transition-all",
                      lang === l ? "bg-terracotta text-white shadow-sm" : "text-clay/40"
                    )}
                  >
                    {l}
                  </button>
                ))}
              </div>
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={cn(
                    "flex items-center gap-2 text-sm font-medium transition-colors hover:text-terracotta",
                    location.pathname === link.path ? "text-terracotta" : "text-clay/70"
                  )}
                >
                  <link.icon size={18} />
                  {link.name}
                </Link>
              ))}
              {user ? (
                <button
                  onClick={() => logOut()}
                  className="flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
                >
                  <LogOut size={18} />
                  {t('logout')}
                </button>
              ) : (
                <button
                  onClick={() => signIn()}
                  className="bg-terracotta text-white px-6 py-2 rounded-full text-sm font-semibold hover:bg-terracotta-dark transition-colors shadow-sm"
                >
                  {t('signIn')}
                </button>
              )}
            </div>

            {/* Mobile Nav Toggle */}
            <button 
              className="md:hidden p-2 text-clay"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-cream-dark bg-white overflow-hidden"
            >
              <div className="px-4 pt-2 pb-6 space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 text-base font-medium text-clay hover:bg-cream rounded-xl transition-colors"
                  >
                    <link.icon size={20} />
                    {link.name}
                  </Link>
                ))}
                {!user && (
                  <button
                    onClick={() => { signIn(); setIsMenuOpen(false); }}
                    className="w-full mt-4 bg-terracotta text-white px-6 py-3 rounded-xl font-semibold text-center"
                  >
                    Sign In
                  </button>
                )}
                {user && (
                  <button
                    onClick={() => { logOut(); setIsMenuOpen(false); }}
                    className="w-full mt-4 flex items-center justify-center gap-2 px-3 py-3 text-red-600 font-medium"
                  >
                    <LogOut size={20} />
                    Logout
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main className="flex-grow">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="bg-clay text-cream py-12 px-4 mt-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Utensils className="text-terracotta" />
              <span className="text-xl font-serif font-bold">BitesBoard</span>
            </div>
            <p className="text-cream/60 text-sm leading-relaxed">
              Connecting talented individuals with the best opportunities in the Food & Beverage industry across Indonesia.
            </p>
          </div>
          <div>
            <h4 className="font-serif text-lg font-bold mb-4 text-terracotta">For Job Seekers</h4>
            <ul className="space-y-2 text-sm text-cream/70">
              <li><Link to="/jobs" className="hover:text-white transition-colors">Browse Vacancies</Link></li>
              <li><Link to="/profile" className="hover:text-white transition-colors">Career Profile</Link></li>
              <li><Link to="/jobs?type=Part-time" className="hover:text-white transition-colors">Part-time Gigs</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-serif text-lg font-bold mb-4 text-terracotta">For Businesses</h4>
            <ul className="space-y-2 text-sm text-cream/70">
              <li><Link to="/dashboard" className="hover:text-white transition-colors">Post a Vacancy</Link></li>
              <li><Link to="/dashboard" className="hover:text-white transition-colors">Manage Applications</Link></li>
              <li><Link to="/profile" className="hover:text-white transition-colors">Verify Outlet</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-cream/10 text-center text-xs text-cream/40 space-y-2">
          <p>© {new Date().getFullYear()} BitesBoard. All rights reserved.</p>
          <p className="font-serif italic text-terracotta/60">Build by ridhorrp</p>
        </div>
      </footer>
    </div>
  );
};

// --- Admin Panel ---
const AdminPanel = () => {
  const { user, profile } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      if (profile?.role !== 'admin') return;
      setLoading(true);
      try {
        const q = query(collection(db, 'categoryRequests'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        setRequests(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    fetchRequests();
  }, [profile]);

  const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'categoryRequests', id), { status });
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    } catch (err) { console.error(err); }
  };

  if (profile?.role !== 'admin') return <Navigate to="/" />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-serif font-black text-clay mb-12">Admin Control Panel</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-6">
          <h3 className="text-2xl font-serif font-black flex items-center gap-2">
            <PlusSquare className="text-terracotta" />
            Category Requests
          </h3>
          <div className="space-y-4">
            {requests.map(req => (
              <div key={req.id} className="bg-white p-6 rounded-3xl border border-cream-dark shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-lg text-clay">{req.requestedTitle}</h4>
                    <p className="text-xs text-clay/40 font-bold uppercase tracking-wider">Owner ID: {req.ownerId}</p>
                  </div>
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight border",
                    req.status === 'pending' ? "bg-orange-50 text-orange-600 border-orange-200" :
                    req.status === 'approved' ? "bg-green-50 text-green-600 border-green-200" : "bg-red-50 text-red-600 border-red-200"
                  )}>
                    {req.status}
                  </span>
                </div>
                {req.status === 'pending' && (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleUpdateStatus(req.id, 'approved')}
                      className="flex-grow py-2 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 transition-colors"
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus(req.id, 'rejected')}
                      className="flex-grow py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const Home = () => {
  const { t } = useLang();
  const categories = [
    { name: 'Barista', icon: Coffee, color: 'bg-orange-100 text-orange-600' },
    { name: 'Kitchen', icon: ChefHat, color: 'bg-red-100 text-red-600' },
    { name: 'Waiters', icon: Users, color: 'bg-blue-100 text-blue-600' },
    { name: 'Cashier', icon: BadgeDollarSign, color: 'bg-green-100 text-green-600' },
    { name: 'Cleaning Service', icon: Utensils, color: 'bg-purple-100 text-purple-600' },
  ];

  return (
    <div className="pb-20">
      {/* Hero Section */}
      <section className="bg-white border-b border-cream-dark px-4 py-20 md:py-32 overflow-hidden relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-terracotta/5 rounded-full blur-3xl -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-terracotta/5 rounded-full blur-3xl -ml-20 -mb-20" />
        </div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-block px-4 py-1.5 bg-terracotta/10 text-terracotta rounded-full text-xs font-bold uppercase tracking-widest mb-6"
          >
            #1 FnB Job Portal in Indonesia
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-serif font-black text-clay mb-6 leading-[0.9] tracking-tight">
            {t('heroTitle').split(/Future|Masa Depanmu/).map((part, i, arr) => (
              <React.Fragment key={i}>
                {part}
                {i < arr.length - 1 && <span className="text-terracotta">{t('heroTitle').match(/Future|Masa Depanmu/)?.[0]}</span>}
              </React.Fragment>
            ))}
          </h1>
          <p className="text-lg md:text-xl text-clay/60 mb-10 max-w-2xl mx-auto font-medium">
            {t('heroSubtitle')}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to="/jobs" 
              className="w-full sm:w-auto px-10 py-4 bg-terracotta text-white rounded-full font-bold shadow-lg shadow-terracotta/20 hover:bg-terracotta-dark transition-all transform hover:-translate-y-1"
            >
              {t('browseJobs')}
            </Link>
            <Link 
              to="/dashboard" 
              className="w-full sm:w-auto px-10 py-4 bg-white border-2 border-clay/10 text-clay rounded-full font-bold hover:bg-cream transition-all"
            >
              {t('postVacancy')}
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 -mt-12 relative z-20">
        <div className="bg-white rounded-3xl shadow-xl shadow-clay/5 p-8 grid grid-cols-2 md:grid-cols-5 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.name}
              to={`/jobs?category=${cat.name}`}
              className="group flex flex-col items-center text-center p-4 rounded-2xl hover:bg-cream transition-all border border-transparent hover:border-cream-dark"
            >
              <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110", cat.color)}>
                <cat.icon size={32} />
              </div>
              <span className="text-sm font-bold text-clay uppercase tracking-wider">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured/Info Section */}
      <section className="max-w-7xl mx-auto px-4 py-24 grid md:grid-cols-2 gap-16 items-center">
        <div className="space-y-8">
          <h2 className="text-4xl md:text-5xl font-serif font-black text-clay leading-tight">
            Designed for the <br />
            <span className="italic-small text-terracotta">Hospitality Heart.</span>
          </h2>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-cream-dark flex items-center justify-center shrink-0">
                <BadgeCheck className="text-green-500" />
              </div>
              <div>
                <h4 className="font-bold text-clay text-lg">Verified Outlets</h4>
                <p className="text-clay/60 text-sm">We verify outlets to ensure safe and legitimate job opportunities for everyone.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-cream-dark flex items-center justify-center shrink-0">
                <Phone className="text-terracotta" />
              </div>
              <div>
                <h4 className="font-bold text-clay text-lg">WhatsApp Direct</h4>
                <p className="text-clay/60 text-sm">Apply directly through WhatsApp. No more waiting for emails that never come.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-cream-dark flex items-center justify-center shrink-0">
                <FileText className="text-blue-500" />
              </div>
              <div>
                <h4 className="font-bold text-clay text-lg">Simple One-Tap Apply</h4>
                <p className="text-clay/60 text-sm">Upload your CV once and apply to any vacancy with just one simple tap.</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="relative group">
          <div className="absolute inset-0 bg-terracotta/10 rounded-[40px] transform rotate-3 group-hover:rotate-1 transition-transform" />
          <img 
            src="https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&q=80&w=800" 
            alt="FnB Worker" 
            className="rounded-[40px] shadow-2xl relative z-10 w-full h-[500px] object-cover border-4 border-white"
          />
        </div>
      </section>
    </div>
  );
};

// --- Job List Page ---

const Jobs = () => {
  const { t } = useLang();
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [provinceFilter, setProvinceFilter] = useState<string>('All');
  const [cityFilter, setCityFilter] = useState<string>('All');
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const cat = params.get('category');
    if (cat) setCategoryFilter(cat);
  }, [location]);

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        let q = query(collection(db, 'jobs'), where('status', '==', 'active'), orderBy('createdAt', 'desc'));
        
        const querySnapshot = await getDocs(q);
        const fetchedJobs = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as JobPost[];

        setJobs(fetchedJobs);
      } catch (error) {
        console.error("Error fetching jobs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const provinces = Object.keys(PROVINCES_CITIES);
  const cities = provinceFilter !== 'All' ? PROVINCES_CITIES[provinceFilter as keyof typeof PROVINCES_CITIES] : [];

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(search.toLowerCase()) || 
                          job.outletName.toLowerCase().includes(search.toLowerCase()) ||
                          (job.location && job.location.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = categoryFilter === 'All' || categoryFilter === t('all') || job.category === categoryFilter;
    const matchesType = typeFilter === 'All' || typeFilter === t('all') || job.type === typeFilter;
    const matchesProvince = provinceFilter === 'All' || job.province === provinceFilter;
    const matchesCity = cityFilter === 'All' || job.city === cityFilter;
    
    return matchesSearch && matchesCategory && matchesType && matchesProvince && matchesCity;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-serif font-black text-clay mb-2">Find Your Role</h1>
        <p className="text-clay/60 font-medium">Discover the best FnB opportunities tailored for you.</p>
      </div>

      {/* Filters */}
      <div className="space-y-4 mb-12">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-clay/30" size={20} />
          <input 
            type="text" 
            placeholder={t('searchPlaceholder')}
            className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-cream-dark focus:outline-none focus:border-terracotta transition-colors text-clay font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <select 
            className="px-4 py-4 bg-white rounded-2xl border border-cream-dark focus:outline-none focus:border-terracotta text-clay font-medium"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="All">{t('all')} {t('category')}</option>
            <option>Barista</option>
            <option>Kitchen</option>
            <option>Waiters</option>
            <option>Cashier</option>
            <option>Cleaning Service</option>
          </select>

          <select 
            className="px-4 py-4 bg-white rounded-2xl border border-cream-dark focus:outline-none focus:border-terracotta text-clay font-medium"
            value={provinceFilter}
            onChange={(e) => {
              setProvinceFilter(e.target.value);
              setCityFilter('All');
            }}
          >
            <option value="All">{t('all')} {t('province')}</option>
            {provinces.map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          <select 
            className="px-4 py-4 bg-white rounded-2xl border border-cream-dark focus:outline-none focus:border-terracotta text-clay font-medium"
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            disabled={provinceFilter === 'All'}
          >
            <option value="All">{t('all')} {t('city')}</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select 
            className="px-4 py-4 bg-white rounded-2xl border border-cream-dark focus:outline-none focus:border-terracotta text-clay font-medium"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="All">{t('all')} Types</option>
            <option>Full-time</option>
            <option>Part-time</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-12 h-12 border-4 border-terracotta border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredJobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map(job => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-cream-dark">
          <Search className="mx-auto text-clay/20 mb-4" size={48} />
          <h3 className="text-xl font-bold text-clay">{t('noJobs')}</h3>
          <p className="text-clay/40">Try adjusting your filters or search terms.</p>
        </div>
      )}
    </div>
  );
};

const JobCard: React.FC<{ job: JobPost }> = ({ job }) => {
  const { t } = useLang();
  const [showDetail, setShowDetail] = useState(false);

  return (
    <>
      <motion.div 
        whileHover={{ y: -5 }}
        className="bg-white rounded-3xl p-6 border border-cream-dark shadow-sm hover:shadow-xl hover:shadow-terracotta/5 transition-all flex flex-col h-full cursor-pointer group"
        onClick={() => setShowDetail(true)}
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <div className="px-2 py-1 bg-cream-dark/50 text-[10px] font-bold text-clay/60 rounded uppercase tracking-wider">
              {job.type}
            </div>
            {job.salary && (
              <div className="px-2 py-1 bg-green-50 text-[10px] font-bold text-green-600 rounded uppercase tracking-wider">
                {job.salary}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 text-terracotta">
            <BadgeCheck size={14} className="fill-terracotta/20" />
            <span className="text-[10px] font-bold uppercase tracking-widest">{t('verified')}</span>
          </div>
        </div>

        <h3 className="text-xl font-bold text-clay mb-1 group-hover:text-terracotta transition-colors">{job.title}</h3>
        <div className="flex items-center gap-2 text-clay/40 text-sm mb-4">
          <Utensils size={14} />
          <span className="font-medium">{job.outletName}</span>
          <span>•</span>
          <span className="text-clay/60">{job.city || job.location}, {job.province}</span>
        </div>

        <p className="text-clay/60 text-xs line-clamp-3 mb-6 leading-relaxed">
          {job.description}
        </p>

        <div className="mt-auto pt-4 border-t border-cream-dark flex items-center justify-between">
          <span className="text-xs font-bold text-terracotta uppercase tracking-widest">{t('viewDetails')}</span>
          <ExternalLink size={16} className="text-clay/20 group-hover:text-terracotta transition-colors" />
        </div>
      </motion.div>

      <AnimatePresence>
        {showDetail && (
          <JobDetailModal job={job} onClose={() => setShowDetail(false)} />
        )}
      </AnimatePresence>
    </>
  );
};

const JobDetailModal: React.FC<{ job: JobPost; onClose: () => void }> = ({ job, onClose }) => {
  const { user, profile, signIn } = useAuth();
  const { t } = useLang();
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [selectedCvUrl, setSelectedCvUrl] = useState('');

  useEffect(() => {
    if (profile?.cvs && profile.cvs.length > 0) {
      setSelectedCvUrl(profile.cvs[0].url);
    } else if (profile?.cvUrl) {
      setSelectedCvUrl(profile.cvUrl);
    }
  }, [profile]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      signIn();
      return;
    }
    if (profile?.role !== 'seeker') {
      alert("Please set up your seeker profile to apply.");
      return;
    }

    setApplying(true);
    try {
      await addDoc(collection(db, 'applications'), {
        jobId: job.id,
        ownerId: job.ownerId,
        seekerId: user.uid,
        seekerName: profile.name,
        seekerEmail: profile.email,
        seekerWhatsApp: profile.whatsappNumber || '',
        cvUrl: selectedCvUrl,
        coverLetter: coverLetter,
        status: 'pending',
        submittedAt: serverTimestamp()
      });
      setApplied(true);
    } catch (error) {
      console.error("Error applying:", error);
    } finally {
      setApplying(false);
    }
  };

  const openWhatsApp = () => {
    const message = encodeURIComponent(`Hi ${job.outletName}, I'm interested in the ${job.title} position I saw on BitesBoard. Can we discuss more?`);
    const contact = job.whatsappContact || '';
    window.open(`https://wa.me/${contact.replace(/\+/g, '').replace(/[^0-9]/g, '')}?text=${message}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-clay/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative bg-white w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[40px] shadow-2xl flex flex-col md:flex-row"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 z-20 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center text-clay hover:text-terracotta transition-colors"
        >
          <X size={20} />
        </button>

        {/* Poster / Side Panel */}
        <div className="w-full md:w-2/5 bg-cream border-r border-cream-dark overflow-y-auto">
          {job.posterUrl ? (
            <img 
              src={job.posterUrl} 
              alt={job.title} 
              className="w-full h-auto min-h-full object-cover"
            />
          ) : (
            <div className="p-12 flex flex-col items-center justify-center text-center h-full space-y-4 min-h-[300px]">
              <Utensils size={64} className="text-terracotta/20" />
              <h3 className="font-serif font-black text-2xl text-clay/40">{job.outletName}</h3>
            </div>
          )}
        </div>

        {/* Content Panel */}
        <div className="w-full md:w-3/5 p-8 md:p-12 overflow-y-auto space-y-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-terracotta/10 text-terracotta text-xs font-bold rounded-full uppercase tracking-wider">
                {job.type}
              </span>
              <span className="text-clay/40 text-sm font-medium">{job.category}</span>
            </div>
            <h2 className="text-4xl font-serif font-black text-clay mb-2">{job.title}</h2>
            <p className="text-xl font-bold text-terracotta">{job.outletName}</p>
            <div className="flex items-center gap-2 text-clay/40 mt-2">
              <Search size={16} />
              <span className="font-medium">{job.city}, {job.province}</span>
              {job.salary && <span className="ml-2 font-bold text-green-600 tracking-wider">• {job.salary}</span>}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-black uppercase tracking-widest text-xs text-clay/40">Description</h4>
            <div className="prose prose-sm text-clay/70 leading-relaxed max-w-none">
              {job.description.split('\n').map((line, i) => <p key={i}>{line}</p>)}
            </div>
          </div>

          <div className="pt-8 border-t border-cream-dark">
            {applied ? (
              <div className="bg-green-50 p-6 rounded-3xl text-center space-y-2">
                <CheckCircle2 size={32} className="mx-auto text-green-500" />
                <h4 className="font-bold text-green-800 text-lg">{t('applied')}!</h4>
                <p className="text-green-600/70 text-sm">{t('alreadyApplied')}</p>
              </div>
            ) : user && profile?.role === 'seeker' ? (
              <form onSubmit={handleApply} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-clay/40">{t('coverLetter')}</label>
                  <textarea 
                    className="w-full px-4 py-3 bg-cream rounded-xl border-none focus:ring-2 focus:ring-terracotta text-clay font-medium text-sm"
                    rows={4}
                    placeholder="Tell the owner why you are the best fit..."
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-clay/40">{t('selectCv')}</label>
                  {profile.cvs && profile.cvs.length > 0 ? (
                    <select 
                      className="w-full px-4 py-3 bg-cream rounded-xl border-none focus:ring-2 focus:ring-terracotta text-clay font-medium text-sm"
                      value={selectedCvUrl}
                      onChange={(e) => setSelectedCvUrl(e.target.value)}
                    >
                      {profile.cvs.map(cv => (
                        <option key={cv.id} value={cv.url}>{cv.name}</option>
                      ))}
                      {profile.cvUrl && <option value={profile.cvUrl}>Default CV</option>}
                    </select>
                  ) : profile.cvUrl ? (
                    <div className="p-3 bg-cream rounded-xl text-xs font-medium text-clay/60 border border-cream-dark">
                      Using default CV from your profile
                    </div>
                  ) : (
                    <Link to="/profile" className="block p-4 border-2 border-dashed border-cream-dark rounded-xl text-center text-xs font-bold text-terracotta hover:bg-cream">
                      {t('addCv')}
                    </Link>
                  )}
                </div>

                <div className="flex gap-4">
                  <button 
                    type="submit"
                    disabled={applying}
                    className="flex-grow bg-terracotta text-white py-4 rounded-2xl font-black shadow-lg shadow-terracotta/20 hover:bg-terracotta-dark transition-all"
                  >
                    {applying ? "..." : t('applyToJob')}
                  </button>
                  {job.whatsappContact && (
                    <button 
                      type="button"
                      onClick={openWhatsApp}
                      className="bg-green-500 text-white px-8 rounded-2xl flex items-center justify-center hover:bg-green-600 transition-colors shadow-lg shadow-green-500/20"
                    >
                      <Phone size={24} />
                    </button>
                  )}
                </div>
              </form>
            ) : !user ? (
              <button 
                onClick={signIn}
                className="w-full bg-clay text-white py-4 rounded-2xl font-black shadow-lg shadow-clay/20 hover:bg-clay/90 transition-all font-serif"
              >
                {t('signIn')} to Apply
              </button>
            ) : (
              <div className="p-6 bg-cream rounded-3xl text-center">
                <p className="text-clay/40 text-sm font-medium">Please switch to a Seeker profile to apply for jobs.</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// --- Seeker Dashboard (History) ---
const SeekerDashboard = () => {
  const { user, profile } = useAuth();
  const { t } = useLang();
  const [apps, setApps] = useState<JobApplication[]>([]);
  const [jobsData, setJobsData] = useState<Record<string, JobPost>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const q = query(collection(db, 'applications'), where('seekerId', '==', user.uid), orderBy('submittedAt', 'desc'));
        const snap = await getDocs(q);
        const fetchedApps = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as JobApplication[];
        setApps(fetchedApps);

        // Fetch related jobs info
        const jobIds = [...new Set(fetchedApps.map(a => a.jobId))];
        const jobsMap: Record<string, JobPost> = {};
        for (const id of jobIds) {
          const jobSnap = await getDoc(doc(db, 'jobs', id));
          if (jobSnap.exists()) {
            jobsMap[id] = { id: jobSnap.id, ...jobSnap.data() } as JobPost;
          }
        }
        setJobsData(jobsMap);
      } catch (err) {
        console.error("Error fetching history:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [user]);

  if (loading) return <div className="p-20 text-center text-clay/50">Loading History...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-serif font-black text-clay mb-2">{t('history')}</h1>
      <p className="text-clay/60 mb-12">Track the status of your applications.</p>

      {apps.length > 0 ? (
        <div className="space-y-6">
          {apps.map(app => (
            <motion.div 
              key={app.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white p-6 rounded-3xl border border-cream-dark shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
            >
              <div>
                <h3 className="text-xl font-bold text-clay">{jobsData[app.jobId]?.title || 'Unknown Position'}</h3>
                <p className="text-sm text-clay/60 font-medium">{jobsData[app.jobId]?.outletName || 'Unknown Outlet'}</p>
                <p className="text-[10px] text-clay/30 uppercase font-bold mt-1">Applied: {app.submittedAt?.toDate().toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                <StatusBadge status={app.status} />
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-cream-dark">
          <Clock className="mx-auto text-clay/10 mb-4" size={48} />
          <h3 className="text-xl font-bold text-clay">No applications yet</h3>
          <p className="text-clay/40">Your application history will appear here once you apply for jobs.</p>
          <Link to="/jobs" className="mt-6 inline-block bg-terracotta text-white px-8 py-3 rounded-full font-bold">Find Jobs</Link>
        </div>
      )}
    </div>
  );
};

const StatusBadge: React.FC<{ status: ApplicationStatus }> = ({ status }) => {
  const styles = {
    pending: { label: 'Pending', icon: Clock, class: 'bg-orange-50 text-orange-600 border-orange-200' },
    seen: { label: 'Reviewed', icon: Eye, class: 'bg-blue-50 text-blue-600 border-blue-200' },
    interview: { label: 'Interview', icon: MessageSquare, class: 'bg-purple-50 text-purple-600 border-purple-200' },
    accepted: { label: 'Accepted', icon: CheckCircle, class: 'bg-green-50 text-green-600 border-green-200' },
    rejected: { label: 'Rejected', icon: XCircle, class: 'bg-red-50 text-red-600 border-red-200' },
  };

  const config = styles[status] || styles.pending;
  return (
    <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-black uppercase tracking-tight", config.class)}>
      <config.icon size={14} />
      {config.label}
    </div>
  );
};
// --- Owner Dashboard ---
const Dashboard = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const { t } = useLang();
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestTitle, setRequestTitle] = useState('');
  
  const [newJob, setNewJob] = useState({
    title: '',
    outletName: '',
    description: '',
    category: 'Barista' as JobCategory,
    province: 'DKI Jakarta',
    city: 'Jakarta Selatan',
    location: '', 
    salary: '',
    type: 'Full-time' as JobType,
    whatsappContact: '',
    posterUrl: ''
  });

  const provinces = Object.keys(PROVINCES_CITIES);
  const cities = PROVINCES_CITIES[newJob.province as keyof typeof PROVINCES_CITIES] || [];

  const fetchOwnerData = async () => {
    if (!user) return;
    try {
      const qJobs = query(collection(db, 'jobs'), where('ownerId', '==', user.uid));
      const snapJobs = await getDocs(qJobs);
      const jobsList = snapJobs.docs.map(doc => ({ id: doc.id, ...doc.data() })) as JobPost[];
      setJobs(jobsList);

      if (jobsList.length > 0) {
        // Query applications directly by ownerId for efficiency and security rule compatibility
        const qApps = query(collection(db, 'applications'), where('ownerId', '==', user.uid), orderBy('submittedAt', 'desc'));
        const snapApps = await getDocs(qApps);
        setApplications(snapApps.docs.map(doc => ({ id: doc.id, ...doc.data() })) as JobApplication[]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateAppStatus = async (appId: string, newStatus: ApplicationStatus) => {
    try {
      await updateDoc(doc(db, 'applications', appId), { status: newStatus });
      setApplications(apps => apps.map(a => a.id === appId ? { ...a, status: newStatus } : a));
      if (selectedApp?.id === appId) setSelectedApp({ ...selectedApp, status: newStatus });
    } catch (err) {
      console.error(err);
    }
  };

  const handleRequestCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestTitle.trim()) return;
    try {
      await addDoc(collection(db, 'categoryRequests'), {
        ownerId: user?.uid,
        requestedTitle: requestTitle,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      setIsRequesting(false);
      setRequestTitle('');
      alert("Request sent to Admin!");
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user && profile?.role === 'owner') {
      fetchOwnerData();
    }
  }, [user, profile]);

  if (authLoading) return <div className="p-20 text-center">Loading...</div>;
  if (!user || profile?.role !== 'owner') {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center">
        <PlusSquare size={64} className="mx-auto text-clay/10 mb-6" />
        <h2 className="text-3xl font-serif font-black mb-4">{t('dashboard')}</h2>
        <p className="text-clay/60 mb-8 font-medium">You need to be registered as an Outlet Owner to post vacancies.</p>
        <Link to="/profile" className="bg-terracotta text-white px-8 py-4 rounded-full font-bold shadow-lg shadow-terracotta/20">Set Up Owner Profile</Link>
      </div>
    );
  }

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'jobs'), {
        ...newJob,
        ownerId: user.uid,
        status: 'active',
        createdAt: serverTimestamp()
      });
      setIsPosting(false);
      fetchOwnerData();
      setNewJob({
        title: '',
        outletName: '',
        description: '',
        category: 'Barista',
        province: 'DKI Jakarta',
        city: 'Jakarta Selatan',
        location: '',
        salary: '',
        type: 'Full-time',
        whatsappContact: '',
        posterUrl: ''
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleViewApplicant = (app: JobApplication) => {
    setSelectedApp(app);
    if (app.status === 'pending') {
      updateAppStatus(app.id, 'seen');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-serif font-black text-clay mb-2">{t('dashboard')}</h1>
          <p className="text-clay/60 font-medium">Manage your outlet's vacancies and hire the best talent.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setIsPosting(true)}
            className="bg-terracotta text-white px-8 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-terracotta-dark transition-colors shadow-lg shadow-terracotta/20"
          >
            <PlusSquare size={20} />
            {t('postVacancy')}
          </button>
          <button 
            onClick={() => setIsRequesting(true)}
            className="bg-white border-2 border-clay/10 text-clay px-8 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-cream transition-colors"
          >
            <Settings size={20} />
            Request Category
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-12">
        <div className="md:col-span-2 space-y-8">
          <h3 className="text-2xl font-serif font-black flex items-center gap-2 text-clay">
            <Briefcase className="text-terracotta" />
            Active Vacancies
          </h3>
          {jobs.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {jobs.map(job => (
                <div key={job.id} className="bg-white p-6 rounded-3xl border border-cream-dark flex justify-between items-center group hover:shadow-lg transition-shadow">
                  <div>
                    <h4 className="font-bold text-xl text-clay group-hover:text-terracotta transition-colors">{job.title}</h4>
                    <p className="text-sm text-clay/40 font-medium">{job.category} • {job.type}</p>
                    <div className="flex items-center gap-3 mt-2">
                       <span className="text-xs bg-terracotta/5 text-terracotta px-2 py-1 rounded-lg font-bold">
                        {applications.filter(a => a.jobId === job.id).length} Applicants
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button className="p-2 text-clay/20 hover:text-red-500 transition-colors">
                      <Trash2 size={22} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-20 text-center bg-white rounded-3xl border border-dashed border-cream-dark text-clay/30 font-medium">
              No vacancies posted yet.
            </div>
          )}
        </div>

        <div className="space-y-8">
          <h3 className="text-2xl font-serif font-black flex items-center gap-2 text-clay">
            <Users className="text-blue-500" />
            Applicants
          </h3>
          <div className="bg-white rounded-[40px] border border-cream-dark p-8 space-y-6 shadow-sm">
            {applications.length > 0 ? (
              <div className="space-y-4">
              {applications.map(app => (
                <button 
                  key={app.id} 
                  onClick={() => handleViewApplicant(app)}
                  className="w-full text-left p-4 rounded-2xl hover:bg-cream transition-colors border border-transparent hover:border-cream-dark group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-bold text-clay truncate pr-4">{app.seekerName}</p>
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      app.status === 'pending' ? "bg-orange-500 animate-pulse" : "bg-clay/10"
                    )} />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-clay/40 font-bold uppercase truncate max-w-[120px]">
                      {jobs.find(j => j.id === app.jobId)?.title}
                    </p>
                    <span className="text-[10px] font-black uppercase tracking-tighter text-blue-500 bg-blue-50 px-2 py-0.5 rounded">
                      {app.status}
                    </span>
                  </div>
                </button>
              ))}
              </div>
            ) : (
              <p className="text-center py-12 text-sm text-clay/40 font-medium italic">No applications to review.</p>
            )}
          </div>
        </div>
      </div>

      {/* Applicant Detail Modal */}
      <AnimatePresence>
        {selectedApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-clay/60 backdrop-blur-sm"
              onClick={() => setSelectedApp(null)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl p-10 relative z-10 overflow-hidden"
            >
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-3xl font-serif font-black text-clay">{selectedApp.seekerName}</h2>
                  <p className="text-clay/40 font-bold text-sm uppercase tracking-widest mt-1">Applying for {jobs.find(j => j.id === selectedApp.jobId)?.title}</p>
                </div>
                <button onClick={() => setSelectedApp(null)} className="p-2 text-clay/20 hover:text-clay transition-colors"><X /></button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <a 
                  href={`mailto:${selectedApp.seekerEmail}`}
                  className="flex items-center justify-center gap-3 py-4 bg-cream rounded-2xl text-clay font-bold hover:bg-cream-dark transition-colors"
                >
                  <Mail size={20} className="text-terracotta" />
                  Email
                </a>
                <a 
                  href={`https://wa.me/${selectedApp.seekerWhatsApp.replace(/\+/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-3 py-4 bg-green-50 rounded-2xl text-green-700 font-bold hover:bg-green-100 transition-colors"
                >
                  <Phone size={20} className="text-green-600" />
                  WhatsApp
                </a>
              </div>

                {selectedApp.coverLetter && (
                  <div className="mb-8">
                    <p className="text-xs font-black uppercase tracking-widest text-clay/30 mb-2">{t('coverLetter')}</p>
                    <div className="p-4 bg-cream rounded-2xl text-clay text-sm leading-relaxed italic">
                      "{selectedApp.coverLetter}"
                    </div>
                  </div>
                )}

                {selectedApp.cvUrl && (
                <div className="bg-cream p-6 rounded-3xl mb-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-terracotta shadow-sm">
                        <FileText size={20} />
                      </div>
                      <span className="font-bold text-clay underline decoration-terracotta/30 underline-offset-4 cursor-pointer" onClick={() => window.open(selectedApp.cvUrl, '_blank')}>View Attachment (CV)</span>
                    </div>
                    <ExternalLink size={18} className="text-clay/20" />
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <p className="text-xs font-black uppercase tracking-widest text-clay/30">Update Status</p>
                <div className="grid grid-cols-2 gap-3">
                  {(['seen', 'interview', 'accepted', 'rejected'] as ApplicationStatus[]).map((status) => (
                    <button
                      key={status}
                      onClick={() => updateAppStatus(selectedApp.id, status)}
                      className={cn(
                        "py-3 rounded-xl border-2 text-xs font-black uppercase transition-all",
                        selectedApp.status === status
                          ? "bg-clay text-white border-clay"
                          : "border-cream-dark text-clay/40 hover:border-clay/20"
                      )}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Request Category Modal */}
      <AnimatePresence>
        {isRequesting && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="absolute inset-0 bg-clay/60 backdrop-blur-sm"
               onClick={() => setIsRequesting(false)}
            />
            <motion.div
              layoutId="request-modal"
              className="bg-white w-full max-w-md rounded-[40px] shadow-2xl p-10 relative z-10"
            >
              <h3 className="text-3xl font-serif font-black text-clay mb-4">Request New Category</h3>
              <p className="text-clay/60 text-sm mb-8 font-medium">Need a specific job title that isn't listed? Ask our Admin to add it.</p>
              
              <form onSubmit={handleRequestCategory} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-clay/30">Position Title</label>
                  <input 
                    required
                    type="text" 
                    placeholder="e.g. Supervisor, Manager..."
                    className="w-full px-5 py-4 bg-cream rounded-2xl border-none focus:ring-2 focus:ring-terracotta text-clay font-medium"
                    value={requestTitle}
                    onChange={e => setRequestTitle(e.target.value)}
                  />
                </div>
                <button type="submit" className="w-full py-4 bg-terracotta text-white font-black rounded-2xl shadow-lg shadow-terracotta/20 hover:bg-terracotta-dark transition-all">
                  Submit Request
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Post Job Modal */}
      <AnimatePresence>
        {isPosting && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-clay/40 backdrop-blur-sm"
              onClick={() => setIsPosting(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl p-8 relative z-10 overflow-y-auto max-h-[90vh]"
            >
              <h2 className="text-3xl font-serif font-black mb-6">Post a New Vacancy</h2>
              <form onSubmit={handleCreateJob} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-clay/40">Job Title</label>
                    <input 
                      required 
                      type="text" 
                      placeholder="e.g. Senior Barista"
                      className="w-full px-4 py-3 bg-cream rounded-xl border-none focus:ring-2 focus:ring-terracotta text-clay font-medium"
                      value={newJob.title}
                      onChange={e => setNewJob({...newJob, title: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-clay/40">Outlet Name</label>
                    <input 
                      required 
                      type="text" 
                      placeholder="e.g. Morning Brew Cafe"
                      className="w-full px-4 py-3 bg-cream rounded-xl border-none focus:ring-2 focus:ring-terracotta text-clay font-medium"
                      value={newJob.outletName}
                      onChange={e => setNewJob({...newJob, outletName: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-clay/40">Category</label>
                    <select 
                      className="w-full px-4 py-3 bg-cream rounded-xl border-none focus:ring-2 focus:ring-terracotta text-clay font-medium"
                      value={newJob.category}
                      onChange={e => setNewJob({...newJob, category: e.target.value as JobCategory})}
                    >
                      <option>Barista</option>
                      <option>Kitchen</option>
                      <option>Waiters</option>
                      <option>Cashier</option>
                      <option>Cleaning Service</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-clay/40">Job Type</label>
                    <select 
                      className="w-full px-4 py-3 bg-cream rounded-xl border-none focus:ring-2 focus:ring-terracotta text-clay font-medium"
                      value={newJob.type}
                      onChange={e => setNewJob({...newJob, type: e.target.value as JobType})}
                    >
                      <option>Full-time</option>
                      <option>Part-time</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-clay/40">Description</label>
                  <textarea 
                    required 
                    rows={4}
                    placeholder="Describe the job duties, requirements, and benefits..."
                    className="w-full px-4 py-3 bg-cream rounded-xl border-none focus:ring-2 focus:ring-terracotta text-clay font-medium"
                    value={newJob.description}
                    onChange={e => setNewJob({...newJob, description: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-clay/40">{t('province')}</label>
                    <select 
                      className="w-full px-4 py-3 bg-cream rounded-xl border-none focus:ring-2 focus:ring-terracotta text-clay font-medium"
                      value={newJob.province}
                      onChange={e => setNewJob({...newJob, province: e.target.value, city: PROVINCES_CITIES[e.target.value as keyof typeof PROVINCES_CITIES][0]})}
                    >
                      {provinces.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-clay/40">{t('city')}</label>
                    <select 
                      className="w-full px-4 py-3 bg-cream rounded-xl border-none focus:ring-2 focus:ring-terracotta text-clay font-medium"
                      value={newJob.city}
                      onChange={e => setNewJob({...newJob, city: e.target.value})}
                    >
                      {cities.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-clay/40">Full Address</label>
                    <input 
                      required 
                      type="text" 
                      placeholder="e.g. Jl. Senopati No. 12"
                      className="w-full px-4 py-3 bg-cream rounded-xl border-none focus:ring-2 focus:ring-terracotta text-clay font-medium"
                      value={newJob.location}
                      onChange={e => setNewJob({...newJob, location: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-clay/40">Salary (Optional)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 5M - 7M IDR"
                      className="w-full px-4 py-3 bg-cream rounded-xl border-none focus:ring-2 focus:ring-terracotta text-clay font-medium"
                      value={newJob.salary}
                      onChange={e => setNewJob({...newJob, salary: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-clay/40">WhatsApp Contact</label>
                    <input 
                      required 
                      type="text" 
                      placeholder="e.g. 62812345678"
                      className="w-full px-4 py-3 bg-cream rounded-xl border-none focus:ring-2 focus:ring-terracotta text-clay font-medium"
                      value={newJob.whatsappContact}
                      onChange={e => setNewJob({...newJob, whatsappContact: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-clay/40">{t('poster')} URL</label>
                    <input 
                      type="text" 
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-4 py-3 bg-cream rounded-xl border-none focus:ring-2 focus:ring-terracotta text-clay font-medium"
                      value={newJob.posterUrl}
                      onChange={e => setNewJob({...newJob, posterUrl: e.target.value})}
                    />
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsPosting(false)}
                    className="flex-grow py-4 border-2 border-clay/10 text-clay font-bold rounded-2xl hover:bg-cream transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-grow py-4 bg-terracotta text-white font-bold rounded-2xl hover:bg-terracotta-dark shadow-lg shadow-terracotta/20 transition-all"
                  >
                    Post Vacancy Now
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Profile / Setup Page ---
const Profile = () => {
  const { user, profile, signIn, updateProfile } = useAuth();
  const { t } = useLang();
  const [formData, setFormData] = useState({
    name: '',
    role: 'seeker' as UserRole,
    whatsappNumber: '',
    cvUrl: '',
    cvs: [] as { id: string; name: string; url: string }[]
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || user?.displayName || '',
        role: profile.role || 'seeker',
        whatsappNumber: profile.whatsappNumber || '',
        cvUrl: profile.cvUrl || '',
        cvs: profile.cvs || []
      });
    } else if (user) {
      setFormData(prev => ({ ...prev, name: user.displayName || '' }));
    }
  }, [profile, user]);

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const addCvField = () => {
    setFormData(prev => ({
      ...prev,
      cvs: [...prev.cvs, { id: crypto.randomUUID(), name: '', url: '' }]
    }));
  };

  const removeCvField = (id: string) => {
    setFormData(prev => ({
      ...prev,
      cvs: prev.cvs.filter(cv => cv.id !== id)
    }));
  };

  const updateCvField = (id: string, field: 'name' | 'url', value: string) => {
    setFormData(prev => ({
      ...prev,
      cvs: prev.cvs.map(cv => cv.id === id ? { ...cv, [field]: value } : cv)
    }));
  };

  if (!user) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center">
        <UserIcon size={64} className="mx-auto text-clay/10 mb-6" />
        <h2 className="text-4xl font-serif font-black mb-4">{t('profile')}</h2>
        <p className="text-clay/60 mb-8 font-medium">Sign in to set up your career profile and start applying or hiring.</p>
        <button onClick={signIn} className="bg-terracotta text-white px-10 py-4 rounded-full font-bold shadow-lg shadow-terracotta/20">{t('signIn')}</button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    try {
      await updateProfile(formData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-serif font-black text-clay mb-2">Profile Settings</h1>
      <p className="text-clay/60 mb-12">How would you like to use BitesBoard?</p>

      <div className="bg-white rounded-[40px] border border-cream-dark shadow-sm p-8 md:p-12">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-clay/40">Full Name</label>
                <input 
                  required 
                  type="text" 
                  className="w-full px-4 py-3 bg-cream rounded-xl border-none focus:ring-2 focus:ring-terracotta text-clay font-medium"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-clay/40">I am a...</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, role: 'seeker'})}
                    className={cn(
                      "py-4 rounded-xl border-2 font-bold transition-all",
                      formData.role === 'seeker' 
                        ? "border-terracotta bg-terracotta/5 text-terracotta shadow-sm" 
                        : "border-clay/10 text-clay/40 hover:border-clay/20"
                    )}
                  >
                    Job Seeker
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, role: 'owner'})}
                    className={cn(
                      "py-4 rounded-xl border-2 font-bold transition-all",
                      formData.role === 'owner' 
                        ? "border-terracotta bg-terracotta/5 text-terracotta shadow-sm" 
                        : "border-clay/10 text-clay/40 hover:border-clay/20"
                    )}
                  >
                    Outlet Owner
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-clay/40">WhatsApp Number</label>
                <input 
                  type="text" 
                  placeholder="e.g. 628..."
                  className="w-full px-4 py-3 bg-cream rounded-xl border-none focus:ring-2 focus:ring-terracotta text-clay font-medium"
                  value={formData.whatsappNumber}
                  onChange={e => setFormData({...formData, whatsappNumber: e.target.value})}
                />
                <p className="text-[10px] text-clay/30 uppercase tracking-wide">For direct communication via WhatsApp button</p>
              </div>
              {formData.role === 'seeker' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase tracking-wider text-clay/40">My CVs / Portfolios</label>
                    <button 
                      type="button" 
                      onClick={addCvField}
                      className="text-[10px] font-black uppercase text-terracotta bg-terracotta/5 px-2 py-1 rounded hover:bg-terracotta/10 transition-colors"
                    >
                      + {t('addCv')}
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {formData.cvs.map((cv) => (
                      <div key={cv.id} className="p-4 bg-cream rounded-2xl border border-cream-dark space-y-3 relative group">
                        <button 
                          type="button"
                          onClick={() => removeCvField(cv.id)}
                          className="absolute top-2 right-2 p-1 text-clay/20 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                        <input 
                          type="text" 
                          placeholder="CV Name (e.g. Barista CV 2024)"
                          className="w-full bg-white px-3 py-2 rounded-lg text-sm font-medium border-none focus:ring-1 focus:ring-terracotta text-clay"
                          value={cv.name}
                          onChange={e => updateCvField(cv.id, 'name', e.target.value)}
                        />
                        <input 
                          type="url" 
                          placeholder="URL Link (Google Drive, etc.)"
                          className="w-full bg-white px-3 py-2 rounded-lg text-sm font-medium border-none focus:ring-1 focus:ring-terracotta text-clay"
                          value={cv.url}
                          onChange={e => updateCvField(cv.id, 'url', e.target.value)}
                        />
                      </div>
                    ))}

                    <div className="space-y-2">
                       <label className="text-[10px] font-bold uppercase tracking-wider text-clay/30">Primary CV (Legacy)</label>
                       <input 
                        type="url" 
                        placeholder="Link to your primary CV"
                        className="w-full px-4 py-3 bg-cream rounded-xl border border-cream-dark focus:ring-2 focus:ring-terracotta text-clay font-medium text-sm"
                        value={formData.cvUrl}
                        onChange={e => setFormData({...formData, cvUrl: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-cream-dark flex items-center justify-between">
            {success ? (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 text-green-600 font-bold"
              >
                <CheckCircle2 size={20} />
                Profile Updated!
              </motion.div>
            ) : <div />}
            <button 
              type="submit"
              disabled={saving}
              className={cn(
                "bg-clay text-white px-12 py-4 rounded-full font-bold hover:bg-clay/90 transition-all shadow-lg flex items-center justify-center min-w-[200px]",
                saving && "opacity-70 cursor-not-allowed"
              )}
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Main App ---
export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/jobs" element={<Jobs />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/seeker-dashboard" element={<SeekerDashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Layout>
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}
