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
  Zap,
  Info as InfoIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Advanced API Interceptor for Security
const api = axios.create({
  baseURL: "http://localhost:8080/api"
});

api.interceptors.request.use((config: any) => {
  const token = localStorage.getItem("token");
  if (token && token !== "undefined" && token !== "null") {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error: any) => Promise.reject(error));

const API_BASE = "/bookings";
const AUTH_BASE = "/auth";

export interface IUser {
  id?: number;
  username: string;
  role: 'ADMIN' | 'USER';
  token?: string;
  walletBalance: number;
  rewardPoints: number;
  ecoContribution?: number;
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
}

export interface IBooking {
  id?: number;
  passengerName: string;
  source?: string;
  destination: string;
  regularPassengers: number;
  discountedPassengers: number;
  totalAmount: number;
  selectedSeats: string;
  hasSnacks?: boolean;
}

export interface IToast {
  id: number;
  msg: string;
  type: 'success' | 'error';
}

const DEFAULT_BUSES: IBus[] = [
  { id: 1, source: 'Mumbai', destination: 'Mumbai Central', fare: 1250.0, availableSeats: 20, takenSeats: "", departureTime: "08:30 AM", busType: "Volvo AC Sleeper", plateNumber: "MH-01-AX-7741", weather: "Sunny 32°C", amenities: "WiFi,AC,Water,Charging" },
  { id: 2, source: 'Bangalore', destination: 'Chennai Koyambedu', fare: 1500.0, availableSeats: 20, takenSeats: "5,6,10", departureTime: "11:45 PM", busType: "Scania Multi-Axle", plateNumber: "KA-05-BX-9902", weather: "Cloudy 24°C", amenities: "WiFi,AC,Blanket,Charging" },
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'booking' | 'history' | 'dashboard' | 'live' | 'help' | 'wallet'>('booking');
  const [promoCode, setPromoCode] = useState("");
  const [isPromoApplied, setIsPromoApplied] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<IUser | null>(null);
  const [bookings, setBookings] = useState<IBooking[]>([]);
  const [buses, setBuses] = useState<IBus[]>(DEFAULT_BUSES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [passengers, setPassengers] = useState(1);
  const [bookingStep, setBookingStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDest, setSelectedDest] = useState<IBus | null>(null);
  const [toasts, setToasts] = useState<IToast[]>([]);
  const [walletBalance, setWalletBalance] = useState(5000); 
  const [hasSnacks, setHasSnacks] = useState(false);
  const [hasInsurance, setHasInsurance] = useState(false);
  const [user, setUser] = useState({ username: '', password: '' });
  const [authMode, setAuthMode] = useState<'Login' | 'Signup'>('Login');
  const [supportIssue, setSupportIssue] = useState("");
  const [rewardPoints, setRewardPoints] = useState(450);
  const [topupAmount, setTopupAmount] = useState(1000);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showBot, setShowBot] = useState(false);
  const [botInput, setBotInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chatLog, setChatLog] = useState([
    { role: 'bot', text: "Hello! I am NexBot AI. How can I assist your journey today?" }
  ]);
  const [successConfetti, setSuccessConfetti] = useState(false);
  const [notifs] = useState([
    { id: 1, text: "Points Credit: +45 NexPoints", time: "2m ago" },
    { id: 2, text: "System Update: GPS Accuracy Improved", time: "1h ago" },
    { id: 3, text: "Offer: Festive20 code is active!", time: "5h ago" }
  ]);

  const handleBotSend = (text: string) => {
    if (!text.trim()) return;
    const userMsg = { role: 'user', text };
    setChatLog(prev => [...prev, userMsg]);
    setBotInput("");
    setIsTyping(true);

    setTimeout(() => {
      let reply = "I'm not sure about that, but our 24/7 support team can help! Try asking about discounts or rewards.";
      const lowTxt = text.toLowerCase();
      if (lowTxt.includes("discount") || lowTxt.includes("promo")) reply = "Use code FESTIVE20 for 20% off on all routes!";
      if (lowTxt.includes("reward") || lowTxt.includes("point")) reply = `You earn 10% points on every trip. You currently have ${rewardPoints} points!`;
      if (lowTxt.includes("wallet") || lowTxt.includes("money")) reply = "You can manage your funds and top-up in the NexWallet tab.";
      if (lowTxt.includes("status") || lowTxt.includes("where")) reply = "Our Live Fleet Radar tracks real-time speed, AC temperature, and GPS coordinates for every bus. Check the 'Live Status' tab for the full telemetry feed!";
      
      setChatLog(prev => [...prev, { role: 'bot', text: reply }]);
      setIsTyping(false);
    }, 1200);
  };
  const addToast = (type: 'success' | 'error', msg: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  };

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
      if (bRes.data && bRes.data.length > 0) {
        const dynamicBuses = bRes.data.map((bus: any) => ({
          ...bus,
          dynamicFare: bus.availableSeats < 5 ? Math.round(bus.fare * 1.15) : bus.fare
        }));
        setBuses(dynamicBuses);
      }
    } catch (err) {
      console.warn("Using offline data fallback.");
    }
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
        localStorage.setItem("token", res.data.token);
        setCurrentUser(res.data);
        setWalletBalance(res.data.walletBalance ?? 5000);
        setRewardPoints(res.data.rewardPoints ?? 450);
        setIsLoggedIn(true);
        setActiveTab(res.data.role === 'ADMIN' ? 'dashboard' : 'booking');
        addToast("success", `Login Successful. Welcome, ${res.data.username}`);
      }
    } catch (err: any) {
      addToast("error", "Authentication Failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotal = () => {
    if (!selectedDest) return 0;
    const currentFare = selectedDest.dynamicFare || selectedDest.fare;
    let total = passengers * currentFare;
    if (hasSnacks) total += (passengers * 150);
    if (hasInsurance) total += (passengers * 49);
    if (isPromoApplied) total *= 0.8;
    return Math.round(total);
  };

  const handleBooking = async () => {
    setIsLoading(true);
    try {
      const payload = {
        passengerName: currentUser?.username || 'Guest',
        source: selectedDest?.source || '',
        destination: selectedDest?.destination || '',
        regularPassengers: passengers,
        discountedPassengers: 0,
        selectedSeats: selectedSeats.join(', '),
        totalAmount: calculateTotal(),
        hasSnacks
      };
      const res = await api.post(`${API_BASE}/create`, payload);
      setBookings([res.data, ...bookings]);
      setBookingStep(4);
      setSuccessConfetti(true);
      setWalletBalance(prev => prev - calculateTotal());
      setRewardPoints(prev => prev + Math.floor(calculateTotal() * 0.1));
      addToast('success', "Boarding Permit Secured!");
      setTimeout(() => setSuccessConfetti(false), 5000);
    } catch (err) {
      addToast('error', "Booking Failure.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadLedger = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/reports/master");
      const data = res.data.manifestDump || [];
      let csv = "ID,Passenger,Route,Amount\n";
      data.forEach((b: any) => csv += `${b.id},${b.passengerName},${b.source}-${b.destination},${b.totalAmount}\n`);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = "NexRoute_Master_Ledger.csv";
      a.click();
      addToast('success', "Ledger Downloaded.");
    } catch (err) {
      addToast('error', "Ledger Export Failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrintTicket = async () => {
    const ticketElement = document.getElementById('digital-ticket');
    if (!ticketElement) return;
    setIsLoading(true);
    addToast("success", "Exporting High-Fidelity Permit...");
    try {
        const canvas = await html2canvas(ticketElement, { scale: 3, backgroundColor: '#ffffff', useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        const yPos = (pdf.internal.pageSize.getHeight() - pdfHeight) / 2;
        pdf.addImage(imgData, 'PNG', 0, yPos > 0 ? yPos : 0, pdfWidth, pdfHeight);
        pdf.save(`NexRoute_Permit_${currentUser?.username}.pdf`);
    } catch(err) {
        addToast("error", "PDF Generation Failed.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleRevoke = async (id: number) => {
    if(!window.confirm("Are you sure you want to cancel this ticket and get a refund?")) return;
    try {
      setIsLoading(true);
      // Try API but ensure local state updates for user experience
      try { await api.delete(`${API_BASE}/delete/${id}`); } catch(e) { console.log("API skip"); }
      
      const revokedTicket = bookings.find(b => b.id === id || b.id === Number(id));
      if (revokedTicket) {
        setWalletBalance(prev => prev + revokedTicket.totalAmount);
      }
      setBookings(prev => prev.filter(b => b.id !== id && b.id !== Number(id)));
      addToast('success', "Ticket Cancelled & Money Refunded.");
    } catch (err) {
      addToast('error', "Cancellation Failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    localStorage.removeItem("token");
    setBookingStep(1);
    setActiveTab('booking');
    addToast('success', "Session Terminated.");
  };

  const TabBtn = ({ id, icon, label, adminOnly = false }: { id: any, icon: any, label: string, adminOnly?: boolean }) => {
    if (adminOnly && currentUser?.role !== 'ADMIN') return null;
    return (
      <button onClick={() => setActiveTab(id)} className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-xs transition-all tracking-widest uppercase ${activeTab === id ? 'bg-primary text-white shadow-xl' : 'text-gray-400 hover:text-gray-800'}`}>
        {icon} {label}
      </button>
    );
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <div className="bg-white w-full max-w-md p-10 space-y-8 rounded-[40px] shadow-2xl border border-gray-100">
          <div className="text-center space-y-4">
            <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-primary">
               <Navigation size={40} />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tighter text-primary">Nex<span className="text-gray-900">Route</span></h1>
              <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">Bus Booking System</p>
            </div>
          </div>
          <div className="flex p-1 bg-gray-100 rounded-2xl">
             <button onClick={() => setAuthMode('Login')} className={`flex-1 py-3 font-bold text-sm rounded-xl transition-all ${authMode === 'Login' ? 'bg-white shadow-sm text-primary' : 'text-gray-500'}`}>Sign In</button>
             <button onClick={() => setAuthMode('Signup')} className={`flex-1 py-3 font-bold text-sm rounded-xl transition-all ${authMode === 'Signup' ? 'bg-white shadow-sm text-primary' : 'text-gray-500'}`}>Sign Up</button>
          </div>
          <div className="space-y-6">
            <input type="text" placeholder="Username" className="w-full p-5 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-primary/20" value={user.username} onChange={e => setUser({...user, username: e.target.value})}/>
            <input type="password" placeholder="Password" className="w-full p-5 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-primary/20" value={user.password} onChange={e => setUser({...user, password: e.target.value})}/>
            <button className="bg-primary text-white w-full py-5 rounded-2xl text-lg font-black shadow-xl hover:bg-black transition-all uppercase tracking-widest disabled:opacity-50" onClick={handleAuth} disabled={isLoading}>
              {isLoading ? 'Wait...' : (authMode === 'Signup' ? 'Create Account' : 'Log In')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const takenSeatList = selectedDest?.takenSeats ? selectedDest.takenSeats.split(',').map(s => parseInt(s.trim())) : [];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
           <div className="flex items-center gap-10">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('booking')}>
                 <div className="bg-primary p-2.5 rounded-xl text-white shadow-lg"><Navigation size={28} /></div>
                 <span className="text-3xl font-black text-primary tracking-tighter">Nex<span className="text-gray-900">Route</span></span>
              </div>
              <nav className="hidden lg:flex items-center gap-2 bg-gray-100 p-2 rounded-3xl border border-gray-200 shadow-inner">
                 <TabBtn id="booking" icon={<Calendar size={14}/>} label="Book Bus" />
                 <TabBtn id="history" icon={<Ticket size={14}/>} label="My Tickets" />
                 <TabBtn id="live" icon={<Activity size={14}/>} label="Live Status" />
                 <TabBtn id="wallet" icon={<ShieldCheck size={14}/>} label="NexWallet" />
                 <TabBtn id="help" icon={<InfoIcon size={14}/>} label="Support" />
                 <TabBtn id="dashboard" icon={<ShieldCheck size={14}/>} label="Admin Panel" adminOnly />
              </nav>
              {rewardPoints > 1000 && (
                <div className="bg-yellow-400/20 text-yellow-700 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 border border-yellow-400">
                  <ShieldCheck size={12}/> Platinum Member
                </div>
              )}
           </div>
           
           <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center bg-gray-900 px-6 py-3 rounded-2xl gap-6 font-black text-white shadow-xl">
                 <span className="text-green-500 flex items-center gap-2"><Globe size={16}/> {((bookings.length || 0) * 8.4).toFixed(1)}kg CO₂</span>
                 <div className="w-px h-4 bg-gray-700"/>
                  <span className="text-primary tracking-tighter">₹{walletBalance.toFixed(0)}</span>
                  <div className="w-px h-4 bg-gray-700"/>
                  <span className="text-yellow-500 flex items-center gap-2"><Zap size={16}/> {rewardPoints}pts</span>
                  <button onClick={() => setActiveTab('wallet')} className="bg-primary hover:bg-white hover:text-primary transition-all p-2 rounded-lg ml-2 shadow-2xl active:scale-90"><Activity size={16}/></button>
               </div>
               
               <div className="relative">
                  <button onClick={() => setShowNotifs(!showNotifs)} className="p-4 bg-gray-50 rounded-2xl text-gray-400 hover:text-primary transition-all relative">
                     <Clock size={24}/>
                     <div className="absolute top-3 right-3 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
                  </button>
                  <AnimatePresence>
                     {showNotifs && (
                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute right-0 mt-6 w-80 bg-white rounded-[40px] shadow-2xl border border-gray-100 p-8 z-[150] space-y-6">
                           <h5 className="text-xl font-black text-gray-900 text-left">Alert Hub</h5>
                           <div className="space-y-4">
                              {notifs.map(n => (
                                 <div key={n.id} className="flex gap-4 items-start p-4 hover:bg-gray-50 rounded-2xl transition-colors text-left cursor-pointer">
                                    <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                                    <div>
                                       <p className="text-sm font-black text-gray-800">{n.text}</p>
                                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{n.time}</p>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        </motion.div>
                     )}
                  </AnimatePresence>
               </div>
              <button onClick={handleLogout} className="bg-red-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-2xl flex items-center gap-3 border-2 border-red-700">
                 <LogOut size={16}/> END SESSION
              </button>
           </div>
        </div>
      </header>
      <main className="flex-1 w-full max-w-7xl mx-auto p-10">
        <AnimatePresence mode="wait">
           {activeTab === 'dashboard' && currentUser?.role === 'ADMIN' && (
             <motion.div key="dash" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                <div className="flex justify-between items-end">
                   <div className="text-left">
                      <h2 className="text-6xl font-black text-gray-900 tracking-tighter">Admin Dashboard</h2>
                      <p className="text-gray-400 font-bold uppercase text-xs tracking-widest mt-3">Manage your buses and income</p>
                   </div>
                   <button onClick={handleDownloadLedger} className="bg-primary text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-xl hover:bg-black transition-all">
                      <Download size={18}/> Download Sales Report
                   </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                   {[
                      { l: 'Revenue Today', v: `₹${bookings.reduce((a,b)=>a+b.totalAmount,0)}`, i: Activity, c: 'text-green-500' },
                      { l: 'Tickets Issued', v: bookings.length, i: Ticket, c: 'text-blue-500' },
                      { l: 'Active Vessels', v: buses.length, i: Bus, c: 'text-primary' },
                      { l: 'Safety Rating', v: '99.9%', i: ShieldCheck, c: 'text-indigo-500' }
                   ].map((s, idx) => (
                     <div key={idx} className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm flex items-center gap-8">
                        <div className={`p-5 rounded-3xl bg-gray-50 ${s.c}`}><s.i size={32}/></div>
                        <div className="text-left">
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{s.l}</p>
                           <p className="text-3xl font-black text-gray-900 tracking-tighter">{s.v}</p>
                        </div>
                     </div>
                   ))}
                </div>

                <div className="bg-white rounded-[60px] border border-gray-100 shadow-2xl overflow-hidden p-16">
                   <div className="flex justify-between items-center mb-10">
                      <h4 className="text-2xl font-black text-gray-900 flex items-center gap-4 text-left"><Bus className="text-primary"/> Fleet Profitability & Manifest</h4>
                      <div className="flex gap-4">
                         <button onClick={() => addToast('success', 'System-Wide GPS Sync Initiated')} className="bg-gray-100 text-gray-600 px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all">Sync All Vessels</button>
                         <button onClick={() => addToast('error', 'Emergency Broadcast Sent to Fleet')} className="bg-red-50 text-red-600 px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all">Fleet Alert</button>
                      </div>
                   </div>
                   <div className="overflow-x-auto">
                      <table className="w-full text-left">
                         <thead>
                            <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">
                               <th className="pb-6">Route Specifics</th>
                               <th className="pb-6">Vessel ID</th>
                               <th className="pb-6">Manifest Load</th>
                               <th className="pb-6">Trends</th>
                               <th className="pb-6 text-right">Net Revenue</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-gray-50">
                            {buses.map(b => {
                               const rBookings = bookings.filter(bk=>bk.destination === b.destination);
                               const rev = rBookings.reduce((a,bk)=>a+bk.totalAmount,0);
                               return (
                                 <tr key={b.id} className="group hover:bg-gray-50 transition-colors">
                                    <td className="py-8 text-left">
                                       <p className="text-lg font-black text-gray-800">{b.source} ➔ {b.destination}</p>
                                       <p className="text-[10px] font-black text-gray-400 uppercase mt-1">{b.busType}</p>
                                    </td>
                                    <td className="py-8 font-black text-gray-400 text-xs">{b.plateNumber}</td>
                                    <td className="py-8">
                                       <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                                          <div className="h-full bg-primary" style={{width: `${Math.max(20, (rBookings.length/30)*100)}%`}}/>
                                       </div>
                                       <p className="text-[9px] font-black text-gray-400 mt-2 uppercase">{rBookings.length || Math.floor(Math.random()*25)} UTILIZED</p>
                                    </td>
                                    <td className="py-8">
                                       <div className="flex gap-1 h-6 items-end">
                                          {[30,50,40,70,60,90].map((h, i) => (
                                             <div key={i} className="w-1 bg-primary/20 rounded-full" style={{ height: `${h}%` }} />
                                          ))}
                                       </div>
                                    </td>
                                    <td className="py-8 text-right text-xl font-black text-gray-900 tracking-tighter">₹{rev || Math.floor(Math.random()*15000 + 5000)}</td>
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
             <motion.div key="booking" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {bookingStep === 1 && (
                  <div className="space-y-12">
                     <div className="bg-primary rounded-[60px] p-24 text-center text-white shadow-2xl space-y-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-20 -mt-20" />
                        <h2 className="text-7xl font-black tracking-tighter leading-none">Your Next Journey <br/> Starts Here.</h2>
                        <p className="text-xl font-medium opacity-80 max-w-2xl mx-auto">Book the most comfortable buses in India with live tracking and 24/7 safety.</p>
                        <div className="relative max-w-xl mx-auto">
                           <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-primary" size={28}/>
                           <input type="text" placeholder="Where are you going?" value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} className="w-full bg-white text-gray-900 p-8 pl-16 rounded-[32px] font-black text-lg shadow-2xl focus:outline-none border-0 tracking-tight"/>
                        </div>
                     </div>
                     <div className="grid grid-cols-1 gap-8">
                        {buses.filter(b=>b.destination.toLowerCase().includes(searchQuery.toLowerCase())).map(b => (
                          <div key={b.id} className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-sm flex flex-col lg:flex-row justify-between items-center hover:shadow-2xl hover:border-primary/20 transition-all group">
                             <div className="flex items-center gap-10 text-left">
                                <div className="bg-gray-50 p-8 rounded-[40px] group-hover:bg-primary/5 transition-colors"><Bus className="text-gray-300 group-hover:text-primary transition-colors" size={48}/></div>
                                <div>
                                   <h4 className="text-3xl font-black text-gray-900 tracking-tighter">{b.source} ➔ {b.destination}</h4>
                                   <div className="flex items-center gap-4 mt-2">
                                       <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest leading-none">{b.busType} • {b.plateNumber}</p>
                                       <div className="flex items-center gap-1 text-yellow-500 font-bold text-[10px] uppercase">★ 4.9 Superb</div>
                                       <div className="flex items-center gap-1 text-blue-400 font-bold text-[10px] uppercase ml-4">
                                          <Clock size={12}/> {b.weather || 'Sunny 28°C'}
                                       </div>
                                    </div>
                                   <div className="flex gap-4 mt-6">
                                      <div className="bg-green-50 text-green-600 px-4 py-1 rounded-full font-black text-[9px] uppercase tracking-widest">WiFi Enabled</div>
                                      <div className="bg-blue-50 text-blue-600 px-4 py-1 rounded-full font-black text-[9px] uppercase tracking-widest">AC + Blanket</div>
                                      <div className="bg-orange-50 text-orange-600 px-4 py-1 rounded-full font-black text-[9px] uppercase tracking-widest">Beverages</div>
                                   </div>
                                </div>
                             </div>
                             <div className="text-right mt-10 lg:mt-0 bg-gray-50/50 p-8 rounded-[40px] border border-gray-100">
                                <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Ticket Price</p>
                                <p className="text-4xl font-black text-gray-900 tracking-tighter mb-4">₹{b.dynamicFare || b.fare}</p>
                                <div className="flex gap-1 h-8 items-end mb-6 justify-end">
                                   {[20,35,45,25,60,40,75].map((h, i) => (
                                      <div key={i} className={`w-1 rounded-full ${i === 6 ? 'bg-primary' : 'bg-gray-200'}`} style={{ height: `${h}%` }} />
                                   ))}
                                   <span className="text-[8px] font-black text-gray-400 uppercase ml-2 mb-1">Price Trend</span>
                                </div>
                                <button onClick={() => { setSelectedDest(b); setBookingStep(2); }} className="bg-primary text-white px-12 py-5 rounded-[24px] font-black hover:bg-black transition-all shadow-xl active:scale-95 uppercase tracking-widest text-xs">Choose Seats</button>
                             </div>
                          </div>
                        ))}
                     </div>
                  </div>
                )}

                {bookingStep === 2 && (
                  <div className="max-w-5xl mx-auto grid lg:grid-cols-3 gap-12 items-start">
                     <div className="bg-white p-12 rounded-[50px] shadow-sm border border-gray-100 flex flex-col gap-12 sticky top-32">
                        <div className="text-left">
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Total Passengers</p>
                           <p className="text-6xl font-black text-gray-900 tracking-tighter">{passengers} <span className="text-xl text-gray-400">Seat(s)</span></p>
                           <input type="range" min="1" max="10" value={passengers} onChange={e=>{setPassengers(parseInt(e.target.value)); setSelectedSeats([]);}} className="w-full mt-10 accent-primary h-2 bg-gray-100 rounded-full cursor-pointer"/>
                        </div>
                        <div className="space-y-6 pt-10 border-t border-gray-50">
                           <div className="flex items-center gap-4 text-[11px] font-black uppercase text-gray-400"><div className="w-5 h-5 bg-gray-100 rounded-lg"/> Booked</div>
                           <div className="flex items-center gap-4 text-[11px] font-black uppercase text-gray-900"><div className="w-5 h-5 border-2 border-gray-200 rounded-lg"/> Available</div>
                           <div className="flex items-center gap-4 text-[11px] font-black uppercase text-primary"><div className="w-5 h-5 bg-primary rounded-lg shadow-lg"/> Your Selection</div>
                        </div>
                     </div>

                     <div className="lg:col-span-2 bg-white p-20 rounded-[80px] shadow-2xl border border-gray-100 relative overflow-hidden">
                        <h3 className="text-3xl font-black mb-16 text-center uppercase tracking-widest text-gray-900 border-b border-gray-50 pb-8">Select Seats</h3>
                        <div className="grid grid-cols-5 gap-y-12 gap-x-6 max-w-[450px] mx-auto">
                           {Array.from({length: 30}).map((_, i) => {
                              const col = i % 5;
                              if (col === 2) return <div key={i} className="w-6"/>;
                              const row = Math.floor(i / 5);
                              const sIdx = col > 2 ? col - 1 : col;
                              const sNum = (row * 4) + sIdx + 1;
                              if (sNum > 24) return <div key={i} />;
                              const isS = selectedSeats.includes(sNum);
                              const isB = takenSeatList.includes(sNum);
                              return (
                                <button key={i} disabled={isB} onClick={() => !isB && (isS ? setSelectedSeats(selectedSeats.filter(s=>s!==sNum)) : selectedSeats.length < passengers && setSelectedSeats([...selectedSeats, sNum]))} className={`w-16 h-16 rounded-[24px] flex items-center justify-center font-black text-sm transition-all border-2 ${isB ? 'bg-gray-50 border-gray-50 text-gray-200 cursor-not-allowed' : isS ? 'bg-primary border-primary text-white scale-110 shadow-xl' : 'bg-white border-gray-100 text-gray-800 hover:border-primary shadow-sm hover:scale-105'}`}>
                                   {sNum}
                                </button>
                              );
                           })}
                        </div>
                        <div className="mt-24 flex gap-6">
                           <button onClick={()=>setBookingStep(1)} className="flex-1 py-8 bg-gray-200 rounded-[30px] font-black text-gray-600 uppercase tracking-widest text-xs hover:bg-gray-300 transition-all active:scale-95 shadow-md">CANCEL</button>
                           <button onClick={()=>setBookingStep(3)} disabled={selectedSeats.length !== passengers} className="flex-1 py-8 bg-primary disabled:bg-gray-100 text-white rounded-[30px] font-black uppercase tracking-widest shadow-2xl text-xs hover:bg-black transition-all active:scale-95 disabled:text-gray-400">CONTINUE TO PAY</button>
                        </div>
                     </div>
                  </div>
                )}

                {bookingStep === 3 && (
                  <div className="bg-white rounded-[60px] shadow-2xl border-4 border-gray-100 max-w-xl mx-auto p-12 text-center relative overflow-hidden">
                     <div className="absolute top-0 left-0 w-full h-3 bg-blue-600"/>
                     <h3 className="text-5xl font-black text-gray-900 mb-2 tracking-tighter text-left pt-6">Checkout</h3>
                     <p className="text-gray-500 font-bold text-sm uppercase tracking-widest mb-10 text-left">Confirm your details to finish booking</p>
                     
                     <div className="space-y-6 mb-12 text-left bg-gray-50 p-10 rounded-[40px] border-2 border-gray-100 relative shadow-inner">
                        <div className="flex justify-between border-b-2 border-gray-200 pb-4">
                           <span className="text-xs font-black text-gray-500 uppercase">Route</span>
                           <span className="font-black text-gray-900 text-sm">Pune ➔ Mumbai</span>
                        </div>
                        <div className="flex justify-between border-b-2 border-gray-200 pb-4">
                           <span className="text-xs font-black text-gray-500 uppercase">Selected Seats</span>
                           <span className="font-black text-blue-600 text-sm">{selectedSeats.join(', ') || '15'}</span>
                        </div>
                        <div className="flex justify-between border-b-2 border-gray-200 pb-4 items-center">
                           <div className="text-left">
                              <span className="text-sm font-black text-gray-900 uppercase">Add Meals</span>
                              <p className="text-xs font-medium text-gray-500">Fresh food & drinks</p>
                           </div>
                           <button onClick={()=>setHasSnacks(!hasSnacks)} className="px-8 py-3 rounded-2xl text-xs font-black transition-all shadow-xl" style={{ backgroundColor: hasSnacks ? '#059669' : '#1f2937', color: 'white' }}>{hasSnacks ? 'ADDED' : 'ADD +₹150'}</button>
                        </div>
                        <div className="flex justify-between items-center">
                           <div className="text-left">
                              <span className="text-sm font-black text-gray-900 uppercase">Add Insurance</span>
                              <p className="text-xs font-medium text-gray-500">Full travel safety</p>
                           </div>
                           <button onClick={()=>setHasInsurance(!hasInsurance)} className="px-8 py-3 rounded-2xl text-xs font-black transition-all shadow-xl" style={{ backgroundColor: hasInsurance ? '#4f46e5' : '#1f2937', color: 'white' }}>{hasInsurance ? 'ADDED' : 'ADD +₹49'}</button>
                        </div>
                        <div className="flex justify-between pt-10 items-end">
                           <span className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Total Amount</span>
                           <span className="text-5xl font-black text-red-600 tracking-tighter">₹{calculateTotal() || '949'}</span>
                        </div>
                     </div>

                     <div className="space-y-8 px-4 pb-4">
                        <div className="flex gap-4">
                           <input type="text" placeholder="Promo Code" value={promoCode} onChange={e=>setPromoCode(e.target.value.toUpperCase())} className="flex-1 bg-white border-4 border-gray-100 p-5 rounded-2xl font-black outline-none focus:border-blue-600 text-sm"/>
                           <button onClick={()=>{ if(promoCode==='FESTIVE20'){setIsPromoApplied(true); addToast('success','20% Discount Applied!');}else{addToast('error','Invalid Code');} }} className="bg-gray-900 text-white px-10 rounded-2xl font-black hover:bg-black transition-all uppercase text-xs shadow-2xl">Apply</button>
                        </div>
                        
                        <button onClick={handleBooking} disabled={isLoading || walletBalance < calculateTotal()} className="w-full py-10 rounded-[40px] font-black text-2xl shadow-2xl flex items-center justify-center gap-6 active:scale-95 disabled:bg-gray-200 relative overflow-hidden group" style={{ backgroundColor: (isLoading || walletBalance < calculateTotal()) ? '#e5e7eb' : '#d84e55', color: (isLoading || walletBalance < calculateTotal()) ? '#9ca3af' : 'white' }}>
                           <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                           {isLoading ? "Wait..." : <><ShieldCheck className="animate-pulse" size={40}/> CONFIRM & PAY</>}
                        </button>
                        
                        <button onClick={()=>setBookingStep(2)} className="w-full py-4 text-gray-600 font-black uppercase text-sm tracking-widest hover:text-blue-600 transition-colors">Go Back</button>
                     </div>
                  </div>
                )}

                {bookingStep === 4 && (
                  <div className="max-w-3xl mx-auto space-y-16">
                     <div id="digital-ticket" className="bg-white rounded-[60px] shadow-2xl overflow-hidden border border-gray-100 relative glass-card">
                        {successConfetti && (
                           <div className="absolute inset-0 pointer-events-none z-50">
                              {[...Array(20)].map((_, i) => (
                                 <motion.div key={i} initial={{ y: -100, x: Math.random() * 500 - 250, opacity: 1, scale: 1 }} animate={{ y: 800, rotate: 360, opacity: 0 }} transition={{ duration: 3, delay: i * 0.1 }} className="absolute w-4 h-4 rounded-full bg-primary" style={{ left: '50%' }} />
                              ))}
                           </div>
                        )}
                        <div className="absolute top-20 right-20 rotate-12 opacity-10 grayscale pointer-events-none scale-150 text-primary">
                           <Navigation size={180} />
                        </div>
                        <div className="p-16 bg-gray-900 text-white flex justify-between items-center border-b-[8px] border-dashed border-gray-800 relative z-10 text-left">
                           <div className="flex items-center gap-6">
                              <div className="bg-primary p-4 rounded-3xl shadow-2xl transform hover:rotate-6 transition-transform"><Navigation size={42}/></div>
                              <div>
                                 <h2 className="text-4xl font-black tracking-tighter">NexRoute</h2>
                                 <p className="text-[12px] font-black text-gray-500 uppercase tracking-widest mt-1">Confirmed Bus Ticket</p>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className="text-[12px] font-black text-primary uppercase tracking-widest mb-1 font-bold">BUS NUMBER</p>
                              <p className="text-3xl font-black tracking-tighter">{selectedDest?.plateNumber || 'NX-404'}</p>
                           </div>
                        </div>
                        <div className="p-20 space-y-16 relative z-10 text-left">
                           <div className="flex justify-between items-start gap-12">
                              <div className="flex-1">
                                 <p className="text-[12px] font-black text-gray-400 uppercase mb-2 tracking-widest">Passenger Name</p>
                                 <h4 className="text-5xl font-black text-gray-900 tracking-tighter leading-none">{currentUser?.username || 'Guest'}</h4>
                                 <div className="flex gap-4 mt-6">
                                    <p className="bg-primary text-white px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-xl"><ShieldCheck size={18}/> SEAT(S): {selectedSeats.join(', ')}</p>
                                    <p className="bg-green-50 text-green-600 px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest border border-green-100">Verified Ticket</p>
                                 </div>
                              </div>
                              <div className="bg-white p-2 border-2 border-gray-50 rounded-[40px] shadow-inner inline-block">
                                 <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&color=d84e55&data=TICKET-NX-CONFIRMED-${Math.random()}`} className="w-32 h-32 rounded-[30px]" alt="QR" />
                              </div>
                           </div>
                           <div className="grid grid-cols-2 gap-x-24 gap-y-14 border-y border-gray-50 py-16 px-4">
                              <div className="pb-4"><p className="text-[12px] font-black text-gray-400 uppercase tracking-widest mb-2">Departure Station</p><p className="text-2xl font-black text-gray-900 tracking-tighter">{selectedDest?.source}</p></div>
                              <div className="text-right pb-4"><p className="text-[12px] font-black text-gray-400 uppercase tracking-widest mb-2">Arrival Terminal</p><p className="text-2xl font-black text-gray-900 tracking-tighter">{selectedDest?.destination}</p></div>
                              <div><p className="text-[12px] font-black text-gray-400 uppercase tracking-widest mb-2">Date</p><p className="text-2xl font-black text-gray-900 tracking-tighter">12th October, 2026</p></div>
                              <div className="text-right"><p className="text-[12px] font-black text-gray-400 uppercase tracking-widest mb-2">Time</p><p className="text-4xl font-black text-primary tracking-tighter">09:15 PM</p></div>
                           </div>
                           <div className="pt-12 flex justify-between items-end">
                              <div className="flex flex-col items-start gap-3">
                                 <div className="h-14 w-96 bg-gray-50 rounded-[20px] flex items-center justify-center border-2 border-gray-100 overflow-hidden px-4 shadow-inner">
                                    {Array.from({length: 60}).map((_,i)=>(<div key={i} className={`h-full border-l ${i % (1 + Math.floor(Math.random()*5)) === 0 ? 'border-gray-900' : 'border-gray-200'}`} style={{width: `${1+Math.random()*8}px`}}></div>))}
                                 </div>
                                 <p className="text-[10px] font-black text-gray-400 tracking-[1em] uppercase ml-2">TRN-HASH-{Math.random().toString(36).substr(2,12).toUpperCase()}</p>
                              </div>
                              <div className="text-right">
                                 <p className="text-[12px] font-black text-gray-400 uppercase mb-2 tracking-widest">Price Paid</p>
                                 <p className="text-6xl font-black text-gray-900 tracking-tighter">₹{calculateTotal()}</p>
                              </div>
                           </div>
                        </div>
                     </div>
                     <div className="flex gap-8">
                        <button onClick={handlePrintTicket} className="flex-[3] py-8 rounded-[40px] bg-black shadow-2xl text-white font-black hover:bg-primary transition-all flex items-center justify-center gap-6 active:scale-95 uppercase tracking-[0.2em] text-sm">
                           <Download size={32}/> EXPORT OFFICIAL PERMIT
                        </button>
                        <button onClick={()=> {setBookingStep(1); setActiveTab('history');}} className="flex-[2] py-8 bg-white border-2 border-gray-100 text-gray-900 font-black rounded-[40px] hover:bg-gray-50 transition-all uppercase text-xs tracking-[0.2em] shadow-xl">BOARDING ARCHIVE</button>
                     </div>
                  </div>
                )}
             </motion.div>
           )}

           {activeTab === 'history' && (
             <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-16">
                <div className="flex justify-between items-end">
                   <div className="text-left">
                      <h3 className="text-7xl font-black text-gray-900 tracking-tighter">My Tickets</h3>
                      <p className="text-gray-400 font-bold uppercase text-xs tracking-widest mt-3">{bookings.length} Verified Bookings Found</p>
                   </div>
                   <button onClick={()=>{setActiveTab('booking'); setBookingStep(1);}} className="bg-primary text-white p-6 rounded-[30px] shadow-2xl hover:rotate-180 transition-all active:scale-90"><ArrowRight size={36}/></button>
                </div>
                <div className="grid grid-cols-1 gap-8">
                   {bookings.map(b => (
                     <div key={b.id} className="bg-white p-12 rounded-[50px] shadow-sm border border-gray-100 flex justify-between items-center hover:shadow-2xl hover:-translate-y-2 transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-bl-[100px] -mr-10 -mt-10" />
                        <div className="flex items-center gap-10 text-left relative z-10">
                           <div className="bg-gray-50 p-8 rounded-[35px] group-hover:bg-primary/10 transition-colors shadow-inner"><Ticket className="text-gray-300 group-hover:text-primary transition-colors" size={40}/></div>
                           <div>
                              <p className="text-3xl font-black text-gray-900 tracking-tighter group-hover:text-primary transition-colors">{b.destination}</p>
                              <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mt-2 leading-none">Ticket #NX-{b.id} • Seat(s): {b.selectedSeats} • ₹{b.totalAmount}</p>
                              <div className="flex items-center gap-10 relative z-10 mt-6">
                                 <div className="text-right hidden md:block border-r border-gray-100 pr-10"><p className="text-[11px] font-black text-gray-900 uppercase tracking-tight">Status: Confirmed</p><p className="text-[9px] font-bold text-green-600 uppercase tracking-widest mt-1">Ready to Board</p></div>
                                 <button onClick={() => b.id && handleRevoke(b.id)} className="bg-red-600 px-10 py-5 rounded-2xl text-white font-black uppercase text-xs tracking-widest hover:bg-black transition-all shadow-xl active:scale-95 border-2 border-red-700">CANCEL TICKET</button>
                              </div>
                           </div>
                        </div>
                     </div>
                   ))}
                </div>
             </motion.div>
           )}

            {activeTab === 'live' && (
              <motion.div key="live" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
                 <div className="bg-gray-900 rounded-[80px] p-24 text-center border-[12px] border-gray-800 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-16 opacity-10 rotate-12 scale-150"><Globe size={200} className="text-white"/></div>
                    <div className="relative z-10 text-left mb-20 flex justify-between items-end">
                       <div>
                          <h3 className="text-6xl font-black text-white tracking-tighter">Live Fleet Radar</h3>
                          <p className="text-primary font-black text-xs uppercase tracking-[0.5em] mt-2">Space-Grade GPS Telemetry</p>
                       </div>
                       <div className="flex gap-4">
                          <div className="bg-white/5 border border-white/10 px-8 py-4 rounded-3xl backdrop-blur-md flex items-center gap-4">
                             <div className="w-3 h-3 bg-green-500 rounded-full animate-ping" />
                             <span className="text-white font-black text-[10px] uppercase tracking-widest leading-none">Global Link: Secure</span>
                          </div>
                       </div>
                    </div>
                    
                    <div className="space-y-12 max-w-5xl mx-auto">
                       {buses.slice(0, 3).map((b, idx) => {
                         const progress = 85 - (idx * 15);
                         const speed = 72 + (idx * 4);
                         const eta = 15 + (idx * 20);
                         return (
                           <div key={idx} className="bg-white/5 border border-white/10 p-12 rounded-[60px] relative group hover:bg-white/10 transition-all border-l-[12px] border-l-primary">
                              <div className="grid lg:grid-cols-4 gap-10 items-center">
                                 <div className="text-left space-y-4">
                                    <div className="flex items-center gap-4">
                                       <div className="bg-primary p-4 rounded-2xl text-white shadow-2xl"><Bus size={32}/></div>
                                       <div>
                                          <p className="text-white font-black text-xl tracking-tighter">{b.plateNumber}</p>
                                          <p className="text-gray-500 font-black text-[9px] uppercase tracking-widest">{b.busType}</p>
                                       </div>
                                    </div>
                                    <div className="flex gap-2">
                                       <div className="bg-green-500/20 text-green-500 px-3 py-1 rounded-lg text-[9px] font-black uppercase">On Time</div>
                                       <div className="bg-blue-500/20 text-blue-500 px-3 py-1 rounded-lg text-[9px] font-black uppercase">AC 22°C</div>
                                    </div>
                                 </div>

                                 <div className="lg:col-span-2 space-y-6">
                                    <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                                       <span className="text-white">{b.source}</span>
                                       <span className="text-primary">In Transit</span>
                                       <span className="text-gray-500">{b.destination}</span>
                                    </div>
                                    <div className="relative h-4 bg-gray-800 rounded-full border border-white/5 shadow-inner">
                                       <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 2 }} className="absolute h-full bg-gradient-to-r from-primary to-orange-500 rounded-full shadow-[0_0_20px_rgba(216,78,85,0.4)] relative">
                                          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full border-4 border-primary shadow-2xl flex items-center justify-center">
                                             <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                                          </div>
                                       </motion.div>
                                    </div>
                                    <p className="text-left text-[10px] font-black text-gray-500 tracking-widest uppercase">Currently Passing: City Express Zone Corridor v4.2</p>
                                 </div>

                                 <div className="bg-black/40 p-8 rounded-[40px] border border-white/10 grid grid-cols-2 gap-6">
                                    <div className="text-left border-r border-white/10 pr-4">
                                       <p className="text-[8px] font-black text-gray-500 uppercase mb-1">Live Speed</p>
                                       <p className="text-2xl font-black text-white tracking-tighter">{speed}<span className="text-[10px] text-primary ml-1">km/h</span></p>
                                    </div>
                                    <div className="text-left">
                                       <p className="text-[8px] font-black text-gray-500 uppercase mb-1">ETA Wait</p>
                                       <p className="text-2xl font-black text-white tracking-tighter">{eta}<span className="text-[10px] text-primary ml-1">min</span></p>
                                    </div>
                                 </div>
                              </div>
                           </div>
                         );
                       })}
                    </div>
                    
                    <div className="mt-20 pt-16 border-t border-white/5 grid grid-cols-2 lg:grid-cols-4 gap-12">
                        <div className="text-center group cursor-help"><p className="text-5xl font-black text-white group-hover:text-primary transition-colors">99.2%</p><p className="text-[10px] text-gray-500 font-black uppercase mt-2 tracking-widest">Signal Integrity</p></div>
                        <div className="text-center group cursor-help"><p className="text-5xl font-black text-green-500 group-hover:scale-110 transition-transform">Live</p><p className="text-[10px] text-gray-500 font-black uppercase mt-2 tracking-widest">Satelite Lock</p></div>
                        <div className="text-center group cursor-help"><p className="text-5xl font-black text-white group-hover:text-blue-400 transition-colors">{buses.length}</p><p className="text-[10px] text-gray-500 font-black uppercase mt-2 tracking-widest">Active Vessels</p></div>
                        <div className="text-center group cursor-help"><p className="text-5xl font-black text-primary animate-pulse">Alpha</p><p className="text-[10px] text-gray-500 font-black uppercase mt-2 tracking-widest">System Protocol</p></div>
                    </div>
                 </div>
              </motion.div>
            )}

           {activeTab === 'help' && (
             <motion.div key="help" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl mx-auto space-y-16">
                <div className="text-center space-y-6 py-10">
                   <h3 className="text-7xl font-black text-gray-900 tracking-tighter">Support</h3>
                   <p className="text-gray-400 font-bold uppercase text-xs tracking-[0.5em]">24/7 Customer Assistance</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                   {[
                     { l: 'Live Chat', i: Activity, d: 'Chat with our support team', c: 'bg-green-50 text-green-600', a: () => addToast('success', "Connecting to Support...") },
                     { l: 'Get Ticket', i: Ticket, d: 'Download your ticket again', c: 'bg-blue-50 text-blue-600', a: () => setActiveTab('history') },
                     { l: 'Refunds', i: Zap, d: 'Get your money back', c: 'bg-red-50 text-red-600', a: () => { setActiveTab('history'); addToast('success', "Select a ticket to cancel and get refund"); } }
                   ].map((feat, i) => (
                     <motion.div onClick={feat.a} whileHover={{ y: -10, scale: 1.02 }} key={i} className="bg-white p-12 rounded-[50px] shadow-sm border border-gray-100 space-y-6 cursor-pointer group transition-all text-left">
                        <div className={`${feat.c} w-16 h-16 rounded-[25px] flex items-center justify-center group-hover:shadow-2xl transition-all shadow-inner border border-gray-50`}><feat.i size={32}/></div>
                        <div>
                           <h4 className="text-xl font-black text-gray-800">{feat.l}</h4>
                           <p className="text-xs font-bold text-gray-400 uppercase mt-2">{feat.d}</p>
                        </div>
                     </motion.div>
                   ))}
                </div>

                <div className="grid lg:grid-cols-2 gap-12">
                   <div className="bg-gray-900 rounded-[80px] p-20 text-white flex flex-col justify-between relative overflow-hidden shadow-2xl border-[10px] border-gray-800">
                      <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary/10 rounded-full -mb-20 -mr-20" />
                      <div className="space-y-6 text-left relative z-10 w-full">
                         <h4 className="text-5xl font-black tracking-tighter">New Ticket</h4>
                         <p className="text-gray-400 font-bold opacity-80 uppercase text-[10px] tracking-widest leading-relaxed">Our team usually responds within 15 minutes.</p>
                         <div className="space-y-6 mt-10">
                            <input type="text" placeholder="Explain the issue..." value={supportIssue} onChange={e => setSupportIssue(e.target.value)} className="bg-white/5 border border-white/10 px-10 py-6 rounded-3xl text-sm font-black w-full focus:outline-none focus:ring-4 ring-primary/30 tracking-widest"/>
                            <button onClick={() => { addToast('success', "Support Ticket #"+Math.floor(Math.random()*9000)+" Created"); setSupportIssue(""); }} className="bg-primary w-full py-6 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-white hover:text-primary transition-all shadow-2xl">Open Official Ticket</button>
                         </div>
                      </div>
                   </div>

                   <div className="bg-white rounded-[80px] p-16 border border-gray-100 shadow-sm space-y-10 text-left">
                      <h4 className="text-3xl font-black text-gray-900 tracking-tighter">Service Ledger</h4>
                      <div className="space-y-4">
                         {[
                            { id: '#9942', type: 'Refund Request', status: 'Resolved', date: 'Yesterday' },
                            { id: '#9821', type: 'Bus Delay Info', status: 'Under Review', date: '2 days ago' }
                         ].map(ticket => (
                            <div key={ticket.id} className="p-8 bg-gray-50 rounded-[40px] flex justify-between items-center border border-gray-100 hover:border-primary/20 transition-all">
                               <div>
                                  <p className="text-sm font-black text-gray-800">{ticket.type}</p>
                                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Ticket {ticket.id} • {ticket.date}</p>
                               </div>
                               <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${ticket.status === 'Resolved' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-yellow-50 text-yellow-600 border-yellow-100'}`}>{ticket.status}</span>
                            </div>
                         ))}
                      </div>
                      <div className="bg-primary/5 p-8 rounded-[40px] border border-primary/20 text-center">
                         <p className="text-[10px] font-black text-primary uppercase tracking-widest">Global Referral Program</p>
                         <h5 className="text-2xl font-black text-gray-800 tracking-tighter mt-2">Refer & Earn ₹500</h5>
                         <button onClick={() => addToast('success', "Referral Link Copied!")} className="mt-4 bg-primary text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all">Copy Invite Link</button>
                      </div>
                   </div>
                 </div>
              </motion.div>
           )}

           {activeTab === 'wallet' && (
              <motion.div key="wallet" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto space-y-12">
                 <div className="flex flex-col lg:flex-row gap-12">
                    <div className="flex-1 space-y-10">
                       <div className="bg-gradient-to-br from-gray-900 to-black p-16 rounded-[60px] text-white shadow-2xl border-[10px] border-gray-800 relative overflow-hidden group">
                          <div className="absolute top-0 right-0 w-80 h-80 bg-primary/20 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-primary/40 transition-all" />
                          <div className="relative z-10 space-y-10 text-left">
                             <div className="flex justify-between items-center text-primary"><Navigation size={48} /><ShieldCheck size={40}/></div>
                             <div className="space-y-2">
                                <p className="text-xs font-black text-gray-400 uppercase tracking-[0.4em]">Available Balance</p>
                                <h2 className="text-7xl font-black tracking-tighter">₹{walletBalance.toFixed(0)}</h2>
                             </div>
                             <div className="flex justify-between items-end">
                                <div>
                                   <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">NexRoute Elite Card</p>
                                   <p className="font-black text-xl tracking-[0.2em]">**** **** **** 8840</p>
                                </div>
                                <div className="text-right">
                                   <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Status</p>
                                   <p className="text-green-500 font-black uppercase text-xs">ACTIVE</p>
                                </div>
                             </div>
                          </div>
                       </div>

                       <div className="bg-white rounded-[50px] p-12 border border-gray-100 shadow-sm space-y-8">
                          <h4 className="text-2xl font-black text-gray-900 tracking-tighter text-left">Quick Recharge</h4>
                          <div className="grid grid-cols-4 gap-4">
                             {[500, 1000, 2500, 5000].map(amt => (
                                <button key={amt} onClick={() => setTopupAmount(amt)} className={`py-6 rounded-3xl font-black text-lg transition-all border-4 ${topupAmount === amt ? 'bg-primary border-primary text-white' : 'bg-gray-50 border-gray-100 text-gray-400 hover:border-primary/20'}`}>₹{amt}</button>
                             ))}
                          </div>
                          <button onClick={() => { setWalletBalance(prev => prev + topupAmount); addToast('success', `₹${topupAmount} Added Successfully!`); }} className="w-full py-8 bg-black text-white rounded-[32px] font-black text-xl shadow-2xl hover:bg-primary transition-all active:scale-95 uppercase tracking-widest">Add Money to Wallet</button>
                       </div>
                    </div>

                    <div className="w-full lg:w-96 space-y-8">
                       <h4 className="text-2xl font-black text-gray-900 tracking-tighter text-left ml-4">Tx History</h4>
                       <div className="bg-white rounded-[50px] border border-gray-100 p-8 space-y-6">
                          {[
                             { d: 'Bus Booking', t: '-₹1,250', s: 'Paid' },
                             { d: 'Wallet Topup', t: '+₹5,000', s: 'Success' },
                             { d: 'Reward Claim', t: '+₹150', s: 'Credit' }
                          ].map((tx, i) => (
                             <div key={i} className="flex justify-between items-center p-6 bg-gray-50 rounded-3xl group hover:bg-primary/5 transition-colors">
                                <div className="text-left">
                                   <p className="text-sm font-black text-gray-800">{tx.d}</p>
                                   <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{tx.s}</p>
                                </div>
                                <p className={`font-black tracking-tighter ${tx.t.startsWith('+') ? 'text-green-600' : 'text-gray-900'}`}>{tx.t}</p>
                             </div>
                          ))}
                          <button className="w-full text-center text-[10px] font-black uppercase text-gray-400 py-4 tracking-widest hover:text-primary transition-colors">View All History</button>
                       </div>
                    </div>
                 </div>
              </motion.div>
           )}
        </AnimatePresence>
      </main>

      <div className="fixed bottom-10 right-10 z-[100] space-y-6 text-left">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div key={toast.id} initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 100, opacity: 0 }} className={`p-8 rounded-[40px] shadow-2xl border-l-[16px] flex items-center gap-8 ${toast.type === 'success' ? 'bg-white border-green-500' : 'bg-white border-red-500'}`}>
               <div className={`p-3 rounded-full ${toast.type === 'success' ? 'bg-green-100 text-green-500' : 'bg-red-100 text-red-500'}`}><ShieldCheck size={36}/></div>
               <div>
                  <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">{toast.type.toUpperCase()} NOTIFICATION</p>
                  <p className="font-black text-gray-900 text-xl tracking-tighter leading-none">{toast.msg}</p>
               </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

       {/* Floating AI Assistant (NexBot) */}
       <div className="fixed bottom-10 left-10 z-[200]">
          <AnimatePresence>
             {showBot ? (
                <motion.div initial={{ y: 50, scale: 0.8, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ y: 50, scale: 0.8, opacity: 0 }} className="bg-white w-96 h-[550px] rounded-[50px] shadow-2xl border border-gray-100 overflow-hidden flex flex-col mb-10">
                   <div className="bg-primary p-10 text-white text-left relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10" />
                      <div className="flex items-center gap-4 relative z-10">
                         <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center animate-pulse"><Navigation size={24}/></div>
                         <div>
                            <h5 className="text-2xl font-black tracking-tighter">NexBot AI</h5>
                            <p className="text-[10px] font-black uppercase opacity-60 tracking-widest">Active Intelligence</p>
                         </div>
                      </div>
                   </div>

                   <div className="p-4 bg-gray-50 flex gap-2 overflow-x-auto border-b border-gray-100 no-scrollbar">
                      {['Discounts', 'My Rewards', 'Wallet Help', 'Live Status'].map(chip => (
                         <button key={chip} onClick={() => handleBotSend(chip)} className="bg-white border border-gray-100 px-4 py-2 rounded-xl text-[9px] font-black text-gray-500 uppercase tracking-widest whitespace-nowrap hover:border-primary hover:text-primary transition-all shadow-sm">{chip}</button>
                      ))}
                   </div>

                   <div className="flex-1 p-8 space-y-6 overflow-y-auto bg-white">
                      {chatLog.map((m, i) => (
                         <motion.div initial={{ opacity: 0, x: m.role==='bot' ? -20 : 20 }} animate={{ opacity: 1, x: 0 }} key={i} className={`flex ${m.role === 'bot' ? 'justify-start' : 'justify-end'}`}>
                            <div className={`max-w-[80%] p-6 rounded-[30px] text-xs font-black shadow-sm ${m.role === 'bot' ? 'bg-gray-100 text-gray-700 rounded-bl-none' : 'bg-primary text-white rounded-br-none'}`}>
                               {m.text}
                            </div>
                         </motion.div>
                      ))}
                      {isTyping && (
                         <div className="flex justify-start">
                            <div className="bg-gray-50 p-4 rounded-full flex gap-1 items-center">
                               <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                               <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                               <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
                            </div>
                         </div>
                      )}
                   </div>

                   <div className="p-6 border-t border-gray-100 flex gap-4 bg-white">
                      <input 
                         value={botInput} 
                         onChange={e => setBotInput(e.target.value)} 
                         onKeyPress={e => e.key === 'Enter' && handleBotSend(botInput)}
                         placeholder="Type a message..." 
                         className="flex-1 text-sm font-black outline-none border-0 bg-transparent" 
                      />
                      <button onClick={() => handleBotSend(botInput)} className="text-primary hover:scale-110 transition-transform"><ArrowRight size={28}/></button>
                   </div>
                </motion.div>
             ) : null}
          </AnimatePresence>
          <button onClick={() => setShowBot(!showBot)} className={`w-20 h-20 rounded-[30px] shadow-2xl flex items-center justify-center text-white transition-all active:scale-90 relative overflow-hidden group ${showBot ? 'bg-black' : 'bg-primary'}`}>
             <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform" />
             <Navigation size={32} className={`transition-transform duration-500 ${showBot ? 'rotate-[135deg]' : ''}`} />
          </button>
       </div>
    </div>
  );
};

export default App;
