// webapp/src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // --- Log Awal ---
  console.log('[ProtectedRoute] Rendering...', {
    pathname: location.pathname,
    isLoading,
    user: user ? { id: user.id, role: user.role } : user, // Log user or null/undefined safely
    roles,
  });
  // ---------------

  if (isLoading) {
    console.log('[ProtectedRoute] Status: Loading...');
    return <div>Memeriksa status login...</div>;
  }

  if (!user) {
    console.log('[ProtectedRoute] Status: No user found, redirecting to login.');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // --- Cek Role dengan Logging Tambahan ---
  let roleCheckPassed = true; // Asumsikan lolos jika tidak ada roles prop
  if (roles && roles.length > 0) {
    console.log('[ProtectedRoute] Checking roles:', roles);
    // Pastikan user ADA dan memiliki properti 'role' SEBELUM cek includes
    if (user && typeof user.role === 'string') {
      if (!roles.includes(user.role)) {
        // Role tidak cocok
        roleCheckPassed = false;
        console.warn(
          `[ProtectedRoute] Role mismatch! User role "${user.role}" not in allowed roles: ${roles.join(', ')}. Redirecting...`
        );
      } else {
        console.log(`[ProtectedRoute] Role check passed for role "${user.role}".`);
      }
    } else {
      // User ada tapi tidak punya role string? Ini aneh.
      roleCheckPassed = false; // Anggap gagal jika role tidak valid
      console.error(
        `[ProtectedRoute] User object exists but 'role' is missing or not a string! User object:`, user, `. Redirecting...`
      );
    }
  } else {
     console.log('[ProtectedRoute] No specific roles required for this route.');
  }
  // ------------------------------------

  // Jika cek role gagal, redirect
  if (!roleCheckPassed) {
    return <Navigate to="/" replace />; // Redirect ke halaman utama
  }

  // Jika semua cek lolos, render children
  console.log('[ProtectedRoute] Access granted.');
  return <>{children}</>;
};

export default ProtectedRoute;