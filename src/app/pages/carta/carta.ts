import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { catchError, debounceTime, map, of, switchMap, tap } from 'rxjs';
import { RouterLink } from '@angular/router';
import { GrupoFiltros, OpcionFiltro } from '../../components/grupo-filtros/grupo-filtros';
import { Icono } from '../../components/icono/icono';
import { TarjetaProducto } from '../../components/tarjeta-producto/tarjeta-producto';
import { CampoBusqueda } from '../../components/campo-busqueda/campo-busqueda';
import { SelectorMultiple } from '../../components/selector-multiple/selector-multiple';
import { Aviso } from '../../components/aviso/aviso';
import { Paginador } from '../../components/paginador/paginador';
import { PaginaResultados } from '../../models/pagina';
import { Producto } from '../../models/producto';
import { FiltrosCarta } from '../../utils/filtros-carta';
import { ServicioAutenticacion } from '../../services/servicio-autenticacion';
import { ServicioCarrito } from '../../services/servicio-carrito';
import { ServicioProductos } from '../../services/servicio-productos';

/** Productos por página en la carta. */
const PRODUCTOS_POR_PAGINA = 6;

/** Precio máximo que equivale a "sin filtro de precio" (la opción más alta del selector). */
const PRECIO_MAXIMO_SIN_FILTRO = 15;

@Component({
  selector: 'app-pagina-carta',
  imports: [
    TarjetaProducto,
    GrupoFiltros,
    CampoBusqueda,
    SelectorMultiple,
    Paginador,
    Aviso,
    Icono,
    RouterLink,
  ],
  templateUrl: './carta.html',
  styleUrl: './carta.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginaCarta {
  protected readonly servicioProductos = inject(ServicioProductos);
  protected readonly servicioCarrito = inject(ServicioCarrito);
  protected readonly autenticacion = inject(ServicioAutenticacion);

  protected readonly alergenos = this.servicioProductos.alergenos;
  protected readonly opcionesPrecioMaximo = [5, 10, 15];

  protected readonly opcionesTipoProducto: OpcionFiltro[] = [
    { valor: 'todos', texto: 'Todos' },
    { valor: 'cafe', texto: 'Café' },
    { valor: 'comida', texto: 'Comida' },
    { valor: 'frios', texto: 'Fríos' },
  ];
  protected readonly opcionesDisponibilidad: OpcionFiltro[] = [
    { valor: 'todos', texto: 'Todos' },
    { valor: 'disponible', texto: 'Disponibles' },
    { valor: 'agotado', texto: 'Agotados' },
  ];

  // Filtros
  protected readonly textoBusqueda = signal('');
  protected readonly tipoProducto = signal('todos');
  protected readonly estadoDisponibilidad = signal('todos');
  protected readonly precioMaximo = signal(PRECIO_MAXIMO_SIN_FILTRO);

  /** ¿Hay algún filtro distinto del estado inicial? Si no, el botón "Borrar filtros" no se muestra. */
  protected readonly hayFiltrosActivos = computed(
    () =>
      this.textoBusqueda().trim() !== '' ||
      this.tipoProducto() !== 'todos' ||
      this.estadoDisponibilidad() !== 'todos' ||
      this.precioMaximo() !== PRECIO_MAXIMO_SIN_FILTRO ||
      this.alergenosExcluidos().length > 0,
  );
  protected readonly alergenosExcluidos = signal<string[]>([]);

  /** Filtros actuales agrupados en un objeto: es lo que se envía a la API. */
  private readonly filtros = computed<FiltrosCarta>(() => ({
    texto: this.textoBusqueda(),
    grupo: this.tipoProducto(),
    estado: this.estadoDisponibilidad(),
    precioMaximo: this.precioMaximo(),
    alergenosExcluidos: this.alergenosExcluidos(),
  }));

  // Paginación y resultado de la última consulta
  protected readonly paginaActual = signal(0);
  protected readonly resultado = signal<PaginaResultados<Producto> | null>(null);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  /**
   * Altura mínima de la rejilla al cambiar de página. Si la página nueva tiene menos productos,
   * la web no se acorta y la vista no salta.
   */
  protected readonly altoMinimoRejilla = signal(0);

  constructor() {
    // Al cambiar cualquier filtro se vuelve a la primera página (y la rejilla recupera su altura natural).
    effect(() => {
      this.filtros();
      untracked(() => {
        this.paginaActual.set(0);
        this.altoMinimoRejilla.set(0);
      });
    });

    // Cada cambio de filtros o de página lanza una petición nueva. `debounceTime` evita una petición
    // por cada tecla del buscador y `switchMap` descarta la respuesta anterior si llega tarde.
    // También se repite cuando cambia la carta cargada (p. ej. un producto pasa a agotado).
    toObservable(
      computed(() => ({
        filtros: this.filtros(),
        pagina: this.paginaActual(),
        carta: this.servicioProductos.carta(),
      })),
    )
      .pipe(
        debounceTime(250),
        tap(() => {
          this.cargando.set(true);
          this.error.set(null);
        }),
        switchMap(({ filtros, pagina }) =>
          this.servicioProductos.buscarCarta(filtros, pagina, PRODUCTOS_POR_PAGINA).pipe(
            map((paginaRecibida) => ({ pagina: paginaRecibida, mensajeError: null })),
            catchError((errorBusqueda: Error) =>
              of({ pagina: null, mensajeError: errorBusqueda.message }),
            ),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe(({ pagina, mensajeError }) => {
        if (pagina) this.resultado.set(pagina);
        this.error.set(mensajeError);
        this.cargando.set(false);
      });
  }

  protected irAPagina(pagina: number): void {
    // La vista no se desplaza: se mantiene la altura actual de la rejilla y solo cambian los productos.
    const rejilla = document.querySelector('.rejilla');
    this.altoMinimoRejilla.set(Math.max(this.altoMinimoRejilla(), rejilla?.clientHeight ?? 0));
    this.paginaActual.set(pagina);
  }

  protected quitarFiltros(): void {
    this.textoBusqueda.set('');
    this.tipoProducto.set('todos');
    this.estadoDisponibilidad.set('todos');
    this.precioMaximo.set(PRECIO_MAXIMO_SIN_FILTRO);
    this.alergenosExcluidos.set([]);
  }
}
