import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initialData } from '../server/data.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project')) {
  console.error('❌ Error: Please specify valid SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env before running this script.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('🌱 Starting Supabase seed process...');

  // 1. Settings
  console.log('1. Seeding platform settings...');
  const { error: errSettings } = await supabase.from('platform_settings').upsert(initialData.settings, { onConflict: 'key' });
  if (errSettings) console.warn('Settings warning:', errSettings.message);
  else console.log('✓ Settings seeded');

  // 2. Categories
  console.log('2. Seeding categories...');
  const { error: errCat } = await supabase.from('categories').upsert(initialData.categories, { onConflict: 'id' });
  if (errCat) console.warn('Categories warning:', errCat.message);
  else console.log('✓ Categories seeded');

  // 3. Instructors
  console.log('3. Seeding instructors...');
  const { error: errInst } = await supabase.from('instructors').upsert(initialData.instructors, { onConflict: 'id' });
  if (errInst) console.warn('Instructors warning:', errInst.message);
  else console.log('✓ Instructors seeded');

  // 4. Courses
  console.log('4. Seeding courses...');
  const coursesToSeed = initialData.courses.map(c => ({
    id: c.id,
    title: c.title,
    slug: c.slug,
    description: c.description,
    price: c.price,
    level: c.level,
    duration_hours: c.durationHours,
    lesson_count: c.lessonCount,
    enrolled_count: c.enrolledCount,
    rating: c.rating,
    featured: c.featured,
    badge: c.badge,
    thumbnail: c.thumbnail,
    instructor_id: c.instructorId,
    instructor_name: c.instructorName,
    category_id: c.categoryId,
    category_name: c.categoryName,
    status: c.status || 'published',
    approval_status: c.approvalStatus || 'approved',
    what_you_learn: c.whatYouLearn,
    requirements: c.requirements,
    sections: c.sections,
    created_at: c.createdAt
  }));
  const { error: errCourses } = await supabase.from('courses').upsert(coursesToSeed, { onConflict: 'id' });
  if (errCourses) console.warn('Courses warning:', errCourses.message);
  else console.log('✓ Courses seeded');

  // 5. Workshops
  console.log('5. Seeding workshops...');
  const { error: errWorkshops } = await supabase.from('workshops').upsert(initialData.workshops, { onConflict: 'id' });
  if (errWorkshops) console.warn('Workshops warning:', errWorkshops.message);
  else console.log('✓ Workshops seeded');

  // 6. Blog
  console.log('6. Seeding blog posts...');
  const blogToSeed = initialData.blog.map(b => ({
    id: b.id,
    title: b.title,
    slug: b.slug,
    excerpt: b.excerpt,
    content: b.content,
    category: b.category,
    author: b.author,
    read_time: b.readTime,
    published: b.published,
    featured: b.featured,
    published_at: b.publishedAt
  }));
  const { error: errBlog } = await supabase.from('blog_posts').upsert(blogToSeed, { onConflict: 'id' });
  if (errBlog) console.warn('Blog warning:', errBlog.message);
  else console.log('✓ Blog posts seeded');

  console.log('🎉 Supabase database seeding complete!');
}

seed().catch(err => {
  console.error('Seed fatal error:', err);
  process.exit(1);
});
