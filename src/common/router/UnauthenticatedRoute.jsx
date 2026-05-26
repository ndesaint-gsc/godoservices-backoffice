import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getLandingRoute } from '@/common/router/getLandingRoute';
import { selectHasCustomer } from '@/common/features/customer/customerSlice';

const UnauthenticatedRoute = ({ children }) => {
  const { isAuthenticated, user } = useSelector((s) => s.auth);
  const hasCustomer = useSelector(selectHasCustomer);
  if (isAuthenticated) {
    return <Navigate to={getLandingRoute(user?.roles, hasCustomer)} replace />;
  }
  return children;
};

export default UnauthenticatedRoute;
