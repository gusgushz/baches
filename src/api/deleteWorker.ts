const API_BASE = import.meta.env.VITE_BACKEND_URL || 'https://baches-yucatan-1.onrender.com/api';

const deleteWorker = async (id: string, token?: string) => {
  if (!token) throw new Error('No autorizado');
  const res = await fetch(`${API_BASE}/workers/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Error ${res.status}`);
  }

  return true;
};

export default deleteWorker;
