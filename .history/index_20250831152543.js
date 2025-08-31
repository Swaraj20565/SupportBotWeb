import axios from 'axios';
import * as cheerio from 'cheerio';

async function scrapeWebpage(url = '') {
  try {
    // 1. Fetch the HTML content from the URL
    const { data } = await axios.get(url);

    // 2. Load HTML into Cheerio
    const $ = cheerio.load(data);

    const links = [];
    const externalLinks = [];
    const internalLinks = [];

    // 3. Extract all <a> links
    $('a').each((_, el) => {
      const href = $(el).attr('href'); // Get the href attribute
      const text = $(el).text().trim(); // Optional: link text
      links.push({ text, href });

      if (href) {
        if (href.startsWith('http://') || href.startsWith('https://')) {
          externalLinks.push({ text, href });
        } else {
          internalLinks.push({ text, href });
        }
      }
    });

    console.log('================ ALL LINKS ================');
    console.log(links);
    console.log('================ EXTERNAL LINKS ================');
    console.log(externalLinks);
    console.log('================ INTERNAL LINKS ================');
    console.log(internalLinks);
    console.log('================================================');

    return { links, externalLinks, internalLinks };
  } catch (error) {
    console.error('Error scraping webpage:', error.message);
    return { links: [], externalLinks: [], internalLinks: [] };
  }
}

// Usage example
scrapeWebpage('https://piyushgarg.com');
