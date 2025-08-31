import axios from 'axios';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';

dotenv.config(); // Load .env variables

const embeddingsClient = new GoogleGenerativeAIEmbeddings({
  model: "models/gemini-embedding-001",
  taskType: "RETRIEVAL_DOCUMENT",
  apiKey: process.env.GOOGLE_API_KEY
});

// Scrape webpage: headings, body text, links
async function scrapeWebpage(url = '') {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    // Extract headings h1-h6
    const headings = [];
    $('h1, h2, h3, h4, h5, h6').each((_, el) => {
      const text = $(el).text().trim();
      if (text) headings.push(text);
    });

    // Extract body text
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim();

    // Extract links
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

    return { headings, bodyText, links, externalLinks, internalLinks };
  } catch (error) {
    console.error('Error scraping webpage:', error.message);
    return { headings: [], bodyText: '', links: [], externalLinks: [], internalLinks: [] };
  }
}

// Split text into chunks
function splitText(text, chunkSize = 500) {
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  return chunks;
}

// Generate embeddings for multiple chunks
async function generateVectorEmbeddings(textChunks, label = 'TEXT') {
  try {
    for (const [i, chunk] of textChunks.entries()) {
      const vector = await embeddingsClient.embedDocuments([chunk]);
      console.log(`================ GEMINI EMBEDDING ${label} CHUNK ${i + 1} ================`);
      console.log(vector[0].slice(0, 10), '...'); // Show first 10 values
      console.log('=================================================');
    }
  } catch (error) {
    console.error(`Error generating embeddings for ${label}:`, error.message);
  }
}

// Usage example
(async () => {
  const url = 'https://piyushgarg.com';
  const { headings, bodyText, externalLinks, internalLinks } = await scrapeWebpage(url);

  // Embeddings for headings
  if (headings.length > 0) {
    console.log('================ HEADINGS ================');
    console.log(headings);
    console.log('==========================================');
    await generateVectorEmbeddings(headings, 'HEADINGS');
  }

  // Embeddings for body text
  if (bodyText) {
    console.log('================ BODY TEXT ================');
    console.log(bodyText.slice(0, 500), '...'); // preview
    console.log('==========================================');
    const bodyChunks = splitText(bodyText, 500);
    await generateVectorEmbeddings(bodyChunks, 'BODY');
  }
})();
