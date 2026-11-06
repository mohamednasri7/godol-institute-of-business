import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  ArrowRight, 
  X, 
  Eye, 
  ThumbsUp, 
  Share2, 
  MessageSquare, 
  Check, 
  Send,
  BookOpen,
  Sparkles
} from 'lucide-react';
import { apiFetch } from '../lib/api';

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [activePost, setActivePost] = useState(null);
  const [postComments, setPostComments] = useState([]);
  const [metrics, setMetrics] = useState({ views: 0, likes: 0, shares: 0, uniqueVisitors: 0 });
  const [hasLiked, setHasLiked] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  
  // Comment form state
  const [commentName, setCommentName] = useState('');
  const [commentEmail, setCommentEmail] = useState('');
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentSuccess, setCommentSuccess] = useState(false);

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

  const openPostModal = async (post) => {
    setActivePost(post);
    setHasLiked(false);
    setShareSuccess(false);
    setCommentSuccess(false);
    setPostComments(post.comments || []);
    setMetrics({
      views: post.metrics?.views || post.views || 0,
      uniqueVisitors: post.metrics?.uniqueVisitors || 0,
      likes: post.metrics?.likes || post.likes || 0,
      shares: post.metrics?.shares || 0
    });

    // Call single post endpoint to record view and fetch latest comments & metrics
    try {
      const detailed = await apiFetch(`/api/blog/${post.id}`);
      if (detailed) {
        if (detailed.metrics) {
          setMetrics(detailed.metrics);
        }
        if (detailed.comments) {
          setPostComments(detailed.comments);
        }
      }
    } catch (err) {
      console.error('Error fetching post details:', err);
    }
  };

  const handleLike = async () => {
    if (hasLiked || !activePost) return;
    try {
      const res = await apiFetch(`/api/blog/${activePost.id}/interact`, {
        method: 'POST',
        body: JSON.stringify({ type: 'like' })
      });
      setHasLiked(true);
      if (res?.metrics?.likes !== undefined) {
        setMetrics((prev) => ({ ...prev, likes: res.metrics.likes }));
      } else {
        setMetrics((prev) => ({ ...prev, likes: prev.likes + 1 }));
      }
    } catch (err) {
      console.error('Like error:', err);
    }
  };

  const handleShare = async () => {
    if (!activePost) return;
    const shareUrl = window.location.origin + `/blog?id=${activePost.id}`;
    
    // Copy to clipboard
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(shareUrl);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 3000);
    }

    try {
      const res = await apiFetch(`/api/blog/${activePost.id}/interact`, {
        method: 'POST',
        body: JSON.stringify({ type: 'share' })
      });
      if (res?.metrics?.shares !== undefined) {
        setMetrics((prev) => ({ ...prev, shares: res.metrics.shares }));
      }
    } catch (err) {
      console.error('Share tracking error:', err);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentName.trim() || !commentText.trim() || !activePost) return;

    setIsSubmittingComment(true);
    try {
      const res = await apiFetch(`/api/blog/${activePost.id}/comments`, {
        method: 'POST',
        body: JSON.stringify({
          authorName: commentName.trim(),
          authorEmail: commentEmail.trim(),
          content: commentText.trim()
        })
      });

      if (res?.comment) {
        setPostComments((prev) => [...prev, res.comment]);
        setCommentText('');
        setCommentSuccess(true);
        setTimeout(() => setCommentSuccess(false), 4000);
      }
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

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
            Business insights, market analysis, and practical leadership frameworks authored by our faculty and regional business experts.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-12">
        {posts.length === 0 && !isLoading ? (
          <div className="bg-card border border-border rounded-2xl p-12 text-center max-w-md mx-auto my-12">
            <h3 className="text-lg font-bold text-foreground mb-2">No Articles Published Yet</h3>
            <p className="text-sm text-muted-foreground">
              Articles and industry insights will appear here once published from the faculty or admin portal.
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
                onClick={() => openPostModal(featuredPost)}
                className="rounded-3xl overflow-hidden border border-border bg-card hover:shadow-2xl transition-all duration-300 group cursor-pointer mb-14"
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
                        {featuredPost.category}
                      </span>
                      <span>•</span>
                      <span>{featuredPost.readTime || '5 min read'}</span>
                      <span>•</span>
                      <span>{featuredPost.publishedAt ? new Date(featuredPost.publishedAt).toLocaleDateString() : 'May 2026'}</span>
                    </div>

                    <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-4 group-hover:text-primary transition-colors leading-tight">
                      {featuredPost.title}
                    </h2>

                    <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                      {featuredPost.excerpt}
                    </p>

                    <div className="flex items-center justify-between mt-auto pt-6 border-t border-border flex-wrap gap-3">
                      <div className="flex items-center gap-2 text-xs text-foreground font-medium">
                        <User className="w-4 h-4 text-primary" />
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
              </div>
            )}

            {/* Other Posts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {otherPosts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => openPostModal(post)}
                  className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-xl hover:border-primary/40 transition-all duration-300 flex flex-col cursor-pointer group"
                >
                  {(post.featuredImageUrl || post.featured_image_url) && (
                    <div className="h-44 w-full overflow-hidden bg-muted">
                      <img
                        src={post.featuredImageUrl || post.featured_image_url}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}

                  <div className="p-6 flex flex-col flex-grow">
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
                      <span className="font-medium text-foreground truncate max-w-[120px]">
                        {post.authorName || post.author}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 font-mono text-[11px]">
                          <Eye className="w-3 h-3 text-blue-500" />
                          {post.metrics?.views || post.views || 0}
                        </span>
                        <span className="flex items-center gap-1 font-mono text-[11px]">
                          <ThumbsUp className="w-3 h-3 text-amber-500" />
                          {post.metrics?.likes || post.likes || 0}
                        </span>
                        <span className="text-primary font-bold flex items-center gap-0.5 ml-1">
                          Read <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Article Reader Modal with RBAC interaction & comments */}
      {activePost && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white text-gray-900 rounded-3xl max-w-3xl w-full shadow-2xl p-6 md:p-10 my-8 relative border border-gray-100 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setActivePost(null)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors z-20"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Featured Image Header */}
            {(activePost.featuredImageUrl || activePost.featured_image_url) && (
              <div className="w-full h-64 md:h-80 rounded-2xl overflow-hidden mb-6 -mt-2">
                <img
                  src={activePost.featuredImageUrl || activePost.featured_image_url}
                  alt={activePost.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Metadata Bar */}
            <div className="flex items-center gap-2.5 text-xs text-gray-500 mb-3 flex-wrap">
              <span className="font-bold text-primary uppercase tracking-wider bg-primary/10 px-2.5 py-0.5 rounded-full">
                {activePost.category || 'Business'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                {activePost.readTime || '5 min read'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-gray-400" />
                By {activePost.authorName || activePost.author || 'Godol Editorial'}
              </span>
            </div>

            <h1 className="font-serif text-2xl md:text-3xl font-bold text-gray-900 mb-4 leading-tight">
              {activePost.title}
            </h1>

            {/* Engagement & Metrics Bar */}
            <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-2xl border border-gray-200 mb-8 flex-wrap gap-3">
              <div className="flex items-center gap-4 text-xs font-mono text-gray-600">
                <span className="flex items-center gap-1.5" title="Total Views">
                  <Eye className="w-4 h-4 text-blue-600" />
                  <strong className="text-gray-900">{metrics.views}</strong> views
                </span>
                <span className="flex items-center gap-1.5" title="Unique Readers">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <strong className="text-gray-900">{metrics.uniqueVisitors}</strong> unique
                </span>
                <span className="flex items-center gap-1.5" title="Reader Comments">
                  <MessageSquare className="w-4 h-4 text-purple-600" />
                  <strong className="text-gray-900">{postComments.length}</strong> comments
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleLike}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    hasLiked
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
                  }`}
                >
                  <ThumbsUp className={`w-3.5 h-3.5 ${hasLiked ? 'fill-amber-600 text-amber-600' : ''}`} />
                  <span>{hasLiked ? 'Liked' : 'Like'} ({metrics.likes})</span>
                </button>

                <button
                  onClick={handleShare}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 transition-colors"
                >
                  {shareSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Article Body Content */}
            <div className="prose text-sm text-gray-800 leading-relaxed space-y-4 mb-10 border-b border-gray-200 pb-8">
              {activePost.content && activePost.content.includes('<') ? (
                <div dangerouslySetInnerHTML={{ __html: activePost.content }} />
              ) : (
                <div className="whitespace-pre-line">
                  {activePost.content || activePost.excerpt}
                </div>
              )}
            </div>

            {/* Comments & Discussion Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-lg font-bold text-gray-900 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  Discussion ({postComments.length})
                </h3>
              </div>

              {/* Comment submission form */}
              <form onSubmit={handleCommentSubmit} className="bg-gray-50 rounded-2xl p-5 border border-gray-200 space-y-3">
                <p className="text-xs font-bold text-gray-700">Join the discussion</p>
                
                {commentSuccess && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs flex items-center gap-1.5 border border-emerald-200">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Your comment has been added!</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Your Name *"
                    value={commentName}
                    onChange={(e) => setCommentName(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-gray-200 text-xs outline-none focus:border-primary bg-white text-gray-900"
                  />
                  <input
                    type="email"
                    placeholder="Your Email (optional, not published)"
                    value={commentEmail}
                    onChange={(e) => setCommentEmail(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-gray-200 text-xs outline-none focus:border-primary bg-white text-gray-900"
                  />
                </div>

                <textarea
                  rows={3}
                  required
                  placeholder="Share your perspective or ask a question..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 text-xs outline-none focus:border-primary bg-white text-gray-900 resize-none"
                />

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmittingComment}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmittingComment ? 'Posting...' : 'Post Comment'}</span>
                  </button>
                </div>
              </form>

              {/* Comments List */}
              <div className="space-y-3 pt-2">
                {postComments.length === 0 ? (
                  <p className="text-xs text-gray-500 italic text-center py-4">
                    No comments yet. Be the first to share your thoughts on this article!
                  </p>
                ) : (
                  postComments.map((comment) => (
                    <div key={comment.id} className="bg-gray-50 rounded-2xl p-4 border border-gray-200 text-xs">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-[11px]">
                            {comment.authorName ? comment.authorName.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <span className="font-bold text-gray-900">{comment.authorName}</span>
                        </div>
                        <span className="text-[10px] text-gray-400">
                          {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : 'Today'}
                        </span>
                      </div>
                      <p className="text-gray-700 leading-relaxed pl-8">
                        {comment.content}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setActivePost(null)}
                className="px-6 py-2.5 rounded-xl bg-gray-900 text-white font-semibold text-xs hover:bg-gray-800 transition-colors"
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
