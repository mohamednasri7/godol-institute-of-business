// Student, Admin & Instructor Auth Store
export const auth = {
  getUser() {
    const email = localStorage.getItem('godol_email');
    const name = localStorage.getItem('godol_name');
    if (!email) return null;
    return { email, name: name || email.split('@')[0] };
  },
  setUser(email, name) {
    localStorage.setItem('godol_email', email);
    if (name) localStorage.setItem('godol_name', name);
  },
  logout() {
    localStorage.removeItem('godol_email');
    localStorage.removeItem('godol_name');
  },
  getAdmin() {
    const token = localStorage.getItem('godol_admin_token');
    const email = localStorage.getItem('godol_admin_email');
    if (!token && !email) return null;
    return { token: token || 'godol_admin_mock_token_2026', email: email || 'admin@godolinstitute.so' };
  },
  setAdmin(token, email) {
    localStorage.setItem('godol_admin_token', token || 'godol_admin_mock_token_2026');
    localStorage.setItem('godol_admin_email', email);
  },
  logoutAdmin() {
    localStorage.removeItem('godol_admin_token');
    localStorage.removeItem('godol_admin_email');
  },
  getInstructor() {
    const raw = localStorage.getItem('godol_instructor');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
  setInstructor(instructorData) {
    localStorage.setItem('godol_instructor', JSON.stringify(instructorData));
  },
  logoutInstructor() {
    localStorage.removeItem('godol_instructor');
  }
};

