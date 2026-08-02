import { useEffect, useState } from 'react';
import { getStudentResults } from '../../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Award } from 'lucide-react';
import { toast } from 'sonner';

const StudentResults = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getStudentResults()
      .then((data) => {
        if (!cancelled) {
          setResults(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          toast.error('Failed to load results');
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

  const getGradeColor = (grade) => {
    if (['A+', 'A'].includes(grade)) return 'bg-green-500';
    if (['A-', 'B+', 'B'].includes(grade)) return 'bg-blue-500';
    if (['B-', 'C+', 'C'].includes(grade)) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const calculateSemesterStats = (semester) => {
    const semesterResults = results.filter(r => r.semester === semester);
    const totalPoints = semesterResults.reduce((sum, r) => sum + (r.gradePoint * (r.course?.credit || 0)), 0);
    const totalCredits = semesterResults.reduce((sum, r) => sum + (r.course?.credit || 0), 0);
    return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
  };

  const semesters = [...new Set(results.map(r => r.semester))].sort();

  if (loading) {
    return <div className="flex justify-center items-center h-64" data-testid="loading-spinner"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="space-y-6" data-testid="student-results-page">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Results</h1>
        <p className="text-gray-600 dark:text-gray-400">View your academic performance</p>
      </div>

      {semesters.map(semester => (
        <Card key={semester}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Semester {semester}</CardTitle>
                <CardDescription>Academic Year {results.find(r => r.semester === semester)?.year || 'N/A'}</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-blue-600" />
                <span className="text-2xl font-bold text-blue-600">{calculateSemesterStats(semester)}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course Code</TableHead>
                  <TableHead>Course Title</TableHead>
                  <TableHead className="text-center">Credit</TableHead>
                  <TableHead className="text-center">Total Marks</TableHead>
                  <TableHead className="text-center">Grade</TableHead>
                  <TableHead className="text-center">Grade Point</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results
                  .filter(result => result.semester === semester)
                  .map((result) => (
                    <TableRow key={result._id}>
                      <TableCell className="font-medium">{result.course?.code}</TableCell>
                      <TableCell>{result.course?.title}</TableCell>
                      <TableCell className="text-center">{result.course?.credit}</TableCell>
                      <TableCell className="text-center">{result.totalMarks}</TableCell>
                      <TableCell className="text-center">
                        <Badge className={getGradeColor(result.letterGrade)}>{result.letterGrade}</Badge>
                      </TableCell>
                      <TableCell className="text-center font-bold">{result.gradePoint.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}

      {results.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Award className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No results published yet</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StudentResults;