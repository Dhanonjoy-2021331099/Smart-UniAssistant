import { useEffect, useState } from 'react';
import { getTeacherDashboard } from '../../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { BookOpen, Users, ClipboardList, Award } from 'lucide-react';
import { toast } from 'sonner';

const TeacherDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getTeacherDashboard()
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
    { icon: BookOpen, label: 'Assigned Courses', value: dashboard?.courses?.length || 0, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
    { icon: Users, label: 'Total Sections', value: [...new Set(dashboard?.courses?.map(c => c.section))].filter(Boolean).length || 0, color: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
    { icon: ClipboardList, label: 'Assignments', value: 0, color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20' },
    { icon: Award, label: 'Results Published', value: 0, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' }
  ];

  return (
    <div className="space-y-6" data-testid="teacher-dashboard">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Teacher Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your courses and students</p>
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

      <Card>
        <CardHeader>
          <CardTitle>My Courses</CardTitle>
          <CardDescription>Courses assigned to you</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dashboard?.courses && dashboard.courses.length > 0 ? (
              dashboard.courses.map((teacherCourse) => (
                <div key={teacherCourse._id} className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{teacherCourse.courseName}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {teacherCourse.courseCode} • {teacherCourse.departmentName || teacherCourse.department || '—'} • {teacherCourse.section ? `Section ${teacherCourse.section}` : 'No section'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Semester {teacherCourse.semester}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">No courses assigned</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherDashboard;