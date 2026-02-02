import { Clock, Car, User, AlertCircle } from 'lucide-react';

interface Vehicle {
  _id: string;
  make: string;
  model: string;
  licensePlate: string;
  status?: 'Available' | 'Booked' | 'Maintenance';
  createdAt?: string;
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
  };
}

interface RecentActivityProps {
  bookings: Booking[];
  clients: Client[];
  vehicles: Vehicle[];
  loading?: boolean;
}

type ActivityItem = {
  id: string;
  title: string;
  description: string;
  time: string;
  icon: any;
  color: string;
  ts: number;
};

const timeAgo = (dateStr?: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const ts = d.getTime();
  if (Number.isNaN(ts)) return '';
  const diffMs = Date.now() - ts;
  const mins = Math.floor(diffMs / (1000 * 60));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
};

export default function RecentActivity({ bookings, clients, vehicles, loading = false }: RecentActivityProps) {
  const activities: ActivityItem[] = [];

  if (!loading) {
    const newestBookings = [...bookings]
      .sort((a, b) => new Date(b.createdAt || b.startDate).getTime() - new Date(a.createdAt || a.startDate).getTime())
      .slice(0, 3);

    newestBookings.forEach((b) => {
      const clientName = b.client?.fullName || 'Client';
      const vehicleLabel = b.vehicle ? `${b.vehicle.make} ${b.vehicle.model}` : 'Vehicle';
      const ts = new Date(b.createdAt || b.startDate).getTime();

      activities.push({
        id: `booking-${b._id}`,
        title: b.status === 'Completed' ? 'Booking completed' : b.status === 'Cancelled' ? 'Booking cancelled' : 'New booking created',
        description: `${clientName} - ${vehicleLabel}`,
        time: timeAgo(b.createdAt || b.startDate),
        icon: Car,
        color:
          b.status === 'Cancelled'
            ? 'text-gray-600 bg-gray-100'
            : b.status === 'Completed'
            ? 'text-green-600 bg-green-100'
            : 'text-blue-600 bg-blue-100',
        ts: Number.isNaN(ts) ? 0 : ts,
      });
    });

    const newestClient = [...clients]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())[0];

    if (newestClient) {
      const ts = new Date(newestClient.createdAt || 0).getTime();
      activities.push({
        id: `client-${newestClient._id}`,
        title: 'New client registered',
        description: newestClient.fullName,
        time: timeAgo(newestClient.createdAt),
        icon: User,
        color: 'text-purple-600 bg-purple-100',
        ts: Number.isNaN(ts) ? 0 : ts,
      });
    }

    const maintenanceVehicle = vehicles.find(v => v.status === 'Maintenance');
    if (maintenanceVehicle) {
      const ts = new Date(maintenanceVehicle.createdAt || 0).getTime();
      activities.push({
        id: `maintenance-${maintenanceVehicle._id}`,
        title: 'Vehicle in maintenance',
        description: `${maintenanceVehicle.make} ${maintenanceVehicle.model} (${maintenanceVehicle.licensePlate})`,
        time: timeAgo(maintenanceVehicle.createdAt),
        icon: AlertCircle,
        color: 'text-amber-600 bg-amber-100',
        ts: Number.isNaN(ts) ? 0 : ts,
      });
    }
  }

  const sorted = activities.sort((a, b) => b.ts - a.ts).slice(0, 5);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg">
            <Clock className="w-5 h-5 text-white" />
          </div>
          Recent Activity
        </h2>
        <p className="text-sm text-gray-600 mt-2">Latest updates from your business</p>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-3">
              <div className="h-14 bg-gray-50 rounded-xl" />
              <div className="h-14 bg-gray-50 rounded-xl" />
              <div className="h-14 bg-gray-50 rounded-xl" />
            </div>
          ) : sorted.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-600">No recent activity.</p>
            </div>
          ) : (
            sorted.map((activity) => {
              const Icon = activity.icon;
              return (
                <div key={activity.id} className="flex items-start space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activity.color} shadow-sm`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900">{activity.title}</p>
                    <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                    <div className="flex items-center mt-2">
                      <Clock className="w-3 h-3 text-gray-400 mr-1" />
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}