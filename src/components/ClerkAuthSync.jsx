import { useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { auth } from '../lib/auth';

export default function ClerkAuthSync() {
  const { isLoaded, isSignedIn, user } = useUser();

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn && user) {
      const email = user.primaryEmailAddress?.emailAddress;
      const name = user.fullName || user.firstName || (email ? email.split('@')[0] : 'Student');
      if (email) {
        auth.setUser(email, name);
      }
    }
  }, [isLoaded, isSignedIn, user]);

  return null;
}

