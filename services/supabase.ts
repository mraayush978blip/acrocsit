
import { createClient } from '@supabase/supabase-js';

// --- 3rd Year (existing env vars — UNCHANGED, no Vercel changes needed) ---
const get3rdYearUrl = () => {
    return import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
};
const KEY_3RD = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

// --- 2nd Year (new env vars — add VITE_SUPABASE_URL_2ND & VITE_SUPABASE_ANON_KEY_2ND on Vercel) ---
const URL_2ND = import.meta.env.VITE_SUPABASE_URL_2ND || '';
const KEY_2ND = import.meta.env.VITE_SUPABASE_ANON_KEY_2ND || '';

// --- 4th Year (new env vars — add VITE_SUPABASE_URL_4TH & VITE_SUPABASE_ANON_KEY_4TH on Vercel) ---
const URL_4TH = import.meta.env.VITE_SUPABASE_URL_4TH || '';
const KEY_4TH = import.meta.env.VITE_SUPABASE_ANON_KEY_4TH || '';

// --- Year Selection Helper ---
export type YearMode = '2nd' | '3rd' | '4th';
export const getYearMode = (): YearMode =>
    (localStorage.getItem('acro_year_mode') as YearMode) || '3rd';
export const setYearMode = (mode: YearMode) => {
    localStorage.setItem('acro_year_mode', mode);
    window.location.reload(); // Reload to re-initialise clients with correct credentials
};

export const getYearDisplayName = (mode: YearMode): string => {
    switch (mode) {
        case '2nd': return 'Second Year';
        case '3rd': return 'Third Year';
        case '4th': return 'Fourth Year';
        default: return `${mode} Year`;
    }
};

export const getYearUnavailableMessage = (mode: YearMode): string => {
    return `Services for ${getYearDisplayName(mode)} are not yet available. Soon we will start this app in that year!`;
};

const isValidEnv = (val?: string): boolean => {
    return Boolean(val && val.trim() !== '' && !val.includes('placeholder') && !val.includes('dummy'));
};

export const isYearConfigured = (mode: YearMode): boolean => {
    if (mode === '4th') return isValidEnv(URL_4TH) && isValidEnv(KEY_4TH);
    if (mode === '2nd') return isValidEnv(URL_2ND) && isValidEnv(KEY_2ND);
    return isValidEnv(get3rdYearUrl()) && isValidEnv(KEY_3RD);
};

// --- Active Credentials based on selection ---
const yearMode = getYearMode();
const resolvedUrl = yearMode === '4th' ? URL_4TH : (yearMode === '2nd' ? URL_2ND : get3rdYearUrl());
const resolvedKey = yearMode === '4th' ? KEY_4TH : (yearMode === '2nd' ? KEY_2ND : KEY_3RD);

export const isConfigured = isYearConfigured(yearMode);

const supabaseUrl = isConfigured ? resolvedUrl : 'https://dummy.supabase.co';
const supabaseAnonKey = isConfigured ? resolvedKey : 'dummy';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Special client for creating other users without swapping the admin's current session
export const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        storageKey: 'sb-acropolis-auth-temp'
    }
});
