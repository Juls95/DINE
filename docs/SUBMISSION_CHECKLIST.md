# Checklist de entrega · NEAR HACKATHON (track `thesis`)

Fecha límite: **2026-11-14T23:59:00Z** (17:59 hora local, UTC-6). Cada paso marcado "humano" no lo hace el agente.

## Repositorio

- [ ] `pnpm check` en verde y `DATA_MODE=live pnpm verify` en verde con los datos reales commiteados.
- [ ] `git status` no muestra `.env`, `gcp-*.json`, `docsReplicate/`, `BLUEPRINT.md` ni `data/mock/`.
- [ ] `THESIS.md` es la versión live (sin franja "DATOS SIMULADOS").
- [ ] README: confirmar si el equipo tiene otro proyecto en el hackathon (Q-015) y, si lo tiene, nombrarlo.
- [ ] (humano) Hacer público el repositorio antes de la fecha límite.

## Demo

- [ ] (humano) Render: crear el Static Site desde `render.yaml`, rama `main`, deploy después de que pase CI. Mantenerlo en línea hasta 2026-11-25.
- [ ] (humano) Grabar un video corto: Ágora, abrir Bison, abrir una query del dashboard y mostrar `pnpm verify` fallando con un número escrito a mano.
- [ ] (humano) Publicar el post en X con el video.

### Borrador del post en X (el humano lo edita y lo publica)

> Construí en NEAR HACKATHON una tesis de inversión sobre NEAR donde ninguna cifra está escrita a mano: tres agentes (Beary lee X, Bison consulta BigQuery y NEAR Intents, Bul escribe la tesis) y un verificador que rompe el build si aparece un número sin fuente.
>
> Cada gráfico muestra su query. ¿Qué métrica on-chain agregarías para invalidar la tesis?
>
> Demo: <URL de Render> · Repo: <URL del repo>
>
> @NEARProtocol #NEARHackathon @NearLegion @NearBuilders

## Envío (una sola vez)

- [ ] Armar el payload con `SubmissionPayload` (`src/schemas/submission.ts`): track `thesis`, `demoUrl` = URL del post en X, `projectUrl` = repo público, sin campo `website`.
- [ ] (humano) Revisar el JSON completo y confirmar con un "sí" explícito.
- [ ] Un solo POST a `https://nearhackathon.com/api/applications`. Un 409 significa que ya existe: no reenviar.
- [ ] No commitear el payload (contiene datos personales).
- [ ] Errores posteriores: (humano) `https://nearhackathon.com/request-changes`.
