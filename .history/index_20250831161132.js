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

// // Scrape webpage: headings, body text, links
// async function scrapeWebpage(url = '') {
//   try {
//     const { data } = await axios.get(url);
//     const $ = cheerio.load(data);

//     // Extract headings h1-h6
//     const headings = [];
//     $('h1, h2, h3, h4, h5, h6').each((_, el) => {
//       const text = $(el).text().trim();
//       if (text) headings.push(text);
//     });

//     // Extract body text
//     const bodyText = $('body').text().replace(/\s+/g, ' ').trim();

//     // Extract links
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

//     return { headings, bodyText, links, externalLinks, internalLinks };
//   } catch (error) {
//     console.error('Error scraping webpage:', error.message);
//     return { headings: [], bodyText: '', links: [], externalLinks: [], internalLinks: [] };
//   }
// }

// // Split text into chunks
// function splitText(text, chunkSize = 500) {
//   const chunks = [];
//   for (let i = 0; i < text.length; i += chunkSize) {
//     chunks.push(text.slice(i, i + chunkSize));
//   }
//   return chunks;
// }

// // Generate embeddings for multiple chunks
// async function generateVectorEmbeddings(textChunks, label = 'TEXT') {
//   try {
//     for (const [i, chunk] of textChunks.entries()) {
//       const vector = await embeddingsClient.embedDocuments([chunk]);
//       console.log(`================ GEMINI EMBEDDING ${label} CHUNK ${i + 1} ================`);
//       console.log(vector[0].slice(0, 10), '...'); // Show first 10 values
//       console.log('=================================================');
//     }
//   } catch (error) {
//     console.error(`Error generating embeddings for ${label}:`, error.message);
//   }
// }

// // Usage example
// (async () => {
//   const url = 'https://piyushgarg.com';
//   const { headings, bodyText, externalLinks, internalLinks } = await scrapeWebpage(url);

//   // Embeddings for headings
//   if (headings.length > 0) {
//     console.log('================ HEADINGS ================');
//     console.log(headings);
//     console.log('==========================================');
//     await generateVectorEmbeddings(headings, 'HEADINGS');
//   }

//   // Embeddings for body text
//   if (bodyText) {
//     console.log('================ BODY TEXT ================');
//     console.log(bodyText.slice(0, 2000), '...'); // preview
//     console.log('==========================================');
//     const bodyChunks = splitText(bodyText, 2000);
//     await generateVectorEmbeddings(bodyChunks, 'BODY');
//   }
// })();
import axios from 'axios';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { ChromaClient } from 'chromadb';

dotenv.config();

// -----------------------------
// Initialize Chroma client
// -----------------------------
const chroma = new ChromaClient({ url: 'http://localhost:8000' });

// -----------------------------
// Initialize Gemini embeddings
// -----------------------------
const embeddingsClient = new GoogleGenerativeAIEmbeddings({
  model: 'models/gemini-embedding-001',
  taskType: 'RETRIEVAL_DOCUMENT',
  apiKey: process.env.GOOGLE_API_KEY,
});

// -----------------------------
// Wrap Gemini embeddings to Chroma embedding function
// -----------------------------
const myEmbeddingFunction = async (texts) => {
  const vectors = await embeddingsClient.embedDocuments(texts);
  return vectors;
};

// -----------------------------
// Generate unique collection name with timestamp
// -----------------------------
function generateCollectionName() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `webpage_embeddings_${timestamp}`;
}

// -----------------------------
// Create collection with unique name
// -----------------------------
async function createCollection() {
  const collectionName = generateCollectionName();
  console.log(`📦 Creating collection: ${collectionName}`);
  
  const collection = await chroma.createCollection({
    name: collectionName,
    embeddingFunction: myEmbeddingFunction,
  });
  
  return collection;
}

// -----------------------------
// List all collections (for debugging)
// -----------------------------
async function listCollections() {
  try {
    const collections = await chroma.listCollections();
    console.log('📋 Available collections:');
    collections.forEach((col, index) => {
      console.log(`  ${index + 1}. ${col.name}`);
    });
    return collections;
  } catch (error) {
    console.log('❌ Could not list collections:', error.message);
    return [];
  }
}

// -----------------------------
// Scrape webpage
// -----------------------------
async function scrapeWebpage(url = '') {
  try {
    console.log(`🌐 Scraping: ${url}`);
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    const headings = [];
    $('h1, h2, h3, h4, h5, h6').each((_, el) => {
      const text = $(el).text().trim();
      if (text) headings.push(text);
    });

    const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
    
    console.log(`✅ Found ${headings.length} headings and ${bodyText.length} characters of body text`);
    return { headings, bodyText };
  } catch (error) {
    console.error('❌ Failed to scrape webpage:', error.message);
    throw error;
  }
}

// -----------------------------
// Split text into chunks
// -----------------------------
function splitText(text, chunkSize = 500) {
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  console.log(`📄 Split text into ${chunks.length} chunks of ${chunkSize} characters`);
  return chunks;
}

// -----------------------------
// Store embeddings in Chroma
// -----------------------------
async function storeEmbeddings(collection, textChunks, label) {
  console.log(`💾 Storing ${textChunks.length} ${label} chunks...`);
  
  for (const [i, chunk] of textChunks.entries()) {
    try {
      await collection.add({
        ids: [`${label}_${i + 1}_${Date.now()}`],
        documents: [chunk],
        metadatas: [{ 
          label, 
          chunk_index: i + 1,
          total_chunks: textChunks.length,
          timestamp: new Date().toISOString()
        }],
      });
      
      if ((i + 1) % 5 === 0 || i + 1 === textChunks.length) {
        console.log(`   ↳ Stored ${label} chunk ${i + 1}/${textChunks.length}`);
      }
    } catch (error) {
      console.error(`❌ Failed to store chunk ${i + 1}:`, error.message);
    }
  }
  
  console.log(`✅ Finished storing ${label} chunks`);
}

// -----------------------------
// Main function
// -----------------------------
async function main() {
  try {
    console.log('🚀 Starting web scraping and embedding process...\n');
    
    // List existing collections
    await listCollections();
    console.log('');
    
    // Create new collection with unique name
    const collection = await createCollection();
    console.log('');
    
    // Scrape webpage
    const url = 'https://piyushgarg.com';
    const { headings, bodyText } = await scrapeWebpage(url);
    console.log('');
    
    // Process and store headings
    if (headings.length > 0) {
      const headingChunks = splitText(headings.join(' '), 500);
      await storeEmbeddings(collection, headingChunks, 'HEADINGS');
      console.log('');
    }
    
    // Process and store body text
    if (bodyText) {
      const bodyChunks = splitText(bodyText, 2000);
      await storeEmbeddings(collection, bodyChunks, 'BODY');
      console.log('');
    }
    
    // Verify the collection was created
    const collections = await listCollections();
    const currentCollection = collections.find(col => col.name === collection.name);
    
    if (currentCollection) {
      console.log(`\n🎉 Success! Collection "${collection.name}" created with embeddings`);
      console.log(`🔗 You can query this collection using the name: ${collection.name}`);
    } else {
      console.log('\n⚠️  Collection created but not found in list');
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// -----------------------------
// Run the main function
// -----------------------------
main().catch(console.error);
