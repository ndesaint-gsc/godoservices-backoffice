// console-sdk/admin.js
// Administración de roles / privilegios / catálogo. La superficie depende del modo del cliente:
//   - modo 'session' (editor in-console): solo privilegios, vía /perfil/console/auth/permissions.
//   - modo 'apikey' (provisioning S2S): roles + privilegios + catálogo, vía /perfil/console-admin/**.
// El product/appconsole/rolePrefix del plano provisioning los deriva el backend del apikey.

function createSessionAdmin(client) {
  const app = client.appId;
  return {
    mode: 'session',
    // GET /perfil/console/auth/permissions -> { roles, tabs, actions, fields, permissions }
    getPermissions: () => client.get('/perfil/console/auth/permissions', { params: { app } }),
    // PUT /perfil/console/auth/permissions?role= body:{tabs,actions,fields}
    savePermissions: (role, perms) =>
      client.put('/perfil/console/auth/permissions', perms, { params: { app, role } }),
  };
}

function createProvisioningAdmin(client) {
  const enc = encodeURIComponent;
  return {
    mode: 'apikey',
    roles: {
      list: () => client.get('/perfil/console-admin/roles').then((r) => r?.roles || []),
      create: (name, description) => client.post('/perfil/console-admin/roles', { name, description }),
      update: (name, description) =>
        client.put(`/perfil/console-admin/roles/${enc(name)}`, { description }),
      remove: (name) => client.del(`/perfil/console-admin/roles/${enc(name)}`),
    },
    privileges: {
      getAll: () => client.get('/perfil/console-admin/privileges').then((r) => r?.permissions || {}),
      set: (role, perms) => client.put(`/perfil/console-admin/privileges/${enc(role)}`, perms),
      remove: (role) => client.del(`/perfil/console-admin/privileges/${enc(role)}`),
    },
    catalog: {
      get: () => client.get('/perfil/console-admin/catalog'),
      set: (catalog) => client.put('/perfil/console-admin/catalog', catalog),
    },
  };
}

export function createAdminApi(client) {
  return client.mode === 'apikey' ? createProvisioningAdmin(client) : createSessionAdmin(client);
}
