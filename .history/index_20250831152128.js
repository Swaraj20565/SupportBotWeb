import axios from 'axios';
import * as cheerio from 'cheerio';

async function scrapeWebpage(url = '') {
  try {
    // 1. Fetch the HTML content from the URL
    const { data } = await axios.get(url);

    // 2. Load HTML into Cheerio
    const $ = cheerio.load(data);

    // 3. Extract all <a> links
    const links = [];
    $('a').each((_, el) => {
      const href = $(el).attr('href'); // Get the href attribute
      const text = $(el).text().trim(); // Optional: link text
      links.push({ text, href });
    });

    console.log('================ LINKS ================');
    console.log(links);
    console.log('======================================');

    return links;
  } catch (error) {
    console.error('Error scraping webpage:', error.message);
    return [];
  }
}

// Usage example
scrapeWebpage('https://piyushgarg.com');
