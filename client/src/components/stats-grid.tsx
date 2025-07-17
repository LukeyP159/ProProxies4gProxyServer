import { Card, CardContent } from "@/components/ui/card";
import { Smartphone, Download, RotateCcw, Shield, TrendingUp, TrendingDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { DashboardStats } from "@/types";

const StatsGrid = () => {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/stats'],
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statsData = [
    {
      title: "Active Modems",
      value: stats?.activeModems || 0,
      icon: Smartphone,
      iconColor: "text-success",
      iconBg: "bg-success bg-opacity-10",
      trend: "+1 from yesterday",
      trendIcon: TrendingUp,
      trendColor: "text-success"
    },
    {
      title: "Total Bandwidth",
      value: `${stats?.totalBandwidth || 0} MB/s`,
      icon: Download,
      iconColor: "text-primary",
      iconBg: "bg-primary bg-opacity-10",
      trend: "12% increase",
      trendIcon: TrendingUp,
      trendColor: "text-success"
    },
    {
      title: "IP Rotations",
      value: stats?.totalRotations || 0,
      icon: RotateCcw,
      iconColor: "text-warning",
      iconBg: "bg-warning bg-opacity-10",
      trend: "-5% from last hour",
      trendIcon: TrendingDown,
      trendColor: "text-error"
    },
    {
      title: "OpenVPN Connections",
      value: stats?.activeVpnConnections || 0,
      icon: Shield,
      iconColor: "text-purple-500",
      iconBg: "bg-purple-500 bg-opacity-10",
      trend: "+3 new connections",
      trendIcon: TrendingUp,
      trendColor: "text-success"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsData.map((stat, index) => {
        const Icon = stat.icon;
        const TrendIcon = stat.trendIcon;
        
        return (
          <Card key={index} className="bg-surface shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.iconBg}`}>
                  <Icon className={`${stat.iconColor} text-xl`} />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <TrendIcon className={`${stat.trendColor} text-sm mr-1`} />
                <span className={`text-sm ${stat.trendColor}`}>{stat.trend}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default StatsGrid;
