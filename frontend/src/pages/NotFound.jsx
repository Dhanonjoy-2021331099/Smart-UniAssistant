import { useNavigate } from "react-router-dom";
import { Card, CardContent } from '../components/ui/card';
import { FileQuestion } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4" data-testid="not-found-page">
      <Card className="w-full max-w-md">
        <CardContent className="py-16 text-center">
          <FileQuestion className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-3">404</h1>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Page Not Found
          </h2>
          <p className="text-gray-500 mb-6">
            The page you are looking for does not exist or has been moved.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium"
          >
            Go Back
          </button>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
