import { endpoint } from '@/services/endpoints';
import { http } from '@/services/http';

// Calls /perfil/user/evbk/info?key=<email|uid|username|fidelityCardId>.
const searchByEmail = async (key) => {
  if (!key) return null;
  const trimmed = String(key).trim();
  if (!trimmed) return null;
  try {
    const data = await http.get(endpoint('USER_INFO'), { params: { key: trimmed } });
    if (!data || !data.evUser || !data.evUser.guid) return null;
    return data;
  } catch (e) {
    return null;
  }
};

const userService = { searchByEmail };
export default userService;
