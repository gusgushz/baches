const API_URL_BASE = (import.meta.env.VITE_BACKEND_URL ? String(import.meta.env.VITE_BACKEND_URL).replace(/\/$/, '') : 'https://baches-yucatan.onrender.com') + '/api/workers';

type UpdatePayload = {
  name?: string;
  secondName?: string | null;
  lastname?: string;
  secondLastname?: string | null;
  role?: string;
  email?: string | null;
  phoneNumber?: number | string | null;
  fechaNacimiento?: string | null; // ISO date
  status?: string | null;
  photoUrl?: string | null;
  assignedVehicleId?: string | null;
};

const updateWorker = async (id: string, data: UpdatePayload, token?: string) => {
  if (!token) throw new Error('No autorizado');
  const res = await fetch(`${API_URL_BASE}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || `Error ${res.status}`);
  }

  return res.json().catch(() => ({}));
};

export default updateWorker;
