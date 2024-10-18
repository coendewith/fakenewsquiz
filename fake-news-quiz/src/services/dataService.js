import { supabase } from './supabaseClient';  

function categorizeRating(rating) {
  const fakeRatings = ['Unfounded', 'Fake', 'Unproven', 'False', 'Originated as Satire', 'Mixture', 'Misattributed', 'Miscaptioned', 'Legend', 'Mostly False', 'Outdated', 'Scam', 'Labeled Satire'];
  const trueRatings = ['True', 'Correct Attribution', 'Mostly True', 'Legit'];
  if (fakeRatings.includes(rating)) {
    return 'Fake';
  } else if (trueRatings.includes(rating)) {
    return 'Real';
  } else {
    return 'Ambiguous';
  }
}

export async function fetchFactChecks(tag = null, dateRange = 'all', numQuestions = 5) {
  try {
    console.log('Fetching fact checks from Supabase');
    let query = supabase
      .from('questions')
      .select('*');

    // Apply tag filter if provided
    if (tag) {
      query = query.ilike('Tags', `%${tag}%`);
    }

    // Apply date range filter
    if (dateRange !== 'all') {
      const startDate = getStartDate(dateRange);
      if (startDate) {
        query = query.gte('Date', startDate.toISOString());
      }
    }

    // Add ordering by Date
    query = query.order('Date', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }

    // Filter and categorize the results
    const categorizedData = data
      .map(item => ({
        ...item,
        category: categorizeRating(item.Rating)
      }))
      .filter(item => item.category !== 'Ambiguous');

    // Shuffle the results client-side
    const shuffled = categorizedData.sort(() => 0.5 - Math.random());

    // Ensure we always return exactly 5 unique questions
    const selectedQuestions = [];
    const usedIndices = new Set();

    while (selectedQuestions.length < 5 && usedIndices.size < shuffled.length) {
      const randomIndex = Math.floor(Math.random() * shuffled.length);
      if (!usedIndices.has(randomIndex)) {
        selectedQuestions.push(shuffled[randomIndex]);
        usedIndices.add(randomIndex);
      }
    }

    // If we don't have enough unique questions, fill the rest with duplicates
    while (selectedQuestions.length < 5) {
      const randomIndex = Math.floor(Math.random() * shuffled.length);
      selectedQuestions.push(shuffled[randomIndex]);
    }

    console.log('Fetched, categorized, and randomized data:', selectedQuestions);
    return selectedQuestions;
  } catch (error) {
    console.error('Error fetching fact checks:', error);
    throw new Error('Failed to fetch fact checks from the database.');
  }
}

function getStartDate(range) {
  const now = new Date();
  switch (range) {
    case 'month':
      return new Date(now.setMonth(now.getMonth() - 1));
    case '3months':
      return new Date(now.setMonth(now.getMonth() - 3));
    case 'year':
      return new Date(now.setFullYear(now.getFullYear() - 1));
    default:
      return null;
  }
}

async function testConnection() {
  const { data, error } = await supabase.from('questions').select('count');
  if (error) {
    console.error('Connection failed:', error);
  } else {
    console.log('Connection successful. Row count:', data[0].count);
  }
}

testConnection();
