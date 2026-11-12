# NEAR RDC · Research Development Council

> **English abstract (for automated judges).** Evidence-first, long-term investment thesis for NEAR (track `thesis`, NEAR HACKATHON 2026). Three agents: **Beary** reads a fixed list of X accounts with xAI `x_search`, **Bison** queries `bigquery-public-data.crypto_near_mainnet_us` (always filtered on `block_date`) plus the NEAR Intents Explorer API, and **Bul** rebuilds every chart, a static dashboard and `THESIS.md` from raw files with one command. A verifier fails the build if any number in the thesis or chart text was not computed from data. Everything below is in Spanish; technical names stay in English.

## Qué es

Una tesis de inversión de largo plazo sobre NEAR que se juzga por su evidencia, no por su convicción. La hipótesis es que el uso de NEAR se desplaza hacia la ejecución cross-chain (1Click Swap sobre NEAR Intents) y que ese volumen anticipa la actividad on-chain general. La tesis dice de antemano qué datos la invalidarían.

## Qué problema resuelve

Las tesis de inversión cripto suelen mezclar cifras sin fuente, capturas de pantalla y opiniones. Aquí cada cifra sale de una query versionada o de un endpoint documentado, cada gráfico muestra su query y una frase simple, y cualquiera puede reconstruir todo desde los datos crudos.

## Pruébalo

Requisitos: Node 22 y pnpm 10 (`corepack enable`). pnpm descarga Node 22.21.1 por `.npmrc` si hace falta.

| Haz esto | Verás esto |
| --- | --- |
| `pnpm install && pnpm demo` | Datos simulados en `data/mock/`, `examples/THESIS.mock.md` y el sitio en `dist/`, sin credenciales. |
| `pnpm preview` y abre `http://localhost:4173` | El sitio con una franja roja "DATOS SIMULADOS". |
| Ve a **Ágora** | Beary, Bison y Bul evaluados por separado, cada uno con sus validaciones, y la tabla semanal de sentimiento contra actividad. |
| Abre un agente, por ejemplo **Bison** | Qué hace, entradas, salidas, corridas y validaciones (tope de bytes, filtro por `block_date`, frescura de datos). |
| Ve a **Dashboard** y abre "Query" bajo un gráfico | El SQL exacto o el endpoint que produjo ese gráfico. |
| Escribe un número literal en `src/bul/thesis/THESIS.template.md` y corre `DATA_MODE=mock pnpm verify` | El build falla y señala la línea: ningún número puede salir de texto escrito a mano. |
| `pnpm test` | La suite de Jest: guardas de costo, paginación y rate limit, filtro anti-alucinación de Beary, cálculo de métricas y componentes del sitio. |

Con credenciales (ver `.env.example`): `pnpm refresh` descarga datos reales, escribe `data/` y `THESIS.md`, y reconstruye el sitio. Sin credenciales, `pnpm bul:build` reconstruye todo desde los archivos de `data/` ya commiteados.

## Cómo funciona

| Agente | Fuente | Qué produce |
| --- | --- | --- |
| **Beary** (lectura psicológica) | xAI Responses API con `x_search`, limitada a `config/beary.handles.yaml` y a un día por consulta | Posts verificados contra las citas de xAI, puntaje de credibilidad calculado en código y un índice semanal de sentimiento. Guarda paráfrasis y URLs, nunca el texto completo de un post. |
| **Bison** (lectura técnica) | BigQuery `crypto_near_mainnet_us` (`blocks`, `transactions`, `receipt_actions`) y Intents Explorer `GET /api/v0/transactions` | Cuentas activas, transacciones, cuentas nuevas, uso de contratos, concentración, meta-transacciones y volumen de 1Click Swap. Cada query pasa por un dry run con tope `BQ_MAX_BYTES`. |
| **Bul** (síntesis) | Archivos de Beary y Bison | Régimen de adopción, picos frente a cambios estructurales, correlación con rezago, confirmadores y espejismos, `THESIS.md`, el dashboard y `bundle.json`. |

Reglas que el código hace cumplir:

- **No inventar números.** `THESIS.md` y las frases de los gráficos solo contienen placeholders (`{{metric:id}}`) que Bul rellena con valores calculados. `pnpm verify` renderiza todo con un centinela y falla si queda cualquier dígito fuera de un placeholder.
- **Lo que no se puede medir se dice.** La sección "Métricas no computables" de la tesis lista precio, TVL, fees en USD, volumen total de Intents y humanos únicos.
- **Datos simulados y reales no se mezclan.** `DATA_MODE=mock` escribe en carpetas ignoradas por git y el build falla si encuentra artefactos de otro modo.
- **El modelo de lenguaje es intercambiable.** `LLM_PROVIDER=gemini|xai` y `LLM_MODEL` eligen el modelo de estructuración, sin cambiar código.

## Comandos

| Comando | Qué hace |
| --- | --- |
| `pnpm demo` | Escenario simulado de punta a punta. |
| `pnpm bison:fetch` | BigQuery e Intents Explorer, a `data/raw/`. |
| `pnpm beary:run` / `pnpm beary:backfill` | Ayer en vivo / cuatro semanas reconstruidas, a `data/beary/`. |
| `pnpm bul:build` | Métricas, `THESIS.md`, `bundle.json` y el sitio estático en `dist/`. |
| `pnpm refresh` | Los tres anteriores en orden. |
| `pnpm verify` | Comprueba la regla de no inventar números. |
| `pnpm check` | Lint (warnings cuentan como errores), typecheck y tests. |

## Ventana del hackathon y disclosure

- Todo el código de este repositorio se escribió durante NEAR HACKATHON (desde 2026-11-01). No hay producto previo en otra cadena.
- Partes del código y del texto se generaron con asistencia de IA.
- No es asesoría financiera.

## Librerías

TypeScript, tsx, Vite, React, Vega, Vega-Lite y vega-embed, zod, debug, yaml, `@google-cloud/bigquery`; Jest, babel-jest, React Testing Library, ESLint con typescript-eslint. No se usaron plantillas ni librerías propias previas.

## Licencia

MIT, ver `LICENSE`.
