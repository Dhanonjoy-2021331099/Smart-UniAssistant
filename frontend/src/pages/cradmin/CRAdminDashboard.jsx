import { useEffect, useState } from 'react';
import { getCRAdminDashboard } from '../../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Bell, Users, Calendar, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';

const CRAdminDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getCRAdminDashboard()
      .then((data) => {
        if (!cancelled) {
          setDashboard(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          toast.error('Failed to load dashboard');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-64" data-testid="loading-spinner"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  const stats = [
    { icon: Bell, label: 'Notices', value: dashboard?.notices?.length || 0, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
    { icon: Users, label: 'Events', value: dashboard?.events?.length || 0, color: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
    { icon: Calendar, label: 'Routines', value: 0, color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20' },
    { icon: FolderOpen, label: 'Resources', value: 0, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' }
  ];

  return (
    <div className="space-y-6" data-testid="cradmin-dashboard">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">CR Admin Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage batch resources and information</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Notices</CardTitle>
            <CardDescription>Latest batch notices</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboard?.notices && dashboard.notices.length > 0 ? (
                dashboard.notices.map((notice) => (
                  <div key={notice._id} className="p-3 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <p className="font-medium text-gray-900 dark:text-white">{notice.title}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{new Date(notice.createdAt).toLocaleDateString()}</p>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">No notices yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>Events for your batch</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboard?.events && dashboard.events.length > 0 ? (
                dashboard.events.map((event) => (
                  <div key={event._id} className="p-3 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <p className="font-medium text-gray-900 dark:text-white">{event.title}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{new Date(event.startDate).toLocaleDateString()}</p>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">No events yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CRAdminDashboard;