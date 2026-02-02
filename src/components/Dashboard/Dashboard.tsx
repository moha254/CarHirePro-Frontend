import React from 'react';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import DashboardStats, { StatItem } from './DashboardStats';
import RecentActivity from './RecentActivity';
import QuickActions from './QuickActions';

type VehicleStatus = 'Available' | 'Booked' | 'Maintenance';

interface Vehicle {
  _id: string;
  make: string;
  model: string;
  licensePlate: string;
  status?: VehicleStatus;
  createdAt?: string;
  dailyRate?: number;
}

interface Client {
  _id: string;
  fullName: string;
  createdAt?: string;
}

interface Booking {
  _id: string;
  status: 'Active' | 'Completed' | 'Cancelled';
  startDate: string;
  endDate: string;
  createdAt?: string;
  client?: {
    _id: string;
    fullName: string;
  };
  vehicle?: {
    _id: string;
    make: string;
    model: string;
    licensePlate: string;
    dailyRate?: number;
  };
}

export default function Dashboard() {
  const { user } = useAuth();

  const [clients, setClients] = React.useState<Client[]>([]);
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
  const [bookings, setBookings] = React.useState<Booking[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    let cancelled = false;

    const fetchDashboardData = async () => {
      setLoading(true);
      setError('');
      try {
        const [clientsRes, vehiclesRes, bookingsRes] = await Promise.all([
          api.get('/clients'),
          api.get('/vehicles'),
          api.get('/bookings'),
        ]);

        if (cancelled) return;

        setClients(clientsRes.data?.data || []);
        setVehicles(vehiclesRes.data?.data || []);
        setBookings(bookingsRes.data?.data || []);
      } catch (err: any) {
        if (cancelled) return;
        setError(err?.response?.data?.message || 'Failed to load dashboard data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchDashboardData();
    return () => {
      cancelled = true;
    };
  }, []);

  const daysBetween = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const ms = e.getTime() - s.getTime();
    if (!Number.isFinite(ms) || ms <= 0) return 0;
    return Math.ceil(ms / (1000 * 60 * 60 * 24));
  };

  const isCurrentMonth = (dateStr?: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return false;
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  };

  const totalClients = clients.length;
  const totalVehicles = vehicles.length;
  const availableVehicles = vehicles.filter(v => (v.status || 'Available') === 'Available').length;
  const bookedVehicles = vehicles.filter(v => v.status === 'Booked').length;
  const maintenanceVehicles = vehicles.filter(v => v.status === 'Maintenance').length;
  const activeBookings = bookings.filter(b => b.status === 'Active').length;

  const monthlyRevenueEstimate = bookings
    .filter(b => isCurrentMonth(b.createdAt || b.startDate))
    .filter(b => b.status !== 'Cancelled')
    .reduce((sum, b) => {
      const rate = b.vehicle?.dailyRate || 0;
      const days = daysBetween(b.startDate, b.endDate);
      return sum + rate * days;
    }, 0);

  const stats: StatItem[] = [
    {
      title: 'Total Clients',
      value: totalClients.toString(),
      subtitle: 'Registered clients',
      trend: '',
      color: 'blue'
    },
    {
      title: 'Fleet Status',
      value: totalVehicles.toString(),
      subtitle: `${availableVehicles} available, ${bookedVehicles} booked, ${maintenanceVehicles} maintenance`,
      trend: '',
      color: 'green'
    },
    {
      title: 'Active Bookings',
      value: activeBookings.toString(),
      subtitle: 'Current rentals',
      trend: '',
      color: 'purple'
    },
    {
      title: 'Monthly Revenue',
      value: `KSH ${monthlyRevenueEstimate.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: 'Estimated from bookings',
      trend: '',
      color: 'amber'
    }
  ];

  return (
    <div className="p-6 space-y-8">
      {/* Professional Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            Welcome back, {user?.name || user?.email}
          </h1>
          <p className="text-gray-600 mt-3 text-lg">Here's what's happening with your car hire business today.</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-4">
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Today</p>
            <p className="text-lg font-bold text-gray-900 mt-1">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-8">
        <DashboardStats stats={stats} loading={loading} />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <QuickActions className="bg-white rounded-xl shadow-sm border border-gray-200 p-6" />
          </div>
          <div>
            <RecentActivity bookings={bookings} clients={clients} vehicles={vehicles} loading={loading} />
          </div>
        </div>
      </div>
    </div>
  );
}