import { useEffect, useState } from 'react';
import { getStudentAssignments, submitAssignment } from '../../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { ClipboardList, Upload, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const StudentAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [files, setFiles] = useState([]);
  const [githubLink, setGithubLink] = useState('');
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchAssignments = async () => {
    const data = await getStudentAssignments();
    setAssignments(data);
  };

  useEffect(() => {
    let cancelled = false;

    getStudentAssignments()
      .then((data) => {
        if (!cancelled) {
          setAssignments(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          toast.error('Failed to load assignments');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('assignmentId', selectedAssignment._id);
      formData.append('githubLink', githubLink);
      formData.append('comments', comments);
      
      files.forEach(file => {
        formData.append('files', file);
      });

      await submitAssignment(formData);
      toast.success('Assignment submitted successfully!');
      setSelectedAssignment(null);
      setFiles([]);
      setGithubLink('');
      setComments('');
      fetchAssignments();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (assignment) => {
    if (assignment.submission) {
      if (assignment.submission.status === 'graded') {
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Graded</Badge>;
      }
      return <Badge className="bg-blue-500"><Clock className="w-3 h-3 mr-1" />Submitted</Badge>;
    }
    
    const dueDate = new Date(assignment.dueDate);
    const now = new Date();
    if (now > dueDate) {
      return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Overdue</Badge>;
    }
    return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64" data-testid="loading-spinner"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="space-y-6" data-testid="student-assignments-page">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Assignments</h1>
        <p className="text-gray-600 dark:text-gray-400">View and submit your assignments</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {assignments.map((assignment) => (
          <Card key={assignment._id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle>{assignment.title}</CardTitle>
                  <CardDescription>{assignment.course?.title}</CardDescription>
                </div>
                {getStatusBadge(assignment)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">{assignment.description}</p>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-800">
                  <div className="text-sm">
                    <span className="text-gray-500">Due: </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {new Date(assignment.dueDate).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">Max Marks: </span>
                    <span className="font-medium text-gray-900 dark:text-white">{assignment.maxMarks}</span>
                  </div>
                </div>

                {assignment.submission ? (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Submitted on: {new Date(assignment.submission.submittedAt).toLocaleString()}</p>
                    {assignment.submission.marks !== undefined && (
                      <p className="text-sm mt-2">
                        <span className="text-blue-900 dark:text-blue-100">Marks: </span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">{assignment.submission.marks}/{assignment.maxMarks}</span>
                      </p>
                    )}
                    {assignment.submission.feedback && (
                      <p className="text-sm mt-2 text-blue-900 dark:text-blue-100"><span className="font-medium">Feedback:</span> {assignment.submission.feedback}</p>
                    )}
                  </div>
                ) : (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button onClick={() => setSelectedAssignment(assignment)} className="w-full" data-testid="submit-assignment-button">
                        <Upload className="w-4 h-4 mr-2" />
                        Submit Assignment
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Submit Assignment</DialogTitle>
                        <DialogDescription>{assignment.title}</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="files">Upload Files (PDF, DOCX, ZIP)</Label>
                          <Input
                            id="files"
                            type="file"
                            multiple
                            accept=".pdf,.docx,.zip"
                            onChange={(e) => setFiles(Array.from(e.target.files))}
                            data-testid="file-upload-input"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="github">GitHub Repository Link (Optional)</Label>
                          <Input
                            id="github"
                            type="url"
                            placeholder="https://github.com/username/repo"
                            value={githubLink}
                            onChange={(e) => setGithubLink(e.target.value)}
                            data-testid="github-input"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="comments">Comments (Optional)</Label>
                          <Textarea
                            id="comments"
                            placeholder="Add any comments or notes"
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            rows={4}
                            data-testid="comments-input"
                          />
                        </div>

                        <Button type="submit" className="w-full" disabled={submitting} data-testid="submit-button">
                          {submitting ? 'Submitting...' : 'Submit Assignment'}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {assignments.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <ClipboardList className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No assignments available</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default StudentAssignments;