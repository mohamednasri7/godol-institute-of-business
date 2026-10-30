import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'wouter';
import { Users, BookOpen, Star, ArrowLeft } from 'lucide-react';
import CourseCard from '../components/CourseCard';
import { apiFetch } from '../lib/api';

export default function InstructorDetail() {
  const { id } = useParams();
  const [instructor, setInstructor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    apiFetch(`/api/instructors/${id}`)
      .then(setInstructor)
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 pt-32 pb-20">
        <div className="h-64 bg-muted/40 animate-pulse rounded-2xl mb-12" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array(3)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="h-80 bg-muted/30 animate-pulse rounded-xl" />
            ))}
        </div>
      </div>
    );
  }

  if (!instructor) {
    return (
      <div className="min-h-screen pt-32 text-center container mx-auto px-4">
        <h2 className="text-2xl font-bold mb-4">Instructor not found</h2>
        <Link href="/instructors" className="text-primary hover:underline font-semibold">
          ← Back to instructors
        </Link>
      </div>
    );
  }

  const avatar =
    instructor.avatar ||
    (instructor.id % 2 === 0 ? '/instructor-2.png' : '/instructor-1.png');

  return (
    <div className="min-h-screen pt-24 pb-20 bg-background">
      {/* Instructor Profile Header */}
      <div className="bg-muted/30 border-b border-border py-16 mb-16">
        <div className="container mx-auto px-4 md:px-6">
          <Link
            href="/instructors"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary mb-8 hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to faculty directory
          </Link>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-10">
            <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-background shadow-xl flex-shrink-0 bg-muted">
              <img
                src={avatar}
                alt={instructor.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="text-center md:text-left flex-grow">
              <h1 className="text-4xl font-serif font-bold tracking-tight mb-2 text-foreground">
                {instructor.name}
              </h1>
              <p className="text-xl text-primary font-medium mb-6">
                {instructor.title}
              </p>

              <div className="flex flex-wrap justify-center md:justify-start gap-8 mb-8">
                <div className="flex flex-col items-center md:items-start">
                  <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">
                    Total Students
                  </span>
                  <div className="flex items-center gap-2 text-2xl font-bold text-foreground">
                    <Users className="w-5 h-5 text-primary" />
                    {(instructor.studentCount || 1000).toLocaleString()}
                  </div>
                </div>

                <div className="flex flex-col items-center md:items-start">
                  <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">
                    Courses Taught
                  </span>
                  <div className="flex items-center gap-2 text-2xl font-bold text-foreground">
                    <BookOpen className="w-5 h-5 text-primary" />
                    {instructor.courseCount || 3}
                  </div>
                </div>

                <div className="flex flex-col items-center md:items-start">
                  <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">
                    Rating
                  </span>
                  <div className="flex items-center gap-2 text-2xl font-bold text-foreground">
                    <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                    {Number(instructor.rating || 4.9).toFixed(1)}
                  </div>
                </div>
              </div>

              <div className="prose max-w-3xl">
                <p className="text-base leading-relaxed text-muted-foreground">
                  {instructor.bio ||
                    'A seasoned executive and educator dedicated to helping students develop tangible commercial skills through practical, hands-on learning. With extensive corporate experience in East Africa, they bring real-world mastery to every lecture.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Courses by this instructor */}
      <div className="container mx-auto px-4 md:px-6">
        <h2 className="font-serif text-3xl font-bold mb-8 text-foreground">
          Courses Taught by {instructor.name}
        </h2>

        {instructor.courses && instructor.courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {instructor.courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            No active public courses listed under this instructor at the moment.
          </p>
        )}
      </div>
    </div>
  );
}

