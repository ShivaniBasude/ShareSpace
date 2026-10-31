import React from 'react';
import { Link } from 'react-router-dom';
import { Container } from '../components/common/Container';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { LogoIcon, ArrowRightIcon } from '../components/common/Icons';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="py-20 md:py-32 flex items-center justify-center">
      <Container size="sm">
        <Card className="max-w-md mx-auto text-center p-4">
          <CardHeader className="space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mb-2">
              <LogoIcon className="h-8 w-8" />
            </div>
            <div className="text-4xl font-black font-mono text-indigo-600 dark:text-indigo-400">
              404
            </div>
            <CardTitle className="text-xl">Page Not Found</CardTitle>
            <CardDescription>
              The campus resource or page you are looking for does not exist or has been relocated.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center pt-4">
            <Link to="/">
              <Button variant="primary" icon={<ArrowRightIcon className="w-4 h-4" />} iconPosition="right">
                Back to Home
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </Container>
    </div>
  );
};

