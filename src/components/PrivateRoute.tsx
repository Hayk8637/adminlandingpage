import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { auth } from '../firebase-config'; 

interface PrivateRouteProps {
  element: React.ReactElement;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ element }) => {
  const [user, setUser] = React.useState<any>(null);
  const location = useLocation();

  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return () => unsubscribe();
  }, []);

  return user ? (
    element
  ) : (
    <Navigate to="/dashboard" state={{ from: location }} replace />
  );
};

export default PrivateRoute;