// edge-console-administrator/admin.js
// Admin de roles/privilegios/catálogo — plano PROVISIONING (…/admin/**). Auth por apikey inyectada por
// el proxy (en navegador no va la key). Roles con nombre pelado; el backend pone el prefijo Evolok.
import { ADMIN } from './paths';

export function createAdminApi(client) {
  const enc = encodeURIComponent;
  return {
    // Payload combinado para el editor: { roles, tabs, actions, fields, permissions }.
    getPermissions: () => client.get(ADMIN + '/permissions'),
    // Fija los privilegios de un rol: { tabs, actions, fields }.
    savePermissions: (role, perms) => client.put(ADMIN + `/privileges/${enc(role)}`, perms),

    roles: {
      list: () => client.get(ADMIN + '/roles').then((r) => r?.roles || []),
      create: (name, description) => client.post(ADMIN + '/roles', { name, description }),
      update: (name, description) => client.put(ADMIN + `/roles/${enc(name)}`, { description }),
      remove: (name) => client.del(ADMIN + `/roles/${enc(name)}`),
      // Membresías: usuarios (email) asignados al grupo Evolok del rol, con fechas start/fin OPCIONALES.
      members: {
        list: (name) => client.get(ADMIN + `/roles/${enc(name)}/members`).then((r) => r?.members || []),
        assign: (name, email, startDate, endDate) =>
          client.post(ADMIN + `/roles/${enc(name)}/members`, { email, startDate, endDate }),
        revoke: (name, email) => client.del(ADMIN + `/roles/${enc(name)}/members`, { params: { email } }),
      },
    },

    catalog: {
      get: () => client.get(ADMIN + '/catalog'),
      set: (catalog) => client.put(ADMIN + '/catalog', catalog),
    },
  };
}
