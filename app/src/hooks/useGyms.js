import { useState, useEffect, useCallback } from 'react';
import { getGyms } from '../../lib/gyms';

// Hook qui gère le chargement des salles
export function useGyms(userId) {
  const [gyms, setGyms]       = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getGyms(userId);
      setGyms(data);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) load();
  }, [userId]);

  return { gyms, loading, load };
}