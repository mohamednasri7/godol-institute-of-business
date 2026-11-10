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
      className="group flex flex-col items-center p-6 liquid-glass liquid-glass-squircle liquid-glass-interactive text-center cursor-pointer"
    >
      <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-2 border-white/60 dark:border-white/20 shadow-lg group-hover:scale-105 transition-transform duration-300 bg-muted/60">
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
          <span className="font-semibold">{instructor.rating ? Number(instructor.rating).toFixed(1) : '5.0'}</span>
        </div>
        <div className="w-1 h-1 rounded-full bg-border" />
        <div className="flex items-center gap-1 text-muted-foreground">
          <Users className="w-3.5 h-3.5" />
          <span>{(instructor.studentCount ?? 0).toLocaleString()} students</span>
        </div>
        <div className="w-1 h-1 rounded-full bg-border" />
        <div className="flex items-center gap-1 text-muted-foreground">
          <BookOpen className="w-3.5 h-3.5" />
          <span>{instructor.courseCount ?? 0} courses</span>
        </div>
      </div>
    </Link>
  );
}

