# edge-console-core

**Núcleo neutral** del framework de integración *edge-console* (sin redux/MUI). Contiene lo que comparten
los dos SDK y no pertenece a ninguno en exclusiva:

- **`client`** — cliente HTTP self-contained (`createConsoleClient`) + `ConsoleError`.
- **`keys`** — modelo de claves (`Role`/`Tab`/`Naming`/`RESERVED_*`/`Priv`/`hasPrivilege`).
- **`paths`** — base de rutas del framework (`BASE`).

Ambos SDK dependen de este paquete, **no entre sí**:

```
                 edge-console-core
        (client · keys · paths BASE · ConsoleError)
              ▲                        ▲
     edge-console-sdk        edge-console-administrator
     (consumidor)             (mentor / admin)
```

- [`edge-console-sdk`](../edge-console-sdk/README.md) — consumidor (auth Evolok + `privileges.resolve` +
  `verify` + `react/`). Es lo único que se entrega a un tercero.
- [`edge-console-administrator`](../edge-console-administrator/README.md) — administración del mentor
  (roles/privilegios/catálogo + consolas). Mentor-only.

> El núcleo **no se entrega suelto** a un tercero. Contrato completo:
> [`../edge-console-sdk/CONTRACT.md`](../edge-console-sdk/CONTRACT.md).
