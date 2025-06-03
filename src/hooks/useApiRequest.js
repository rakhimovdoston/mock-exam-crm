import { useState, useEffect } from "react";
import apiClient from "../services/api";

const useApiRequest = (url, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiClient.get(url);
        setData(response);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [...dependencies]);

  return { data, loading, error };
};

export default useApiRequest;