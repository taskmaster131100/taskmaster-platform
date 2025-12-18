import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function DashboardRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/', { replace: true });
  }, [navigate]);

  return null;
}

export function VisaoGeralRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/', { replace: true });
  }, [navigate]);

  return null;
}
