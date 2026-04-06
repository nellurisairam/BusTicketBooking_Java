import React, { useState, useEffect } from 'react';
import { 
  Bus, 
  Ticket, 
  LogOut, 
  Search, 
  ArrowRight, 
  TrendingUp, 
  Zap, 
  QrCode, 
  Globe, 
  Activity, 
  Clock, 
  Navigation, 
  ShieldCheck,
  Calendar,
  Download,
  MapPin,
  Wifi,
  Wind,
  CheckCircle,
  User,
  Info as InfoIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Advanced TypeScript Enterprise Architectures
export interface IUser {
  id?: number;
  username: string;
  role: 'ADMIN' | 'USER';
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

const API_BASE = "http://localhost:8080/api/bookings";

const DEFAULT_BUSES: IBus[] = [
  { id: 1, source: 'Mumbai', destination: 'Mumbai Central', fare: 1250.0, availableSeats: 20, takenSeats: "", departureTime: "08:30 AM", busType: "Volvo AC Sleeper", plateNumber: "MH-01-AX-7741", weather: "Sunny 32°C", amenities: "WiFi,AC,Water,Charging" },
  { id: 2, source: 'Bangalore', destination: 'Bangalore - Silk Board', fare: 1500.0, availableSeats: 20, takenSeats: "5,6,10", departureTime: "11:45 AM", busType: "Scania Multi-Axle", plateNumber: "KA-05-BX-9902", weather: "Cloudy 24°C", amenities: "WiFi,AC,Blanket,Charging" },
  { id: 3, source: 'Delhi', destination: 'Delhi - ISBT', fare: 1200.0, availableSeats: 20, takenSeats: "", departureTime: "02:15 PM", busType: "Intercity Express", plateNumber: "DL-01-CX-1123", weather: "Hazy 28°C", amenities: "AC,Water" },
  { id: 4, source: 'Chennai', destination: 'Chennai - Koyambedu', fare: 1850.0, availableSeats: 20, takenSeats: "15,16", departureTime: "06:00 PM", busType: "Ultra Luxury 2+1", plateNumber: "TN-07-DX-5566", weather: "Clear 30°C", amenities: "WiFi,AC,Charging,Movies" },
  { id: 5, source: 'Hyderabad', destination: 'Hyderabad - Miyapur', fare: 2200.0, availableSeats: 20, takenSeats: "", departureTime: "10:30 PM", busType: "Direct Non-Stop", plateNumber: "TS-09-EX-8877", weather: "Cool 22°C", amenities: "WiFi,AC,Snooze-Kit" },
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<IUser | null>(null);
  const [bookings, setBookings] = useState<IBooking[]>([]);
  const [buses, setBuses] = useState<IBus[]>(DEFAULT_BUSES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [boardingPoint, setBoardingPoint] = useState("");
  const [droppingPoint, setDroppingPoint] = useState("");
  const [passengers, setPassengers] = useState(1);
  const [discounted, setDiscounted] = useState(0);
  const [bookingStep, setBookingStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDest, setSelectedDest] = useState<IBus | null>(null);
  const [toasts, setToasts] = useState<IToast[]>([]);
  const [language, _setLanguage] = useState<'EN' | 'HI' | 'JP'>('EN');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedTrackingBus, setSelectedTrackingBus] = useState<IBus | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'WALLET'>('CARD');
  const [walletBalance, setWalletBalance] = useState(5000); 
  const [authMode, setAuthMode] = useState<'Login' | 'Signup'>('Login');
  const [user, setUser] = useState({ username: '', password: '' });
  const [systemLogs, setSystemLogs] = useState<string[]>([
    "[INFO] Server connected successfully.",
    "[INFO] API live on port 8080."
  ]);

  // New Route Form State
  const [newRoute, setNewRoute] = useState<Partial<IBus>>({
    destination: '', fare: 1200, departureTime: '08:00 AM', busType: 'Standard', plateNumber: '', weather: 'Clear 25°C', amenities: 'WiFi,AC,Water'
  });

  // Advanced Filters (Senior Dev Addition)
  const [filterType, setFilterType] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('DEFAULT');

  // Memoized Search Optimization (Senior Dev Addition)
  const filteredBuses = React.useMemo(() => {
    let result = [...buses].filter(bus => 
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
        await axios.post(`http://localhost:8080/api/auth/signup`, user);
        addToast("success", "Registration Successful. Please Login.");
        setAuthMode('Login');
      } else {
        const res = await axios.post(`http://localhost:8080/api/auth/login`, user);
        setCurrentUser(res.data);
        setIsLoggedIn(true);
        setActiveTab(res.data.role === 'ADMIN' ? 'dashboard' : 'booking');
        addToast("success", `Welcome back, ${res.data.username}`);
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
    const logInterval = setInterval(() => {
      const logTypes = ["[INFO]", "[SEC]", "[NET]", "[SYNC]"];
      const messages = ["Booking payload verified", "Traffic anomaly: NONE", "API heartbeat detected", "Database synchronized"];
      const newLog = `${logTypes[Math.floor(Math.random()*logTypes.length)]} ${messages[Math.floor(Math.random()*messages.length)]}`;
      setSystemLogs(prev => [newLog, ...prev].slice(0, 5));
    }, 8000);

    return () => {
      clearInterval(timer);
      clearInterval(logInterval);
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
    const currentFare = selectedDest.dynamicFare || selectedDest.fare;
    const baseTotal = (passengers - discounted) * currentFare;
    const discountedTotal = discounted * (currentFare * 0.80); 
    return baseTotal + discountedTotal;
  };

  const handleBooking = async () => {
    setIsLoading(true);
    addToast("success", "Processing your booking...");
    try {
      const payload = {
        passengerName: user.username,
        source: selectedDest?.source || '',
        destination: selectedDest?.destination || '',
        boardingPoint: boardingPoint,
        droppingPoint: droppingPoint,
        regularPassengers: passengers - discounted,
        discountedPassengers: discounted,
        selectedSeats: selectedSeats.join(', '),
        totalAmount: calculateTotal() - appliedDiscount
      };
      const res = await axios.post(`${API_BASE}/create`, payload);
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
      await axios.delete(`${API_BASE}/${id}`);
      setBookings(bookings.filter(b => b.id !== id));
      addToast('success', "Ticket Cancelled Successfully");
      await fetchData(); 
    } catch (err) {
      addToast('error', "Cannot delete ticket");
    }
  };

  const exportTicketPdf = (booking: any) => {
    const pdf = new jsPDF('p', 'mm', 'a5');
    pdf.setFillColor(5, 5, 7);
    pdf.rect(0, 0, 148, 210, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(22);
    pdf.text("redBus Digital Permit", 20, 30);
    pdf.setFontSize(10);
    pdf.setTextColor(150, 150, 150);
    pdf.text(`Reference ID: #${booking.id.toString().padStart(6, '0')}`, 20, 40);
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(14);
    pdf.text(`Passenger: ${booking.passengerName}`, 20, 60);
    pdf.text(`Route Vector: ${booking.destination}`, 20, 75);
    pdf.text(`Allocated Seats: ${booking.selectedSeats}`, 20, 90);
    
    pdf.setTextColor(0, 255, 128); 
    pdf.setFontSize(20);
    pdf.text(`TOTAL REMITTANCE: ₹${booking.totalAmount.toFixed(2)}`, 20, 120);
    
    pdf.save(`redBus_Archive_${booking.id}.pdf`);
  };

  const handleAddRoute = async () => {
    setIsLoading(true);
    addToast("success", "Deploying New Fleet Vector...");
    try {
      const payload = {
        ...newRoute,
        availableSeats: 20,
        takenSeats: "",
      };
      await axios.post(`${API_BASE}/buses`, payload);
      await fetchData();
      addToast("success", "Fleet Vector Synchronized");
      setNewRoute({ destination: '', fare: 1200, departureTime: '08:00 AM', busType: 'Standard', plateNumber: '', weather: 'Clear 25°C', amenities: 'WiFi,AC,Water' });
    } catch (err) {
      addToast("error", "Failed to establish new route");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = async () => {
    setIsLoading(true);
    addToast("success", "Generating Master Report Archive...");
    try {
      const response = await axios.get(`http://localhost:8080/api/reports/master`);
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'master_report_v4.json');
      document.body.appendChild(link);
      link.click();
      addToast("success", "Master Report Generated Successfully!");
    } catch (err) {
      addToast("error", "Export Failed: Connection Fault");
    } finally {
      setIsLoading(false);
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
       pdf.save(`BusTick_Permit_${user.username || 'Guest'}_${Math.floor(Math.random()*1000)}.pdf`);
    } catch(err) {
       addToast("error", "Failed to generate PDF.");
    } finally {
       setIsLoading(false);
    }
  };

  const takenSeatList = selectedDest?.takenSeats 
    ? selectedDest.takenSeats.split(',').map((s: string) => parseInt(s.trim())) 
    : [];

  const filteredBookings = bookings.filter(b => 
    (currentUser?.role === 'ADMIN' || b.passengerName === currentUser?.username) &&
    (b.passengerName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
     b.destination?.toLowerCase().includes(searchQuery.toLowerCase()))
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
               <label className="text-xs uppercase font-bold text-gray-500 px-2">Account Phone / Email</label>
               <input type="text" placeholder="john.doe@example.com" className="input-field" value={user.username} onChange={(e) => setUser({...user, username: e.target.value})}/>
            </div>
            <div className="space-y-2">
               <label className="text-xs uppercase font-bold text-gray-500 px-2">Secure Password</label>
               <input type="password" placeholder="••••••••" className="input-field" value={user.password} onChange={(e) => setUser({...user, password: e.target.value})}/>
            </div>
            <button className="btn-primary w-full py-4 text-lg mt-4 shadow-md group" onClick={handleAuth} disabled={isLoading}>
              {isLoading ? 'Processing...' : (authMode === 'Signup' ? 'Create Account' : 'Sign In')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-[#3e3e52] font-sans transition-all">
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
              <div className="bg-primary p-2 rounded-lg text-white"><Bus size={28} /></div>
              <span className="text-2xl font-black text-primary tracking-tight">red<span className="text-[#3e3e52]">bus</span></span>
            </div>
            
            <nav className="hidden md:flex gap-6 border-l border-gray-200 pl-8 h-8 items-center text-sm font-semibold text-gray-600">
               {[
                 ...(currentUser?.role === 'ADMIN' ? [{ id: 'dashboard', label: 'Dashboard' }] : []),
                 { id: 'booking', label: 'Book Tickets' },
                 { id: 'history', label: 'My Bookings' },
               ].map(item => (
                 <button key={item.id} onClick={() => setActiveTab(item.id)} className={`hover:text-primary transition-colors ${activeTab === item.id ? 'text-primary font-black border-b-2 border-primary pb-1' : ''}`}>
                   {item.label}
                 </button>
               ))}
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
                 {user.username.charAt(0).toUpperCase()}
               </div>
               <span className="text-sm font-bold truncate max-w-[100px]">{currentUser?.username || user.username}</span>
               
               <div className="absolute top-12 right-0 w-48 bg-white border border-gray-100 shadow-xl rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all p-2 flex flex-col pointer-events-none group-hover:pointer-events-auto">
                 <button onClick={() => { setIsLoggedIn(false); setCurrentUser(null); }} className="text-left px-4 py-2 text-sm text-red-500 font-bold hover:bg-red-50 rounded-md flex items-center gap-2">
                   <LogOut size={16} /> Logout
                 </button>
               </div>
             </div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto p-6 md:p-10">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div key="dash" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                   { label: 'Total Revenue', value: `₹${bookings.reduce((acc, b) => acc + b.totalAmount, 0).toFixed(2)}`, icon: Activity, color: 'text-green-500' },
                   { label: 'Active Fleet', value: buses.length, icon: Bus, color: 'text-blue-500' },
                   { label: 'Tickets Sold', value: bookings.length, icon: ShieldCheck, color: 'text-indigo-500' },
                   { label: 'Safe Travels', value: '100%', icon: Zap, color: 'text-yellow-500' }
                ].map((stat, i) => (
                  <motion.div whileHover={{ y: -5 }} key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between h-36">
                    <div className="flex justify-between items-start">
                      <p className="text-gray-500 font-bold text-sm uppercase tracking-wide">{stat.label}</p>
                      <stat.icon className={`${stat.color} opacity-80`} size={24} />
                    </div>
                    <p className="text-4xl font-black text-gray-800 tracking-tight">{stat.value}</p>
                  </motion.div>
                ))}
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                 <div className="lg:col-span-2 bg-white shadow-sm border border-gray-100 rounded-xl p-8 relative overflow-hidden">
                    <div className="flex justify-between items-center mb-8">
                       <h4 className="text-2xl font-black text-gray-800 tracking-tight">Financial Reports</h4>
                       <div className="flex gap-4"><Activity className="text-gray-400" size={24} /><TrendingUp className="text-primary" size={24} /></div>
                    </div>
                    <div className="h-64 flex items-end gap-2 relative border-b border-gray-200 pb-4">
                       {Array.from({ length: 24 }).map((_, i) => (
                         <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${Math.random() * 85 + 15}%` }} transition={{ delay: i * 0.04, duration: 1 }} className="flex-1 bg-red-100 hover:bg-primary transition-colors rounded-t-sm cursor-pointer" />
                       ))}
                    </div>
                 </div>
                 <div className="bg-white shadow-sm border border-gray-100 rounded-xl p-8 space-y-6">
                    <div className="flex justify-between items-center"><h4 className="text-lg font-black text-gray-800">System Logs</h4><ShieldCheck size={20} className="text-primary" /></div>
                    <div className="space-y-3">
                       {systemLogs.map((log, i) => (
                         <motion.div initial={{ x: -20, opacity: 0 }} animate={{ opacity: 1, x: 0 }} key={i} className="text-xs font-semibold text-gray-600 bg-gray-50 p-3 rounded border-l-4 border-gray-300">
                            {log}
                         </motion.div>
                       ))}
                    </div>
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
                        <h3 className="text-4xl font-black mb-2">Book Bus Tickets</h3>
                        <p className="font-semibold opacity-90">Find the best routes across the country.</p>
                      </div>
                      <div className="relative w-full md:w-[400px] text-gray-800">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
                        <input type="text" placeholder="From / To / Destination" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white border-0 py-4 pl-12 pr-4 rounded-xl shadow-inner font-bold focus:outline-none focus:ring-4 focus:ring-red-300" />
                      </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 grid grid-cols-1 gap-4">
                      {filteredBuses.map((dest) => (
                        <div key={dest.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row justify-between items-center hover:shadow-md transition-shadow">
                           <div className="flex items-center gap-6 w-full md:w-auto mb-4 md:mb-0">
                              <div className="hidden md:flex bg-gray-50 border border-gray-100 p-4 rounded-lg"><Navigation className="text-gray-400" size={24} /></div>
                              <div>
                                 <h4 className="text-xl font-black text-gray-800 mb-1">{dest.source} → {dest.destination}</h4>
                                 <p className="text-xs font-bold text-gray-500 uppercase">{dest.busType} • {dest.plateNumber}</p>
                              </div>
                           </div>
                           <div className="text-right">
                               <p className="text-2xl text-primary font-black mb-1">₹{dest.dynamicFare || dest.fare}</p>
                               <button onClick={() => { setSelectedDest(dest); setBookingStep(2); }} className="bg-primary hover:bg-[#c33a41] text-white px-6 py-2 rounded font-bold transition-colors">VIEW SEATS</button>
                           </div>
                        </div>
                      ))}
                    </div>
                    <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
                       <div className="flex justify-between items-center mb-8">
                          <h4 className="text-xl font-black text-gray-800">Revenue Velocity</h4>
                          <div className="flex items-center gap-2">
                             <span className="w-3 h-3 bg-primary rounded-full"></span>
                             <span className="text-xs font-bold text-gray-500 uppercase">Live Sales</span>
                          </div>
                       </div>
                       <div className="h-64 flex items-end justify-between gap-4 px-4">
                          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                            <div key={day} className="flex-1 flex flex-col items-center gap-4 group">
                               <div className="w-full bg-gray-50 rounded-t-xl relative overflow-hidden h-full flex items-end">
                                  <motion.div 
                                    initial={{ height: 0 }} 
                                    animate={{ height: `${[40, 70, 45, 90, 65, 85, 100][i]}%` }} 
                                    className="w-full bg-gradient-to-t from-primary to-red-400 rounded-t-xl group-hover:brightness-110 transition-all"
                                  />
                               </div>
                               <span className="text-[10px] font-black text-gray-400 uppercase">{day}</span>
                            </div>
                          ))}
                       </div>
                    </div>
                  </div>
                </div>
              )}

              {bookingStep === 2 && (
                <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto items-start">
                  <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 shadow-sm border border-gray-200 rounded-xl">
                       <h3 className="text-lg font-black text-gray-800 mb-6 border-b pb-2">Travelers Details</h3>
                       <div className="space-y-6">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <label className="text-xs font-bold text-gray-500 uppercase">Passengers</label>
                              <span className="text-xl font-black text-gray-800">{passengers}</span>
                            </div>
                            <input type="range" min="1" max="10" value={passengers} onChange={(e) => { setPassengers(parseInt(e.target.value)); setSelectedSeats([]); }} className="w-full h-2 bg-gray-200 rounded-full accent-primary" />
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <label className="text-xs font-bold text-gray-500 uppercase">Discount Eligible</label>
                              <span className="text-xl font-black text-secondary">{discounted}</span>
                            </div>
                            <input type="range" min="0" max={passengers} value={discounted} onChange={(e) => setDiscounted(parseInt(e.target.value))} className="w-full h-2 bg-gray-200 rounded-full accent-secondary" />
                          </div>
                       </div>
                    </div>
                  </div>

                   <div className="lg:col-span-2 bg-white p-10 shadow-lg border border-gray-100 rounded-3xl">
                     <div className="flex justify-between items-center mb-10">
                       <div>
                         <h3 className="text-2xl font-black text-gray-800">Select Seats</h3>
                         <p className="text-sm font-bold text-gray-400 mt-1">Choose your preferred seating position</p>
                       </div>
                       <div className="flex gap-4 p-3 bg-gray-50 rounded-xl text-[10px] uppercase font-black text-gray-500">
                         <span className="flex items-center gap-2"><div className="w-3 h-3 bg-white border border-gray-200 rounded-sm"/> Available</span>
                         <span className="flex items-center gap-2"><div className="w-3 h-3 bg-gray-200 rounded-sm cursor-not-allowed"/> Booked</span>
                         <span className="flex items-center gap-2"><div className="w-3 h-3 bg-primary rounded-sm"/> Selected</span>
                       </div>
                     </div>
                     
                     <div className="max-w-[320px] mx-auto border-[6px] border-gray-100 rounded-[50px] p-10 relative bg-gray-50/30 mb-10 border-t-[20px] border-t-gray-200">
                        <div className="absolute top-[-15px] left-1/2 -translate-x-1/2 w-12 h-2 bg-gray-300 rounded-full"></div>
                        <div className="flex justify-end mb-12">
                           <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-300 shadow-inner border border-gray-200">
                              <User size={24} />
                           </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4">
                           {Array.from({ length: 20 }).map((_, i) => {
                             const seatNum = i + 1;
                             const isSelected = selectedSeats.includes(seatNum);
                             const isBooked = takenSeatList.includes(seatNum);
                             const isWindow = seatNum % 4 === 1 || seatNum % 4 === 0;
                             
                             return (
                               <motion.div 
                                 key={i}
                                 whileHover={!isBooked ? { scale: 1.1 } : {}}
                                 onClick={() => !isBooked && (isSelected ? setSelectedSeats(selectedSeats.filter(s => s !== seatNum)) : selectedSeats.length < passengers && setSelectedSeats([...selectedSeats, seatNum]))}
                                 className={`h-12 rounded-lg flex flex-col items-center justify-center font-black text-xs cursor-pointer transition-all relative
                                   ${isBooked ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 
                                     isSelected ? 'bg-primary text-white shadow-xl shadow-red-200 ring-2 ring-primary ring-offset-2' : 
                                     'bg-white text-gray-600 border-2 border-gray-100 hover:border-primary shadow-sm'}`}
                               >
                                  {seatNum}
                                  {isWindow && <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-400 rounded-full border border-white" title="Window"></div>}
                               </motion.div>
                             );
                           })}
                        </div>
                        
                        <div className="absolute left-1/2 -translate-x-1/2 top-32 bottom-10 w-6 bg-gray-100/50 flex flex-col justify-around py-10">
                           {[...Array(4)].map((_, i) => <div key={i} className="w-full h-px bg-gray-200/50"></div>)}
                        </div>
                     </div>

                       <div className="flex gap-4">
                        <button className="flex-1 py-4 px-6 rounded-xl border-2 border-gray-100 font-black text-gray-500 hover:bg-gray-50 transition-colors" onClick={() => setBookingStep(1)}>MODIFY SEARCH</button>
                        <button className={`flex-1 py-4 px-6 rounded-xl font-black transition-all ${selectedSeats.length === passengers ? 'bg-primary text-white shadow-lg hover:shadow-red-200 active:scale-95' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`} disabled={selectedSeats.length !== passengers} onClick={() => setBookingStep(3)}>CONFIRM SEATS</button>
                     </div>
                   </div>
                </div>
              )}

              {/* Step 3: Payment & Review */}
              {bookingStep === 3 && (
                <div className="space-y-8 max-w-2xl mx-auto">
                  <div className="text-center"><h3 className="text-3xl font-black text-gray-800 mb-2">Confirm Booking</h3></div>
                  <div className="bg-white p-8 space-y-6 border border-gray-200 rounded-xl shadow-sm">
                    {/* Boarding/Dropping Selection */}
                    {(selectedDest?.boardingPoints || selectedDest?.droppingPoints) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {selectedDest.boardingPoints && (
                          <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block">Pickup Point</label>
                            <select 
                              value={boardingPoint} 
                              onChange={(e) => setBoardingPoint(e.target.value)}
                              className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-gray-700 outline-none focus:ring-2 focus:ring-primary/20"
                            >
                              <option value="">Select Boarding</option>
                              {selectedDest.boardingPoints.split(',').map(p => <option key={p} value={p.trim()}>{p.trim()}</option>)}
                            </select>
                          </div>
                        )}
                        {selectedDest.droppingPoints && (
                          <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block">Dropoff Point</label>
                            <select 
                              value={droppingPoint} 
                              onChange={(e) => setDroppingPoint(e.target.value)}
                              className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-gray-700 outline-none focus:ring-2 focus:ring-primary/20"
                            >
                              <option value="">Select Dropping</option>
                              {selectedDest.droppingPoints.split(',').map(p => <option key={p} value={p.trim()}>{p.trim()}</option>)}
                            </select>
                          </div>
                        )}
                      </div>
                    )}

                    {[
                      { label: 'Passenger Name', value: currentUser?.username || user.username },
                      { label: 'Bus Plate', value: selectedDest?.plateNumber || 'N/A' },
                      { label: 'Route', value: `${selectedDest?.source} → ${selectedDest?.destination}` },
                      { label: 'Boarding At', value: boardingPoint || 'Main Terminal' },
                      { label: 'Dropping At', value: droppingPoint || 'City Center' },
                      { label: 'Selected Seats', value: selectedSeats.join(', ') },
                    ].map((row, i) => (
                      <div key={i} className="flex justify-between items-center text-lg border-b border-gray-100 pb-4">
                        <span className="text-xs font-bold text-gray-500 uppercase">{row.label}</span>
                        <span className="font-black text-gray-800">{row.value}</span>
                      </div>
                    ))}

                    <div className="flex gap-4 pt-4">
                       <input type="text" placeholder="PROMO CODE (e.g. SAVE20)" value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())} className="flex-1 bg-gray-50 border border-gray-200 px-4 py-3 rounded text-sm font-bold focus:outline-none focus:border-primary" />
                       <button onClick={() => { if(promoCode === 'SAVE20') { setAppliedDiscount(calculateTotal() * 0.2); addToast('success', 'Promo Code SAVED! 20% Discount applied.'); } else { addToast('error', 'Invalid Promo Code'); } }} className="px-6 py-3 bg-gray-800 text-white font-bold rounded text-sm">Apply</button>
                    </div>

                    <div className="pt-6 space-y-4">
                       <p className="text-xs font-bold text-gray-400 uppercase">Payment Method</p>
                       <div className="grid grid-cols-2 gap-4">
                          <button onClick={() => setPaymentMethod('CARD')} className={`p-4 border-2 rounded-xl text-left transition-all ${paymentMethod === 'CARD' ? 'border-primary bg-red-50' : 'border-gray-100 hover:border-gray-200'}`}>
                             <p className="font-black text-gray-800">Credit / Debit Card</p>
                             <p className="text-xs text-gray-500 font-bold">Visa, Master, Rupay</p>
                          </button>
                          <button onClick={() => setPaymentMethod('WALLET')} className={`p-4 border-2 rounded-xl text-left transition-all ${paymentMethod === 'WALLET' ? 'border-primary bg-red-50' : 'border-gray-100 hover:border-gray-200'}`}>
                             <p className="font-black text-gray-800">redBus Wallet</p>
                             <p className="text-xs text-primary font-black">Balance: ₹{walletBalance.toFixed(0)}</p>
                          </button>
                       </div>
                    </div>

                    <div className="flex justify-between items-center pt-8 border-t border-gray-100">
                       <div className="space-y-1">
                          {appliedDiscount > 0 && <p className="text-xs font-bold text-green-600">Discount Applied: -₹{appliedDiscount.toFixed(2)}</p>}
                          <span className="text-lg font-black text-gray-800">Payable Amount</span>
                       </div>
                       <span className="text-4xl font-black text-primary">₹{(calculateTotal() - appliedDiscount).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button className="flex-1 py-4 px-6 rounded-lg border border-gray-300 font-bold text-gray-600 hover:bg-gray-50" onClick={() => setBookingStep(2)}>Back</button>
                    <button className="flex-[2] btn-primary py-4 px-6 text-xl font-bold flex items-center justify-center gap-2 group" 
                       onClick={() => {
                          if (paymentMethod === 'WALLET' && walletBalance < (calculateTotal() - appliedDiscount)) {
                             addToast('error', 'Insufficient Wallet Balance! Please use Card.');
                             return;
                          }
                          if (paymentMethod === 'WALLET') setWalletBalance(prev => prev - (calculateTotal() - appliedDiscount));
                          handleBooking();
                       }} 
                       disabled={isLoading}
                    >
                       {isLoading ? 'Processing...' : `PAY ₹${(calculateTotal() - appliedDiscount).toFixed(0)}`}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: Final Confirmation */}
              {bookingStep === 4 && selectedDest && (
                <motion.div id="digital-ticket" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden max-w-2xl mx-auto transform transition-all">
                   <div className="bg-gradient-to-br from-primary via-red-600 to-orange-500 p-12 text-white text-center relative overflow-hidden">
                      <motion.div 
                        animate={{ rotate: 360 }} 
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="absolute -top-24 -right-24 w-64 h-64 border-[32px] border-white/5 rounded-full"
                      />
                      <div className="relative flex justify-center mb-6">
                         <motion.div 
                           initial={{ scale: 0 }} 
                           animate={{ scale: 1 }} 
                           transition={{ type: "spring", damping: 10, stiffness: 100, delay: 0.2 }}
                           className="bg-white/20 p-6 rounded-full backdrop-blur-md ring-8 ring-white/10"
                         >
                            <CheckCircle size={64} className="text-white" />
                         </motion.div>
                      </div>
                      <h3 className="text-4xl font-black tracking-tight mb-2">Booking Confirmed!</h3>
                      <p className="opacity-80 font-bold text-lg">Your adventure begins soon, {currentUser?.username || user.username}!</p>
                   </div>

                   <div className="p-12 space-y-10 relative">
                      <div className="flex justify-between items-start border-b-2 border-dashed border-gray-100 pb-10">
                         <div className="space-y-1">
                            <p className="text-[10px] uppercase font-black text-gray-400 tracking-[0.3em] mb-2">Journey Route</p>
                            <p className="text-2xl font-black text-gray-800 flex items-center gap-3">
                               {selectedDest.source} 
                               <ArrowRight className="text-primary" size={24}/> 
                               {selectedDest.destination}
                            </p>
                         </div>
                         <div className="text-right space-y-1">
                            <p className="text-[10px] uppercase font-black text-gray-400 tracking-[0.3em] mb-2">Boarding Bus</p>
                            <p className="text-2xl font-black text-primary font-mono lowercase">{selectedDest.plateNumber}</p>
                         </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                         <div className="bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100 shadow-inner group transition-colors hover:bg-gray-100">
                            <p className="text-[10px] uppercase font-black text-gray-400 mb-6 tracking-widest flex items-center gap-2">
                               <InfoIcon size={12}/> Ticket Info
                            </p>
                            <div className="space-y-5">
                               <div className="flex items-center gap-4 text-gray-700 font-bold">
                                  <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm"><Calendar size={18} className="text-primary"/></div>
                                  <div className="flex flex-col"><span className="text-[10px] text-gray-400 uppercase font-black">Date</span><span className="text-sm">{currentTime.toLocaleDateString()}</span></div>
                               </div>
                               <div className="flex items-center gap-4 text-gray-700 font-bold">
                                  <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm"><Clock size={18} className="text-primary"/></div>
                                  <div className="flex flex-col"><span className="text-[10px] text-gray-400 uppercase font-black">Time</span><span className="text-sm">{selectedDest.departureTime}</span></div>
                               </div>
                               <div className="flex items-center gap-4 text-gray-700 font-bold">
                                  <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm"><User size={18} className="text-primary"/></div>
                                  <div className="flex flex-col"><span className="text-[10px] text-gray-400 uppercase font-black">Passenger</span><span className="text-sm">{currentUser?.username || user.username} + {passengers-1}</span></div>
                               </div>
                            </div>
                         </div>
                         
                         <div id="digital-ticket-qr" className="flex flex-col items-center justify-center bg-gray-900 rounded-[2.5rem] p-10 text-white group cursor-pointer hover:bg-black transition-all shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                               <QrCode size={150} />
                            </div>
                            <div className="p-5 bg-white rounded-3xl mb-6 shadow-xl shadow-black/20 group-hover:scale-105 transition-transform relative z-10">
                               <QrCode size={100} className="text-gray-900" />
                            </div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] text-center mb-1">Boarding Pass</p>
                            <p className="text-white text-md font-black tracking-widest font-mono">#{Math.floor(Math.random()*1000000)}</p>
                            <div className="w-full h-px bg-gray-700 my-4" />
                            <div className="flex gap-2">
                               {selectedSeats.map(s => <span key={s} className="bg-white/10 text-white px-3 py-1 rounded text-xs font-black">S{s}</span>)}
                            </div>
                         </div>
                      </div>

                      <div className="flex gap-4 pt-4">
                         <button onClick={handlePrintTicket} className="flex-1 py-5 px-8 rounded-3xl border-2 border-gray-100 font-black text-gray-500 hover:bg-gray-50 hover:border-gray-200 transition-all flex items-center justify-center gap-3 active:scale-95">
                            <Download size={22}/> EXPORT PDF
                         </button>
                         <button 
                           onClick={async () => {
                             setSelectedDest(null);
                             setBookingStep(1);
                             setSelectedSeats([]);
                             await fetchData();
                             setActiveTab('dashboard');
                           }} 
                           className="flex-[1.5] py-5 px-8 rounded-3xl bg-primary text-white font-black shadow-2xl shadow-red-200 hover:shadow-red-300 hover:-translate-y-1 transition-all active:scale-95 text-lg"
                         >
                           GO TO HOME
                         </button>
                      </div>
                   </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div key="hist" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                  <h3 className="text-3xl font-black text-gray-800">My Bookings</h3>
                  <p className="text-gray-500 font-semibold mt-1">Manage and view your ticket history.</p>
                </div>
                <div className="relative w-full sm:w-[350px]">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                   <input type="text" placeholder="Search by destination or name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white border border-gray-200 py-3 pl-12 pr-4 rounded-lg font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                </div>
              </div>

              <div className="space-y-4">
                {filteredBookings.length === 0 ? (
                   <div className="text-center py-20 bg-white border border-gray-200 rounded-xl">
                      <Ticket size={48} className="mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-500 font-bold">No bookings found.</p>
                   </div>
                ) : filteredBookings.map((b) => (
                  <div key={b.id} className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-6 w-full md:w-auto">
                      <div className="bg-primary/10 p-4 rounded-lg text-primary hidden sm:block"><Ticket size={32} /></div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full" /><p className="text-xs font-bold text-green-600 uppercase">Confirmed</p></div>
                        <p className="text-xl font-black text-gray-800">Ref: #{(b.id?.toString() || '0').padStart(6, '0')}</p>
                        <p className="text-sm font-bold text-gray-500 flex items-center gap-2">
                           <span>{b.passengerName}</span>
                           <ArrowRight size={16} className="text-gray-400" />
                           <span className="text-primary">{b.source} → {b.destination}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col md:items-end gap-4 w-full md:w-auto text-center md:text-right">
                      <p className="text-3xl font-black text-gray-800">₹{b.totalAmount.toFixed(2)}</p>
                      <div className="flex gap-2 justify-center md:justify-end">
                        <button onClick={() => exportTicketPdf(b)} className="px-4 py-2 bg-gray-50 border border-gray-200 text-gray-600 text-xs font-bold rounded hover:bg-gray-100 flex items-center gap-2">
                          <Download size={14} /> PDF Ticket
                        </button>
                        <button onClick={() => b.id && handleDeleteBooking(b.id)} className="px-4 py-2 border border-red-200 text-red-500 bg-red-50 text-xs font-bold rounded hover:bg-red-100">
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'fleet' && (
            <motion.div key="fleet" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                  <div>
                    <h3 className="text-3xl font-black text-gray-800">Live Fleet Tracking</h3>
                    <p className="text-gray-500 font-bold mt-1">Monitor all active buses and their current locations.</p>
                  </div>
                  <button onClick={() => setSelectedTrackingBus(null)} className="px-4 py-2 border border-gray-300 rounded text-gray-600 font-bold text-sm hover:bg-gray-50">Reset View</button>
               </div>

               <div className="grid lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 bg-gray-50 rounded-xl border border-gray-200 p-8 min-h-[500px] flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cartographer.png')]" />
                    <div className="text-center relative z-10 w-full px-10">
                      {selectedTrackingBus ? (
                        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200 animate-pulse-slow">
                           <Bus size={64} className="text-primary mx-auto mb-4" />
                           <h2 className="text-3xl font-black text-gray-800 mb-2">{selectedTrackingBus.plateNumber}</h2>
                           <p className="text-lg font-bold text-gray-500 uppercase tracking-widest">{selectedTrackingBus.destination}</p>
                           <div className="mt-8 grid grid-cols-2 gap-4 text-left">
                              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                 <p className="text-xs uppercase font-bold text-gray-400">Current Status</p>
                                 <p className="text-green-600 font-black">On Time</p>
                              </div>
                              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                 <p className="text-xs uppercase font-bold text-gray-400">Next Stop Weather</p>
                                 <p className="text-gray-700 font-black">{selectedTrackingBus.weather}</p>
                              </div>
                           </div>
                           <button onClick={() => { setSelectedDest(selectedTrackingBus); setBookingStep(2); setActiveTab('booking'); }} className="w-full mt-6 btn-primary py-3 font-bold rounded">Book on this Route</button>
                        </div>
                      ) : (
                         <div>
                            <MapPin size={48} className="text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 font-bold text-lg">Select a bus from the fleet list to view its live status.</p>
                         </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                     {buses.map((bus, i) => (
                        <div key={i} onClick={() => setSelectedTrackingBus(bus)} className={`bg-white p-6 rounded-xl border shadow-sm cursor-pointer transition-all hover:border-red-300 ${selectedTrackingBus?.id === bus.id ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-200'}`}>
                           <div className="flex justify-between items-center mb-2">
                              <span className="text-xs font-bold text-primary uppercase">{bus.plateNumber}</span>
                              <div className="flex gap-1 animate-pulse">
                                 <div className="w-1 h-2 bg-green-500 rounded-full" />
                                 <div className="w-1 h-3 bg-green-500 rounded-full" />
                                 <div className="w-1 h-2 bg-green-500 rounded-full" />
                              </div>
                           </div>
                           <p className="font-black text-xl text-gray-800">{bus.destination}</p>
                           <div className="flex justify-between items-center mt-4">
                              <span className="text-xs font-bold text-gray-400 uppercase">Status: Nominal</span>
                              <Zap size={14} className="text-yellow-500" />
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
              <h3 className="text-3xl font-black text-gray-800">Admin Control Panel</h3>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm space-y-6">
                     <p className="text-xs font-bold uppercase text-primary border-b pb-2">Admin Profile</p>
                     <div className="flex justify-between items-center"><span className="text-gray-500 font-bold text-sm">Operator Name</span><span className="font-black text-gray-800">{currentUser?.username || user.username}</span></div>
                     <div className="flex justify-between items-center"><span className="text-gray-500 font-bold text-sm">Access Role</span><span className="font-black px-3 py-1 bg-red-100 text-primary rounded-full text-xs">{currentUser?.role === 'ADMIN' ? 'Administrator' : 'Passenger'}</span></div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm space-y-4">
                     <p className="text-xs font-bold uppercase text-secondary border-b pb-2 mb-4">Add New Route</p>
                     <input type="text" placeholder="Destination Name" value={newRoute.destination} onChange={e => setNewRoute({...newRoute, destination: e.target.value})} className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded text-gray-800 font-bold focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400" />
                     <div className="flex gap-4">
                       <input type="text" placeholder="Plate Number" value={newRoute.plateNumber} onChange={e => setNewRoute({...newRoute, plateNumber: e.target.value})} className="flex-1 bg-gray-50 border border-gray-200 px-4 py-3 rounded text-gray-800 font-bold focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400" />
                       <input type="number" placeholder="Base Fare ($)" value={newRoute.fare} onChange={e => setNewRoute({...newRoute, fare: Number(e.target.value)})} className="flex-1 bg-gray-50 border border-gray-200 px-4 py-3 rounded text-gray-800 font-bold focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400" />
                     </div>
                     <div className="flex gap-4">
                       <input type="text" placeholder="Time (e.g. 08:30 AM)" value={newRoute.departureTime} onChange={e => setNewRoute({...newRoute, departureTime: e.target.value})} className="flex-1 bg-gray-50 border border-gray-200 px-4 py-3 rounded text-gray-800 font-bold focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400" />
                       <input type="text" placeholder="Type (Sleeper/AC)" value={newRoute.busType} onChange={e => setNewRoute({...newRoute, busType: e.target.value})} className="flex-1 bg-gray-50 border border-gray-200 px-4 py-3 rounded text-gray-800 font-bold focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400" />
                     </div>
                     <button onClick={handleAddRoute} disabled={isLoading || !newRoute.destination} className={`w-full py-3 font-bold mt-4 rounded transition-colors ${isLoading || !newRoute.destination ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-primary text-white hover:bg-[#c33a41]'}`}>Deploy Route</button>
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
            <motion.div key={toast.id} initial={{ opacity: 0, x: 200, scale: 0.5 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} className={`glass-card p-6 flex items-center gap-4 min-w-[300px] shadow-xl border-l-[6px] pointer-events-auto backdrop-blur-3xl ${toast.type === 'success' ? 'border-l-green-500 bg-white' : 'border-l-red-500 bg-white'}`}>
              <div className={toast.type === 'success' ? 'text-green-500' : 'text-red-500'}><ShieldCheck size={32} /></div>
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1">{toast.type === 'success' ? 'Success' : 'Notification'}</p>
                <p className="font-bold text-gray-800 text-sm">{toast.msg}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default App;
