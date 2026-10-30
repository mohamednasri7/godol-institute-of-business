import React from 'react';
import { Switch, Route } from 'wouter';
import Layout from './components/Layout';
import ChatWidget from './components/ChatWidget';

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
import NotFound from './pages/NotFound';

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

export default function App() {
  return (
    <>
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

        {/* Auth */}
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />

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
