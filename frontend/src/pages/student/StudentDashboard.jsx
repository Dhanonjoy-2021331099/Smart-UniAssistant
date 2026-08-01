import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStudentDashboard } from '../../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Award, BookOpen, ClipboardList, TrendingUp, CalendarClock, Clock, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchSchedules } from '../../services/schedule.service';
import { formatTime, toDateKey, addDaysToKey, formatScheduleDate } from '../../components/schedule/scheduleMeta';

const DayScheduleCard = ({ dateKey, title, fallbackText }) => {
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetchSchedules({ date: dateKey, status: 'published', limit: 1 })
      .then((data) => {
        if (!cancelled) {
          setSchedule(data?.schedules?.[0] || null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSchedule(null);
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
  }, [dateKey]);

  const classes = schedule ? schedule.classes || [] : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {schedule ? formatScheduleDate(schedule.date) : fallbackText}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-12 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
            ))}
          </div>
        ) : classes.length > 0 ? (
          <div className="space-y-2">
            {[...classes]
              .sort((a, b) => `${a.startTime}`.localeCompare(`${b.startTime}`))
              .slice(0, 5)
              .map((entry, index) => (
                <div
                  key={entry._id || `${entry.section}-${entry.startTime}-${index}`}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <CalendarClock className="w-4 h-4 text-blue-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">{entry.courseName}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{entry.courseCode}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center justify-end"><Clock className="w-3 h-3 mr-1" />{formatTime(entry.startTime)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-end">
                      {entry.classMode === 'Online' ? (
                        <>{entry.meetingPlatform || 'Online'}</>
                      ) : (
                        <><MapPin className="w-3 h-3 mr-1" />{entry.room}</>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            <Button
              variant="outline"
              className="w-full mt-2"
              onClick={() => navigate('/student/schedule')}
            >
              View All
            </Button>
          </div>
        ) : (
          <div className="text-center py-6">
            <CalendarClock className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {fallbackText}
            </p>
            <Button
              variant="outline"
              onClick={() => navigate('/student/schedule')}
            >
              View All
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const StudentDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  const todayKey = toDateKey(new Date());
  const tomorrowKey = addDaysToKey(todayKey, 1);

  useEffect(() => {
    let cancelled = false;

    getStudentDashboard()
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
        <DayScheduleCard
          dateKey={todayKey}
          title="Today's Classes"
          fallbackText="No schedule published for today yet."
        />

        <DayScheduleCard
          dateKey={tomorrowKey}
          title="Tomorrow's Classes"
          fallbackText="No schedule published for tomorrow yet."
        />

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