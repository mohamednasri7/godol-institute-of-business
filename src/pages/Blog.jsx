import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { 
  Calendar, 
  Clock, 
  User, 
  ArrowRight, 
  Eye, 
  ThumbsUp, 
  Search,
  BookOpen,
  Sparkles,
  TrendingUp,
  Tag
} from 'lucide-react';
import { apiFetch } from '../lib/api';

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    apiFetch('/api/blog')
      .then((data) => {
        // Only published posts for public view
        const published = (data || []).filter(p => p.status === 'published' || p.published === true || !p.status);
        setPosts(published);
      })
      .catch((err) => console.error('Failed to load posts:', err))
      .finally(() => setIsLoading(false));
  }, []);

  const categories = ['All', ...Array.from(new Set(posts.map((p) => p.category).filter(Boolean)))];

  const filteredPosts = posts.filter((p) => {
    if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (p.title || '').toLowerCase().includes(q);
      const matchExcerpt = (p.excerpt || '').toLowerCase().includes(q);
      const matchAuthor = (p.authorName || p.author || '').toLowerCase().includes(q);
      const matchCategory = (p.category || '').toLowerCase().includes(q);
      if (!matchTitle && !matchExcerpt && !matchAuthor && !matchCategory) return false;
    }
    return true;
  });

  const featuredPost = filteredPosts.find((p) => p.featured) || filteredPosts[0];
  const otherPosts = filteredPosts.filter((p) => p.id !== featuredPost?.id);

  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'Finance & Accounting':
      case 'Finance':
        return 'hsl(42 92% 48%)';
      case 'Business Strategy':
      case 'Strategy':
        return 'hsl(215 72% 24%)';
      case 'Leadership & HR':
      case 'Leadership':
        return 'hsl(280 55% 40%)';
      case 'Digital Marketing':
      case 'Marketing':
        return 'hsl(160 60% 30%)';
      default:
        return 'hsl(215 72% 24%)';
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-24 bg-background">
      {/* Blog Hero Banner */}
      <div className="hero-gradient py-20 text-white relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6 text-center relative z-10">
          <div
            className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold tracking-widest uppercase mb-6"
            style={{ background: 'hsl(42 92% 52% / 0.2)', color: 'hsl(42 92% 65%)' }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Insights & Thought Leadership</span>
          </div>
          <h1 className="font-serif text-4xl md:text-6xl font-bold mb-4 tracking-tight">
            The Godol Institute Blog
          </h1>
          <p className="text-white/80 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Rigorous business analysis, real-world case studies, and strategic management frameworks tailored for professionals and entrepreneurs across East Africa.
          </p>

          {/* Search bar inside hero */}
          <div className="max-w-md mx-auto mt-8 relative">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/50" />
            <input
              type="text"
              placeholder="Search articles by title, topic, or author..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-11 pr-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/50 text-xs outline-none focus:bg-white/20 focus:border-white/40 transition-all shadow-lg"
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-12">
        {isLoading ? (
          <div className="py-20 text-center space-y-4">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-muted-foreground">Loading published articles...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-card border border-border rounded-3xl p-12 text-center max-w-md mx-auto my-12 shadow-sm">
            <BookOpen className="w-12 h-12 text-primary/40 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-foreground mb-2">No Articles Published Yet</h3>
            <p className="text-sm text-muted-foreground">
              Executive articles and industry insights will appear here once published from the faculty or admin dashboard.
            </p>
          </div>
        ) : (
          <>
            {/* Category Filter Pills */}
            <div className="flex gap-2 flex-wrap mb-10 items-center justify-between">
              <div className="flex gap-2 flex-wrap">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold transition-all border ${
                      selectedCategory === cat
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                        : 'bg-card text-muted-foreground border-border hover:border-primary/30 hover:text-foreground'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <span className="text-xs text-muted-foreground font-mono">
                Showing {filteredPosts.length} article{filteredPosts.length === 1 ? '' : 's'}
              </span>
            </div>

            {/* Featured Blog Post */}
            {featuredPost && (
              <Link
                href={`/blog/${featuredPost.slug || featuredPost.id}`}
                className="block rounded-3xl overflow-hidden border border-border bg-card hover:shadow-2xl transition-all duration-300 group cursor-pointer mb-14"
              >
                <div className="grid grid-cols-1 lg:grid-cols-5">
                  <div
                    className="lg:col-span-2 min-h-64 relative flex items-center justify-center p-8 text-center text-white overflow-hidden"
                    style={{ background: getCategoryColor(featuredPost.category) }}
                  >
                    {(featuredPost.featuredImageUrl || featuredPost.featured_image_url) ? (
                      <img
                        src={featuredPost.featuredImageUrl || featuredPost.featured_image_url}
                        alt={featuredPost.title}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-75"
                      />
                    ) : null}
                    <div className="relative z-10">
                      <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-4 border border-white/30 shadow-lg">
                        <ArrowRight className="w-6 h-6 text-white group-hover:translate-x-1 transition-transform" />
                      </div>
                      <span className="text-white/90 text-xs font-bold uppercase tracking-widest drop-shadow">
                        Featured Analysis
                      </span>
                    </div>
                  </div>

                  <div className="lg:col-span-3 p-8 md:p-12 flex flex-col justify-center">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3 flex-wrap">
                      <span className="font-bold text-primary uppercase tracking-wider">
                        {featuredPost.category || 'Business Strategy'}
                      </span>
                      <span>•</span>
                      <span>{featuredPost.readTime || '5 min read'}</span>
                      <span>•</span>
                      <span>
                        {featuredPost.publishedAt
                          ? new Date(featuredPost.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                          : 'May 2026'}
                      </span>
                    </div>

                    <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-4 group-hover:text-primary transition-colors leading-tight">
                      {featuredPost.title}
                    </h2>

                    <p className="text-muted-foreground text-sm leading-relaxed mb-6 line-clamp-3">
                      {featuredPost.excerpt}
                    </p>

                    <div className="flex items-center justify-between mt-auto pt-6 border-t border-border flex-wrap gap-3">
                      <div className="flex items-center gap-2.5 text-xs text-foreground font-medium">
                        <div className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-[10px]">
                          {(featuredPost.authorName || featuredPost.author || 'G').charAt(0).toUpperCase()}
                        </div>
                        <span>{featuredPost.authorName || featuredPost.author || 'Godol Editorial'}</span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 font-mono">
                          <Eye className="w-3.5 h-3.5 text-blue-500" />
                          {featuredPost.metrics?.views || featuredPost.views || 0}
                        </span>
                        <span className="flex items-center gap-1 font-mono">
                          <ThumbsUp className="w-3.5 h-3.5 text-amber-500" />
                          {featuredPost.metrics?.likes || featuredPost.likes || 0}
                        </span>
                        <span className="text-xs font-bold text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform ml-2">
                          Read Article <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* Other Posts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {otherPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug || post.id}`}
                  className="bg-card border border-border rounded-3xl overflow-hidden hover:shadow-2xl hover:border-primary/40 transition-all duration-300 flex flex-col group cursor-pointer"
                >
                  {(post.featuredImageUrl || post.featured_image_url) ? (
                    <div className="h-48 w-full overflow-hidden bg-muted">
                      <img
                        src={post.featuredImageUrl || post.featured_image_url}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  ) : (
                    <div className="h-48 w-full bg-primary/5 flex items-center justify-center text-primary/40 border-b border-border">
                      <BookOpen className="w-10 h-10" />
                    </div>
                  )}

                  <div className="p-6 flex flex-col flex-grow">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                      <span className="font-bold text-primary uppercase tracking-wider text-[10px]">
                        {post.category || 'Business'}
                      </span>
                      <span className="flex items-center gap-1 text-[11px]">
                        <Clock className="w-3 h-3" />
                        {post.readTime || '5 min read'}
                      </span>
                    </div>

                    <h3 className="font-serif text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                      {post.title}
                    </h3>

                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 mb-6 flex-grow">
                      {post.excerpt}
                    </p>

                    <div className="pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-2 truncate max-w-[140px]">
                        <User className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        <span className="font-medium text-foreground truncate text-xs">
                          {post.authorName || post.author}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 font-mono text-[11px]" title="Views">
                          <Eye className="w-3.5 h-3.5 text-blue-500" />
                          {post.metrics?.views || post.views || 0}
                        </span>
                        <span className="flex items-center gap-1 font-mono text-[11px]" title="Likes">
                          <ThumbsUp className="w-3.5 h-3.5 text-amber-500" />
                          {post.metrics?.likes || post.likes || 0}
                        </span>
                        <span className="text-primary font-bold flex items-center gap-0.5 ml-1">
                          Read <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
