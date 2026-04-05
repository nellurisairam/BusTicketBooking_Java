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
  Cpu,
  PieChart,
  Navigation,
  Compass,
  Monitor,
  Radar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

// System Configuration
const SYSTEM_NAME = "BusTick";
const SYSTEM_VERSION = "v3.2.0 Elite";
const API_BASE = "http://localhost:8080/api/bookings";

const DEFAULT_BUSES = [
  { id: 1, destination: 'Tokyo Central', fare: 12.0, availableSeats: 20, takenSeats: "", departureTime: "08:30 AM", busType: "Standard AC", plateNumber: "BUS-7741-A", weather: "Sunny 22°C", x: 10, y: -20 },
  { id: 2, destination: 'Osaka Express', fare: 15.0, availableSeats: 20, takenSeats: "5,6,10", departureTime: "11:45 AM", busType: "Luxury Sleeper", plateNumber: "BUS-9902-B", weather: "Cloudy 18°C", x: -40, y: 30 },
  { id: 3, destination: 'Kyoto Heritage', fare: 12.0, availableSeats: 20, takenSeats: "", departureTime: "02:15 PM", busType: "Executive", plateNumber: "BUS-1123-C", weather: "Rainy 15°C", x: 60, y: -50 },
  { id: 4, destination: 'Fukuoka South', fare: 18.5, availableSeats: 20, takenSeats: "15,16", departureTime: "06:00 PM", busType: "Ultra Premium", plateNumber: "BUS-5566-D", weather: "Clear 25°C", x: -20, y: -70 },
  { id: 5, destination: 'Kanazawa West', fare: 22.0, availableSeats: 20, takenSeats: "", departureTime: "10:30 PM", busType: "Overnight Luxury", plateNumber: "BUS-8877-E", weather: "Snowy 2°C", x: 80, y: 40 },
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
  
  const [loginType, setLoginType] = useState<'Admin' | 'User'>('Admin');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const addToast = (msg: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts([...toasts, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  };

  const handleLogin = () => {
    if (user.username.trim() === 'admin' && user.password === 'admin') {
      setIsLoggedIn(true);
      addToast("Login Successful: Welcome back");
    } else {
      addToast("Login Failed: Check credentials", 'error');
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
    addToast("Processing your booking...", "success");
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
      addToast("Ticket Booked Successfully!");
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || "Connection Failed";
      addToast(`Booking Failed: ${errorMsg}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBooking = async (id: number) => {
    if (!confirm("Are you sure you want to cancel this ticket?")) return;
    try {
      await axios.delete(`${API_BASE}/${id}`);
      setBookings(bookings.filter(b => b.id !== id));
      addToast("Ticket Cancelled Successfully", 'success');
      await fetchData(); 
    } catch (err) {
      addToast("Cannot delete ticket", 'error');
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
        <motion.div animate={{ x: mousePos.x - 300, y: mousePos.y - 300 }} className="fixed w-[600px] h-[600px] bg-primary/20 rounded-full blur-[150px] -z-10 pointer-events-none" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 -z-20" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
           {[Bus, Shield, Cpu, Monitor, Zap].map((Icon, i) => (
             <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: [0.1, 0.4, 0.1], scale: [1, 1.3, 1], x: [Math.random()*1000, Math.random()*1000], y: [Math.random()*1000, Math.random()*1000] }} transition={{ duration: 15, repeat: Infinity }} className="absolute">
               <Icon size={150} className="text-white/10" />
             </motion.div>
           ))}
        </div>

        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="glass-card w-full max-w-2xl p-16 space-y-12 border-white/10 relative overflow-hidden backdrop-blur-3xl shadow-2xl">
          <div className="text-center space-y-8">
            <motion.div whileHover={{ rotate: 180 }} className="bg-gradient-to-br from-primary to-secondary w-28 h-28 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl border border-white/20">
              <Bus size={56} className="text-white" />
            </motion.div>
            <div>
              <h1 className="text-7xl font-black tracking-tighter leading-none mb-4 uppercase italic">{SYSTEM_NAME}<span className="text-primary">.</span></h1>
              <p className="text-text-muted font-black uppercase tracking-[0.4em] text-[10px] opacity-60">Architectural System v3.2.0 Elite</p>
            </div>
          </div>
          <div className="flex p-3 bg-white/5 rounded-[2.5rem] border border-white/10 relative">
             <motion.div animate={{ x: loginType === 'Admin' ? 0 : '100%' }} className="absolute top-2 bottom-2 left-2 w-[calc(50%-8px)] bg-primary rounded-[2rem] shadow-2xl z-10" />
             <button onClick={() => setLoginType('Admin')} className={`flex-1 py-4 font-black text-sm uppercase italic relative z-20 transition-colors ${loginType === 'Admin' ? 'text-white' : 'text-text-muted'}`}>Admin Login</button>
             <button onClick={() => setLoginType('User')} className={`flex-1 py-4 font-black text-sm uppercase italic relative z-20 transition-colors ${loginType === 'User' ? 'text-white' : 'text-text-muted'}`}>User Login</button>
          </div>
          <div className="space-y-8">
            <div className="space-y-3">
               <label className="text-[10px] uppercase font-black text-text-muted px-6 flex items-center gap-3"><User size={14} className="text-primary" /> Identification Signature</label>
               <input type="text" placeholder="SEC-01-CODE" className="input-field bg-white/5 border-white/10 py-6 px-10 text-xl font-bold rounded-[3rem] focus:border-primary" value={user.username} onChange={(e) => setUser({...user, username: e.target.value})}/>
            </div>
            <div className="space-y-3">
               <label className="text-[10px] uppercase font-black text-text-muted px-6 flex items-center gap-3"><Lock size={14} className="text-primary" /> Security Vector</label>
               <input type="password" placeholder="••••••••" className="input-field bg-white/5 border-white/10 py-6 px-10 text-xl font-bold rounded-[3rem] focus:border-primary" value={user.password} onChange={(e) => setUser({...user, password: e.target.value})}/>
            </div>
            <button className="btn-primary w-full py-8 text-2xl font-black mt-6 shadow-2xl flex items-center justify-center gap-6 group" onClick={handleLogin}>
              INITIALIZE LOGIN
              <ChevronRight size={32} className="group-hover:translate-x-3 transition-transform" />
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#050507] text-white selection:bg-primary/30 font-display transition-all">
      <motion.nav animate={{ width: isSidebarOpen ? 300 : 120 }} className="glass-card rounded-none border-y-0 border-l-0 border-white/5 h-screen sticky top-0 flex flex-col p-8 z-50 overflow-hidden">
        <div className="flex items-center gap-6 px-2 mb-20 cursor-pointer" onClick={() => setSidebarOpen(!isSidebarOpen)}>
          <div className="bg-primary p-4 rounded-[1.5rem] shadow-2xl shadow-primary/30 hover:scale-110 transition-transform"><Bus className="text-white" size={32} /></div>
          {isSidebarOpen && <span className="text-3xl font-black tracking-tighter italic">{SYSTEM_NAME}<span className="text-primary">.</span></span>}
        </div>
        <div className="space-y-4 flex-1">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { id: 'booking', icon: Ticket, label: 'Book Ticket' },
            { id: 'history', icon: History, label: 'History' },
            { id: 'fleet', icon: Compass, label: 'Track Bus' },
            { id: 'settings', icon: Settings, label: 'Settings' }
          ].map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-6 p-5 rounded-[2rem] transition-all relative group ${activeTab === item.id ? 'bg-primary/10 text-primary' : 'hover:bg-white/5 text-text-muted'}`}>
              <item.icon size={28} className={activeTab === item.id ? 'stroke-[3.5px]' : ''} />
              {isSidebarOpen && <span className="font-black text-lg italic">{item.label}</span>}
            </button>
          ))}
        </div>
        <button onClick={() => setIsLoggedIn(false)} className="w-full flex items-center gap-6 p-5 rounded-[2rem] text-danger/60 hover:bg-danger/20 hover:text-danger transition-all font-black mt-auto">
          <LogOut size={28} />
          {isSidebarOpen && <span className="text-lg italic">Logout</span>}
        </button>
      </motion.nav>

      <main className="flex-1 p-10 lg:p-20 overflow-y-auto relative">
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10 mb-20">
          <div className="space-y-4">
            <div className="flex items-center gap-6">
               <div className="flex items-center gap-3 text-primary uppercase font-black tracking-[0.3em] text-[10px] bg-primary/5 px-4 py-2 rounded-full border border-primary/10">
                  <Globe size={14} /> Region: {language}
               </div>
               <div className="flex items-center gap-2 bg-white/5 px-4 py-1 rounded-full border border-white/10 text-[10px] font-black text-secondary">
                  <Clock size={14} /> Time: {currentTime.toLocaleTimeString()}
               </div>
            </div>
            <h2 className="text-7xl font-black tracking-tight leading-none italic uppercase">{activeTab}<span className="text-primary">.</span></h2>
          </div>
          <div className="flex items-center gap-8">
             <div className="flex p-2 bg-white/5 rounded-[1.5rem] border border-white/10">
                {['EN', 'HI', 'JP'].map(l => (
                   <button key={l} onClick={() => {setLanguage(l as 'EN'); addToast(`Language shifted to ${l}`)}} className={`px-5 py-2 rounded-xl text-[10px] font-black transition-all ${language === l ? 'bg-primary text-white shadow-2xl' : 'text-text-muted hover:text-white'}`}>{l}</button>
                ))}
             </div>
             <motion.div whileHover={{ scale: 1.05 }} className="glass-card p-5 rounded-[2.5rem] border-white/10 bg-white/5 flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center font-black text-2xl shadow-2xl">{user.username.charAt(0).toUpperCase()}</div>
                <div><p className="font-black text-primary italic">ADMINISTRATOR</p><p className="text-[10px] uppercase font-black text-text-muted tracking-widest">Master Key Ready</p></div>
             </motion.div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div key="dash" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                  { label: 'Total Revenue', value: `$${bookings.reduce((acc, b) => acc + b.totalAmount, 0).toFixed(2)}`, icon: Activity, color: 'primary' },
                  { label: 'Active Fleet', value: buses.length, icon: Bus, color: 'secondary' },
                  { label: 'Successful Manifests', value: bookings.length, icon: ShieldCheck, color: 'success' },
                  { label: 'System Uptime', value: '100%', icon: Zap, color: 'white' }
                ].map((stat, i) => (
                  <motion.div whileHover={{ y: -10, scale: 1.02 }} key={i} className="glass-card p-10 group relative border-white/5 bg-white/[0.02]">
                    <stat.icon className={`text-${stat.color} mb-10 opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all`} size={40} />
                    <p className="text-text-muted font-black text-[10px] uppercase tracking-[0.4em]">{stat.label}</p>
                    <p className="text-5xl font-black mt-4 tracking-tighter italic">{stat.value}</p>
                  </motion.div>
                ))}
              </div>

              <div className="grid lg:grid-cols-3 gap-10">
                 <div className="lg:col-span-2 glass-card p-12 border-white/5 relative overflow-hidden bg-white/[0.01]">
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/10 blur-[120px] rounded-full -mr-48 -mt-48" />
                    <div className="flex justify-between items-center mb-12">
                       <h4 className="text-4xl font-black italic tracking-tighter underline underline-offset-[16px] decoration-primary decoration-4">Financial Reports</h4>
                       <div className="flex gap-4"><Activity className="text-success" size={28} /><TrendingUp className="text-primary" size={28} /></div>
                    </div>
                    <div className="h-72 flex items-end gap-3 relative pb-8 border-b border-white/5">
                       {Array.from({ length: 24 }).map((_, i) => (
                         <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${Math.random() * 85 + 15}%` }} transition={{ delay: i * 0.04, duration: 1 }} className="flex-1 bg-gradient-to-t from-primary/30 to-secondary/30 rounded-t-lg group relative cursor-pointer">
                            <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-lg" />
                         </motion.div>
                       ))}
                    </div>
                 </div>
                 <div className="glass-card p-10 border-white/5 bg-white/[0.04] space-y-10">
                    <div className="flex justify-between items-center"><h4 className="text-xl font-black italic">Recent Activity</h4><Monitor size={20} className="text-primary" /></div>
                    <div className="space-y-6">
                       {bookings.slice(-4).reverse().map((b, i) => (
                         <div key={i} className="flex items-center gap-4 border-l-3 border-primary/20 pl-4 py-3 hover:bg-white/5 transition-all rounded-r-xl">
                            <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center font-black text-primary text-sm">{b.passengerName.charAt(0)}</div>
                            <div className="space-y-1">
                               <p className="font-black italic">{b.destination}</p>
                               <p className="text-[10px] uppercase font-black text-text-muted tracking-widest">${b.totalAmount} Confirmed</p>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'booking' && (
            <motion.div key="booking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-16">
              {bookingStep === 1 && (
                <div className="space-y-12">
                   <div className="flex flex-col md:flex-row justify-between items-center gap-10">
                      <div>
                        <h3 className="text-6xl font-black mb-4 leading-none tracking-tighter italic uppercase text-white/90">Book a <span className="text-primary">Ticket.</span></h3>
                        <p className="text-text-muted font-black text-xl opacity-60 tracking-tight">Select your route from the active fleet manifest.</p>
                      </div>
                      <div className="relative w-full md:w-[400px] group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={24} />
                        <input type="text" placeholder="Search routes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="input-field pl-16 py-5 rounded-[2rem] bg-white/5 border-white/10 text-lg font-bold italic" />
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {filteredBuses.map((dest) => (
                      <motion.button key={dest.id} whileHover={{ y: -10 }} onClick={() => { setSelectedDest(dest); setBookingStep(2); }} className="glass-card p-10 flex flex-col justify-between hover:border-primary transition-all group overflow-hidden border-white/5 bg-white/[0.01]">
                         <div className="flex justify-between items-start mb-8">
                            <div className="flex items-center gap-6">
                               <div className="bg-primary/20 p-6 rounded-[2.5rem] group-hover:rotate-12 transition-transform shadow-2xl border border-primary/20"><Navigation className="text-primary font-black" size={32} /></div>
                               <div>
                                  <p className="text-[10px] font-black text-secondary uppercase tracking-[0.4em] mb-2">{dest.busType} | {dest.plateNumber}</p>
                                  <p className="text-4xl font-black tracking-tighter italic uppercase underline underline-offset-8 decoration-primary/20 group-hover:decoration-primary transition-all decoration-4">{dest.destination}</p>
                               </div>
                            </div>
                            <div className="bg-white/5 p-4 rounded-[1.5rem] border border-white/5 text-center shadow-inner">
                               <CloudSun size={28} className="text-primary mx-auto mb-2" />
                               <p className="text-[10px] font-black uppercase tracking-widest">{dest.weather}</p>
                            </div>
                         </div>
                         <div className="h-px bg-white/10 w-full mb-8" />
                         <div className="flex justify-between items-center font-black">
                            <div className="flex gap-8">
                               <div className="space-y-1">
                                  <p className="text-[10px] text-text-muted uppercase tracking-[0.4em] font-black">Departure</p>
                                  <p className="text-xl flex items-center gap-2"><Zap size={16} className="text-success" /> {dest.departureTime}</p>
                               </div>
                            </div>
                            <div className="text-right">
                               <p className="text-4xl text-primary font-mono tracking-tighter italic">${dest.fare}</p>
                               <p className="text-[10px] text-text-muted uppercase tracking-[0.4em] font-black">Ticket Cost</p>
                            </div>
                         </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {bookingStep === 2 && (
                <div className="grid lg:grid-cols-5 gap-12 max-w-[1200px] mx-auto items-start">
                  <div className="lg:col-span-2 space-y-10">
                    <div className="glass-card p-12 space-y-12 shadow-2xl relative overflow-hidden">
                       <h3 className="text-4xl font-black italic tracking-tighter uppercase underline underline-offset-8 decoration-primary">Travelers</h3>
                       <div className="space-y-12">
                          <div className="space-y-4">
                            <div className="flex justify-between items-center mb-4">
                              <label className="text-[12px] font-black uppercase tracking-[0.4em] text-text-muted">No. of Passengers</label>
                              <span className="text-5xl font-black text-primary font-mono">{passengers}</span>
                            </div>
                            <input type="range" min="1" max="10" value={passengers} onChange={(e) => { setPassengers(parseInt(e.target.value)); setSelectedSeats([]); }} className="w-full h-3 bg-white/5 rounded-full accent-primary appearance-none cursor-pointer border border-white/10" />
                          </div>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center mb-4">
                              <label className="text-[12px] font-black uppercase tracking-[0.4em] text-text-muted">Special Discounts</label>
                              <span className="text-5xl font-black text-secondary font-mono">{discounted}</span>
                            </div>
                            <input type="range" min="0" max={passengers} value={discounted} onChange={(e) => setDiscounted(parseInt(e.target.value))} className="w-full h-3 bg-white/5 rounded-full accent-secondary appearance-none cursor-pointer border border-white/10" />
                          </div>
                       </div>
                    </div>
                    <div className="glass-card p-8 bg-primary/5 border-primary/20 flex flex-col items-center text-center gap-6 group">
                       <ShieldCheck className="text-primary" size={48} />
                       <p className="text-md font-black italic leading-tight uppercase tracking-tighter">Security Synchronized: All data is persistent.</p>
                    </div>
                  </div>

                  <div className="lg:col-span-3 glass-card p-12 text-center space-y-12 border-white/10 bg-white/[0.01]">
                    <h3 className="text-4xl font-black italic tracking-tighter uppercase underline underline-offset-8 decoration-primary decoration-4">Select Grid Seats</h3>
                    <div className="grid grid-cols-4 gap-6 p-8 bg-white/[0.03] rounded-[3rem] border border-white/5 shadow-inner">
                      {Array.from({ length: 20 }).map((_, i) => {
                        const seatNum = i + 1;
                        const isSelected = selectedSeats.includes(seatNum);
                        const isBooked = takenSeatList.includes(seatNum);
                        return (
                          <motion.div key={i} whileTap={{ scale: 0.9 }} onClick={() => !isBooked && (isSelected ? setSelectedSeats(selectedSeats.filter(s => s !== seatNum)) : selectedSeats.length < passengers && setSelectedSeats([...selectedSeats, seatNum]))}
                            className={`h-16 w-full rounded-2xl flex flex-col items-center justify-center font-black text-xl cursor-pointer transition-all border-3 ${isBooked ? 'bg-white/5 text-white/5 border-white/5 cursor-not-allowed opacity-20' : isSelected ? 'bg-primary text-white border-primary shadow-2xl scale-110 z-10' : 'bg-white/[0.03] text-white/40 border-white/10 hover:border-primary/50 hover:bg-primary/5'}`}
                          >
                             {seatNum}
                             <p className="text-[7px] uppercase tracking-widest mt-1 opacity-40 font-black">{isBooked ? 'LOCKED' : isSelected ? 'CHOSEN' : 'OPEN'}</p>
                          </motion.div>
                        );
                      })}
                    </div>
                    <div className="flex gap-10">
                       <button className="flex-1 p-6 rounded-[2.5rem] border-2 border-white/10 font-black uppercase tracking-[0.4em] text-xs hover:bg-white/5 transition-all text-text-muted" onClick={() => setBookingStep(1)}>Go Back</button>
                       <button className={`flex-1 btn-primary p-6 text-xl font-black shadow-2xl transition-all ${selectedSeats.length === passengers ? 'opacity-100 shadow-primary/40' : 'opacity-20 cursor-not-allowed'}`} disabled={selectedSeats.length !== passengers} onClick={() => setBookingStep(3)}>Continue</button>
                    </div>
                  </div>
                </div>
              )}

              {bookingStep === 3 && (
                <div className="space-y-16 max-w-4xl mx-auto">
                  <div className="text-center"><h3 className="text-6xl font-black tracking-tighter italic mb-4 uppercase">Confirm Booking</h3></div>
                  <div className="glass-card p-12 space-y-10 border-white/10 shadow-2xl bg-white/[0.01]">
                    {[
                      { label: 'Passenger Name', value: user.username },
                      { label: 'Bus Plate', value: selectedDest.plateNumber },
                      { label: 'Destination', value: selectedDest.destination },
                      { label: 'Selected Seats', value: selectedSeats.join(', ') },
                    ].map((row, i) => (
                      <div key={i} className="flex justify-between items-center text-xl border-b border-white/5 pb-6">
                        <span className="text-[10px] uppercase font-black tracking-[0.4em] text-text-muted">{row.label}</span>
                        <span className="font-black text-white italic">{row.value}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-8">
                       <span className="text-2xl font-black italic uppercase">Total Amount</span>
                       <span className="text-6xl font-black text-secondary font-mono">${calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex gap-10">
                    <button className="flex-1 p-8 rounded-[3rem] border-3 border-white/10 font-black uppercase text-xs hover:bg-white/5" onClick={() => setBookingStep(2)}>Back to Seats</button>
                    <button className="flex-3 btn-primary p-8 text-2xl font-black shadow-2xl flex items-center justify-center gap-4 group" onClick={handleBooking} disabled={isLoading}>
                       {isLoading ? 'Processing...' : 'CONFIRM & PAY'}
                       <ChevronRight size={32} className="group-hover:translate-x-3 transition-transform" />
                    </button>
                  </div>
                </div>
              )}

              {bookingStep === 4 && (
                <div className="text-center py-20 space-y-16">
                   <motion.div initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} className="w-56 h-56 bg-gradient-to-br from-success/5 to-success/40 text-success rounded-[5rem] flex items-center justify-center mx-auto shadow-2xl border-4 border-success/30">
                    <ShieldCheck size={110} />
                  </motion.div>
                  <div className="space-y-4">
                    <h3 className="text-8xl font-black italic tracking-tighter mb-4 uppercase leading-none">Booking <br/>Confirmed!</h3>
                    <p className="text-text-muted text-2xl font-black opacity-60 tracking-tight">Your digital permit has been synchronized.</p>
                  </div>
                  <div className="glass-card max-w-sm mx-auto p-12 border-white/20 group cursor-pointer relative overflow-hidden transition-all" onClick={() => window.print()}>
                     <div className="flex flex-col items-center gap-10 relative z-10">
                        <QrCode size={160} className="text-white opacity-90 shadow-2xl" />
                        <div className="space-y-2">
                           <p className="font-black text-xl tracking-tighter italic uppercase">Ticket Hash: #{Math.floor(Math.random()*1000000)}</p>
                           <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.4em] opacity-40">Boarding Verification Ready</p>
                        </div>
                        <div className="flex gap-6"><Printer size={28} className="text-primary" /><Download size={28} className="text-secondary" /></div>
                     </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-8 max-w-2xl mx-auto pt-16">
                    <button className="flex-1 btn-primary py-6 font-black text-2xl shadow-2xl flex items-center justify-center gap-4" onClick={() => setActiveTab('history')}>
                       OPEN VAULT <ArrowRight size={32} />
                    </button>
                    <button className="flex-1 p-6 rounded-[3rem] border-3 border-white/10 font-black text-xl hover:bg-white/10 transition-all uppercase tracking-tighter" onClick={() => { setBookingStep(1); setSelectedDest(null); setSelectedSeats([]); setActiveTab('dashboard'); }}>Home Terminal</button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div key="hist" initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} className="space-y-16">
              <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10">
                <div className="space-y-4">
                  <h3 className="text-6xl font-black italic tracking-tighter uppercase underline underline-offset-[20px] decoration-secondary decoration-8">Registry History</h3>
                  <p className="text-text-muted font-black text-2xl opacity-60 italic mt-6">Secure audit of all active and archival bookings.</p>
                </div>
                <div className="relative w-full xl:w-[500px] border-b-3 border-white/5 focus-within:border-primary transition-all pb-2">
                   <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-text-muted" size={28} />
                   <input type="text" placeholder="Search manifest..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="input-field pl-16 py-6 bg-transparent border-none text-2xl font-black uppercase italic" />
                </div>
              </div>
              <div className="grid gap-8">
                {filteredBookings.map((b) => (
                  <motion.div layout key={b.id} className="glass-card p-12 flex flex-col xl:flex-row items-center justify-between gap-12 hover:bg-white/[0.06] transition-all border-white/5 hover:border-secondary group relative overflow-hidden">
                    <div className="flex items-center gap-10">
                      <div className="bg-secondary/20 p-8 rounded-[3rem] group-hover:rotate-12 transition-all shadow-2xl border border-secondary/20 flex items-center justify-center"><Ticket className="text-secondary" size={56} /></div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3"><div className="w-2 h-2 bg-success rounded-full animate-pulse" /><p className="text-[12px] font-black text-secondary uppercase tracking-[0.5em]">System Verified</p></div>
                        <p className="text-4xl font-black italic tracking-tighter font-mono">Reference: #{b.id.toString().padStart(6, '0')}</p>
                        <p className="text-2xl font-black flex items-center gap-4 text-white/40">
                           <span className="text-white">{b.passengerName}</span>
                           <ArrowRight className="text-primary" size={24} />
                           <span className="text-white italic">{b.destination}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-center xl:items-end gap-6 w-full xl:w-auto">
                      <p className="text-7xl font-black text-success font-mono tracking-tighter italic leading-none">${b.totalAmount.toFixed(2)}</p>
                      <div className="flex gap-4">
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleDeleteBooking(b.id)} className="px-8 py-3 bg-danger/10 text-danger text-[10px] font-black tracking-[0.4em] rounded-xl border-2 border-danger/30 uppercase hover:bg-danger/20 transition-all">Cancel Record</motion.button>
                        <div className="px-8 py-3 bg-white/5 text-white/40 text-[10px] font-black tracking-[0.4em] rounded-xl border-2 border-white/10 uppercase">Properties</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'fleet' && (
            <motion.div key="fleet" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-16">
               <div className="text-center space-y-6">
                  <h3 className="text-7xl font-black italic tracking-tighter uppercase underline underline-offset-[25px] decoration-primary decoration-8">Bus Tracking System</h3>
                  <p className="text-text-muted font-black text-2xl opacity-60">Architectural coordination of all moving fleet vectors.</p>
               </div>
               <div className="grid lg:grid-cols-4 gap-10">
                  <div className="lg:col-span-3 glass-card p-12 h-[600px] border-white/10 bg-white/[0.01] relative overflow-hidden group">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-15 pointer-events-none" />
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 15, repeat: Infinity, ease: 'linear' }} className="absolute inset-0 border-r border-primary/10 pointer-events-none z-10" />
                    
                    {/* Fixed Coordinate Map Grid */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                       <Radar size={400} className="text-primary" />
                    </div>

                    {[...buses].map((bus, i) => (
                      <motion.div 
                        key={i} 
                        initial={{ x: bus.x * 2.5, y: bus.y * 2.5 }}
                        animate={{ 
                          x: [bus.x * 2.5, (bus.x + 10) * 2.5, bus.x * 2.5], 
                          y: [bus.y * 2.5, (bus.y - 10) * 2.5, bus.y * 2.5] 
                        }} 
                        transition={{ duration: 10 + i, repeat: Infinity, ease: "linear" }}
                        className="absolute left-1/2 top-1/2 flex flex-col items-center gap-3 cursor-pointer group/bus z-20"
                      >
                         <div className="relative">
                            <motion.div animate={{ scale: [1, 2], opacity: [0.5, 0] }} transition={{ duration: 2, repeat: Infinity }} className="absolute inset-0 bg-primary rounded-full" />
                            <div className="bg-primary p-3 rounded-full shadow-[0_0_30px_rgba(var(--primary-rgb),1)] group-hover/bus:scale-150 transition-transform relative z-10"><Bus size={16} className="text-white" /></div>
                         </div>
                         <div className="bg-black/80 backdrop-blur-md border border-white/20 px-4 py-2 rounded-xl text-[10px] font-black opacity-0 group-hover/bus:opacity-100 transition-opacity whitespace-nowrap shadow-2xl">
                            <p className="text-primary">{bus.plateNumber}</p>
                            <p className="text-white text-[8px] uppercase">{bus.destination}</p>
                         </div>
                      </motion.div>
                    ))}
                    
                    <div className="absolute top-6 left-6 p-6 glass-card border-white/20 bg-white/5 space-y-4 backdrop-blur-xl">
                       <p className="text-[10px] font-black uppercase tracking-[0.6em] text-primary">Map Legend</p>
                       <div className="space-y-3">
                          <div className="flex items-center gap-3"><div className="w-3 h-3 bg-primary rounded-full animate-pulse shadow-[0_0_10px_rgba(var(--primary-rgb),1)]" /><p className="font-black text-xs uppercase tracking-tighter italic">Active Vector</p></div>
                          <div className="flex items-center gap-3"><Radar size={16} className="text-primary/40" /><p className="font-black text-xs italic tracking-tighter uppercase">Station Proximity</p></div>
                       </div>
                    </div>
                  </div>

                  <div className="lg:col-span-1 space-y-6">
                     <h4 className="text-xl font-black italic uppercase tracking-widest pl-4">Fleet Status</h4>
                     <div className="space-y-4">
                        {buses.map((bus, i) => (
                           <motion.div whileHover={{ scale: 1.05 }} key={i} className="glass-card p-6 border-white/5 bg-white/[0.02] flex flex-col gap-2">
                              <div className="flex justify-between items-center">
                                 <span className="text-[10px] font-black text-primary uppercase">{bus.plateNumber}</span>
                                 <div className="flex gap-1">
                                    <div className="w-1 h-3 bg-success rounded-full" />
                                    <div className="w-1 h-3 bg-success rounded-full" />
                                    <div className="w-1 h-3 bg-success/20 rounded-full" />
                                 </div>
                              </div>
                              <p className="font-black text-lg text-white italic">{bus.destination}</p>
                              <div className="flex justify-between items-center mt-2">
                                 <span className="text-[8px] font-black uppercase text-text-muted">Stability: Nominal</span>
                                 <Zap size={12} className="text-success" />
                              </div>
                           </motion.div>
                        ))}
                     </div>
                  </div>
               </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-5xl space-y-16">
              <h3 className="text-6xl font-black italic tracking-tighter underline underline-offset-[20px] decoration-primary decoration-8 uppercase">System Control</h3>
              <div className="glass-card p-16 space-y-16 border-white/10 bg-white/[0.01]">
                 <div className="grid md:grid-cols-2 gap-12">
                    <div className="space-y-4">
                      <p className="text-[12px] font-black uppercase tracking-[0.5em] text-primary font-bold">Biometric Data</p>
                      <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 space-y-6">
                         <div className="flex justify-between border-b border-white/5 pb-4 items-center"><span className="text-text-muted font-black text-lg">OPERATOR_ID</span><span className="font-black text-2xl italic">{user.username}</span></div>
                         <div className="flex justify-between items-center"><span className="text-text-muted font-black text-lg">ACCESS_RANK</span><span className="font-black text-2xl text-primary italic">SYSTEM OVERLORD</span></div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <p className="text-[12px] font-black uppercase tracking-[0.5em] text-secondary font-bold">Network Fidelity</p>
                      <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 space-y-6">
                         <div className="flex justify-between border-b border-white/5 pb-4 items-center"><span className="text-text-muted text-lg">UPLINK_STATUS</span><span className="text-success font-black text-xl">OPTIMAL</span></div>
                         <div className="flex justify-between items-center"><span className="text-text-muted text-lg">CORE_LATENCY</span><span className="text-primary font-black text-xl">0.12ms</span></div>
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
            <motion.div key={toast.id} initial={{ opacity: 0, x: 200, scale: 0.5 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} className={`glass-card p-8 flex items-center gap-6 min-w-[350px] shadow-2xl border-l-[8px] pointer-events-auto backdrop-blur-3xl ${toast.type === 'success' ? 'border-l-primary bg-primary/10' : 'border-l-danger bg-danger/10'}`}>
              <div className={toast.type === 'success' ? 'text-primary' : 'text-danger'}><ShieldCheck size={40} /></div>
              <div>
                <p className="text-[10px] uppercase font-black tracking-[0.4em] opacity-40 mb-1">System Audit Alert</p>
                <p className="font-black text-lg tracking-tight italic uppercase">{toast.msg}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default App;
