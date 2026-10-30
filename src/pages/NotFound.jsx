import React from 'react';
import { Link } from 'wouter';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 text-center">
      <div className="max-w-md">
        <h1 className="font-serif text-7xl font-extrabold text-primary mb-4">404</h1>
        <h2 className="text-2xl font-bold text-foreground mb-3">Page Not Found</h2>
        <p className="text-sm text-muted-foreground mb-8">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link
          href="/"
          className="px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all inline-block shadow-md"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}

