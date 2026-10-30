import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import {
  TrendingUp,
  BarChart2,
  PenTool,
  Tv,
  Users,
  Calendar,
  CalendarDays,
  MapPin,
  Clock,
  ArrowRight
} from 'lucide-react';
import { apiFetch } from '../lib/api';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [workshops, setWorkshops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([apiFetch('/api/categories'), apiFetch('/api/workshops')])
      .then(([cats, works]) => {
        setCategories(cats);
        setWorkshops(works);
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  const getCategoryIcon = (iconName) => {
    switch (iconName) {
      case 'trending-up':
        return <TrendingUp className="w-8 h-8" />;
      case 'bar-chart':
        return <BarChart2 className="w-8 h-8" />;
      case 'pen-tool':
        return <PenTool className="w-8 h-8" />;
      case 'monitor-play':
        return <Tv className="w-8 h-8" />;
      case 'server':
        return <Users className="w-8 h-8" />;
      case 'code':
        return <Calendar className="w-8 h-8" />;
      default:
        return <TrendingUp className="w-8 h-8" />;
    }
  };

  return (
    <div className="min-h-screen pt-28 pb-20 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        {/* Category catalog header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div
            className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold tracking-widest uppercase mb-4"
            style={{ background: 'hsl(42 92% 52% / 0.15)', color: 'hsl(42 92% 40%)' }}
          >
            Curriculum Disciplines
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight mb-4 text-foreground">
            Top Categories
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Explore our comprehensive catalog by category. Find the specific skill you want to master next.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-24">
          {isLoading
            ? Array(6)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="h-44 bg-muted/40 animate-pulse rounded-2xl" />
                ))
            : categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/courses?category=${encodeURIComponent(cat.name)}`}
                  className="group flex flex-col items-center justify-center p-8 bg-card rounded-2xl border border-border hover:border-primary/50 hover:shadow-xl transition-all duration-300 text-center"
                >
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3"
                    style={{
                      backgroundColor: `${cat.color || '#6366f1'}15`,
                      color: cat.color || '#6366f1'
                    }}
                  >
                    {getCategoryIcon(cat.icon)}
                  </div>
                  <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors text-foreground">
                    {cat.name}
                  </h3>
                  <p className="text-muted-foreground text-sm font-medium">
                    {cat.courseCount ?? 0} {cat.courseCount === 1 ? 'course' : 'courses'}
                  </p>
                </Link>
              ))}
        </div>

        {/* Live In-Person Workshops Section */}
        <div className="border-t border-border pt-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <div
                className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold tracking-widest uppercase mb-4"
                style={{ background: 'hsl(42 92% 52% / 0.15)', color: 'hsl(42 92% 40%)' }}
              >
                In-Person Cohorts
              </div>
              <h2 className="font-serif text-3xl md:text-4xl font-bold mb-2 text-foreground">
                Live Mogadishu Workshops
              </h2>
              <p className="text-muted-foreground">
                Join experienced founders and executives for intensive, hands-on weekend workshops.
              </p>
            </div>
          </div>

          {workshops.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {workshops.map((w) => (
                <div
                  key={w.id}
                  className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg hover:border-primary/30 transition-all flex flex-col"
                >
                  <div className="flex items-start justify-between mb-4">
                    <span
                      className="text-xs font-bold tracking-wider uppercase px-2.5 py-1 rounded-full"
                      style={
                        w.tag === 'Limited Seats'
                          ? { background: 'hsl(0 84% 60% / 0.1)', color: 'hsl(0 84% 50%)' }
                          : w.tag === 'New'
                          ? { background: 'hsl(42 92% 52% / 0.15)', color: 'hsl(42 92% 38%)' }
                          : { background: 'hsl(215 72% 24% / 0.1)', color: 'hsl(215 72% 30%)' }
                      }
                    >
                      {w.tag || 'Upcoming'}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">
                      {w.seats ? `${w.seats} seats left` : 'Registration Open'}
                    </span>
                  </div>

                  <h3 className="font-bold text-lg mb-2 text-foreground">{w.title}</h3>
                  <p className="text-xs text-muted-foreground mb-4 leading-relaxed line-clamp-2">
                    {w.description}
                  </p>

                  <div className="space-y-2 mb-6 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-primary" />
                      <span>{w.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      <span>{w.durationHours ? `${w.durationHours} Hours` : 'Intensive'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span>{w.location || 'Mogadishu Campus'}</span>
                    </div>
                  </div>

                  <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
                    <span className="text-xl font-bold text-foreground">{w.price ? `$${w.price}` : 'Free'}</span>
                    <Link
                      href="/register"
                      className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
                    >
                      Reserve Seat
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-3xl p-10 text-center max-w-xl mx-auto shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                <CalendarDays className="w-7 h-7" />
              </div>
              <h3 className="font-serif text-xl font-bold text-foreground mb-2">Upcoming Cohorts Being Scheduled</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Our academic committee is currently finalizing the executive workshop calendar. Subscribe or contact our admissions office on WhatsApp to receive priority notification when seats open.
              </p>
              <Link
                href="/about#contact"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 shadow-sm"
              >
                Inquire on Upcoming Dates
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

