# MotoStock · felixman

Sistema web de inventario y catálogo para una tienda de repuestos, aceites de motos y bicicletas en Roma y Casa Grande.

## Funciones

- Inventario con código, marca, categoría y compatibilidad.
- Alertas de stock mínimo.
- Cálculo de inversión, valor de venta y margen por producto.
- Catálogo adaptable a celular.
- Carrito que prepara el pedido y lo abre en WhatsApp.
- Base de datos D1 para conservar los productos.
- Asistente accesible para consultar por voz precios, stock y compatibilidad.
- Respuesta hablada, repetición y alternativa de consulta escrita.

## Configuración

1. Copia `.env.example` como `.env.local`.
2. Coloca el número de WhatsApp del negocio con código de país.
3. Instala dependencias con `pnpm install`.
4. Inicia el sistema con `pnpm dev`.

## Publicación

El proyecto está preparado para OpenAI Sites/Cloudflare Workers con una base D1. Antes de publicar para clientes, protege la sección de inventario con autenticación.
