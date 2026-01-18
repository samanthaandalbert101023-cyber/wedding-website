import { useState, useEffect } from 'react';
import axios from 'axios';

export const useGET = (endpoint, autoFetch = true) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  // Dynamic fetch: can override the endpoint
  const fetch = async (customEndpoint) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(customEndpoint || endpoint);
      setData(res.data);
      return res.data;
    } catch (err) {
      setError(err.message || 'Error fetching data');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch on mount if desired
  useEffect(() => {
    if (autoFetch) fetch();
  }, [endpoint]);

  return [loading, data, fetch, error];
};
