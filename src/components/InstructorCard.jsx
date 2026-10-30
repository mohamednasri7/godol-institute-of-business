import React from 'react';
import { Link } from 'wouter';
import { Star, Users, BookOpen } from 'lucide-react';

export default function InstructorCard({ instructor }) {
  const avatar =
    instructor.avatar ||
    (instructor.id % 2 === 0 ? '/instructor-2.png' : '/instructor-1.png');

  return (
    <Link
      href={`/instructors/${instructor.id}`}
      className="group flex flex-col items-center p-6 bg-card rounded-2xl border border-border hover:border-primary/40 hover:shadow-xl transition-all duration-300 text-center"
    >
      <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-4 border-background shadow-md group-hover:scale-105 transition-transform duration-300 bg-muted">
        <img
          src={avatar}
          alt={instructor.name}
          className="w-full h-full object-cover"
        />
      </div>

      <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
        {instructor.name}
      </h3>
      <p className="text-xs text-muted-foreground mb-4 line-clamp-1">
        {instructor.title}
      </p>

      <div className="flex items-center justify-center gap-4 text-xs font-medium mt-auto pt-3 border-t border-border w-full">
        <div className="flex items-center gap-1.5 text-foreground">
          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          <span className="font-semibold">{Number(instructor.rating || 4.9).toFixed(1)}</span>
        </div>
        <div className="w-1 h-1 rounded-full bg-border" />
        <div className="flex items-center gap-1 text-muted-foreground">
          <Users className="w-3.5 h-3.5" />
          <span>{(instructor.studentCount || 1000).toLocaleString()}</span>
        </div>
        <div className="w-1 h-1 rounded-full bg-border" />
        <div className="flex items-center gap-1 text-muted-foreground">
          <BookOpen className="w-3.5 h-3.5" />
          <span>{instructor.courseCount || 3} courses</span>
        </div>
      </div>
    </Link>
  );
}

