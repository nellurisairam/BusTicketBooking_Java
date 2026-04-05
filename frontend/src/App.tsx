import React, { useState, useEffect } from 'react';
import { 
  Bus, 
  Ticket, 
  LayoutDashboard, 
  History, 
  Settings, 
  MapPin, 
  LogOut, 
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Search,
  ArrowRight,
  TrendingUp,
  Users,
  Bell,
  Download,
  Printer,
  ShieldCheck,
  Zap,
  MoreVertical,
  QrCode,
  Shield,
  Coffee,
  Wifi,
  ChevronRight,
  Globe,
  CloudSun,
  Activity,
  Terminal,
  Clock,
  Briefcase,
  Lock,
  User,
  Fingerprint,
  Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

// System Configuration
const SYSTEM_NAME = "BusTick";
const SYSTEM_VERSION = "v2.8.0 Elite";
const API_BASE = "http://localhost:8080/api/bookings";

const DEFAULT_BUSES = [
  { id: 1, destination: 'Tokyo Central', fare: 12.0, availableSeats: 20, takenSeats: "", departureTime: "08:30 AM", busType: "Standard AC", plateNumber: "BUS-7741-A", weather: "Sunny 22°C" },
  { id: 2, destination: 'Osaka Express', fare: 15.0, availableSeats: 20, takenSeats: "5,6,10", departureTime: "11:45 AM", busType: "Luxury Sleeper", plateNumber: "BUS-9902-B", weather: "Cloudy 18°C" },
  { id: 3, destination: 'Kyoto Heritage', fare: 12.0, availableSeats: 20, takenSeats: "", departureTime: "02:15 PM", busType: "Executive", plateNumber: "BUS-1123-C", weather: "Rainy 15°C" },
  { id: 4, destination: 'Fukuoka South', fare: 18.5, availableSeats: 20, takenSeats: "15,16", departureTime: "06:00 PM", busType: "Ultra Premium", plateNumber: "BUS-5566-D", weather: "Clear 25°C" },
  { id: 5, destination: 'Kanazawa West', fare: 22.0, availableSeats: 20, takenSeats: "", departureTime: "10:30 PM", busType: "Overnight Luxury", plateNumber: "BUS-8877-E", weather: "Snowy 2°C" },
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [buses, setBuses] = useState<any[]>(DEFAULT_BUSES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDest, setSelectedDest] = useState<any>(null);
  const [passengers, setPassengers] = useState(1);
  const [discounted, setDiscounted] = useState(0);
  const [bookingStep, setBookingStep] = useState(1);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [toasts, setToasts] = useState<any[]>([]);
  const [filterType, setFilterType] = useState('All');
  const [language, setLanguage] = useState<'EN' | 'HI' | 'JP'>('EN');
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Login Specific State
  const [loginType, setLoginType] = useState<'Admin' | 'Passenger'>('Admin');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const addToast = (msg: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts([...toasts, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  };

  const handleLogin = () => {
    if (user.username.trim() === 'admin' && user.password === 'admin') {
      setIsLoggedIn(true);
      addToast("Uplink Successful: Session Validated");
    } else {
      addToast("Access Denied: Terminal Lockout", 'error');
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const handleMouseMove = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      clearInterval(timer);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  useEffect(() => {
    if (isLoggedIn) fetchData();
  }, [isLoggedIn]);

  const fetchData = async () => {
    try {
      const [hRes, bRes] = await Promise.all([
        axios.get(`${API_BASE}/history`),
        axios.get(`${API_BASE}/buses`)
      ]);
      if (hRes.data) setBookings(hRes.data);
      if (bRes.data && bRes.data.length > 0) setBuses(bRes.data);
    } catch (err) {
      console.warn("Backend handshake failed, using offline data fallback.");
    }
  };

  const calculateTotal = () => {
    if (!selectedDest) return 0;
    const baseTotal = (passengers - discounted) * selectedDest.fare;
    const discountedTotal = discounted * (selectedDest.fare * 0.85); 
    return baseTotal + discountedTotal;
  };

  const handleBooking = async () => {
    setIsLoading(true);
    addToast("Encrypting Manifest Payload...", "success");
    try {
      const payload = {
        passengerName: user.username,
        destination: selectedDest.destination,
        regularPassengers: passengers - discounted,
        discountedPassengers: discounted,
        selectedSeats: selectedSeats.join(', '),
        totalAmount: calculateTotal()
      };
      await axios.post(`${API_BASE}/create`, payload);
      await fetchData(); 
      setBookingStep(4);
      addToast("Database Persistent: Transaction Finalized");
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || "Uplink Failed";
      addToast(`Booking Failed: ${errorMsg}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBooking = async (id: number) => {
    if (!confirm("Are you sure you want to purge this record?")) return;
    try {
      await axios.delete(`${API_BASE}/${id}`);
      setBookings(bookings.filter(b => b.id !== id));
      addToast("System Wipe: Record Permanently Purged", 'success');
      await fetchData(); 
    } catch (err) {
      addToast("Authorization Failure", 'error');
    }
  };

  const [user, setUser] = useState({ username: '', password: '' });

  const takenSeatList = selectedDest?.takenSeats 
    ? selectedDest.takenSeats.split(',').map((s: string) => parseInt(s.trim())) 
    : [];

  const filteredBookings = bookings.filter(b => 
    b.passengerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.destination?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBuses = buses.filter(b => 
    (filterType === 'All' || b.busType.includes(filterType)) &&
    b.destination?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#050507] overflow-hidden relative cursor-default">
        {/* Dynamic Interactive Glow */}
        <motion.div 
          animate={{ x: mousePos.x - 200, y: mousePos.y - 200 }}
          className="fixed w-[400px] h-[400px] bg-primary/20 rounded-full blur-[100px] -z-10 pointer-events-none"
        />
        
        {/* Architectural Background Grid */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 -z-20" />
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-secondary/5 -z-20" />

        {/* Floating Background Icons */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
           {[Bus, Shield, Cpu, Fingerprint, Zap].map((Icon, i) => (
             <motion.div
               key={i}
               initial={{ opacity: 0, scale: 0 }}
               animate={{ 
                 opacity: [0.1, 0.3, 0.1], 
                 scale: [1, 1.2, 1],
                 x: [Math.random()*1000, Math.random()*1000],
                 y: [Math.random()*1000, Math.random()*1000]
               }}
               transition={{ duration: 10 + i * 2, repeat: Infinity }}
               className="absolute"
             >
               <Icon size={120} className="text-white/10" />
             </motion.div>
           ))}
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="glass-card w-full max-w-xl p-16 space-y-12 border-white/10 relative overflow-hidden backdrop-blur-2xl shadow-[0_0_100px_rgba(var(--primary-rgb),0.1)]"
        >
          {/* Header */}
          <div className="text-center space-y-8 relative">
            <motion.div 
              whileHover={{ rotate: 360 }}
              transition={{ duration: 1 }}
              className="bg-gradient-to-br from-primary to-secondary w-28 h-28 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(var(--primary-rgb),0.5)] border border-white/20"
            >
              <Bus size={56} className="text-white" />
            </motion.div>
            <div>
              <h1 className="text-7xl font-black tracking-tighter leading-none mb-4 uppercase italic">
                {SYSTEM_NAME}<span className="text-primary">.</span>
              </h1>
              <div className="flex justify-center items-center gap-3">
                 <div className="h-px w-8 bg-white/20" />
                 <p className="text-text-muted font-black uppercase tracking-[0.4em] text-[10px] opacity-60">{SYSTEM_VERSION}</p>
                 <div className="h-px w-8 bg-white/20" />
              </div>
            </div>
          </div>

          {/* User Type Switch */}
          <div className="flex p-2 bg-white/5 rounded-[2rem] border border-white/10 relative">
             <motion.div 
               animate={{ x: loginType === 'Admin' ? 0 : '100%' }}
               className="absolute top-2 bottom-2 left-2 w-[calc(50%-8px)] bg-primary rounded-[1.5rem] shadow-xl z-10"
             />
             <button onClick={() => setLoginType('Admin')} className={`flex-1 py-4 font-black text-sm uppercase italic relative z-20 transition-colors ${loginType === 'Admin' ? 'text-white' : 'text-text-muted'}`}>System Admin</button>
             <button onClick={() => setLoginType('Passenger')} className={`flex-1 py-4 font-black text-sm uppercase italic relative z-20 transition-colors ${loginType === 'Passenger' ? 'text-white' : 'text-text-muted'}`}>Passenger Portal</button>
          </div>

          {/* Form */}
          <div className="space-y-8 relative">
            <div className="space-y-3">
               <label className="text-[10px] uppercase tracking-widest text-text-muted font-black px-4 flex items-center gap-2">
                 <User size={12} className="text-primary" />
                 Identification Code
               </label>
               <input 
                type="text" 
                placeholder="Ex: operator-01" 
                className="input-field bg-white/5 border-white/10 py-6 px-8 text-xl font-bold rounded-[2.5rem] focus:border-primary transition-all placeholder:text-white/10" 
                value={user.username}
                onChange={(e) => setUser({...user, username: e.target.value})}
              />
            </div>
            <div className="space-y-3">
               <label className="text-[10px] uppercase tracking-widest text-text-muted font-black px-4 flex items-center gap-2">
                 <Lock size={12} className="text-primary" />
                 Security Passkey
               </label>
               <input 
                type="password" 
                placeholder="••••••••" 
                className="input-field bg-white/5 border-white/10 py-6 px-8 text-xl font-bold rounded-[2.5rem] focus:border-primary transition-all placeholder:text-white/10" 
                value={user.password}
                onChange={(e) => setUser({...user, password: e.target.value})}
              />
            </div>
            
            <div className="flex items-center justify-between px-4">
               <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="w-6 h-6 rounded-lg border-2 border-white/20 group-hover:border-primary transition-colors flex items-center justify-center">
                     <div className="w-3 h-3 bg-primary rounded-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <span className="text-[10px] font-black uppercase text-text-muted">Remember Session</span>
               </label>
               <button className="text-[10px] font-black uppercase text-primary hover:underline italic">Lost Passkey?</button>
            </div>

            <button 
              className="btn-primary w-full py-8 text-2xl font-black mt-4 shadow-2xl shadow-primary/30 group relative overflow-hidden" 
              onClick={handleLogin}
            >
              <div className="absolute inset-0 bg-white/10 translate-x-full group-hover:translate-x-0 transition-transform skew-x-12" />
              <span className="relative z-10 flex items-center justify-center gap-4">
                 INITIALIZE PROTOCOL
                 <ChevronRight size={32} />
              </span>
            </button>
          </div>

          <p className="text-center text-[10px] text-text-muted font-black uppercase tracking-widest opacity-40 italic">
            Neural Handshake Active <span className="text-white/20 mx-2">|</span> Root Access Only
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#050507] text-white selection:bg-primary/30 font-display">
      <motion.nav animate={{ width: isSidebarOpen ? 300 : 120 }} className="glass-card rounded-none border-y-0 border-l-0 border-white/5 h-screen sticky top-0 flex flex-col p-8 z-50 overflow-hidden">
        <div className="flex items-center gap-5 px-2 mb-20">
          <div className="bg-primary p-4 rounded-[1.5rem] shadow-2xl shadow-primary/30"><Bus className="text-white" size={32} /></div>
          {isSidebarOpen && <span className="text-3xl font-black tracking-tighter">{SYSTEM_NAME}<span className="text-primary">.</span></span>}
        </div>
        <div className="space-y-4 flex-1">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Omni Command' },
            { id: 'booking', icon: Ticket, label: 'Ticket Hub' },
            { id: 'history', icon: History, label: 'Audit Vault' },
            { id: 'settings', icon: Settings, label: 'Preferences' }
          ].map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-5 p-5 rounded-[1.5rem] transition-all relative group ${activeTab === item.id ? 'bg-primary/10 text-primary' : 'hover:bg-white/5 text-text-muted'}`}>
              <item.icon size={28} className={activeTab === item.id ? 'stroke-[3px]' : ''} />
              {isSidebarOpen && <span className="font-black text-lg tracking-tight">{item.label}</span>}
            </button>
          ))}
        </div>
        <div className="pt-10 border-t border-white/5">
           <button onClick={() => setIsLoggedIn(false)} className="w-full flex items-center gap-5 p-5 rounded-[1.5rem] text-danger/60 hover:bg-danger/10 hover:text-danger transition-all font-black">
            <LogOut size={28} />
            {isSidebarOpen && <span className="text-lg tracking-tight">System Exit</span>}
          </button>
        </div>
      </motion.nav>

      <main className="flex-1 p-10 lg:p-20 overflow-y-auto relative">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 mb-20">
          <div className="space-y-4">
            <div className="flex items-center gap-6">
               <div className="flex items-center gap-3 text-text-muted uppercase font-black tracking-[0.3em] text-[10px]">
                  <Globe size={14} className="text-primary" />
                  Region: {language}
               </div>
               <div className="flex items-center gap-2 bg-white/5 px-4 py-1 rounded-full border border-white/10 text-[10px] font-black italic">
                  <Clock size={12} className="text-secondary" />
                  {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
               </div>
            </div>
            <h2 className="text-6xl font-black tracking-tight leading-none mb-4 italic uppercase">{activeTab}<span className="text-primary">.</span></h2>
            <p className="text-text-muted text-xl flex items-center gap-3 font-medium">Operator Uplink: {user.username}</p>
          </div>
          <div className="flex items-center gap-6">
             <div className="flex p-2 bg-white/5 rounded-[1.5rem] border border-white/10">
                {['EN', 'HI', 'JP'].map(l => (
                   <button key={l} onClick={() => {setLanguage(l as 'EN'); addToast(`Language Shift: ${l}`)}} className={`px-5 py-2 rounded-xl text-[10px] font-black transition-all ${language === l ? 'bg-primary text-white shadow-lg' : 'text-text-muted hover:text-white'}`}>{l}</button>
                ))}
             </div>
             <motion.div whileHover={{ scale: 1.05 }} className="glass-card p-5 rounded-[2rem] border-white/10 bg-white/5 flex items-center gap-4">
                <div className="text-right">
                   <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Master Op</p>
                   <p className="font-black text-xs">Terminal 1-A</p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center font-black text-2xl shadow-2xl">{user.username.charAt(0).toUpperCase()}</div>
             </motion.div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div key="dash" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                  { label: 'Fleet Gross', value: `$${bookings.reduce((acc, b) => acc + b.totalAmount, 0).toFixed(2)}`, icon: Activity, color: 'primary' },
                  { label: 'Active Fleet', value: buses.length, icon: Bus, color: 'secondary' },
                  { label: 'Total Manifests', value: bookings.length, icon: FileText, color: 'success' },
                  { label: 'Standard Rev.', value: `$${bookings.reduce((acc, b) => acc + (b.regularPassengers * 12), 0).toFixed(2)}`, icon: TrendingUp, color: 'white' }
                ].map((stat, i) => (
                  <motion.div whileHover={{ y: -10 }} key={i} className="glass-card p-10 group relative border-white/5">
                    <stat.icon className={`text-${stat.color} mb-8 opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all`} size={36} />
                    <p className="text-text-muted font-black text-[10px] uppercase tracking-[0.3em]">{stat.label}</p>
                    <p className="text-5xl font-black mt-4 tracking-tighter">{stat.value}</p>
                  </motion.div>
                ))}
              </div>

              <div className="grid lg:grid-cols-3 gap-8">
                 <div className="lg:col-span-2 glass-card p-12 border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 blur-[100px] rounded-full -mr-48 -mt-48" />
                    <div className="flex justify-between items-center mb-12">
                       <h4 className="text-3xl font-black italic underline underline-offset-8 decoration-primary">Revenue Pulse Analysis</h4>
                       <TrendingUp className="text-success" />
                    </div>
                    <div className="h-64 flex items-end gap-3 relative pb-6 border-b border-white/5">
                       {Array.from({ length: 20 }).map((_, i) => (
                         <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${Math.random() * 80 + 20}%` }} transition={{ delay: i * 0.05 }} className="flex-1 bg-primary/20 rounded-t-lg group relative cursor-crosshair">
                            <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-lg" />
                         </motion.div>
                       ))}
                    </div>
                 </div>
                 <div className="glass-card p-10 border-white/5 bg-white/[0.02] space-y-8">
                    <h4 className="text-xl font-black flex items-center gap-3">
                       <Terminal size={20} className="text-primary" />
                       Recent Audit Logs
                    </h4>
                    <div className="space-y-6">
                       {[
                         { msg: "Neural Uplink Secure", status: "SUCCESS" },
                         { msg: "DB Synchronized", status: "READY" },
                         { msg: "Region Mesh: JP Active", status: "STATUS" }
                       ].map((log, i) => (
                         <div key={i} className="flex justify-between items-center text-xs font-bold border-l-2 border-primary/20 pl-4 py-2 hover:bg-white/5 transition-all">
                            <span className="text-text-muted tracking-tight">{log.msg}</span>
                            <span className="text-primary font-black uppercase text-[8px] tracking-widest">{log.status}</span>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'booking' && (
            <motion.div key="booking" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-16">
              {bookingStep === 1 && (
                <div className="space-y-12">
                   <div className="flex flex-col md:flex-row justify-between items-center gap-10">
                      <div>
                        <h3 className="text-5xl font-black mb-4 flex items-center gap-6 leading-none tracking-tighter">Vector <span className="text-primary italic">Targeting.</span></h3>
                        <p className="text-text-muted font-bold text-xl opacity-60">Initialize fleet protocol for the current cycle.</p>
                      </div>
                      <div className="relative w-full md:w-96">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
                        <input type="text" placeholder="Search Matrix..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="input-field pl-14 py-4 rounded-[1.5rem] bg-white/5 border-white/10" />
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {filteredBuses.map((dest) => (
                      <motion.button key={dest.id} whileHover={{ y: -10 }} onClick={() => { setSelectedDest(dest); setBookingStep(2); }} className="glass-card p-10 flex flex-col justify-between hover:border-primary transition-all group overflow-hidden border-white/5 text-left">
                         <div className="flex justify-between items-start">
                            <div className="flex items-center gap-6">
                               <div className="bg-primary/20 p-5 rounded-[2rem] group-hover:rotate-12 transition-transform shadow-2xl"><MapPin className="text-primary" size={32} /></div>
                               <div>
                                  <p className="text-[10px] font-black text-secondary uppercase tracking-[0.3em] mb-2">{dest.busType} | {dest.plateNumber}</p>
                                  <p className="text-4xl font-black tracking-tighter italic">{dest.destination}</p>
                               </div>
                            </div>
                            <div className="bg-white/5 p-4 rounded-3xl border border-white/5 text-center">
                               <CloudSun size={24} className="text-primary mx-auto mb-2" />
                               <p className="text-[10px] font-black uppercase tracking-tighter">{dest.weather}</p>
                            </div>
                         </div>
                         <div className="h-px bg-white/5 my-8" />
                         <div className="flex justify-between items-center font-black">
                            <div className="space-y-1">
                               <p className="text-[10px] text-text-muted uppercase tracking-[0.2em]">Departure Point</p>
                               <p className="text-xl flex items-center gap-2"><Zap size={16} className="text-success" /> {dest.departureTime}</p>
                            </div>
                            <div className="text-right">
                               <p className="text-4xl text-primary font-mono">${dest.fare}</p>
                               <p className="text-[8px] text-text-muted uppercase tracking-[0.4em]">Per Unit Payload</p>
                            </div>
                         </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {bookingStep === 2 && (
                <div className="grid lg:grid-cols-5 gap-12 max-w-7xl mx-auto items-start">
                  <div className="lg:col-span-2 space-y-8">
                    <div className="glass-card p-12 space-y-10 shadow-2xl">
                       <h3 className="text-3xl font-black italic">Unit Configuration</h3>
                       <div className="space-y-10">
                          <div className="space-y-4">
                            <div className="flex justify-between items-center mb-6">
                              <label className="text-[10px] font-black uppercase tracking-[0.4em] text-text-muted">Total Units</label>
                              <span className="text-4xl font-black text-primary font-mono">{passengers}</span>
                            </div>
                            <input type="range" min="1" max="10" value={passengers} onChange={(e) => { setPassengers(parseInt(e.target.value)); setSelectedSeats([]); }} className="w-full h-3 bg-white/5 rounded-full accent-primary appearance-none cursor-pointer" />
                          </div>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center mb-6">
                              <label className="text-[10px] font-black uppercase tracking-[0.4em] text-text-muted">VIP Discount Status</label>
                              <span className="text-4xl font-black text-secondary font-mono">{discounted}</span>
                            </div>
                            <input type="range" min="0" max={passengers} value={discounted} onChange={(e) => setDiscounted(parseInt(e.target.value))} className="w-full h-3 bg-white/5 rounded-full accent-secondary appearance-none cursor-pointer" />
                          </div>
                       </div>
                    </div>
                    <div className="glass-card p-8 bg-primary/5 border-primary/20 flex items-center gap-6">
                       <Briefcase className="text-primary" size={32} />
                       <p className="text-xs font-black italic tracking-wide">Multi-Passenger Enrollment System Active</p>
                    </div>
                  </div>

                  <div className="lg:col-span-3 glass-card p-12 text-center space-y-12 border-white/10">
                    <h3 className="text-3xl font-black italic underline underline-offset-8 decoration-primary">Matrix Allocation</h3>
                    <div className="grid grid-cols-4 gap-6 p-10 bg-white/[0.02] rounded-[3rem] border border-white/5">
                      {Array.from({ length: 20 }).map((_, i) => {
                        const seatNum = i + 1;
                        const isSelected = selectedSeats.includes(seatNum);
                        const isBooked = takenSeatList.includes(seatNum);
                        return (
                          <motion.div key={i} whileTap={{ scale: 0.9 }} onClick={() => !isBooked && (isSelected ? setSelectedSeats(selectedSeats.filter(s => s !== seatNum)) : selectedSeats.length < passengers && setSelectedSeats([...selectedSeats, seatNum]))}
                            className={`h-16 w-full rounded-2xl flex items-center justify-center font-black text-lg cursor-pointer transition-all border-2 ${isBooked ? 'bg-white/5 text-white/5 border-white/5 cursor-not-allowed opacity-20' : isSelected ? 'bg-primary text-white border-primary shadow-2xl shadow-primary/60 scale-110 z-10' : 'bg-white/[0.03] text-white/40 border-white/10 hover:border-primary/50 hover:bg-primary/5'}`}
                          >{seatNum}</motion.div>
                        );
                      })}
                    </div>
                    <div className="flex gap-8">
                       <button className="flex-1 p-6 rounded-[2rem] border border-white/10 font-black uppercase tracking-widest text-xs hover:bg-white/5 transition-all" onClick={() => setBookingStep(1)}>Abort Sequence</button>
                       <button className={`flex-1 btn-primary p-6 text-xl font-black shadow-2xl transition-all ${selectedSeats.length === passengers ? 'opacity-100 shadow-primary/40' : 'opacity-20 cursor-not-allowed'}`} disabled={selectedSeats.length !== passengers} onClick={() => setBookingStep(3)}>Initialize Sync</button>
                    </div>
                  </div>
                </div>
              )}

              {bookingStep === 3 && (
                <div className="space-y-16 max-w-4xl mx-auto">
                  <div className="text-center"><h3 className="text-6xl font-black tracking-tighter italic mb-4">Summary Protocol</h3></div>
                  <div className="glass-card p-12 space-y-10 border-white/10 shadow-2xl">
                    {[
                      { label: 'Registry Admin', value: user.username },
                      { label: 'Vector Plate', value: selectedDest.plateNumber },
                      { label: 'Destination Core', value: selectedDest.destination },
                      { label: 'Unit Allocation', value: `# ${selectedSeats.join(', ')}` },
                    ].map((row, i) => (
                      <div key={i} className="flex justify-between items-center text-xl border-b border-white/5 pb-6">
                        <span className="text-[10px] uppercase font-black tracking-[0.4em] text-text-muted">{row.label}</span>
                        <span className="font-black text-white">{row.value}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-8">
                       <span className="text-2xl font-black italic">GROSS TOTAL LOAD</span>
                       <span className="text-6xl font-black text-secondary font-mono">${calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex gap-10">
                    <button className="flex-1 p-6 rounded-[2rem] border border-white/10 font-bold hover:bg-white/5" onClick={() => setBookingStep(2)}>Back</button>
                    <button className="flex-3 btn-primary p-6 text-2xl font-black shadow-2xl flex items-center justify-center gap-4" onClick={handleBooking} disabled={isLoading}>
                       {isLoading ? 'Uplink In Progress...' : 'EXECUTE AUTHORIZATION'}
                       <ChevronRight size={32} />
                    </button>
                  </div>
                </div>
              )}

              {bookingStep === 4 && (
                <div className="text-center py-20 space-y-16">
                   <motion.div initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} className="w-48 h-48 bg-gradient-to-br from-success/10 to-success/30 text-success rounded-[4rem] flex items-center justify-center mx-auto shadow-2xl border border-success/20">
                    <ShieldCheck size={96} />
                  </motion.div>
                  <div>
                    <h3 className="text-7xl font-black italic tracking-tighter mb-4">Core Synchronized.</h3>
                    <p className="text-text-muted text-2xl font-medium">Manifest secure. Permit ready for neural export.</p>
                  </div>
                  <div className="glass-card max-w-sm mx-auto p-10 border-white/10 group cursor-pointer" onClick={() => window.print()}>
                     <div className="flex flex-col items-center gap-8 relative z-10">
                        <QrCode size={140} className="text-white opacity-80" />
                        <div className="space-y-1">
                           <p className="font-black text-lg tracking-tighter">PERMIT_REF: #{Math.floor(Math.random()*1000000)}</p>
                           <Printer size={24} className="text-primary mx-auto" />
                        </div>
                     </div>
                  </div>
                  <div className="flex gap-8 max-w-xl mx-auto pt-10">
                    <button className="flex-1 btn-primary py-6 font-black text-2xl shadow-2xl" onClick={() => setActiveTab('history')}>Open Audit</button>
                    <button className="flex-1 p-6 rounded-[2rem] border border-white/20 font-black text-xl" onClick={() => { setBookingStep(1); setSelectedDest(null); setSelectedSeats([]); setActiveTab('dashboard'); }}>Home</button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div key="hist" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className="space-y-16">
              <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-10">
                <h3 className="text-5xl font-black italic tracking-tighter underline underline-offset-8 decoration-secondary">Audit Manifest Vault</h3>
                <div className="relative w-full lg:w-[500px]">
                   <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-text-muted" size={24} />
                   <input type="text" placeholder="Filter Registry Protocol..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="input-field pl-16 py-6 bg-white/5 border-white/10 text-xl font-bold rounded-[2rem]" />
                </div>
              </div>
              <div className="grid gap-8">
                {filteredBookings.map((b) => (
                  <motion.div layout key={b.id} className="glass-card p-12 flex flex-col xl:flex-row items-center justify-between gap-12 hover:bg-white/[0.04] transition-all border-white/5 hover:border-primary group">
                    <div className="flex items-center gap-10">
                      <div className="bg-secondary/20 p-8 rounded-[3rem] group-hover:bg-secondary/40 transition-all shadow-2xl"><Ticket className="text-secondary" size={48} /></div>
                      <div>
                        <p className="text-[10px] font-black text-secondary uppercase tracking-[0.4em] mb-2">Record Verified</p>
                        <p className="text-3xl font-black">REF: #{b.id.toString().padStart(6, '0')}</p>
                        <p className="text-2xl font-bold text-white/50">{b.passengerName} <ArrowRight className="text-primary inline mx-2" size={20} /> <span className="text-white">{b.destination}</span></p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-center xl:items-end gap-6 w-full xl:w-auto">
                      <p className="text-6xl font-black text-success font-mono tracking-tighter">${b.totalAmount.toFixed(2)}</p>
                      <div className="flex gap-4">
                        <button onClick={() => handleDeleteBooking(b.id)} className="px-8 py-3 bg-danger/10 text-danger text-xs font-black tracking-widest rounded-xl border border-danger/20 uppercase hover:bg-danger/20 transition-all">Terminate</button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-5xl space-y-16">
              <h3 className="text-5xl font-black italic tracking-tighter underline underline-offset-8 decoration-primary">Architect Core</h3>
              <div className="glass-card p-12 space-y-12">
                 <div className="grid md:grid-cols-2 gap-12">
                    <div className="space-y-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Biometric Profile</p>
                      <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 space-y-4">
                         <div className="flex justify-between border-b border-white/5 pb-4"><span className="text-text-muted font-bold">Operator</span><span className="font-black text-xl">{user.username}</span></div>
                         <div className="flex justify-between"><span className="text-text-muted font-bold">Security Rank</span><span className="font-black text-xl text-primary italic">SYSTEM OVERLORD</span></div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-secondary">Neural Pipeline</p>
                      <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 space-y-4 font-mono">
                         <div className="flex justify-between border-b border-white/5 pb-4"><span className="text-text-muted">Load Status</span><span className="text-success font-black">OPTIMAL [0.12]</span></div>
                         <div className="flex justify-between"><span className="text-text-muted">Core Ping</span><span className="text-primary font-black">1.2ms</span></div>
                      </div>
                    </div>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <div className="fixed bottom-12 right-12 z-[100] flex flex-col gap-6 pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div key={toast.id} initial={{ opacity: 0, x: 200, scale: 0.5 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} className={`glass-card p-8 flex items-center gap-6 min-w-[350px] shadow-2xl border-l-[6px] pointer-events-auto ${toast.type === 'success' ? 'border-l-success bg-success/20' : 'border-l-danger bg-danger/20'}`}>
              <div className={toast.type === 'success' ? 'text-success' : 'text-danger'}>{toast.type === 'success' ? <ShieldCheck size={40} /> : <AlertCircle size={40} />}</div>
              <div>
                <p className="text-[10px] uppercase font-black tracking-[0.4em] opacity-40 mb-1">Neural Alert</p>
                <p className="font-black text-lg tracking-tight">{toast.msg}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

const FileText: React.FC<any> = (props) => (
  <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-text"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
);

export default App;
