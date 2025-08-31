import axios from 'axios';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { ChromaClient } from 'chromadb';

dotenv.config(); // Load .env variables

// Initialize Chroma client
const chroma = new ChromaClient();
const collection = await chroma.createCollection({ name: "webpage_embeddings" });

// Initialize Gemini embeddings
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

// Generate embeddings and store in Chroma
async function generateAndStoreEmbeddings(textChunks, label = 'TEXT') {
  try {
    for (const [i, chunk] of textChunks.entries()) {
      const vector = await embeddingsClient.embedDocuments([chunk]);
      console.log(`================ GEMINI EMBEDDING ${label} CHUNK ${i + 1} ================`);
      console.log(vector[0].slice(0, 10), '...');
      console.log('=================================================');

      // Store in Chroma
      await collection.add({
        ids: [`${label}_${i + 1}`],
        metadatas: [{ label, chunk }],
        embeddings: [vector[0]]
      });
    }
  } catch (error) {
    console.error(`Error generating embeddings for ${label}:`, error.message);
  }
}

// Usage
(async () => {
  const url = 'https://piyushgarg.com';
  const { headings, bodyText } = await scrapeWebpage(url);

  // Headings embeddings
  if (headings.length > 0) {
    const headingChunks = splitText(headings.join(' '), 500);
    await generateAndStoreEmbeddings(headingChunks, 'HEADINGS');
  }

  // Body embeddings
  if (bodyText) {
    const bodyChunks = splitText(bodyText, 2000);
    await generateAndStoreEmbeddings(bodyChunks, 'BODY');
  }
})();
