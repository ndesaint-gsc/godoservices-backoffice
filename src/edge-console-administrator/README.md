# edge-console-administrator

Paquete de **ADMINISTRACIÓN** de la consola mentor (godoservices-backoffice). **NO se entrega a
terceros** (a un tercero se le da solo el [`edge-console-sdk`](../edge-console-sdk/README.md)).

Se apoya en el núcleo neutral [`edge-console-core`](../edge-console-core/README.md) (`client`/`keys`) y añade:

- **`admin`** — roles / privilegios / catálogo + membresías. Plano `…/admin/**` (apikey vía proxy).
- **`consoles`** — alta/baja/lista de consolas de la plataforma + config técnica del god (`…/mine`).
  Plano `…/consoles/**` (enforcement por sesión Evolok, NO apikey).

```js
import { createConsoleAdmin } from '@/edge-console-administrator';

const admin = createConsoleAdmin({ consoleId: 'welcome-console' });

// Roles / privilegios / catálogo (apikey inyectada por el proxy):
await admin.admin.roles.create('editor', 'Editor de contenidos'); // description obligatoria (GOD reservado)
await admin.admin.savePermissions('EDITOR', { tabs, actions, fields });
await admin.admin.catalog.set({ tabs, actions, fields });

// Consolas de la plataforma + config técnica del god (enforcement por sesión Evolok):
const consoles = await admin.consoles.list();
const created = await admin.consoles.create('running', 'console', 'god@grupogodo.com'); // created.apiKey una vez
const myConfig = await admin.consoles.mine();
```

Contrato completo (endpoints, modelo, clases backend): [`../edge-console-sdk/CONTRACT.md`](../edge-console-sdk/CONTRACT.md).
