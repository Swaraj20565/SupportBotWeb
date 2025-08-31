import axios from 'axios';
import * as cheerio from 'cheerio';

async function scrapeWebpage(url = '') {
  try {
    // 1. Fetch the HTML content from the URL
    const { data } = await axios.get(url);

    // 2. Load HTML into Cheerio
    const $ = cheerio.load(data);

    // 3. Extract all headings (h1)
    const headings = [];
    $('h1').each((index, element) => {
      headings.push($(element).text().trim());
    });

    const pageHead=$('head').html();
    const pageBody=$('body').html();

    console.log('====================================');
    console.log(`Headings found on ${url}:`);
    console.log(headings);
    console.log('====================================');

    return headings;
  } catch (error) {
    console.error('Error scraping webpage:', error.message);
    return [];
  }
}

// Usage example
scrapeWebpage('https://piyushgarg.com');
