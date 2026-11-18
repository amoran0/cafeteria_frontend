import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { catchError, interval, map, of, switchMap, tap } from 'rxjs';
import { RouterLink } from '@angular/router';
import { Aviso } from '../../components/aviso/aviso';
import { Icono } from '../../components/icono/icono';
import { CabeceraPagina } from '../../components/cabecera-pagina/cabecera-pagina';
import { EtiquetaEstado } from '../../components/etiqueta-estado/etiqueta-estado';
import { Paginador } from '../../components/paginador/paginador';
import { PaginaResultados } from '../../models/pagina';
import { ETIQUETA_ESTADO, FLUJO_PEDIDO, Pedido } from '../../models/pedido';
import { ServicioPedidos } from '../../services/servicio-pedidos';
import { PipeEuro } from '../../utils/pipe-euro';
import {
  formatearDescuento,
  formatearFechaCorta,
  formatearHora,
  resumenLineas,
} from '../../utils/formato';

/** Cada cuántos segundos se consulta de nuevo el estado del pedido en curso. */
const SEGUNDOS_SEGUIMIENTO_TURNO = 30;
/** Pedidos por página en el historial. */
const PEDIDOS_POR_PAGINA = 5;

@Component({
  selector: 'app-pagina-mis-pedidos',
  imports: [CabeceraPagina, Aviso, Icono, EtiquetaEstado, Paginador, PipeEuro, RouterLink],
  templateUrl: './mis-pedidos.html',
  styleUrl: './mis-pedidos.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginaMisPedidos {
  protected readonly servicioPedidos = inject(ServicioPedidos);
  protected readonly flujoEstados = FLUJO_PEDIDO;
  protected readonly etiquetaPorEstado = ETIQUETA_ESTADO;
  protected readonly formatearHora = formatearHora;
  protected readonly formatearFechaCorta = formatearFechaCorta;
  protected readonly formatearDescuento = formatearDescuento;
  protected readonly resumenLineas = resumenLineas;

  // Historial paginado (se pide a la API página a página)
  protected readonly paginaHistorial = signal(0);
  protected readonly resultadoHistorial = signal<PaginaResultados<Pedido> | null>(null);
  protected readonly cargandoHistorial = signal(true);
  protected readonly errorHistorial = signal<string | null>(null);
  /** El pedido en curso ya se muestra arriba, así que no se repite en el historial. */
  protected readonly historial = computed(() =>
    (this.resultadoHistorial()?.content ?? []).filter(
      (pedido) => pedido.id !== this.servicioPedidos.pedidoActivo()?.id,
    ),
  );

  constructor() {
    this.servicioPedidos.cargar();
    // Seguimiento del turno: mientras haya un pedido en curso, se consulta su estado periódicamente.
    interval(SEGUNDOS_SEGUIMIENTO_TURNO * 1000)
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        if (this.servicioPedidos.pedidoActivo()) this.servicioPedidos.cargar();
      });

    // Cada cambio de página pide esa página a la API. También se repite cuando se recargan
    // los pedidos (p. ej. el pedido en curso pasa a entregado y entra en el historial).
    toObservable(
      computed(() => ({
        pagina: this.paginaHistorial(),
        actualizacion: this.servicioPedidos.ultimaActualizacion(),
      })),
    )
      .pipe(
        tap(() => {
          this.cargandoHistorial.set(true);
          this.errorHistorial.set(null);
        }),
        switchMap(({ pagina }) =>
          this.servicioPedidos.buscarMisPedidos(pagina, PEDIDOS_POR_PAGINA).pipe(
            map((paginaRecibida) => ({ pagina: paginaRecibida, mensajeError: null })),
            catchError((errorCarga: Error) => of({ pagina: null, mensajeError: errorCarga.message })),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe(({ pagina, mensajeError }) => {
        if (pagina) this.resultadoHistorial.set(pagina);
        this.errorHistorial.set(mensajeError);
        this.cargandoHistorial.set(false);
      });
  }

  protected irAPaginaHistorial(pagina: number): void {
    this.paginaHistorial.set(pagina);
  }

  /** Posición del estado actual del pedido dentro del flujo (0 = pendiente). */
  protected indicePasoActual(pedido: Pedido): number {
    return FLUJO_PEDIDO.indexOf(pedido.estado);
  }
}
