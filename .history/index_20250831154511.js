import axios from 'axios';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';

dotenv.config(); // Load .env variables

// Initialize Gemini embeddings
const embeddingsClient = new GoogleGenerativeAIEmbeddings({
  model: "models/gemini-embedding-001",
  taskType: "RETRIEVAL_DOCUMENT",
  apiKey: process.env.GOOGLE_API_KEY
});

// Web scraping function
async function scrapeWebpage(url = '') {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    const links = [];
    const externalLinks = [];
    const internalLinks = [];

    $('a').each((_, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().trim();

      if (!href || href === '/') return;

      links.push({ text, href });

      if (href.startsWith('http://') || href.startsWith('https://')) {
        externalLinks.push({ text, href });
      } else {
        internalLinks.push({ text, href });
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

// Function to generate Gemini embeddings for scraped text
async function generateVectorEmbeddings(text) {
  try {
    const vector = await embeddingsClient.embedDocuments([text]);
    console.log('================ GEMINI EMBEDDING ================');
    console.log(vector[0].slice(0, 10), '...'); // Show first 10 values for brevity
    console.log('=================================================');
    return vector[0];
  } catch (error) {
    console.error('Error generating embeddings:', error.message);
    return [];
  }
}

// Usage example
(async () => {
  const url = 'https://piyushgarg.com';
  const { externalLinks, internalLinks } = await scrapeWebpage(url);

  // Combine scraped links for embedding
  const scrapedText = `External Links: ${externalLinks.map(l => l.href).join(', ')}
Internal Links: ${internalLinks.map(l => l.href).join(', ')}`;

  await generateVectorEmbeddings(scrapedText);
})();
