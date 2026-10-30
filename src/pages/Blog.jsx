import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, ArrowRight, X } from 'lucide-react';
import { apiFetch } from '../lib/api';

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [activePost, setActivePost] = useState(null);

  useEffect(() => {
    setIsLoading(true);
    apiFetch('/api/blog')
      .then(setPosts)
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  const categories = ['All', ...Array.from(new Set(posts.map((p) => p.category).filter(Boolean)))];

  const filteredPosts =
    selectedCategory === 'All'
      ? posts
      : posts.filter((p) => p.category === selectedCategory);

  const featuredPost = filteredPosts.find((p) => p.featured) || filteredPosts[0];
  const otherPosts = filteredPosts.filter((p) => p.id !== featuredPost?.id);

  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'Finance':
        return 'hsl(42 92% 48%)';
      case 'Strategy':
        return 'hsl(215 72% 24%)';
      case 'Leadership':
        return 'hsl(280 55% 40%)';
      case 'Marketing':
        return 'hsl(160 60% 30%)';
      default:
        return 'hsl(215 72% 24%)';
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-24 bg-background">
      {/* Blog Hero Banner */}
      <div className="hero-gradient py-20 text-white">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <div
            className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold tracking-widest uppercase mb-6"
            style={{ background: 'hsl(42 92% 52% / 0.2)', color: 'hsl(42 92% 65%)' }}
          >
            Insights & Ideas
          </div>
          <h1 className="font-serif text-4xl md:text-6xl font-bold mb-4">
            The Godol Institute Blog
          </h1>
          <p className="text-white/70 text-lg max-w-xl mx-auto leading-relaxed">
            Business insights, market analysis, and practical advice for entrepreneurs and leaders in East Africa.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-12">
        {posts.length === 0 && !isLoading ? (
          <div className="bg-card border border-border rounded-2xl p-12 text-center max-w-md mx-auto my-12">
            <h3 className="text-lg font-bold text-foreground mb-2">No Articles Published Yet</h3>
            <p className="text-sm text-muted-foreground">
              Articles and industry insights will appear here once published from the admin panel.
            </p>
          </div>
        ) : (
          <>
            {/* Category Filter Pills */}
            <div className="flex gap-2 flex-wrap mb-12">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2 rounded-full text-xs font-semibold transition-all border ${
                selectedCategory === cat
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-card text-muted-foreground border-border hover:border-primary/30 hover:text-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Featured Blog Post */}
        {featuredPost && (
          <div
            onClick={() => setActivePost(featuredPost)}
            className="rounded-3xl overflow-hidden border border-border bg-card hover:shadow-2xl transition-all duration-300 group cursor-pointer mb-14"
          >
            <div className="grid grid-cols-1 lg:grid-cols-5">
              <div
                className="lg:col-span-2 min-h-64 flex items-center justify-center p-12 text-center text-white"
                style={{ background: getCategoryColor(featuredPost.category) }}
              >
                <div>
                  <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center mx-auto mb-4 border border-white/20">
                    <ArrowRight className="w-6 h-6 text-white group-hover:translate-x-1 transition-transform" />
                  </div>
                  <span className="text-white/80 text-xs font-bold uppercase tracking-widest">
                    Featured Analysis
                  </span>
                </div>
              </div>

              <div className="lg:col-span-3 p-8 md:p-12 flex flex-col justify-center">
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                  <span className="font-bold text-primary uppercase tracking-wider">
                    {featuredPost.category}
                  </span>
                  <span>•</span>
                  <span>{featuredPost.readTime || '5 min read'}</span>
                  <span>•</span>
                  <span>{featuredPost.publishedAt || 'May 2026'}</span>
                </div>

                <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-4 group-hover:text-primary transition-colors leading-tight">
                  {featuredPost.title}
                </h2>

                <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                  {featuredPost.excerpt}
                </p>

                <div className="flex items-center justify-between mt-auto pt-6 border-t border-border">
                  <div className="flex items-center gap-2 text-xs text-foreground font-medium">
                    <User className="w-4 h-4 text-primary" />
                    <span>{featuredPost.author || 'Godol Editorial'}</span>
                  </div>

                  <span className="text-xs font-bold text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Read Article <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Other Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {otherPosts.map((post) => (
            <div
              key={post.id}
              onClick={() => setActivePost(post)}
              className="bg-card border border-border rounded-2xl p-6 hover:shadow-xl hover:border-primary/30 transition-all duration-300 flex flex-col cursor-pointer group"
            >
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                <span className="font-bold text-primary uppercase tracking-wider">
                  {post.category}
                </span>
                <span>{post.readTime || '5 min read'}</span>
              </div>

              <h3 className="font-serif text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors line-clamp-2">
                {post.title}
              </h3>

              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 mb-6 flex-grow">
                {post.excerpt}
              </p>

              <div className="pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{post.author}</span>
                <span className="text-primary font-bold flex items-center gap-1">
                  Read <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </>
    )}
  </div>

      {/* Article Reader Modal */}
      {activePost && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl p-8 md:p-12 my-8 relative">
            <button
              onClick={() => setActivePost(null)}
              className="absolute top-6 right-6 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 text-xs text-muted-foreground mb-4">
              <span className="font-bold text-primary uppercase tracking-wider">
                {activePost.category}
              </span>
              <span>•</span>
              <span>{activePost.readTime}</span>
              <span>•</span>
              <span>By {activePost.author}</span>
            </div>

            <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-6 leading-tight">
              {activePost.title}
            </h1>

            <div className="prose text-sm text-foreground/80 leading-relaxed whitespace-pre-line space-y-4">
              {activePost.content || activePost.excerpt}
            </div>

            <div className="mt-8 pt-6 border-t border-border flex justify-end">
              <button
                onClick={() => setActivePost(null)}
                className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-semibold text-xs"
              >
                Close Article
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

