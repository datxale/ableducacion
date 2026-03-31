# Configuracion real de Google Meet / Gmail para ABL Educacion

## Que comprar

No se compra Google Meet por separado para este proyecto. Lo correcto es usar una cuenta de Google Workspace.

- Si `ableducacion` es una empresa: comprar `Google Workspace Business Standard`.
- Si la institucion califica oficialmente para Education: usar `Google Workspace for Education Fundamentals` como base; si necesitan funciones premium de Meet, seguridad o administracion avanzada, evaluar `Education Plus`.

## Por que ese plan

El backend actual crea enlaces de Meet mediante Google Calendar API usando:

- una cuenta de Google Workspace,
- un proyecto de Google Cloud,
- una service account,
- y `domain-wide delegation` para impersonar un usuario del dominio.

El codigo depende de estas variables:

- `GOOGLE_MEET_ENABLED`
- `GOOGLE_SERVICE_ACCOUNT_FILE` o `GOOGLE_SERVICE_ACCOUNT_JSON`
- `GOOGLE_WORKSPACE_IMPERSONATED_USER`
- `GOOGLE_MEET_CALENDAR_ID`
- `GOOGLE_MEET_TIMEZONE`
- `GOOGLE_MEET_DURATION_MINUTES`

## Pasos tecnicos

1. Crear o tener un dominio activo en Google Workspace.
2. Crear un proyecto en Google Cloud.
3. Habilitar `Google Calendar API`.
4. Crear una `Service Account`.
5. Habilitar `Domain-wide delegation` en esa service account.
6. En Google Admin Console:
   - ir a `Security > Access and data control > API controls > Manage Domain Wide Delegation`
   - registrar el `Client ID` de la service account
   - autorizar el scope:
     - `https://www.googleapis.com/auth/calendar`
7. Elegir un usuario real del dominio para impersonar, por ejemplo:
   - `admin@tudominio.com`
8. Configurar el servidor con:

```env
GOOGLE_MEET_ENABLED=true
GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
GOOGLE_WORKSPACE_IMPERSONATED_USER=admin@tudominio.com
GOOGLE_MEET_CALENDAR_ID=admin@tudominio.com
GOOGLE_MEET_TIMEZONE=America/Lima
GOOGLE_MEET_DURATION_MINUTES=60
```

9. Reiniciar backend.
10. Crear una clase en vivo desde el panel y verificar que devuelva `meeting_url`.

## Nota importante

Aunque se use Google Cloud para la service account y la API, el prerrequisito clave para este proyecto es `Google Workspace`, porque el flujo usa impersonacion de usuario del dominio.

## Alternativa para Gmail personal

Si solo se usara una cuenta Gmail normal, el backend tambien puede trabajar con OAuth de usuario.

Variables requeridas:

```env
GOOGLE_MEET_ENABLED=true
GOOGLE_OAUTH_CLIENT_ID=...
GOOGLE_OAUTH_CLIENT_SECRET=...
GOOGLE_OAUTH_REFRESH_TOKEN=...
GOOGLE_MEET_CALENDAR_ID=primary
GOOGLE_MEET_TIMEZONE=America/Lima
GOOGLE_MEET_DURATION_MINUTES=60
```

En este modo no se usa `GOOGLE_WORKSPACE_IMPERSONATED_USER` ni `domain-wide delegation`.
