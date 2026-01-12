/**
 * NotFound Page
 * 
 * Simple 404 page for unknown routes.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Button } from '../components/ui';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[var(--bg)]">
      <Card padding="lg" className="max-w-lg w-full text-center">
        <h1 className="text-3xl font-bold mb-4">Page not found</h1>
        <p className="text-gray-600 mb-6">We couldn't find the page you were looking for.</p>
        <Link to="/">
          <Button>Go home</Button>
        </Link>
      </Card>
    </div>
  );
}
