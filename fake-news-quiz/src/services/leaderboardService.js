import { supabase } from './supabaseClient';

export async function fetchLeaderboard(limit = 10, subject = null) {
  let query = supabase
    .from('leaderboard')
    .select('*')
    .order('score', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(limit);

  if (subject) {
    query = query.eq('subject', subject);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

export async function submitScore(username, score, subject) {
  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .insert([{ username, score, subject }]);

    if (error) {
      console.error('Error submitting score:', error);
      console.error('Error details:', error.details);
      throw error;
    }
    return data;
  } catch (error) {
    console.error('Caught error:', error);
    throw error;
  }
}
