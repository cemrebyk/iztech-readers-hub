const { loadEnvConfig } = require('@next/env');
const { createClient } = require('@supabase/supabase-js');

loadEnvConfig(process.cwd());

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log("Testing with 1 tag...");
    const { data, error } = await supabase
        .from('reviews')
        .insert([{
            book_id: '00000000-0000-0000-0000-000000000000',
            user_id: '00000000-0000-0000-0000-000000000000',
            rating: 5,
            tags: ["Funny"] 
        }]);

    console.log("Error inserting 1 tag:", error?.message, error?.details, error?.hint);

    console.log("Testing with 3 tags...");
    const { error: error3 } = await supabase
        .from('reviews')
        .insert([{
            book_id: '00000000-0000-0000-0000-000000000000',
            user_id: '00000000-0000-0000-0000-000000000000',
            rating: 5,
            tags: ["Funny", "Dark", "Emotional"] 
        }]);
    console.log("Error inserting 3 tags:", error3?.message, error3?.details, error3?.hint);
}
test();
