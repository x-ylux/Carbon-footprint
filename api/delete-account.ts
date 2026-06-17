import { createClient } from '@supabase/supabase-js';

type VercelRequest = {
  method?: string;
  headers: {
    authorization?: string;
  };
};

type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
};

const jsonError = (res: VercelResponse, status: number, message: string) => {
  res.status(status).json({ error: message });
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    jsonError(res, 405, 'Method not allowed');
    return;
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    jsonError(res, 500, 'Account deletion is not configured on this deployment.');
    return;
  }

  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) {
    jsonError(res, 401, 'Missing session token');
    return;
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const { data: userData, error: userError } = await userClient.auth.getUser(token);
  if (userError || !userData.user) {
    jsonError(res, 401, 'Invalid session token');
    return;
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(userData.user.id);

  if (deleteError) {
    jsonError(res, 500, deleteError.message);
    return;
  }

  res.status(200).json({ ok: true });
}
