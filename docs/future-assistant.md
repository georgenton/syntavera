# Especificación de un asistente futuro de SyntaVera

Este documento define el contrato mínimo para una futura interfaz conversacional. No autoriza su implementación ni la selección de un SDK.

## Propósito y límites

El asistente ayudaría a orientar una oportunidad, explicar cómo trabaja SyntaVera y dirigir a contenido público verificable. No debe diagnosticar procesos, prometer resultados, cotizar, aceptar términos, representar criterio profesional ni operar sobre sistemas de un visitante.

Debe decir con claridad cuándo no tiene evidencia suficiente. No puede convertir las fichas de Labs en casos de cliente, confundir FeelVerse con SyntaVera ni presentar material no publicado como demostración funcional.

## Fuentes permitidas

- Contenido estructurado aprobado en `src/content/website-content.json`.
- Páginas públicas indexables y fichas de Labs en su estado publicado.
- Documentación expresamente marcada para uso público.

Quedan fuera notas internas, backoffice, snapshots privados, mensajes `INTERNAL`, credenciales, `storageKey`, URLs firmadas, datos de contacto y cualquier documento sin permiso de publicación.

Cada respuesta basada en contenido debe conservar referencia a la fuente y su versión. Si las fuentes discrepan, prevalece la más reciente que esté aprobada y publicada; de lo contrario, el asistente debe abstenerse.

## Datos, consentimiento y retención

La conversación no debe solicitar nombre, email, organización, documentos ni otros datos personales antes de mostrar el aviso de privacidad aplicable y obtener consentimiento específico. El canal de contacto y el asistente tendrían consentimientos separados.

Antes de implementar se deben definir: campos mínimos, finalidad, ubicación, cifrado, acceso, retención, eliminación, exportación, tratamiento de archivos y política sobre uso por proveedores/modelos. No se conservarán prompts o respuestas de forma indefinida por defecto.

## Escalamiento y observabilidad

El escalamiento humano debe ser explícito y crear un registro distinto de la conversación. Nunca debe prometer que una persona recibió el caso hasta que exista persistencia confirmada. Se necesitan IDs de trazabilidad, estado de entrega, latencia, costo, versión de prompt/modelo, fuentes consultadas y errores sanitizados, sin registrar secretos ni contenido personal innecesario.

## Evaluación previa a publicación

- Conjunto de preguntas públicas, ambiguas, fuera de alcance y adversariales.
- Pruebas de fidelidad a fuentes, abstención, prompt injection, fuga entre usuarios y exposición de contenido interno.
- Revisión de accesibilidad, streaming, interrupción y recuperación de errores.
- Umbrales aprobados de calidad, costo y latencia, además de un mecanismo de apagado.

## Decisiones todavía abiertas

- Proveedor, modelo, SDK y arquitectura de recuperación.
- Identidad anónima o autenticada.
- Política legal aprobada y base de consentimiento.
- Retención y residencia de datos.
- Canal y horario de escalamiento humano.
- Presupuesto, rate limits y criterio de éxito.

Hasta cerrar estas decisiones, no debe añadirse un chat, un agente ni dependencias de IA al producto.
