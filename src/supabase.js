import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://qavpybdqmzwvyabumrgb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhdnB5YmRxbXp3dnlhYnVtcmdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MjQ1MjEsImV4cCI6MjA5NDQwMDUyMX0.GVLqeyEscVavk6agJREyFSJe406zXtqniS7UYvIz5ws";

export const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
