// import axios from 'axios';
// import * as cheerio from 'cheerio';
// import dotenv from 'dotenv';
// import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';

// dotenv.config(); // Load .env variables

// const embeddingsClient = new GoogleGenerativeAIEmbeddings({
//   model: "models/gemini-embedding-001",
//   taskType: "RETRIEVAL_DOCUMENT",
//   apiKey: process.env.GOOGLE_API_KEY
// });

// async function scrapeWebpage(url = '') {
//   try {
//     const { data } = await axios.get(url);
//     const $ = cheerio.load(data);

//     const links = [];
//     const externalLinks = [];
//     const internalLinks = [];

//     $('a').each((_, el) => {
//       const href = $(el).attr('href');
//       const text = $(el).text().trim();
//       if (!href || href === '/') return;

//       links.push({ text, href });

//       if (href.startsWith('http://') || href.startsWith('https://')) {
//         externalLinks.push({ text, href });
//       } else {
//         internalLinks.push({ text, href });
//       }
//     });

//     console.log('================ ALL LINKS ================');
//     console.log(links);
//     console.log('================ EXTERNAL LINKS ================');
//     console.log(externalLinks);
//     console.log('================ INTERNAL LINKS ================');
//     console.log(internalLinks);
//     console.log('================================================');

//     return { links, externalLinks, internalLinks };
//   } catch (error) {
//     console.error('Error scraping webpage:', error.message);
//     return { links: [], externalLinks: [], internalLinks: [] };
//   }
// }

// async function generateVectorEmbeddings(text) {
//   try {
//     console.log('====================================');
//     console.log(text);
//     console.log('====================================');
//     const vector = await embeddingsClient.embedDocuments([text]);
//     console.log('================ GEMINI EMBEDDING ================');
//     console.log(vector[0].slice(0, 10), '...');
//     console.log('=================================================');
//     return vector[0];
//   } catch (error) {
//     console.error('Error generating embeddings:', error.message);
//     return [];
//   }
// }

// (async () => {
//   const url = 'https://piyushgarg.com';
//   const { externalLinks, internalLinks } = await scrapeWebpage(url);

//   const scrapedText = `External Links: ${externalLinks.map(l => l.href).join(', ')}
// Internal Links: ${internalLinks.map(l => l.href).join(', ')}`;

//   await generateVectorEmbeddings(scrapedText);
// })();
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

// Function to scrape webpage and get body text + links
async function scrapeWebpage(url = '') {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    // Extract all text from body
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

    return { bodyText, links, externalLinks, internalLinks };
  } catch (error) {
    console.error('Error scraping webpage:', error.message);
    return { bodyText: '', links: [], externalLinks: [], internalLinks: [] };
  }
}

// Function to split text into chunks
function splitText(text, chunkSize = 500) {
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  return chunks;
}

// Function to generate Gemini embeddings for multiple chunks
async function generateVectorEmbeddings(textChunks) {
  try {
    for (const [i, chunk] of textChunks.entries()) {
      const vector = await embeddingsClient.embedDocuments([chunk]);
      console.log(`================ GEMINI EMBEDDING CHUNK ${i + 1} ================`);
      console.log(vector[0].slice(0, 10), '...'); // Show first 10 values
      console.log('=================================================');
    }
  } catch (error) {
    console.error('Error generating embeddings:', error.message);
  }
}

// Usage example
(async () => {
  const url = 'https://piyushgarg.com';
  const { bodyText, externalLinks, internalLinks } = await scrapeWebpage(url);

  console.log('================ BODY TEXT ================');
  console.log(bodyText.slice(0, 500), '...'); // Show first 500 chars for preview
  console.log('==========================================');

  // Split body text into chunks
  const textChunks = splitText(bodyText, 500); // adjust chunk size if needed

  // Generate embeddings for each chunk
  await generateVectorEmbeddings(textChunks);
})();
