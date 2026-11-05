import React, { useEffect } from 'react';
import { Switch, Route, useLocation } from 'wouter';
import Layout from './components/Layout';
import ChatWidget from './components/ChatWidget';
import ClerkAuthSync from './components/ClerkAuthSync';

// Pages
import Home from './pages/Home';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import Checkout from './pages/Checkout';
import Categories from './pages/Categories';
import Instructors from './pages/Instructors';
import InstructorDetail from './pages/InstructorDetail';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Blog from './pages/Blog';
import About from './pages/About';
import Contact from './pages/Contact';
import VerifyCertificate from './pages/VerifyCertificate';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import NotFound from './pages/NotFound';

// Instructor Pages
import InstructorLogin from './pages/instructor/InstructorLogin';
import InstructorDashboard from './pages/instructor/InstructorDashboard';

// Admin Pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCourses from './pages/admin/AdminCourses';
import AdminCourseContent from './pages/admin/AdminCourseContent';
import AdminInstructors from './pages/admin/AdminInstructors';
import AdminWorkshops from './pages/admin/AdminWorkshops';
import AdminStudents from './pages/admin/AdminStudents';
import AdminEnrollments from './pages/admin/AdminEnrollments';
import AdminBlog from './pages/admin/AdminBlog';
import AdminCertificates from './pages/admin/AdminCertificates';
import AdminPayments from './pages/admin/AdminPayments';
import AdminSettings from './pages/admin/AdminSettings';
import AdminRevenue from './pages/admin/AdminRevenue';
import AdminAuditLogs from './pages/admin/AdminAuditLogs';
import AdminCategories from './pages/admin/AdminCategories';

if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    const resetScroll = () => {
      window.scrollTo(0, 0);
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
    };

    resetScroll();
    const rafId = requestAnimationFrame(resetScroll);
    const timer = setTimeout(resetScroll, 30);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timer);
    };
  }, [location]);

  return null;
}

export default function App() {
  const hasClerk = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

  return (
    <>
      {hasClerk && <ClerkAuthSync />}
      <ScrollToTop />
      <Switch>
        {/* Public Routes */}
        <Route path="/">
          <Layout><Home /></Layout>
        </Route>
        <Route path="/courses">
          <Layout><Courses /></Layout>
        </Route>
        <Route path="/courses/:id">
          <Layout><CourseDetail /></Layout>
        </Route>
        <Route path="/checkout/:enrollmentId" component={Checkout} />
        <Route path="/categories">
          <Layout><Categories /></Layout>
        </Route>
        <Route path="/instructors">
          <Layout><Instructors /></Layout>
        </Route>
        <Route path="/instructors/:id">
          <Layout><InstructorDetail /></Layout>
        </Route>
        <Route path="/dashboard">
          <Layout><Dashboard /></Layout>
        </Route>
        <Route path="/blog">
          <Layout><Blog /></Layout>
        </Route>
        <Route path="/about">
          <Layout><About /></Layout>
        </Route>
        <Route path="/contact">
          <Layout><Contact /></Layout>
        </Route>
        <Route path="/verify">
          <Layout><VerifyCertificate /></Layout>
        </Route>
        <Route path="/verify/:code">
          <Layout><VerifyCertificate /></Layout>
        </Route>
        <Route path="/privacy">
          <Layout><Privacy /></Layout>
        </Route>
        <Route path="/terms">
          <Layout><Terms /></Layout>
        </Route>

        {/* Auth */}
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />

        {/* Instructor Portal */}
        <Route path="/instructor/login" component={InstructorLogin} />
        <Route path="/instructor/dashboard" component={InstructorDashboard} />
        <Route path="/instructor" component={InstructorDashboard} />

        {/* Admin Portal */}
        <Route path="/admin" component={AdminLogin} />
        <Route path="/admin/dashboard" component={AdminDashboard} />
        <Route path="/admin/courses" component={AdminCourses} />
        <Route path="/admin/course-content" component={AdminCourseContent} />
        <Route path="/admin/categories" component={AdminCategories} />
        <Route path="/admin/instructors" component={AdminInstructors} />
        <Route path="/admin/workshops" component={AdminWorkshops} />
        <Route path="/admin/students" component={AdminStudents} />
        <Route path="/admin/enrollments" component={AdminEnrollments} />
        <Route path="/admin/payments" component={AdminPayments} />
        <Route path="/admin/revenue" component={AdminRevenue} />
        <Route path="/admin/audit-logs" component={AdminAuditLogs} />
        <Route path="/admin/blog" component={AdminBlog} />
        <Route path="/admin/certificates" component={AdminCertificates} />
        <Route path="/admin/settings" component={AdminSettings} />

        {/* 404 */}
        <Route>
          <Layout><NotFound /></Layout>
        </Route>
      </Switch>

      <ChatWidget />
    </>
  );
}
