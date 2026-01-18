import { useState } from 'react';
import axios from 'axios';

export const usePOST = (url) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetch = async (body) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(url, body);
      setLoading(false);
      return res.data;
    } catch (err) {
      setLoading(false);
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  return [loading, fetch, error];
};
