import React, { useEffect, useState } from 'react';
import { getStudentDashboard } from '../../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Progress } from '../../components/ui/progress';
import { Award, BookOpen, ClipboardList, TrendingUp, Target, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const StudentDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const data = await getStudentDashboard();
      setDashboard(data);
    } catch (error) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64" data-testid="loading-spinner"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  const stats = [
    { icon: Award, label: 'CGPA', value: dashboard?.stats?.overallCGPA?.toFixed(2) || '0.00', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
    { icon: BookOpen, label: 'Credits Completed', value: dashboard?.stats?.totalCredits || 0, color: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
    { icon: ClipboardList, label: 'Pending Assignments', value: dashboard?.assignments?.length || 0, color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20' },
    { icon: TrendingUp, label: 'Current Semester', value: dashboard?.stats?.currentSemester || 1, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' }
  ];

  return (
    <div className="space-y-6" data-testid="student-dashboard">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Welcome to your academic dashboard</p>
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
            <CardTitle>CGPA Progress</CardTitle>
            <CardDescription>Your semester-wise performance</CardDescription>
          </CardHeader>
          <CardContent>
            {dashboard?.student?.semesterGPAs && dashboard.student.semesterGPAs.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={dashboard.student.semesterGPAs}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
                  <XAxis dataKey="semester" className="text-xs" />
                  <YAxis domain={[0, 4]} className="text-xs" />
                  <Tooltip />
                  <Line type="monotone" dataKey="gpa" stroke="#2563eb" strokeWidth={2} dot={{ fill: '#2563eb', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500 py-8">No GPA data available yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Assignments</CardTitle>
            <CardDescription>Upcoming and pending submissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboard?.assignments && dashboard.assignments.length > 0 ? (
                dashboard.assignments.slice(0, 5).map((assignment) => (
                  <div key={assignment._id} className="flex items-start justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">{assignment.title}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{assignment.course?.title}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-orange-600">Due: {new Date(assignment.dueDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">No pending assignments</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Course Materials</CardTitle>
          <CardDescription>Latest uploads from your teachers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dashboard?.recentMaterials && dashboard.recentMaterials.length > 0 ? (
              dashboard.recentMaterials.map((material) => (
                <div key={material._id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex items-center space-x-3">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{material.title}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{material.course?.title} • {material.type}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">{new Date(material.createdAt).toLocaleDateString()}</p>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">No course materials yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentDashboard;