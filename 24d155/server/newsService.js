const Parser = require('rss-parser');
const parser = new Parser();

// We map sources to their RSS feeds.
const RSS_FEEDS = {
  'bbc': 'http://feeds.bbci.co.uk/news/rss.xml',
  'techcrunch': 'https://techcrunch.com/feed/',
  'reuters': 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', // Fallback to NYT World for now
  'bloomberg': 'https://feeds.a.dj.com/rss/RSSMarketsMain.xml',
  'espn': 'https://www.espn.com/espn/rss/news',
  'nature': 'https://www.nature.com/nature.rss',
  'guardian': 'https://www.theguardian.com/world/rss',
  'wsj': 'https://feeds.a.dj.com/rss/RSSWorldNews.xml'
};

async function fetchLatestNews(selectedSources) {
  const articles = [];
  
  for (const sourceId of selectedSources) {
    const feedUrl = RSS_FEEDS[sourceId];
    if (!feedUrl) continue;

    try {
      const feed = await parser.parseURL(feedUrl);
      // Take top 8 from each source to avoid overwhelming the model
      const topItems = feed.items.slice(0, 8);
      
      topItems.forEach(item => {
        articles.push({
          id: Math.random().toString(36).substr(2, 9),
          title: item.title,
          source: sourceId,
          publishedAt: item.isoDate || item.pubDate || new Date().toISOString(),
          summary: item.contentSnippet || item.content || item.title,
          url: item.link
        });
      });
    } catch (err) {
      console.error(`Failed to fetch RSS for ${sourceId}:`, err.message);
    }
  }
  
  return articles;
}

module.exports = { fetchLatestNews };
