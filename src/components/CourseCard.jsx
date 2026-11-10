import React from 'react';
import { Link } from 'wouter';
import { Star, Clock, BookOpen } from 'lucide-react';

export default function CourseCard({ course }) {
  const fallbackThumbnails = {
    'Web Development': '/course-web.png',
    'Design': '/course-design.png',
    'Business': '/course-business.png',
    'Business Strategy': '/course-business.png',
    'Finance & Accounting': '/course-design.png',
    'Entrepreneurship': '/course-web.png',
    'Digital Marketing': '/course-business.png',
    'Leadership & HR': '/course-design.png'
  };

  const thumbnail =
    course.thumbnail ||
    fallbackThumbnails[course.categoryName] ||
    '/course-business.png';

  const getLevelColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'beginner':
        return 'bg-green-500';
      case 'intermediate':
        return 'bg-amber-500';
      case 'advanced':
        return 'bg-blue-500';
      default:
        return 'bg-emerald-500';
    }
  };

  return (
    <Link
      href={`/courses/${course.id}`}
      className="group flex flex-col h-full liquid-glass liquid-glass-squircle liquid-glass-interactive overflow-hidden cursor-pointer"
    >
      <div className="relative aspect-video overflow-hidden bg-muted/60">
        <img
          src={thumbnail}
          alt={course.title}
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
        />
        {course.badge && (
          <span className="absolute top-3 left-3 bg-primary/90 text-primary-foreground font-semibold text-xs px-3 py-1 rounded-full shadow-md border border-white/25 backdrop-blur-md">
            {course.badge}
          </span>
        )}
      </div>

      <div className="p-5 flex flex-col flex-grow">
        <div className="flex justify-between items-center mb-2.5">
          <span className="text-xs font-semibold text-primary tracking-wider uppercase">
            {course.categoryName || 'Business'}
          </span>
          <span className="text-xs font-medium text-muted-foreground flex items-center">
            <span
              className={`w-2 h-2 rounded-full mr-1.5 ${getLevelColor(
                course.level
              )}`}
            />
            {course.level || 'All Levels'}
          </span>
        </div>

        <h3 className="font-bold text-base text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors">
          {course.title}
        </h3>

        {course.instructorName && (
          <p className="text-xs text-muted-foreground mb-4">
            By <span className="font-medium text-foreground">{course.instructorName}</span>
          </p>
        )}

        <div className="mt-auto pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="font-bold text-foreground">
              {course.rating ? Number(course.rating).toFixed(1) : '5.0'}
            </span>
            <span>({course.enrolledCount ?? 0})</span>
          </div>

          <div className="flex items-center gap-3">
            {course.durationHours ? (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {course.durationHours}h
              </span>
            ) : null}
            <span className="flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" />
              {course.lessonCount ? `${course.lessonCount} lessons` : (course.sections?.length ? `${course.sections.length} modules` : 'Curriculum')}
            </span>
          </div>
        </div>

        <div className="mt-3 pt-3 flex items-center justify-between">
          <div className="text-lg font-bold text-foreground">
            {Number(course.price) === 0 ? (
              <span className="text-green-600 font-semibold">Free</span>
            ) : (
              <span>${course.price}</span>
            )}
          </div>
          <span className="text-xs font-semibold text-primary group-hover:translate-x-0.5 transition-transform">
            View Course →
          </span>
        </div>
      </div>
    </Link>
  );
}

