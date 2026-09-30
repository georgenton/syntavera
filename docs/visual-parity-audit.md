# Auditoría de paridad visual

Fecha de cierre: 2026-09-30. Fuente de verdad: el paquete original `SyntaVera Design System`, en particular `handoff/references/viewer.html`, los handoffs 04/06/07/09/16 y ambos UI kits. Las capturas de referencia se ejecutaron desde ese paquete; no proceden de la aplicación.

## Método

- Referencia e implementación se capturaron con Chromium, DPR 1, animaciones deshabilitadas y `prefers-reduced-motion: reduce`.
- Dimensiones exactas: 1440×900, 768×1024 y 390×844.
- La implementación se capturó desde el build optimizado de producción servido por HTTPS local, no desde el servidor de desarrollo.
- Se inspeccionaron Newsreader, IBM Plex Sans, IBM Plex Mono, pesos, tamaños, `line-height`, clamp de H1, contenedores 1240/1440/760, gutter, `section-y`, hairlines, radios, sombras, colores signal, superficies paper/sunken/dark, grid de 32 px, BrandPattern, hero, botones, LabCaseCard, MaturityBadge, ProcessStepper, ArchitectureDiagramCard, tarjetas y navegación admin, y comportamiento responsive.
- Las mediciones DOM y los tokens computados están conservados en [metrics.json](visual-parity/screenshots/metrics.json). Las 30 imágenes enlazadas abajo son la evidencia primaria.

| Route | Viewport | Reference | Implementation | Differences | Severity | Fixed |
| ----- | -------: | --------- | -------------- | ----------- | -------- | ----- |
| `/` | 1440×900 | [reference](visual-parity/screenshots/reference/home-1440.png) | [implementation](visual-parity/screenshots/implementation/home-1440.png) | Geometría de header/H1 exacta; `Insights` no se muestra porque no existe una ruta productiva equivalente. | P2 | No — deliberado |
| `/` | 768×1024 | [reference](visual-parity/screenshots/reference/home-768.png) | [implementation](visual-parity/screenshots/implementation/home-768.png) | H1 en y=168.4 px en ambos; variación intrínseca de ancho de 7 px sin cambio de líneas. | PASS | Sí |
| `/` | 390×844 | [reference](visual-parity/screenshots/reference/home-390.png) | [implementation](visual-parity/screenshots/implementation/home-390.png) | Header, ancho, saltos y posición del H1 coinciden. | PASS | Sí |
| `/labs` | 1440×900 | [reference](visual-parity/screenshots/reference/labs-1440.png) | [implementation](visual-parity/screenshots/implementation/labs-1440.png) | Patrón, hero, filtros, madurez y cards alineados; `Insights` omitido por la misma restricción de ruta. | P2 | No — deliberado |
| `/labs` | 768×1024 | [reference](visual-parity/screenshots/reference/labs-768.png) | [implementation](visual-parity/screenshots/implementation/labs-768.png) | Header y H1 exactos; misma jerarquía, wrap y ritmo de cards. | PASS | Sí |
| `/labs` | 390×844 | [reference](visual-parity/screenshots/reference/labs-390.png) | [implementation](visual-parity/screenshots/implementation/labs-390.png) | Misma composición móvil y orden semántico de MaturityBadge/card. | PASS | Sí |
| `/how-we-work` | 1440×900 | [reference](visual-parity/screenshots/reference/how-we-work-1440.png) | [implementation](visual-parity/screenshots/implementation/how-we-work-1440.png) | Stepper, panel de detalle y geometría coinciden; `Insights` omitido por la misma restricción de ruta. | P2 | No — deliberado |
| `/how-we-work` | 768×1024 | [reference](visual-parity/screenshots/reference/how-we-work-768.png) | [implementation](visual-parity/screenshots/implementation/how-we-work-768.png) | Posición del H1 exacta y stepper responsive equivalente. | PASS | Sí |
| `/how-we-work` | 390×844 | [reference](visual-parity/screenshots/reference/how-we-work-390.png) | [implementation](visual-parity/screenshots/implementation/how-we-work-390.png) | Stepper vertical, detalle y espaciado móvil equivalentes. | PASS | Sí |
| `/admin` | 1440×900 | [reference](visual-parity/screenshots/reference/admin-1440.png) | [implementation](visual-parity/screenshots/implementation/admin-1440.png) | Diferencia de contenido: datos demo reemplazados por métricas/proyectos reales; estructura y H1 difieren 0.2 px en y. | PASS | Sí |
| `/admin` | 768×1024 | [reference](visual-parity/screenshots/reference/admin-768.png) | [implementation](visual-parity/screenshots/implementation/admin-768.png) | Datos reales sustituyen el fixture visual; topbar, navegación, hero y cards conservan la geometría. | PASS | Sí |
| `/admin` | 390×844 | [reference](visual-parity/screenshots/reference/admin-390.png) | [implementation](visual-parity/screenshots/implementation/admin-390.png) | La acción real `Cerrar sesión` reemplaza el switch ficticio `Ver como cliente`; header difiere 1 px. | P2 | No — deliberado |
| `/portal` | 1440×900 | [reference](visual-parity/screenshots/reference/portal-1440.png) | [implementation](visual-parity/screenshots/implementation/portal-1440.png) | Datos reales sustituyen nombres/fixtures; H1 difiere 0.8 px en y y mantiene la composición aprobada. | PASS | Sí |
| `/portal` | 768×1024 | [reference](visual-parity/screenshots/reference/portal-768.png) | [implementation](visual-parity/screenshots/implementation/portal-768.png) | Contenido real cambia el ancho intrínseco del saludo; topbar, hero, métricas y cards coinciden. | PASS | Sí |
| `/portal` | 390×844 | [reference](visual-parity/screenshots/reference/portal-390.png) | [implementation](visual-parity/screenshots/implementation/portal-390.png) | `Cliente` sustituye el nombre demo y `Cerrar sesión` sustituye el switch ficticio; geometría difiere ≤1 px. | P2 | No — deliberado |

## Resultado

Las 15 combinaciones fueron verificadas. No quedan diferencias P0 ni P1. Los cinco P2 abiertos son desviaciones deliberadas que evitan enlazar una ruta inexistente, mostrar datos mock o simular capacidades de autorización. Por tanto, el gate visual queda en **PASS**.

Las capturas finales de implementación son el baseline de regresión productiva. Además, Playwright fija las tres rutas públicas en las mismas dimensiones y DPR; las pantallas autenticadas permanecen como evidencia versionada para comparación bajo fixtures reales de organización.
