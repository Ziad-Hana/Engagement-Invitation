const SUPABASE_URL = "https://utcsratghqeadxboauhu.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_8mhcy9BGU2bimmWeoZztMw_UzjfUm7N";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.supabaseClient = supabaseClient;

window.supabaseRequest = async function supabaseRequest(path, options = {}) {
    const { data: { session } } = await supabaseClient.auth.getSession();
    const accessToken = session?.access_token || SUPABASE_ANON_KEY;
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
        ...options,
        headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    });

    if (!response.ok) {
        throw new Error(`Supabase request failed: ${response.status}`);
    }
    if (response.status === 204) {
        return null;
    }

    const responseText = await response.text();
    return responseText ? JSON.parse(responseText) : null;
};