import type { Employee } from "../models";

const API_URL = (import.meta.env.VITE_BACKEND_URL ? String(import.meta.env.VITE_BACKEND_URL).replace(/\/$/, '') : 'https://baches-yucatan.onrender.com') + '/workers';

function extractArrayFromResponse(json: any): any[] {
  if (!json) return [];
  if (Array.isArray(json)) return json;
  if (Array.isArray(json.workers)) return json.workers;
  if (Array.isArray(json.data)) return json.data;
  if (Array.isArray(json.docs)) return json.docs;
  if (Array.isArray(json.items)) return json.items;
  const arrKey = Object.keys(json).find(k => Array.isArray(json[k]));
  if (arrKey) return json[arrKey];
  return [];
}

const getWorkers = async (token?: string): Promise<Employee[]> => {
  if (!token) throw new Error('No autorizado');

  const res = await fetch(API_URL, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || `Error ${res.status}`);
  }

  const json = await res.json().catch(() => ({}));
  // Log raw response to help debugging
  console.debug('getWorkers raw response:', json);
  const items = extractArrayFromResponse(json) as any[];

  return items.map((w: any) => ({
    id: w.id || w._id || String(w.id || ''),
    name: w.name || w.fullname || w.username || 'Sin nombre',
    role: w.role || w.position || 'trabajador',
    email: w.email ?? null,
    // map lastname and possible variants; ensure non-empty string to satisfy type
    lastname: w.lastname || w.lastName || w.last_name || w.surname || '',
    secondName: w.secondName || w.middleName || w.second_name || null,
    secondLastname: w.secondLastname || w.second_lastname || null,
    // prefer phoneNumber field, fallback to phone
    phoneNumber: w.phoneNumber ?? w.phone ?? w.phone_number ?? null,
    fechaNacimiento: w.fechaNacimiento || w.birthdate || w.birth_date || null,
    status: w.status || w.state || null,
    photoUrl: w.photoUrl || w.photo_url || w.avatar || null,
    assignedVehicleId: w.assignedVehicleId || w.vehicleId || null,
    createdAt: w.createdAt || w.created_at || null
  }));
};

export default getWorkers;

