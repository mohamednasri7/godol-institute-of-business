import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'wouter';
import {
  Calendar, Clock, User, ArrowLeft, ArrowRight, Eye,
  ThumbsUp, Share2, MessageSquare, Check, Send, Sparkles,
  BookOpen, ChevronRight, Tag, Heart
} from 'lucide-react';
import { apiFetch } from '../lib/api';

export default function BlogPost() {
  const { slug } = useParams();
  const [, setLocation] = useLocation();

  const [post, setPost] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Engagement states
  const [hasLiked, setHasLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [viewsCount, setViewsCount] = useState(0);
  const [shareSuccess, setShareSuccess] = useState(false);

  // Comments state
  const [comments, setComments] = useState([]);
  const [commentName, setCommentName] = useState('');
  const [commentEmail, setCommentEmail] = useState('');
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentSuccess, setCommentSuccess] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setIsLoading(true);
    setError(null);
    setHasLiked(false);
    setShareSuccess(false);

    // Fetch single post by slug (or id) - this endpoint automatically increments views & unique visitors
    apiFetch(`/api/blog/${slug}`)
      .then((data) => {
        if (!data || data.error) {
          setError('Article not found.');
          return;
        }
        setPost(data);
        setLikeCount(data.metrics?.likes || data.likes || 0);
        setViewsCount(data.metrics?.views || data.views || 0);
        setComments(data.comments || []);

        // Fetch other posts for "Related Articles"
        apiFetch('/api/blog')
          .then((all) => {
            const others = (all || []).filter((p) => p.id !== data.id && p.slug !== data.slug);
            const matchingCat = others.filter((p) => p.category === data.category);
            setRelatedPosts((matchingCat.length > 0 ? matchingCat : others).slice(0, 3));
          })
          .catch(() => { });
      })
      .catch((err) => {
        console.error('Failed to load article:', err);
        setError('Unable to load this article. It may be restricted or unavailable.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [slug]);

  const handleLike = async () => {
    if (hasLiked || !post) return;
    setHasLiked(true);
    setLikeCount((prev) => prev + 1);

    try {
      const res = await apiFetch(`/api/blog/${post.slug || post.id}/interact`, {
        method: 'POST',
        body: JSON.stringify({ type: 'like' })
      });
      if (res?.metrics?.likes !== undefined) {
        setLikeCount(res.metrics.likes);
      }
    } catch (err) {
      console.error('Like error:', err);
    }
  };

  const handleShare = async () => {
    if (!post) return;
    const url = window.location.href;

    if (navigator?.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt,
          url: url
        });
      } catch {
        // Fallback to clipboard
      }
    }

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(url);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 3000);
    }

    try {
      await apiFetch(`/api/blog/${post.slug || post.id}/interact`, {
        method: 'POST',
        body: JSON.stringify({ type: 'share' })
      });
    } catch (err) {
      console.error('Share tracking error:', err);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentName.trim() || !commentText.trim() || !post) return;

    setIsSubmittingComment(true);
    try {
      const res = await apiFetch(`/api/blog/${post.slug || post.id}/comments`, {
        method: 'POST',
        body: JSON.stringify({
          authorName: commentName.trim(),
          authorEmail: commentEmail.trim(),
          content: commentText.trim()
        })
      });

      if (res?.comment) {
        setComments((prev) => [...prev, res.comment]);
        setCommentText('');
        setCommentSuccess(true);
        setTimeout(() => setCommentSuccess(false), 4500);
      }
    } catch (err) {
      console.error('Failed to post comment:', err);
      alert('Failed to submit comment. Please try again.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'Finance & Accounting':
      case 'Finance':
        return 'bg-amber-500/10 text-amber-700 border-amber-200';
      case 'Business Strategy':
      case 'Strategy':
        return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'Leadership & HR':
      case 'Leadership':
        return 'bg-purple-500/10 text-purple-700 border-purple-200';
      case 'Digital Marketing':
      case 'Marketing':
        return 'bg-emerald-500/10 text-emerald-700 border-emerald-200';
      default:
        return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-32 pb-24 bg-background">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl text-center">
          <div className="animate-pulse space-y-6">
            <div className="h-6 w-32 bg-muted rounded-full mx-auto" />
            <div className="h-12 w-3/4 bg-muted rounded-2xl mx-auto" />
            <div className="h-6 w-1/2 bg-muted rounded-xl mx-auto" />
            <div className="h-96 w-full bg-muted rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen pt-32 pb-24 bg-background">
        <div className="container mx-auto px-4 md:px-6 max-w-lg text-center">
          <div className="bg-card border border-border rounded-3xl p-10 shadow-sm">
            <h2 className="font-serif text-2xl font-bold text-foreground mb-3">Article Unavailable</h2>
            <p className="text-sm text-muted-foreground mb-6">
              {error || 'This article could not be loaded or may still be in draft review.'}
            </p>
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Blog & Insights</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const coverImage = post.featuredImageUrl || post.featured_image_url;

  return (
    <div className="min-h-screen pt-24 pb-24 bg-background text-foreground">
      {/* Article Header & Breadcrumbs */}
      <div className="container mx-auto px-4 md:px-6 max-w-4xl">
        <div className="mb-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline mb-6 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            <span>Back to All Articles</span>
          </Link>

          {/* Breadcrumb row */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4 flex-wrap">
            <Link href="/" className="hover:text-foreground">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/blog" className="hover:text-foreground">Blog & Insights</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-primary font-medium">{post.category || 'Business'}</span>
          </div>

          {/* Category & Read Time */}
          <div className="flex items-center gap-3 text-xs mb-4 flex-wrap">
            <span className={`px-3 py-1 rounded-full font-bold uppercase tracking-wider text-[10px] border ${getCategoryColor(post.category)}`}>
              {post.category || 'Business'}
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              {post.readTime || '5 min read'}
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'May 2026'}
            </span>
          </div>

          {/* Main Title */}
          <h1 className="font-serif text-3xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
            {post.title}
          </h1>

          {/* Excerpt Lead */}
          {post.excerpt && (
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-6 font-normal border-l-4 border-primary/50 pl-4">
              {post.excerpt}
            </p>
          )}

          {/* Author Byline & Metrics Pill */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-y border-border">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-primary/10 text-primary font-serif font-bold text-base flex items-center justify-center border border-primary/20">
                {(post.authorName || post.author || 'G').charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">{post.authorName || post.author || 'Godol Editorial'}</p>
                <p className="text-xs text-muted-foreground">
                  {post.authorRole === 'instructor' ? 'Faculty Instructor' : 'Godol Institute of Business'}
                </p>
              </div>
            </div>

            {/* Readership metrics */}
            <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
              <span className="flex items-center gap-1.5" title="Total Views">
                <Eye className="w-4 h-4 text-blue-500" />
                <strong className="text-foreground">{viewsCount}</strong> views
              </span>
              <span className="flex items-center gap-1.5" title="Unique Readers">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <strong className="text-foreground">{post.metrics?.uniqueVisitors || 0}</strong> readers
              </span>
              <span className="flex items-center gap-1.5" title="Comments">
                <MessageSquare className="w-4 h-4 text-purple-500" />
                <strong className="text-foreground">{comments.length}</strong> comments
              </span>
            </div>
          </div>
        </div>

        {/* Hero Featured Image */}
        {coverImage && (
          <div className="rounded-3xl overflow-hidden border border-border shadow-lg mb-10 bg-muted">
            <img
              src={coverImage}
              alt={post.title}
              className="w-full max-h-[500px] object-cover"
            />
          </div>
        )}

        {/* Article Body Content */}
        <article className="prose prose-lg dark:prose-invert max-w-none text-foreground/90 leading-relaxed space-y-6 mb-12">
          {post.content && post.content.includes('<') ? (
            <div dangerouslySetInnerHTML={{ __html: post.content }} />
          ) : (
            <div className="whitespace-pre-line text-base md:text-lg leading-relaxed">
              {post.content || post.excerpt}
            </div>
          )}
        </article>

        {/* Interactive Engagement Bar (Like & Share) */}
        <div className="liquid-glass liquid-glass-squircle p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 mb-14">
          <div className="flex items-center gap-3">
            <button
              onClick={handleLike}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-xs ${hasLiked
                  ? 'bg-amber-500 text-white shadow-amber-500/20'
                  : 'bg-muted hover:bg-muted/80 text-foreground border border-border'
                }`}
            >
              <ThumbsUp className={`w-4 h-4 ${hasLiked ? 'fill-current' : ''}`} />
              <span>{hasLiked ? 'Liked' : 'Like Article'} ({likeCount})</span>
            </button>

            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-muted hover:bg-muted/80 text-foreground border border-border transition-colors"
            >
              {shareSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span className="text-emerald-600 font-semibold">Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-primary" />
                  <span>Share Article</span>
                </>
              )}
            </button>
          </div>

          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <span>Did you find this insight valuable?</span>
            <span className="font-semibold text-primary">Share with your network</span>
          </div>
        </div>

        {/* Author Bio Box */}
        <div className="liquid-glass liquid-glass-squircle p-6 md:p-8 mb-14 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-primary text-primary-foreground font-serif font-bold text-2xl flex items-center justify-center flex-shrink-0 shadow-md">
            {(post.authorName || post.author || 'G').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Written By</span>
            <h3 className="font-serif text-lg font-bold text-foreground">{post.authorName || post.author || 'Godol Editorial'}</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Faculty leader and practitioner at the Godol Institute of Business, specializing in regional market growth, practical leadership frameworks, and commercial strategy across East Africa.
            </p>
          </div>
        </div>

        {/* Discussion & Comments Section */}
        <div className="space-y-6 mb-16 pt-6 border-t border-border">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-2xl font-bold text-foreground flex items-center gap-2.5">
              <MessageSquare className="w-6 h-6 text-primary" />
              <span>Reader Discussion ({comments.length})</span>
            </h3>
          </div>

          {/* Comment Form */}
          <form onSubmit={handleCommentSubmit} className="liquid-glass liquid-glass-squircle p-6 md:p-8 shadow-sm space-y-4">
            <div>
              <h4 className="font-bold text-sm text-foreground">Leave a Comment</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Join the conversation. Share your perspective, questions, or regional insights.
              </p>
            </div>

            {commentSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-2 border border-emerald-200 dark:border-emerald-800">
                <Check className="w-4 h-4 flex-shrink-0" />
                <span>Your comment has been published directly to the discussion!</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Your Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amina Warsame"
                  value={commentName}
                  onChange={(e) => setCommentName(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-border bg-background text-foreground text-xs outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Email Address (Optional)</label>
                <input
                  type="email"
                  placeholder="e.g. amina@example.com (not published)"
                  value={commentEmail}
                  onChange={(e) => setCommentEmail(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-border bg-background text-foreground text-xs outline-none focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Your Perspective *</label>
              <textarea
                rows={4}
                required
                placeholder="Share your thoughts or real-world experience on this topic..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-full p-3.5 rounded-xl border border-border bg-background text-foreground text-xs outline-none focus:border-primary resize-none"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmittingComment}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmittingComment ? 'Posting...' : 'Post Comment'}</span>
              </button>
            </div>
          </form>

          {/* Comments List */}
          <div className="space-y-3 pt-2">
            {comments.length === 0 ? (
              <div className="p-8 text-center bg-card border border-border rounded-2xl">
                <p className="text-xs text-muted-foreground italic">
                  No comments yet. Be the first to share your thoughts on this article!
                </p>
              </div>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="bg-card border border-border rounded-2xl p-5 text-xs shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                        {(c.authorName || 'U').charAt(0).toUpperCase()}
                      </div>
                      <span className="font-bold text-foreground text-sm">{c.authorName}</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'Recent'}
                    </span>
                  </div>
                  <p className="text-foreground/80 leading-relaxed pl-9 text-xs sm:text-sm">
                    {c.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* More Articles from Godol Institute */}
        {relatedPosts.length > 0 && (
          <div className="pt-8 border-t border-border">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif text-2xl font-bold text-foreground">
                More Insights from Godol Institute
              </h3>
              <Link href="/blog" className="text-xs text-primary font-bold hover:underline flex items-center gap-1">
                View all articles <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/blog/${rel.slug || rel.id}`}
                  className="liquid-glass liquid-glass-squircle liquid-glass-interactive overflow-hidden flex flex-col group cursor-pointer"
                >
                  {(rel.featuredImageUrl || rel.featured_image_url) ? (
                    <div className="h-40 w-full overflow-hidden bg-muted">
                      <img
                        src={rel.featuredImageUrl || rel.featured_image_url}
                        alt={rel.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  ) : (
                    <div className="h-40 w-full bg-primary/10 flex items-center justify-center text-primary">
                      <BookOpen className="w-8 h-8 opacity-40" />
                    </div>
                  )}

                  <div className="p-5 flex flex-col flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary mb-2">
                      {rel.category || 'Business'}
                    </span>
                    <h4 className="font-serif text-base font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
                      {rel.title}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-4 flex-1">
                      {rel.excerpt}
                    </p>
                    <div className="pt-3 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                      <span>{rel.readTime || '5 min read'}</span>
                      <span className="flex items-center gap-1 text-primary font-bold font-sans">
                        Read <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

