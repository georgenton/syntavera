# Handoff de diseño

Fuente aprobada: `SyntaVera Design System (1).zip`, en especial `handoff/README.md`, `HANDOFF_MANIFEST.md`, documentos `01`–`16`, `ui_kits/website`, `ui_kits/portal`, `guidelines/portal/spec.html`, `components`, `tokens` y `handoff/assets`.

La implementación reconstruye componentes productivos; no copia ciegamente el JSX prototipo. `src/styles/colors.css`, `spacing.css`, `typography.css`, `surfaces.css` y `motion.css` portan los tokens de color, tipo, espaciado, bordes, radios, sombras, movimiento, contenedores y patrones. `next/font` empaqueta Newsreader e IBM Plex sin requests a Google Fonts en runtime. Los íconos de aplicación derivan del favicon aprobado del handoff.

Decisiones deliberadas: Insights y perfiles sin autorización no se publican; las fichas de Labs permanecen `noindex` mientras no exista evidencia pública suficiente; FeelVerse se atribuye como iniciativa independiente y aparece únicamente en Nosotros; LLM Twin se retiró de la superficie pública hasta contar con material real; accesibilidad puede ajustar contraste, foco y tamaño de interacción frente al prototipo.
