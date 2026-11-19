import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Título de página + subtítulo opcional + acciones proyectadas a la derecha. */
@Component({
  selector: 'app-cabecera-pagina',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="cabecera-pagina">
      <div class="cabecera-pagina__texto">
        <h1 class="t-titular">{{ titulo() }}</h1>
        @if (subtitulo()) {
          <p class="t-cuerpo atenuado">{{ subtitulo() }}</p>
        }
      </div>
      <div class="cabecera-pagina__acciones"><ng-content /></div>
    </header>
  `,
  styles: `
    .cabecera-pagina { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 28px; padding-bottom: 22px; border-bottom: 1px solid var(--color-borde); }
    .cabecera-pagina__texto { display: flex; flex-direction: column; gap: 8px; min-width: 0; max-width: 68ch; }
    .cabecera-pagina__texto p { font-size: 15px; }
    .cabecera-pagina__acciones { display: flex; gap: 10px; align-items: center; }
  `,
})
export class CabeceraPagina {
  readonly titulo = input.required<string>();
  readonly subtitulo = input<string>();
}
