export interface Employee {
  id: string;
  role: string;
  email: string;
  // passwordHash should not be shown, omitted on client-side
  name: string;
  secondName?: string | null;
  lastname: string;
  secondLastname?: string | null;
  phoneNumber?: number | string | null;
  fechaNacimiento?: string | null; // ISO date string
  status?: string | null;
  photoUrl?: string | null;

  // legacy / additional fields kept optional
  assignedVehicleId?: string | null;
  createdAt?: string | null;
}
