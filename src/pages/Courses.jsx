import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { Search, Filter, X, SlidersHorizontal, BookOpen } from 'lucide-react';
import CourseCard from '../components/CourseCard';
import { apiFetch } from '../lib/api';

export default function Courses() {
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);

  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [selectedLevel, setSelectedLevel] = useState(searchParams.get('level') || 'all');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'popular');
  const [showFilters, setShowFilters] = useState(false);

  const searchInputRef = useRef(null);

  // Sync state to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedCategory !== 'all') params.set('category', selectedCategory);
    if (selectedLevel !== 'all') params.set('level', selectedLevel);
    if (sortBy !== 'popular') params.set('sort', sortBy);
    const queryString = params.toString();
    window.history.replaceState(null, '', `/courses${queryString ? '?' + queryString : ''}`);
  }, [searchQuery, selectedCategory, selectedLevel, sortBy]);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([apiFetch('/api/courses'), apiFetch('/api/categories')])
      .then(([coursesData, categoriesData]) => {
        setCourses(coursesData);
        setCategories(categoriesData);
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  // Filter and sort courses
  const filteredCourses = courses.filter((course) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      course.title.toLowerCase().includes(query) ||
      course.description.toLowerCase().includes(query) ||
      (course.categoryName && course.categoryName.toLowerCase().includes(query)) ||
      (course.instructorName && course.instructorName.toLowerCase().includes(query));

    const matchesCategory =
      selectedCategory === 'all' ||
      (course.categoryName && course.categoryName.toLowerCase() === selectedCategory.toLowerCase());

    const matchesLevel =
      selectedLevel === 'all' ||
      (course.level && course.level.toLowerCase() === selectedLevel.toLowerCase());

    return matchesSearch && matchesCategory && matchesLevel;
  });

  const sortedCourses = [...filteredCourses].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    }
    if (sortBy === 'price-low') {
      return Number(a.price) - Number(b.price);
    }
    if (sortBy === 'price-high') {
      return Number(b.price) - Number(a.price);
    }
    if (sortBy === 'rating') {
      return Number(b.rating || 0) - Number(a.rating || 0);
    }
    // Default popular
    return Number(b.enrolledCount || 0) - Number(a.enrolledCount || 0);
  });

  const activeFiltersCount = [
    selectedCategory !== 'all',
    selectedLevel !== 'all',
    sortBy !== 'popular',
    !!searchQuery
  ].filter(Boolean).length;

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedLevel('all');
    setSortBy('popular');
    searchInputRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Banner */}
      <div className="bg-[hsl(215,72%,18%)] pt-32 pb-14 text-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-white/60 text-sm mb-3">
              <BookOpen className="w-4 h-4 text-accent" />
              <span>Business Course Catalog</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">
              Browse All Courses
            </h1>
            <p className="text-white/70 text-lg leading-relaxed">
              Practical business education designed for entrepreneurs, managers, and professionals in Somalia and East Africa.
            </p>
          </div>

          {/* Search bar & filter toggle */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3 max-w-4xl">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search courses, topics, skills…"
                className="w-full bg-white/10 backdrop-blur border border-white/20 text-white placeholder:text-white/50 rounded-xl pl-12 pr-10 py-3.5 text-sm outline-none focus:bg-white/15 focus:border-white/30 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold border transition-all ${
                showFilters || activeFiltersCount > 0
                  ? 'bg-accent text-foreground border-transparent shadow-md'
                  : 'bg-white/10 text-white border-white/20 hover:bg-white/15'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-[hsl(215,72%,18%)] text-white text-xs flex items-center justify-center ml-1">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Filter drawer / controls */}
      <div className="container mx-auto px-4 md:px-6 py-8">
        {(showFilters || activeFiltersCount > 0) && (
          <div className="bg-card border border-border rounded-2xl p-6 mb-8 shadow-sm">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-border mb-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">Refine Courses</h3>
              </div>
              {activeFiltersCount > 0 && (
                <button
                  onClick={resetFilters}
                  className="text-xs text-primary font-semibold hover:underline"
                >
                  Clear all filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-primary"
                >
                  <option value="all">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Level */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Experience Level
                </label>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-primary"
                >
                  <option value="all">All Levels</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-primary"
                >
                  <option value="popular">Most Popular</option>
                  <option value="newest">Newest</option>
                  <option value="rating">Highest Rated</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Results summary */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground font-medium">
            Showing <span className="font-bold text-foreground">{sortedCourses.length}</span>{' '}
            courses
          </p>
        </div>

        {/* Courses Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array(8)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="h-80 bg-muted/40 animate-pulse rounded-2xl" />
              ))}
          </div>
        ) : sortedCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl p-12 text-center max-w-md mx-auto my-12">
            <BookOpen className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-foreground mb-2">No courses found</h3>
            <p className="text-sm text-muted-foreground mb-6">
              No courses matched your current filter criteria. Try adjusting or clearing your filters.
            </p>
            <button
              onClick={resetFilters}
              className="px-6 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-semibold hover:bg-primary/90 transition-all"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

