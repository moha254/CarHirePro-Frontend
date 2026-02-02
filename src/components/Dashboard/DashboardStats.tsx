import { TrendingUp, TrendingDown, Users, Car, Calendar, TrendingUp as RevenueIcon } from 'lucide-react';

export interface StatItem {
  title: string;
  value: string;
  subtitle: string;
  trend: string;
  color: 'blue' | 'green' | 'purple' | 'amber';
}

interface DashboardStatsProps {
  stats: StatItem[];
  loading?: boolean;
}

export default function DashboardStats({ stats, loading = false }: DashboardStatsProps) {
  const getGradientClasses = (color: StatItem['color']) => {
    switch (color) {
      case 'blue':
        return 'from-blue-50 to-blue-100 border-blue-200';
      case 'green':
        return 'from-green-50 to-green-100 border-green-200';
      case 'purple':
        return 'from-purple-50 to-purple-100 border-purple-200';
      case 'amber':
        return 'from-amber-50 to-amber-100 border-amber-200';
      default:
        return 'from-gray-50 to-gray-100 border-gray-200';
    }
  };

  const getIconBgColor = (color: StatItem['color']) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-600';
      case 'green':
        return 'bg-green-600';
      case 'purple':
        return 'bg-purple-600';
      case 'amber':
        return 'bg-amber-600';
      default:
        return 'bg-gray-600';
    }
  };

  const getStatIcon = (title: string) => {
    switch (title.toLowerCase()) {
      case 'total clients':
        return Users;
      case 'fleet status':
        return Car;
      case 'active bookings':
        return Calendar;
      case 'monthly revenue':
        return RevenueIcon;
      default:
        return TrendingUp;
    }
  };

  const getTrend = (trend: string) => {
    if (!trend) return null;
    const isNegative = trend.trim().startsWith('-');
    const Icon = isNegative ? TrendingDown : TrendingUp;
    const color = isNegative ? 'text-red-600' : 'text-green-600';
    return (
      <div className={`flex items-center text-sm ${color}`}>
        <Icon className="w-4 h-4 mr-1" />
        {trend}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => {
        const Icon = getStatIcon(stat.title);
        return (
          <div key={index} className={`bg-gradient-to-br ${getGradientClasses(stat.color)} border rounded-xl p-6 shadow-sm hover:shadow-lg transition-all`}>
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getIconBgColor(stat.color)} shadow-sm`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              {loading ? (
                <div className="h-4 w-14 bg-gray-100 rounded" />
              ) : (
                getTrend(stat.trend)
              )}
            </div>
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">
                {loading ? <span className="inline-block h-8 w-24 bg-gray-100 rounded" /> : stat.value}
              </h3>
              <p className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-1">{stat.title}</p>
              <p className="text-xs text-gray-600">
                {loading ? <span className="inline-block h-4 w-36 bg-gray-100 rounded" /> : stat.subtitle}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}