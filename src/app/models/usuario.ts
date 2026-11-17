/** Roles de la interfaz: `cliente`, `barista` y `admin` son los roles reales (con cuenta y JWT); `publico` es solo el estado sin sesión, no un rol del backend. */
export type Rol = 'publico' | 'cliente' | 'barista' | 'admin';

export interface Usuario {
  id: string;
  /** Id del cliente (solo rol cliente): es el que viaja en los pedidos. */
  clienteId: string | null;
  nombre: string;
  email: string;
  rol: Exclude<Rol, 'publico'>;
  /** DNI del cliente: se propone para comprobar si es socio FitZone. */
  dniSocio?: string;
}

export interface Sesion {
  token: string;
  usuario: Usuario;
}

export interface Credenciales {
  email: string;
  contrasena: string;
}

/** Datos que se envían para crear una cuenta de cliente. */
export interface DatosRegistro extends Credenciales {
  nombre: string;
  dni: string;
}
