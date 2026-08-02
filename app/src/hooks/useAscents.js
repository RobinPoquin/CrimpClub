import { useState, useEffect, useCallback } from 'react';
import { getAscentsPaginated, getAscents } from '../../lib/db';

// Hook qui gère le chargement paginé des ascensions
// Retourne les ascensions, l'état de chargement et les fonctions de contrôle
export function useAscents(userId) {
  const [ascents, setAscents]         = useState([]);
  const [allAscents, setAllAscents]   = useState([]); // pour les stats
  const [loading, setLoading]         = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore]         = useState(true);
  const [page, setPage]               = useState(0);

  // Charge la première page + toutes les ascensions pour les stats
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [paginated, all] = await Promise.all([
        getAscentsPaginated(userId, 0),
        getAscents(userId),
      ]);
      setAscents(paginated);
      setAllAscents(all);
      setPage(0);
      setHasMore(paginated.length === 20);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Charge la page suivante
  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const data     = await getAscentsPaginated(userId, nextPage);
      setAscents(prev => [...prev, ...data]);
      setPage(nextPage);
      setHasMore(data.length === 20);
    } finally {
      setLoadingMore(false);
    }
  }, [userId, page, hasMore, loadingMore]);

  useEffect(() => {
    if (userId) load();
  }, [userId]);

  return { ascents, allAscents, loading, loadingMore, hasMore, load, loadMore };
}