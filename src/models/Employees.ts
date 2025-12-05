export interface Employee {
  id: string;
  role: string;
  email: string;
  name: string;
  secondName?: string | null;
  lastname: string;
  secondLastname?: string | null;
  phoneNumber?: number | string | null;
  fechaNacimiento?: string | null; // ISO date string
  passwordHash: string | null;
  status: string;
  photoUrl?: string | null;
}
