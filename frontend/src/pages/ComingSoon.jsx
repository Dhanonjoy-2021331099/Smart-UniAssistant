import React from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Construction } from 'lucide-react';

const ComingSoon = ({ title = 'Coming Soon' }) => {
  return (
    <div className="space-y-6" data-testid="coming-soon-page">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{title}</h1>
        <p className="text-gray-600 dark:text-gray-400">This feature is under development</p>
      </div>

      <Card>
        <CardContent className="py-24 text-center">
          <Construction className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Under Construction</h2>
          <p className="text-gray-500">This feature will be available soon</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComingSoon;