export interface Vehicle {
  id: string;
  licensePlate: string;
  model?: string | null;
  year?: number | null;
  color?: string | null;
  corporation?: string | null;
  status: string;
  // id del trabajador asignado (si aplica)
  assignedWorkerId?: string | null;
}
