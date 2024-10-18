import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

function TagSelector({ selectedTag, setSelectedTag, selectedDateRange }) {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchTagFrequencies() {
      setLoading(true);
      try {
        let query = supabase
          .from('questions')
          .select('Tags, Date')
          .not('Tags', 'is', null);

        // Apply date range filter
        const startDate = getStartDate(selectedDateRange);
        if (startDate) {
          query = query.gte('Date', startDate.toISOString());
        }

        const { data, error } = await query;

        if (error) throw error;

        const tagCount = {};
        data.forEach(question => {
          const tagArray = question.Tags.split(',').map(tag => cleanTag(tag));
          tagArray.forEach(tag => {
            if (tag) {
              tagCount[tag] = (tagCount[tag] || 0) + 1;
            }
          });
        });

        const sortedTags = Object.entries(tagCount)
          .filter(([_, count]) => count > 10)
          .sort((a, b) => b[1] - a[1])
          .map(entry => ({ tag: entry[0], count: entry[1] }));

        setTags(sortedTags);
        setError(null);
      } catch (err) {
        console.error('Error fetching tag frequencies:', err);
        setError('Failed to load tags.');
      } finally {
        setLoading(false);
      }
    }

    fetchTagFrequencies();
  }, [selectedDateRange]);

  // Function to clean and format tags
  const cleanTag = (tag) => {
    return tag.trim().replace(/^[\[\]]|[\[\]]$/g, '').replace(/['"]/g, '');
  };

  if (loading) return <p>Loading tags...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <select
        id="tag"
        value={selectedTag}
        onChange={(e) => setSelectedTag(e.target.value)}
        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
      >
        <option value="">All Subjects</option>
        {tags.map(({ tag, count }, index) => (
          <option key={index} value={tag}>
            {tag} ({count})
          </option>
        ))}
      </select>
    </div>
  );
}

// Helper function to get the start date based on the selected range
function getStartDate(range) {
  const now = new Date();
  switch (range) {
    case 'month':
      return new Date(now.setMonth(now.getMonth() - 1));
    case '3months':
      return new Date(now.setMonth(now.getMonth() - 3));
    case 'year':
      return new Date(now.setFullYear(now.getFullYear() - 1));
    case 'all':
    default:
      return null;
  }
}

export default TagSelector;
