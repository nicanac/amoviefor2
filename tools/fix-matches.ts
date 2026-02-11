

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env: Record<string, string> = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
});

async function fixMatches() {
  console.log("🔍 Checking sessions...");
  
  const { data: sessions } = await supabase.from('sessions').select('*');
  if (!sessions) return;

  for (const session of sessions) {
    // Get all swipes for this session
    const { data: swipes } = await supabase
      .from('swipes')
      .select('*')
      .eq('session_id', session.id);

    if (!swipes || swipes.length === 0) continue;

    // Group by movie ID
    const swipesByMovie: Record<string, string[]> = {};
    swipes.forEach(s => {
      if (s.direction === 'right') {
        if (!swipesByMovie[s.session_movie_id]) {
          swipesByMovie[s.session_movie_id] = [];
        }
        swipesByMovie[s.session_movie_id].push(s.user_id);
      }
    });

    for (const [movieId, userIds] of Object.entries(swipesByMovie)) {
      // If 2 different users liked it -> match!
      const uniqueUsers = new Set(userIds);
      if (uniqueUsers.size >= 2) {
        console.log(`  Found MATCH for Movie: ${movieId} in Session ${session.id}`);
        
        // Check if match exists
        const { data: existingMatch } = await supabase
          .from('matches')
          .select('*')
          .eq('session_id', session.id)
          .eq('session_movie_id', movieId)
          .maybeSingle();

        if (!existingMatch) {
          console.log(`  --> CREATING match record...`);
          const { error } = await supabase.from('matches').insert({
            session_id: session.id,
            session_movie_id: movieId,
            matched_at: new Date().toISOString()
          });
          if (error) console.error("Error creating match:", error);
          else {
            console.log("✅ Match created!");
            // Mark session as completed so users can leave
            await supabase.from('sessions').update({ status: 'completed' }).eq('id', session.id);
            console.log("✅ Session marked as COMPLETED");
          }
        } else {
           console.log(`  --> Match record already exists.`);
           // Even if match exists, ensure session is completed
           if (session.status !== 'completed') {
             await supabase.from('sessions').update({ status: 'completed' }).eq('id', session.id);
             console.log("✅ Session marked as COMPLETED (was pending)");
           }
        }
      }
    }
  }
  console.log("Done checking matches.");
}

fixMatches();

