import React, { useState, useEffect } from 'react';
import InstructorCard from '../components/InstructorCard';
import { apiFetch } from '../lib/api';

export default function Instructors() {
  const [instructors, setInstructors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/instructors')
      .then(setInstructors)
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="min-h-screen pt-28 pb-20 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mb-14 max-w-2xl">
          <div
            className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold tracking-widest uppercase mb-4"
            style={{ background: 'hsl(42 92% 52% / 0.15)', color: 'hsl(42 92% 40%)' }}
          >
            Distinguished Faculty
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight mb-4 text-foreground">
            Our Instructors
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Learn from industry practitioners, executives, and founders who have led real companies and managed real budgets in East Africa.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading
            ? Array(4)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="h-64 bg-muted/40 animate-pulse rounded-2xl" />
                ))
            : instructors.map((instructor) => (
                <InstructorCard key={instructor.id} instructor={instructor} />
              ))}
        </div>
      </div>
    </div>
  );
}

