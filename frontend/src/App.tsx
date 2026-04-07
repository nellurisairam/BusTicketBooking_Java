import React, { useState, useEffect } from 'react';
import { 
  Bus, 
  Ticket, 
  LogOut, 
  Search, 
  ArrowRight, 
  Globe, 
  Activity, 
  Clock, 
  Navigation, 
  ShieldCheck,
  Calendar,
  Download,
  Wifi,
  Wind,
  Zap,
  CheckCircle,
  Info as InfoIcon,
  Star,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Advanced API Interceptor for Security (Senior level addition)
const api = axios.create({
  baseURL: "http://localhost:8080/api"
});

api.interceptors.request.use((config: any) => {
  const token = localStorage.getItem("token");
  // Senior Level check: Ensure token is truthy AND not the literal string "undefined" or "null"
  if (token && token !== "undefined" && token !== "null") {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error: any) => Promise.reject(error));

const API_BASE = "/bookings";
const AUTH_BASE = "/auth";

// Advanced TypeScript Enterprise Architectures
export interface IUser {
  id?: number;
  username: string;
  role: 'ADMIN' | 'USER';
  token?: string;
  walletBalance: number;
}

export interface IBus {
  id?: number;
  source?: string;
  destination: string;
  fare: number;
  dynamicFare?: number;
  availableSeats: number;
  takenSeats: string;
  departureTime: string;
  busType: string;
  plateNumber: string;
  weather: string;
  amenities: string;
  boardingPoints?: string;
  droppingPoints?: string;
}

export interface IBooking {
  id?: number;
  passengerName: string;
  source?: string;
  destination: string;
  boardingPoint?: string;
  droppingPoint?: string;
  regularPassengers: number;
  discountedPassengers: number;
  totalAmount: number;
  selectedSeats: string;
}

export interface IToast {
  id: number;
  msg: string;
  type: 'success' | 'error';
}

const DEFAULT_BUSES: IBus[] = [
  { id: 1, source: 'Mumbai', destination: 'Mumbai Central', fare: 1250.0, availableSeats: 20, takenSeats: "", departureTime: "08:30 AM", busType: "Volvo AC Sleeper", plateNumber: "MH-01-AX-7741", weather: "Sunny 32°C", amenities: "WiFi,AC,Water,Charging" },
  { id: 2, source: 'Bangalore', destination: 'Bangalore - Silk Board', fare: 1500.0, availableSeats: 20, takenSeats: "5,6,10", departureTime: "11:45 AM", busType: "Scania Multi-Axle", plateNumber: "KA-05-BX-9902", weather: "Cloudy 24°C", amenities: "WiFi,AC,Blanket,Charging" },
];

interface IReview {
  id?: number;
  username: string;
  busPlateNumber: string;
  rating: number;
  comment: string;
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'booking' | 'history' | 'dashboard' | 'live' | 'help'>('booking');
  const [promoCode, setPromoCode] = useState("");
  const [isPromoApplied, setIsPromoApplied] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<IUser | null>(null);
  const [bookings, setBookings] = useState<IBooking[]>([]);
  const [buses, setBuses] = useState<IBus[]>(DEFAULT_BUSES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [boardingPoint, setBoardingPoint] = useState("");
  const [droppingPoint, setDroppingPoint] = useState("");
  const [passengers, setPassengers] = useState(1);
  const [discounted] = useState(0);
  const [bookingStep, setBookingStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDest, setSelectedDest] = useState<IBus | null>(null);
  const [toasts, setToasts] = useState<IToast[]>([]);
  const [language, _setLanguage] = useState<'EN' | 'HI' | 'JP'>('EN');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [walletBalance, setWalletBalance] = useState(5000); 
  const [busReviews, setBusReviews] = useState<{[key: string]: IReview[]}>({});
  const [showReviewModal, setShowReviewModal] = useState<string | null>(null);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [user, setUser] = useState({ username: '', password: '' });

  // Senior: Financial Rehydration Logic
  const handleRecharge = async (amount: number) => {
    try {
      setIsLoading(true);
      const res = await api.post("/auth/recharge", { username: currentUser?.username, amount });
      if (res.data) {
        setWalletBalance(res.data.walletBalance);
        addToast("success", `₹${amount} Added. New Database Balance: ₹${res.data.walletBalance}`);
      }
    } catch (err) {
      addToast("error", "Recharge Failed: Network Error");
    } finally {
      setIsLoading(false);
    }
  };

  // Senior: Loyalty Tier Logic (Safeguarded)
  const loyaltyTier = React.useMemo(() => {
    const count = Array.isArray(bookings) ? bookings.length : 0;
    if (count > 5) return 'PLATINUM';
    if (count > 2) return 'GOLD';
    return 'SILVER';
  }, [bookings]);
  
  const [authMode, setAuthMode] = useState<'Login' | 'Signup'>('Login');

  const [filterType] = useState<string>('ALL');
  const [sortBy] = useState<string>('DEFAULT');

  const filteredBuses = React.useMemo(() => {
    if (!Array.isArray(buses)) return [];
    let result = [...buses].map(bus => {
       // Senior: Weather-based Dynamic Surge Pricing
       let dynamicFare = bus.fare || 0;
       const weather = bus.weather || "Clear";
       if (weather.includes('Rainy')) dynamicFare *= 1.25; 
       if (weather.includes('Sunny')) dynamicFare *= 0.95; 
       return { ...bus, dynamicFare: Math.round(dynamicFare) };
    });

    result = result.filter(bus => 
      bus.destination.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (bus.source && bus.source.toLowerCase().includes(searchQuery.toLowerCase())) ||
      bus.busType.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (filterType !== 'ALL') {
      result = result.filter(bus => bus.busType.toUpperCase().includes(filterType));
    }

    if (sortBy === 'PRICE_LOW') result.sort((a, b) => (a.dynamicFare || a.fare) - (b.dynamicFare || b.fare));
    if (sortBy === 'PRICE_HIGH') result.sort((a, b) => (b.dynamicFare || b.fare) - (a.dynamicFare || a.fare));

    return result;
  }, [buses, searchQuery, filterType, sortBy]);

  const addToast = (type: 'success' | 'error', msg: string) => {
    const id = Date.now();
    const newToast: IToast = { id, msg, type };
    setToasts(prev => [...prev, newToast]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  };

  const handleAuth = async () => {
    setIsLoading(true);
    try {
      if (authMode === 'Signup') {
        await api.post(`${AUTH_BASE}/signup`, user);
        addToast("success", "Registration Successful. Please Login.");
        setAuthMode('Login');
      } else {
        const res = await api.post(`${AUTH_BASE}/login`, user);
        const userData = res.data;
        localStorage.setItem("token", userData.token); // Store JWT
        setCurrentUser(userData);
        setWalletBalance(userData.walletBalance ?? 5000);
        setIsLoggedIn(true);
        setActiveTab(userData.role === 'ADMIN' ? 'dashboard' : 'booking');
        addToast("success", `Welcome back, ${userData.username}`);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || "Connection Failed";
      addToast("error", `${authMode} Failed: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isLoggedIn) fetchData();
  }, [isLoggedIn]);

  const fetchData = async () => {
    try {
      const [hRes, bRes] = await Promise.all([
        api.get(`${API_BASE}/history`),
        api.get(`${API_BASE}/buses`)
      ]);
      if (hRes.data) setBookings(hRes.data);
      if (bRes.data && bRes.data.length > 0) setBuses(bRes.data);
    } catch (err) {
      console.warn("Backend handshake failed, using offline data fallback.");
    }
  };

  const calculateTotal = () => {
    if (!selectedDest) return 0;
    const currentFare = selectedDest.dynamicFare || selectedDest.fare;
    const baseTotal = (passengers - discounted) * currentFare;
    const discountedTotal = discounted * (currentFare * 0.80); 
    const total = baseTotal + discountedTotal;
    return isPromoApplied ? total * 0.8 : total;
  };

  const fetchReviews = async (plate: string) => {
    try {
      const res = await api.get(`/reviews/${plate}`);
      setBusReviews(prev => ({ ...prev, [plate]: res.data }));
    } catch (err) {}
  };

  const handleAddReview = async (plate: string) => {
    try {
      await api.post("/reviews/add", {
        username: currentUser?.username,
        busPlateNumber: plate,
        rating: newRating,
        comment: newComment
      });
      addToast('success', 'Review Shared! Thank you for the feedback.');
      setShowReviewModal(null);
      setNewComment("");
      fetchReviews(plate);
    } catch (err) {
      addToast('error', 'Submit Failure: Rate limiter or Network error');
    }
  };

  const handleBooking = async () => {
    setIsLoading(true);
    addToast("success", "Processing your booking...");
    try {
      const payload = {
        passengerName: currentUser?.username || user.username,
        source: selectedDest?.source || '',
        destination: selectedDest?.destination || '',
        boardingPoint: boardingPoint,
        droppingPoint: droppingPoint,
        regularPassengers: passengers - discounted,
        discountedPassengers: discounted,
        selectedSeats: selectedSeats.join(', '),
        totalAmount: calculateTotal()
      };
      const res = await api.post(`${API_BASE}/create`, payload);
      setBookings([res.data, ...bookings]);
      addToast('success', "Booking Secured Successfully!");
      setBookingStep(4);
      setBoardingPoint("");
      setDroppingPoint("");
      await fetchData(); 
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || "Connection Failed";
      addToast("error", `Booking Failed: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBooking = async (id: number) => {
    if (!confirm("Are you sure you want to cancel this ticket?")) return;
    try {
      await api.delete(`${API_BASE}/${id}`);
      setBookings(bookings.filter(b => b.id !== id));
      addToast('success', "Ticket Cancelled Successfully");
      await fetchData(); 
    } catch (err) {
      addToast('error', "Cannot delete ticket");
    }
  };

  const handlePrintTicket = async () => {
    const ticketElement = document.getElementById('digital-ticket');
    if (!ticketElement) return;
    
    setIsLoading(true);
    addToast("success", "Generating PDF Permit...");
    try {
       const canvas = await html2canvas(ticketElement, { scale: 2, backgroundColor: '#0f1117' });
       const imgData = canvas.toDataURL('image/png');
       const pdf = new jsPDF('p', 'mm', 'a4');
       const pdfWidth = pdf.internal.pageSize.getWidth();
       const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
       pdf.addImage(imgData, 'PNG', 0, 20, pdfWidth, pdfHeight);
       pdf.save(`BusTick_Permit_${currentUser?.username || 'Guest'}.pdf`);
    } catch(err) {
       addToast("error", "Failed to generate PDF.");
    } finally {
       setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    localStorage.removeItem("token");
    addToast('success', "Session Terminated: See you soon!");
    setBookingStep(1);
    setActiveTab('booking');
  };

  const TabBtn = ({ id, icon, label }: { id: any, icon: any, label: string }) => (
    <button onClick={() => setActiveTab(id)} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${activeTab === id ? 'bg-primary text-white shadow-lg' : 'text-gray-500 hover:text-gray-800'}`}>
      {icon} {label}
    </button>
  );

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <div className="bg-white w-full max-w-md p-10 space-y-8 rounded-2xl shadow-lg border border-gray-100">
          <div className="text-center space-y-4">
            <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-primary">
               <Bus size={40} />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight mb-2 text-primary">red<span className="text-gray-800">bus</span></h1>
              <p className="text-gray-500 font-semibold text-sm">Consumer Ticket Booking Platform</p>
            </div>
          </div>
          <div className="flex p-1 bg-gray-100 rounded-lg">
             <button onClick={() => setAuthMode('Login')} className={`flex-1 py-3 font-bold text-sm rounded-md transition-all ${authMode === 'Login' ? 'bg-white shadow-sm text-primary' : 'text-gray-500'}`}>Sign In</button>
             <button onClick={() => setAuthMode('Signup')} className={`flex-1 py-3 font-bold text-sm rounded-md transition-all ${authMode === 'Signup' ? 'bg-white shadow-sm text-primary' : 'text-gray-500'}`}>Sign Up</button>
          </div>
          <div className="space-y-6">
            <div className="space-y-2">
               <label className="text-xs uppercase font-bold text-gray-500 px-2">Account Username</label>
               <input type="text" placeholder="john.doe" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl font-bold text-gray-700 outline-none focus:ring-2 focus:ring-primary/20" value={user.username} onChange={(e) => setUser({...user, username: e.target.value})}/>
            </div>
            <div className="space-y-2">
               <label className="text-xs uppercase font-bold text-gray-500 px-2">Secure Password</label>
               <input type="password" placeholder="••••••••" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl font-bold text-gray-700 outline-none focus:ring-2 focus:ring-primary/20" value={user.password} onChange={(e) => setUser({...user, password: e.target.value})}/>
            </div>
            <button className="bg-primary text-white w-full py-4 rounded-xl text-lg font-bold shadow-md hover:bg-[#c33a41] transition-all disabled:opacity-50" onClick={handleAuth} disabled={isLoading}>
              {isLoading ? 'Processing...' : (authMode === 'Signup' ? 'Create Account' : 'Sign In')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const takenSeatList = selectedDest?.takenSeats 
    ? selectedDest.takenSeats.split(',').map((s: string) => parseInt(s.trim())) 
    : [];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-[#3e3e52] font-sans">
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('booking')}>
              <div className="bg-primary p-2 rounded-lg text-white"><Bus size={28} /></div>
              <span className="text-2xl font-black text-primary tracking-tight">red<span className="text-[#3e3e52]">bus</span></span>
            </div>
            
            <nav className="flex items-center gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-100">
              <TabBtn id="booking" icon={<Calendar size={18}/>} label="Routes" />
              <TabBtn id="history" icon={<ShieldCheck size={18}/>} label="Tickets" />
              <TabBtn id="live" icon={<Navigation size={18}/>} label="Radar" />
              <TabBtn id="help" icon={<InfoIcon size={18}/>} label="Support" />
              {currentUser?.role === 'ADMIN' && <TabBtn id="dashboard" icon={<Activity size={18}/>} label="Admin" />}
            </nav>
          </div>

          <div className="flex items-center gap-6">
             <div className="hidden lg:flex items-center gap-4 text-xs font-semibold text-gray-500 bg-gray-100 px-4 py-2 rounded-md">
                <span className="flex items-center gap-2 text-primary font-black"><Zap size={14} /> ₹{walletBalance.toFixed(0)}</span>
                <div className="w-px h-4 bg-gray-300" />
                <Globe size={14} className="text-gray-400" /> {language} <div className="w-px h-4 bg-gray-300" /> <Clock size={14} className="text-gray-400" /> {currentTime.toLocaleTimeString()}
             </div>
             
             <div className="relative group cursor-pointer flex items-center gap-3 border border-gray-200 p-2 pr-4 rounded-full bg-white hover:shadow-md transition-shadow">
               <div className="w-8 h-8 bg-primary rounded-full text-white flex items-center justify-center font-bold text-sm">
                 {(currentUser?.username || user.username || 'G').charAt(0).toUpperCase()}
               </div>
               <span className="text-sm font-bold truncate max-w-[100px]">{currentUser?.username || user.username}</span>
                <div className="absolute top-12 right-0 w-64 bg-white border border-gray-100 shadow-xl rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all p-4 flex flex-col z-[200]">
                  <div className="flex flex-col items-center mb-4 pb-4 border-b border-gray-50">
                     <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-2 font-black text-xl">{(currentUser?.username || 'G').charAt(0).toUpperCase()}</div>
                     <h4 className="font-black text-gray-800">{currentUser?.username || 'Guest Traveler'}</h4>
                     <p className="text-[10px] font-bold text-gray-400">PASSPORT ID: #TICK-{currentUser?.id || '99'}</p>
                  </div>
                  <div className="space-y-3 mb-4">
                     <div className="flex justify-between text-[10px] font-black uppercase text-gray-400"><span>Loyalty Status</span><span className={loyaltyTier === 'PLATINUM' ? 'text-indigo-500' : 'text-yellow-500'}>{loyaltyTier}</span></div>
                     <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-primary" style={{ width: (Array.isArray(bookings) && bookings.length > 0) ? '60%' : '10%' }} /></div>
                  </div>
                  
                  <div className="border-t border-gray-50 pt-4 mb-4">
                     <p className="text-[10px] font-black text-gray-400 uppercase mb-3 text-center">Quick Recharge</p>
                     <div className="flex gap-2">
                        {[500, 1000, 5000].map(amt => (
                          <button key={amt} onClick={() => handleRecharge(amt)} className="flex-1 bg-gray-50 hover:bg-primary hover:text-white text-[10px] font-black py-2 rounded-lg transition-all border border-gray-100">+₹{amt}</button>
                        ))}
                     </div>
                  </div>

                  <button onClick={handleLogout} className="text-left px-4 py-2 text-sm text-red-500 font-bold hover:bg-red-50 rounded-md flex items-center gap-2">
                    <LogOut size={16} /> Logout SESSION
                  </button>
                </div>
             </div>

             <button onClick={handleLogout} className="bg-red-100 px-6 py-2 rounded-xl text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-md font-black flex items-center gap-2 border border-red-200">
                <LogOut size={18} /> <span className="text-sm tracking-wide">LOGOUT</span>
             </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto p-6 md:p-10">
        <AnimatePresence mode="wait">
          {(activeTab === 'dashboard' && (currentUser?.role === 'ADMIN' || (currentUser as any)?.role === 'ELITE')) && (
            <motion.div key="dash" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                   { label: 'Total Revenue', value: `₹${(Array.isArray(bookings) ? bookings.reduce((acc, b) => acc + (b.totalAmount || 0), 0) : 0).toFixed(2)}`, icon: Activity, color: 'text-green-500' },
                   { label: 'Active Fleet', value: (Array.isArray(buses) ? buses.length : 0), icon: Bus, color: 'text-blue-500' },
                   { label: 'Tickets Sold', value: (Array.isArray(bookings) ? bookings.length : 0), icon: ShieldCheck, color: 'text-indigo-500' },
                   { label: 'Safe Travels', value: '100%', icon: Zap, color: 'text-yellow-500' },
                   { label: 'Avg Rating', value: '4.8', icon: Star, color: 'text-orange-500' },
                   { label: 'Users', value: '1.2k', icon: Users, color: 'text-purple-500' }
                ].map((stat, i) => (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} key={i} className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm flex items-center gap-6">
                     <div className={`${stat.color.replace('text', 'bg')}/10 p-4 rounded-2xl ${stat.color}`}><stat.icon size={28} /></div>
                     <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                        <p className="text-2xl font-black text-gray-800 tracking-tight">{stat.value}</p>
                     </div>
                  </motion.div>
                ))}
              </div>

              <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl overflow-hidden p-10">
                 <div className="flex justify-between items-center mb-10">
                    <h4 className="text-2xl font-black text-gray-800 flex items-center gap-3"><Activity size={24} className="text-primary"/> Fleet Profitability Matrix</h4>
                    <button onClick={() => addToast('success', "Financial Exporting Started...")} className="bg-gray-900 text-white px-6 py-3 rounded-xl text-xs font-black hover:scale-105 transition-transform flex items-center gap-2">
                       <ShieldCheck size={14}/> DOWNLOAD LEDGER
                    </button>
                 </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <thead>
                          <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">
                             <th className="pb-4">Route / Service</th>
                             <th className="pb-4">Fleet ID</th>
                             <th className="pb-4">Tickets</th>
                             <th className="pb-4">Occupancy Ratio</th>
                             <th className="pb-4 text-right">Route Revenue</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-50">
                          {buses.map(bus => {
                            const routeBookings = Array.isArray(bookings) ? bookings.filter(b => b.source === bus.source && b.destination === bus.destination) : [];
                            const revenue = routeBookings.reduce((acc, b) => acc + (b.totalAmount || 0), 0);
                            const occupancy = Math.round(((40 - bus.availableSeats) / 40) * 100);
                            return (
                              <tr key={bus.id} className="group hover:bg-gray-50/50 transition-all">
                                 <td className="py-6 font-black text-gray-800 text-sm">
                                    {bus.source} ➔ {bus.destination}
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-1">{bus.busType}</p>
                                 </td>
                                 <td className="py-6 font-bold text-gray-500 text-xs">{bus.plateNumber}</td>
                                 <td className="py-6 font-bold text-gray-500 text-sm">{routeBookings.length}</td>
                                 <td className="py-6">
                                    <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                       <div className={`h-full ${occupancy > 50 ? 'bg-primary' : 'bg-blue-400'}`} style={{ width: `${occupancy}%` }} />
                                    </div>
                                    <p className="text-[9px] font-black text-gray-400 mt-1">{occupancy}% SEATED</p>
                                 </td>
                                 <td className="py-6 text-right font-black text-gray-900">₹{revenue.toFixed(2)}</td>
                              </tr>
                            );
                          })}
                       </tbody>
                    </table>
                 </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'booking' && (
            <motion.div key="booking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-16">
              {bookingStep === 1 && (
                <div className="space-y-8">
                   <div className="bg-primary rounded-2xl p-10 flex flex-col md:flex-row justify-between items-center gap-10 shadow-lg text-white">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                           <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Live Weather: 🌩️ Rainy (Surge Active)</span>
                        </div>
                        <h3 className="text-4xl font-black mb-2">Book Bus Tickets</h3>
                        <p className="font-semibold opacity-90">Find the best routes with Dynamic AI Pricing.</p>
                      </div>
                      <div className="relative w-full md:w-[400px] text-gray-800">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
                        <input type="text" placeholder="Destination / Route" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white border-0 py-4 pl-12 pr-4 rounded-xl shadow-inner font-bold focus:outline-none" />
                      </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {filteredBuses.map((dest) => (
                      <div key={dest.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row justify-between items-center hover:shadow-md transition-shadow">
                         <div className="flex items-center gap-6 w-full md:w-auto mb-4 md:mb-0">
                            <div className="hidden md:flex bg-gray-50 border border-gray-100 p-4 rounded-lg"><Navigation className="text-gray-400" size={24} /></div>
                            <div>
                               <h4 className="text-xl font-black text-gray-800 mb-1">{dest.source} → {dest.destination}</h4>
                               <div className="flex items-center gap-2 mb-1">
                                   <p className="text-xs font-bold text-gray-500 uppercase">{dest.busType} • {dest.plateNumber}</p>
                                   <div className="flex items-center bg-yellow-400/10 px-2 py-0.5 rounded text-yellow-600 text-[10px] font-black">★ {busReviews[dest.plateNumber]?.length ? (busReviews[dest.plateNumber].reduce((a,b)=>a+b.rating,0)/busReviews[dest.plateNumber].length).toFixed(1) : 'NEW'}</div>
                               </div>
                               <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowReviewModal(dest.plateNumber)} className="text-[10px] font-black text-primary hover:underline uppercase">View Reviews ({busReviews[dest.plateNumber]?.length || 0})</motion.button>
                                <div className="flex items-center gap-3">
                                   {dest.amenities.includes('WiFi') && <Wifi size={14} className="text-blue-500" />}
                                   {dest.amenities.includes('AC') && <Wind size={14} className="text-cyan-500" />}
                                   {dest.amenities.includes('Charging') && <Zap size={14} className="text-yellow-500" />}
                                </div>
                             </div>
                          </div>
                          <div className="text-right">
                             <div className="flex flex-col items-end">
                                {dest.weather.includes('Rainy') && <p className="text-[9px] font-black text-red-500 uppercase tracking-tighter mb-1 animate-pulse">🌨️ Surge Applied</p>}
                                <p className="text-2xl text-primary font-black mb-1">₹{dest.dynamicFare || dest.fare}</p>
                             </div>
                             <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => { setSelectedDest(dest); setBookingStep(2); }} className="bg-primary hover:bg-[#c33a41] text-white px-6 py-2 rounded font-bold transition-colors">VIEW SEATS</motion.button>
                         </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {bookingStep === 2 && (
                <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto items-start">
                   <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 shadow-sm border border-gray-200 rounded-xl">
                       <h3 className="text-lg font-black text-gray-800 mb-6 border-b pb-2">Travelers</h3>
                       <div className="space-y-6">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center"><label className="text-xs font-bold text-gray-500 uppercase">Passengers</label><span className="text-xl font-black">{passengers}</span></div>
                            <input type="range" min="1" max="10" value={passengers} onChange={(e) => { setPassengers(parseInt(e.target.value)); setSelectedSeats([]); }} className="w-full h-2 bg-gray-200 rounded-full accent-primary" />
                          </div>
                       </div>
                    </div>
                  </div>

                   <div className="lg:col-span-2 bg-white p-10 shadow-lg border border-gray-100 rounded-3xl">
                     <h3 className="text-2xl font-black text-gray-800 mb-10 text-center">Select Seats</h3>
                      <div className="max-w-[320px] mx-auto border-[6px] border-gray-100 rounded-[50px] p-10 bg-gray-50/30 mb-8">
                        <div className="grid grid-cols-4 gap-4">
                           {Array.from({ length: 20 }).map((_, i) => {
                             const seatNum = i + 1;
                             const isSelected = selectedSeats.includes(seatNum);
                             const isBooked = takenSeatList.includes(seatNum);
                             return (
                               <motion.button 
                                 key={i}
                                 whileHover={{ scale: 1.1 }}
                                 whileTap={{ scale: 0.9 }}
                                 disabled={isBooked}
                                 onClick={() => !isBooked && (isSelected ? setSelectedSeats(selectedSeats.filter(s => s !== seatNum)) : selectedSeats.length < passengers && setSelectedSeats([...selectedSeats, seatNum]))}
                                 className={`h-12 rounded-lg flex items-center justify-center font-black text-xs cursor-pointer transition-all border-2
                                   ${isBooked ? 'bg-gray-200 text-gray-400 cursor-not-allowed border-gray-200' : 
                                     isSelected ? 'bg-primary text-white shadow-xl border-primary' : 
                                     'bg-white text-gray-600 border-gray-100 hover:border-primary shadow-sm'}`}
                               >
                                  {seatNum}
                               </motion.button>
                             );
                           })}
                        </div>
                     </div>
                     <div className="flex justify-center gap-6 mb-8 text-[10px] font-black uppercase tracking-widest text-gray-400">
                        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-gray-200 rounded-sm"></div> Booked</div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 border-2 border-gray-100 rounded-sm"></div> Available</div>
                        <div className="flex items-center gap-3"><div className="w-3 h-1 bg-primary rounded-full"></div> Selected</div>
                     </div>
                      <div className="flex gap-4">
                        <button className="flex-1 py-4 font-black text-gray-500 bg-gray-100 rounded-xl" onClick={() => setBookingStep(1)}>SEARCH AGAIN</button>
                        <button className={`flex-1 py-4 rounded-xl font-black ${selectedSeats.length === passengers ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`} disabled={selectedSeats.length !== passengers} onClick={() => setBookingStep(3)}>CONFIRM SEATS</button>
                     </div>
                   </div>
                </div>
              )}

              {bookingStep === 3 && (
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 max-w-lg mx-auto p-12 text-center">
                   <h3 className="text-3xl font-black text-gray-800 mb-6">Secure Checkout</h3>
                   <div className="space-y-4 mb-8 text-left bg-gray-50 p-6 rounded-2xl border border-gray-100">
                      <div className="flex justify-between border-b pb-2"><span className="text-xs font-bold text-gray-400">ROUTE</span><span className="font-black text-gray-700">{selectedDest?.source} → {selectedDest?.destination}</span></div>
                      <div className="flex justify-between border-b pb-2"><span className="text-xs font-bold text-gray-400">SEATS</span><span className="font-black text-gray-700">{selectedSeats.join(', ')}</span></div>
                      <div className="flex justify-between border-b pb-2"><span className="text-xs font-bold text-gray-400">PASSENGERS</span><span className="font-black text-gray-700">{passengers} Traveler(s)</span></div>
                      <div className="flex justify-between pt-4"><span className="text-xl font-black text-gray-800">TOTAL</span><span className="text-2xl font-black text-primary">₹{calculateTotal()}</span></div>
                   </div>
                   <div className="flex flex-col gap-3">
                      <div className="flex gap-2 mb-4">
                         <input type="text" placeholder="Promo Code" value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} className="flex-1 bg-gray-50 border border-gray-100 px-4 py-3 rounded-xl font-bold focus:outline-none" />
                         <button onClick={() => { if(promoCode === 'FESTIVE20') { setIsPromoApplied(true); addToast('success', '20% Holiday Discount Applied!'); } else { addToast('error', 'Invalid Code'); } }} className="bg-gray-800 text-white px-4 rounded-xl font-bold">APPLY</button>
                      </div>
                      <button onClick={() => { handleBooking(); }} disabled={isLoading} className="w-full py-5 rounded-2xl bg-primary text-white font-black shadow-xl hover:shadow-2xl transition-all disabled:bg-gray-200">
                        {isLoading ? "AUTHORIZING..." : "SECURE BOOKING NOW"}
                      </button>
                      <button onClick={() => setBookingStep(2)} className="text-gray-400 font-bold hover:text-gray-600 transition-colors">BACK TO SEATS</button>
                   </div>
                </div>
              )}
              {bookingStep === 4 && (
                <div id="digital-ticket" className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden max-w-2xl mx-auto p-12 text-center">
                   <CheckCircle size={80} className="text-green-500 mx-auto mb-6" />
                   <h3 className="text-4xl font-black text-gray-800 mb-4">Confirmed!</h3>
                   <p className="text-gray-500 font-bold mb-10">Your ticket for {selectedDest?.destination} is secured.</p>
                    <div className="space-y-4">
                       <button onClick={handlePrintTicket} className="w-full py-5 rounded-xl border-2 border-primary text-primary font-black hover:bg-red-50 transition-all flex items-center justify-center gap-3 shadow-sm">
                          <Download size={22}/> DOWNLOAD PDF PERMIT
                       </button>
                       <div className="flex gap-4">
                          <button onClick={() => { setBookingStep(1); setActiveTab('history'); }} className="flex-1 py-4 bg-gray-100 text-gray-500 font-black rounded-xl hover:bg-gray-200 transition-all uppercase text-xs tracking-widest">MY TICKETS</button>
                          <button onClick={() => { setBookingStep(1); setActiveTab('booking'); setSelectedDest(null); }} className="flex-1 py-4 bg-gray-800 text-white font-black rounded-xl hover:bg-black transition-all uppercase text-xs tracking-widest">BOOK ANOTHER</button>
                       </div>
                    </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
               <h3 className="text-3xl font-black text-gray-800">Booking History</h3>
               <div className="grid grid-cols-1 gap-4">
                  {bookings.map(b => (
                    <div key={b.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center">
                       <div>
                          <p className="text-lg font-black">{b.destination}</p>
                          <p className="text-xs font-bold text-gray-400">Seats: {b.selectedSeats} • ₹{b.totalAmount}</p>
                       </div>
                       <div className="flex gap-4">
                          <button onClick={() => handleDeleteBooking(b.id!)} className="text-red-500 font-bold hover:underline">Cancel</button>
                       </div>
                    </div>
                  ))}
               </div>
            </motion.div>
          )}

          {activeTab === 'live' && (
            <motion.div key="live" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
               <div className="bg-gray-900 rounded-[40px] p-12 text-center border-4 border-gray-800 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-primary/30 animate-pulse"></div>
                  <h3 className="text-3xl font-black text-white mb-2">Live Fleet Radar</h3>
                  <p className="text-primary font-bold text-xs uppercase tracking-[0.2em] mb-12">Active Satellite Upsynchronous Tracking</p>
                  
                  <div className="space-y-12">
                     {buses.slice(0, 3).map((b, idx) => (
                       <div key={b.id} className="relative group">
                          <div className="flex justify-between text-xs font-bold text-gray-500 mb-4 uppercase">
                             <span>{b.source}</span>
                             <span className="text-primary">{75 - (idx * 20)}% Distance Covered</span>
                             <span>{b.destination}</span>
                          </div>
                          <div className="h-3 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
                             <motion.div initial={{ width: 0 }} animate={{ width: `${75 - (idx * 20)}%` }} transition={{ duration: 2, delay: idx * 0.2 }} className="h-full bg-gradient-to-r from-primary to-rose-400 relative">
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.8)] flex items-center justify-center">
                                   <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                                </div>
                             </motion.div>
                          </div>
                       </div>
                     ))}
                  </div>
                  <div className="mt-12 pt-12 border-t border-gray-800 flex justify-center gap-12">
                     <div className="text-center"><p className="text-2xl font-black text-white">08</p><p className="text-[10px] font-bold text-gray-500">FLEET ACTIVE</p></div>
                     <div className="text-center"><p className="text-2xl font-black text-green-500">0.4s</p><p className="text-[10px] font-bold text-gray-500">PING LATENCY</p></div>
                     <div className="text-center"><p className="text-2xl font-black text-primary">GPS</p><p className="text-[10px] font-bold text-gray-500">SIGNAL LOCK</p></div>
                  </div>
               </div>
            </motion.div>
          )}

          {activeTab === 'help' && (
            <motion.div key="help" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto space-y-12">
               <div className="text-center space-y-4">
                  <h3 className="text-5xl font-black text-gray-800 tracking-tighter">Support & Concierge</h3>
                  <p className="text-gray-400 font-bold uppercase text-xs tracking-[0.25em]">24/7 Enterprise Level Travel Assistance</p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { label: 'Live Chat', icon: Activity, desc: 'Talk to an agent in < 2 mins', color: 'bg-green-100 text-green-600' },
                    { label: 'E-Ticket Help', icon: Ticket, desc: 'Resend PDF permits instantly', color: 'bg-blue-100 text-blue-600' },
                    { label: 'Refunds', icon: Zap, desc: '100% Wallet credit process', color: 'bg-yellow-100 text-yellow-600' }
                  ].map((feat, i) => (
                    <motion.div whileHover={{ scale: 1.05 }} key={i} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-4 cursor-pointer">
                       <div className={`${feat.color} w-12 h-12 rounded-2xl flex items-center justify-center`}><feat.icon size={24}/></div>
                       <h4 className="text-lg font-black">{feat.label}</h4>
                       <p className="text-xs font-semibold text-gray-400">{feat.desc}</p>
                    </motion.div>
                  ))}
               </div>

               <div className="bg-white rounded-[40px] p-10 shadow-lg border border-gray-100">
                  <h4 className="text-2xl font-black mb-8 flex items-center gap-3"><Clock className="text-primary" /> Common Travel FAQs</h4>
                  <div className="space-y-4">
                     {[
                        { q: 'How do I cancel my booking?', a: 'Head to "My Tickets", select your route, and click "Cancel". Refund is instant to your wallet.' },
                        { q: 'Is my wallet balance safe?', a: 'Yes, we use Enterprise Triple-Layer encryption for all virtual wallet transactions.' },
                        { q: 'What is the Platinum Tier?', a: 'Book more than 5 trips to reach Platinum status and unlock priority boarding icons.' }
                     ].map((faq, i) => (
                        <details key={i} className="group border-b border-gray-50 pb-4">
                           <summary className="list-none flex justify-between items-center cursor-pointer font-bold text-gray-700">
                              {faq.q}
                              <ArrowRight size={16} className="group-open:rotate-90 transition-transform"/>
                           </summary>
                           <p className="mt-3 text-sm text-gray-400 font-medium leading-relaxed">{faq.a}</p>
                        </details>
                     ))}
                  </div>
               </div>

               <div className="bg-gray-900 rounded-[40px] p-12 text-white flex flex-col md:flex-row justify-between items-center gap-10">
                  <div className="space-y-4">
                     <h4 className="text-3xl font-black tracking-tight">Report a Technical Issue</h4>
                     <p className="text-gray-400 font-bold opacity-80">Our engineering team is ready to assist with app glitches.</p>
                     <div className="flex gap-4">
                        <input type="text" placeholder="Issue description..." className="bg-white/10 border border-white/20 px-6 py-4 rounded-xl text-sm font-bold w-full md:w-64 focus:outline-none focus:ring-2 ring-primary"/>
                        <button onClick={() => addToast('success', "Incident #INC-901 Raised Successfully")} className="bg-primary px-8 rounded-xl font-black text-sm hover:scale-105 transition-transform whitespace-nowrap">SUBMIT TICKET</button>
                     </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-6 rounded-3xl text-center hidden lg:block">
                     <Users className="mx-auto mb-2 text-primary" size={32} />
                     <p className="text-2xl font-black">1.4k+</p>
                     <p className="text-[10px] font-bold text-gray-500">SOLVED TODAY</p>
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        {showReviewModal && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[40px] w-full max-w-xl overflow-hidden shadow-2xl">
                <div className="p-8 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                   <h3 className="text-2xl font-black text-gray-800">Passenger Voice</h3>
                   <button onClick={() => setShowReviewModal(null)} className="text-gray-400 hover:text-gray-600 font-black">CLOSE</button>
                </div>
                <div className="p-8 max-h-[400px] overflow-y-auto space-y-6">
                   {busReviews[showReviewModal]?.length ? busReviews[showReviewModal].map((r,i)=>(
                      <div key={i} className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm">
                         <div className="flex justify-between items-center mb-2">
                            <span className="font-black text-gray-800 text-sm">{r.username}</span>
                            <span className="text-yellow-500 font-black">{'★'.repeat(r.rating)}</span>
                         </div>
                         <p className="text-gray-500 text-sm font-medium">{r.comment}</p>
                      </div>
                   )) : <p className="text-center text-gray-400 font-bold py-12">No reviews yet. Be the first!</p>}
                </div>
                <div className="p-8 border-t border-gray-100 space-y-4 bg-white">
                   <div className="flex gap-4">
                      {[1,2,3,4,5].map(v => (
                        <button key={v} onClick={()=>setNewRating(v)} className={`w-10 h-10 rounded-full font-black text-sm transition-all ${newRating >= v ? 'bg-yellow-400 text-white shadow-lg' : 'bg-gray-100 text-gray-400'}`}>{v}</button>
                      ))}
                   </div>
                   <textarea placeholder="Share your experience..." value={newComment} onChange={e=>setNewComment(e.target.value)} className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl font-bold focus:outline-none focus:ring-2 ring-primary/20 min-h-[100px]" />
                   <button onClick={() => handleAddReview(showReviewModal)} className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-xl hover:shadow-2xl transition-all">POST REVIEW</button>
                </div>
             </motion.div>
          </div>
        )}
      </main>

      {/* Toast System */}
      <div className="fixed bottom-10 right-10 z-[100] space-y-4">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div key={toast.id} initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 100, opacity: 0 }} className={`p-4 rounded-xl shadow-xl border-l-8 flex items-center gap-4 ${toast.type === 'success' ? 'bg-white border-green-500' : 'bg-white border-red-500'}`}>
               <ShieldCheck className={toast.type === 'success' ? 'text-green-500' : 'text-red-500'} />
               <p className="font-bold text-gray-800">{toast.msg}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default App;
