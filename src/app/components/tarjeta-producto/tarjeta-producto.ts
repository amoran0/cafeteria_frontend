import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Producto } from '../../models/producto';
import { PipeEuro } from '../../utils/pipe-euro';
import { listaAlergenos } from '../../utils/formato';
import { EtiquetaEstado } from '../etiqueta-estado/etiqueta-estado';

/** Tarjeta de producto de la carta. Enlaza al detalle. */
@Component({
  selector: 'app-tarjeta-producto',
  imports: [RouterLink, PipeEuro, EtiquetaEstado],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="tarjeta-producto tarjeta" [routerLink]="['/carta', producto().id]" [class.esta-agotado]="producto().estado !== 'disponible'">
      <div class="tarjeta-producto__imagen">
        @if (producto().imagen && !imagenNoDisponible()) {
          <img [src]="producto().imagen" [alt]="producto().nombre" loading="lazy" (error)="imagenNoDisponible.set(true)" />
        } @else {
          <div class="tarjeta-producto__sin-imagen"></div>
        }
      </div>
      <div class="tarjeta-producto__informacion">
        <div class="tarjeta-producto__titulo">
          <h3 class="t-titulo">{{ producto().nombre }}</h3>
          <span class="precio">{{ producto().precio | euro }}</span>
        </div>
        <div class="tarjeta-producto__datos">
          <app-etiqueta-estado [estado]="producto().estado" textoPlano />
          <span class="t-leyenda atenuado">{{ nombreCategoria() }}</span>
        </div>
        <p class="t-leyenda atenuado">Alérgenos: {{ textoAlergenos() }}</p>
      </div>
    </a>
  `,
  styles: `
    :host { display: block; }
    /* Tarjeta de la carta: foto, nombre a la izquierda y precio a la derecha. */
    .tarjeta-producto { display: flex; flex-direction: column; height: 100%; padding: 0; overflow: visible; background: transparent; border: 0; border-radius: 0; box-shadow: none; text-decoration: none; color: inherit; }
    .tarjeta-producto__imagen { aspect-ratio: 3 / 2; background: var(--color-arena); border-radius: var(--radio-tarjeta); overflow: hidden; box-shadow: var(--sombra-tarjeta); }
    .tarjeta-producto__imagen img { width: 100%; height: 100%; object-fit: cover; transition: transform .6s var(--curva-salida); }
    /* Sin foto: un plato dibujado con un aro fino en lugar de un hueco vacío. */
    .tarjeta-producto__sin-imagen {
      height: 100%;
      background:
        radial-gradient(circle at 50% 50%, transparent 0 22%, rgba(107, 44, 18, .08) 22.5% 23.5%, transparent 24%),
        var(--color-arena);
    }
    .esta-agotado .tarjeta-producto__imagen { filter: grayscale(.85); opacity: .7; }
    .esta-agotado .tarjeta-producto__sin-imagen { opacity: .5; }
    .tarjeta-producto__informacion { display: flex; flex-direction: column; align-items: stretch; gap: 6px; padding: 16px 2px 28px; text-align: left; }
    /* Con nombres de dos líneas, el precio se alinea con la última línea. */
    .tarjeta-producto__titulo { display: flex; align-items: last baseline; justify-content: space-between; gap: 12px; }
    .tarjeta-producto__titulo h3 { min-width: 0; text-underline-offset: 4px; }
    .tarjeta-producto__titulo .precio { font-size: 16px; }
    .tarjeta-producto__datos { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .esta-agotado h3 { color: var(--color-texto-atenuado); }
    .tarjeta-producto:focus-visible { outline-offset: 6px; border-radius: var(--radio-tarjeta); }
    @media (hover: hover) and (pointer: fine) {
      .tarjeta-producto:hover .tarjeta-producto__imagen img { transform: scale(1.04); }
      .tarjeta-producto:hover h3 { text-decoration: underline; }
    }
  `,
})
export class TarjetaProducto {
  readonly producto = input.required<Producto>();
  readonly nombreCategoria = input('');
  /** Se activa si la foto no carga, para mostrar el fondo liso. */
  protected readonly imagenNoDisponible = signal(false);
  protected textoAlergenos = () => listaAlergenos(this.producto().alergenos);
}
