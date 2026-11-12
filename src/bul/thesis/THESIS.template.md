# Tesis de inversión sobre NEAR · Research Development Council

{{block:mode_banner}}

Generado: {{label:generated_at}} · Datos on-chain hasta: {{label:last_block_date}} · Ventana: {{label:window_start}} a {{label:window_end}} · Modo: {{label:mode}}

Agentes: **Beary** (lectura de X con Grok), **Bison** (BigQuery de NEAR y 1Click Swap), **Bul** (síntesis). Cada cifra de este documento sale de `metrics.json`; ninguna está escrita a mano.

## 1. Afirmación

El uso real de NEAR se está desplazando hacia la ejecución cross-chain (1Click Swap sobre NEAR Intents), y ese volumen anticipa la actividad on-chain general: cuentas activas y uso de contratos. Horizonte: uno a dos años.

**Estado de la hipótesis:** {{label:hypothesis_verdict}}. Desplazamiento: {{label:shift_status}}. Anticipación: {{label:lead_status}}.

## 2. Régimen de adopción

Como en un análisis de régimen de mercado, el régimen da dirección pero no timing. La mediana de cuentas activas diarias de los últimos treinta días es {{metric:daa_median_30d}}, frente a {{metric:daa_median_90d}} en noventa días ({{metric:daa_30d_vs_90d_pct}}). Con la banda pre-registrada de {{param:regime_band_pct}} %, el régimen es **{{label:regime}}**.

Contra los treinta días previos, la mediana cambió {{metric:daa_30d_change_pct}}; las transacciones, {{metric:tx_30d_change_pct}}; las cuentas creadas, {{metric:new_accounts_30d_change_pct}}.

## 3. Pilares

- **Pilar A, desplazamiento:** el contrato de Intents recibe {{metric:intents_call_share_30d}} de las llamadas a contratos ({{metric:intents_call_share_change_pp}} contra la ventana previa). El volumen de 1Click fue {{metric:intents_volume_30d_usd}} en treinta días.
- **Pilar B, anticipación:** la correlación entre el crecimiento de swaps de 1Click y el de cuentas activas es más alta con un rezago de {{metric:lag_best_days}} ({{metric:lag_best_r}}, fuerza {{label:lag_strength}}).
- **Pilar C, calidad de la actividad:** los diez signers más activos generan {{metric:top10_share_median_30d}} de las transacciones; las meta-transacciones son {{metric:meta_tx_share_30d}} de las acciones; la tasa de éxito es {{metric:success_rate_30d}}.

## 4. Evidencia a favor

{{block:evidence_for}}

## 5. Evidencia en contra

{{block:evidence_against}}

## 6. Confirmadores y espejismos

Un rally sin confirmación es un espejismo. Bul cruza cada semana el sentimiento de Beary con la actividad de Bison:

{{block:divergences}}

Saltos de cuentas activas (pico frente a cambio estructural; umbral: {{param:spike_multiple}} veces la mediana previa, persistencia de {{param:spike_persistence_days}} días):

{{block:spikes}}

## 7. Escenarios condicionales

- Si la participación de Intents sigue subiendo y la correlación con rezago se mantiene sobre {{param:lag_min_r}}, la tesis se fortalece.
- Si el volumen de 1Click crece pero las cuentas activas no responden dentro de {{param:lag_max_days}} días, el volumen sería circular (arbitraje o rebalanceo) y no uso: la tesis se debilita.
- Si las cuentas activas suben sin que crezca la participación de Intents, hay crecimiento pero no desplazamiento: la tesis se reformula.
- Si un salto viene con más de {{param:spike_concentration_pct}} % de transacciones en diez signers, se trata como pico y no mueve la tesis.

## 8. Qué me haría cambiar de opinión

Umbrales fijados antes de ver los datos reales:

- La mejor correlación con rezago queda bajo {{param:lag_min_r}}, o la correlación inversa es mayor, durante {{param:invalidation_quarters}} trimestres seguidos.
- La participación del contrato de Intents en las llamadas cae en dos ventanas consecutivas de {{param:window_days}} días.
- El régimen de adopción es de contracción durante {{param:invalidation_quarters}} trimestres seguidos.
- Las semanas de espejismo superan a las de confirmación en un trimestre.

## 9. Métricas no computables con estas fuentes

- Precio de NEAR, capitalización de mercado y múltiplos de valuación: no hay fuente de precio aprobada.
- TVL y fees en USD: requieren precios y datos de protocolos que no están en BigQuery ni en el Explorer.
- Volumen total de NEAR Intents: el Explorer solo expone 1Click Swap.
- Humanos únicos: una cuenta no es una persona; las meta-transacciones y los relayers distorsionan el conteo.
- Concentración del volumen de 1Click por usuario: se guardan agregados diarios, no direcciones.

## 10. Registro semanal

La tabla de la sección seis es el registro: cada fila es un cierre semanal de Bul, marcado como en vivo o reconstruido.

## 11. Metodología y disclosure

- Fuentes: `bigquery-public-data.crypto_near_mainnet_us` (consultas filtradas por `block_date`, en `src/bison/bq/queries`), Intents Explorer API (1Click Swap, estado SUCCESS) y búsqueda de X con xAI `x_search` sobre una lista fija de cuentas.
- Beary descarta posts no citados por xAI, de cuentas fuera de la lista o de otra fecha; descartó {{metric:beary_discard_share}} de los posts propuestos. Las cifras citadas en posts nunca se usan como datos.
- Los parámetros están en `src/bul/params.ts` y `src/beary/score.ts`; cambiarlos exige registrarlo.
- No es asesoría financiera. El autor no declara posición. Partes del código y del texto se generaron con asistencia de IA.
