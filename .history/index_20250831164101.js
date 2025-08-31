
// // // import axios from 'axios';
// // // import * as cheerio from 'cheerio';
// // // import dotenv from 'dotenv';
// // // import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
// // // import { ChromaClient } from 'chromadb';

// // // dotenv.config();

// // // // -----------------------------
// // // // Initialize Chroma client
// // // // -----------------------------
// // // const chroma = new ChromaClient({ url: 'http://localhost:8000' });

// // // // -----------------------------
// // // // Initialize Gemini embeddings
// // // // -----------------------------
// // // const embeddingsClient = new GoogleGenerativeAIEmbeddings({
// // //   model: 'models/gemini-embedding-001',
// // //   taskType: 'RETRIEVAL_DOCUMENT',
// // //   apiKey: process.env.GOOGLE_API_KEY,
// // // });

// // // // -----------------------------
// // // // Wrap Gemini embeddings to Chroma embedding function
// // // // -----------------------------
// // // const myEmbeddingFunction = async (texts) => {
// // //   const vectors = await embeddingsClient.embedDocuments(texts);
// // //   return vectors;
// // // };

// // // // -----------------------------
// // // // Generate unique collection name with timestamp
// // // // -----------------------------
// // // function generateCollectionName() {
// // //   const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
// // //   return `webpage_embeddings_${timestamp}`;
// // // }

// // // // -----------------------------
// // // // Create collection with unique name
// // // // -----------------------------
// // // async function createCollection() {
// // //   const collectionName = generateCollectionName();
// // //   console.log(`📦 Creating collection: ${collectionName}`);
  
// // //   const collection = await chroma.createCollection({
// // //     name: collectionName,
// // //     embeddingFunction: myEmbeddingFunction,
// // //   });
  
// // //   return collection;
// // // }

// // // // -----------------------------
// // // // List all collections (for debugging)
// // // // -----------------------------
// // // async function listCollections() {
// // //   try {
// // //     const collections = await chroma.listCollections();
// // //     console.log('📋 Available collections:');
// // //     collections.forEach((col, index) => {
// // //       console.log(`  ${index + 1}. ${col.name}`);
// // //     });
// // //     return collections;
// // //   } catch (error) {
// // //     console.log('❌ Could not list collections:', error.message);
// // //     return [];
// // //   }
// // // }

// // // // -----------------------------
// // // // Scrape webpage
// // // // -----------------------------
// // // async function scrapeWebpage(url = '') {
// // //   try {
// // //     console.log(`🌐 Scraping: ${url}`);
// // //     const { data } = await axios.get(url);
// // //     const $ = cheerio.load(data);

// // //     const headings = [];
// // //     $('h1, h2, h3, h4, h5, h6').each((_, el) => {
// // //       const text = $(el).text().trim();
// // //       if (text) headings.push(text);
// // //     });

// // //     const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
    
// // //     console.log(`✅ Found ${headings.length} headings and ${bodyText.length} characters of body text`);
// // //     return { headings, bodyText };
// // //   } catch (error) {
// // //     console.error('❌ Failed to scrape webpage:', error.message);
// // //     throw error;
// // //   }
// // // }

// // // // -----------------------------
// // // // Split text into chunks
// // // // -----------------------------
// // // function splitText(text, chunkSize = 500) {
// // //   const chunks = [];
// // //   for (let i = 0; i < text.length; i += chunkSize) {
// // //     chunks.push(text.slice(i, i + chunkSize));
// // //   }
// // //   console.log(`📄 Split text into ${chunks.length} chunks of ${chunkSize} characters`);
// // //   return chunks;
// // // }

// // // // -----------------------------
// // // // Store embeddings in Chroma
// // // // -----------------------------
// // // async function storeEmbeddings(collection, textChunks, label) {
// // //   console.log(`💾 Storing ${textChunks.length} ${label} chunks...`);
  
// // //   for (const [i, chunk] of textChunks.entries()) {
// // //     try {
// // //       await collection.add({
// // //         ids: [`${label}_${i + 1}_${Date.now()}`],
// // //         documents: [chunk],
// // //         metadatas: [{ 
// // //           label, 
// // //           chunk_index: i + 1,
// // //           total_chunks: textChunks.length,
// // //           timestamp: new Date().toISOString()
// // //         }],
// // //       });
      
// // //       if ((i + 1) % 5 === 0 || i + 1 === textChunks.length) {
// // //         console.log(`   ↳ Stored ${label} chunk ${i + 1}/${textChunks.length}`);
// // //       }
// // //     } catch (error) {
// // //       console.error(`❌ Failed to store chunk ${i + 1}:`, error.message);
// // //     }
// // //   }
  
// // //   console.log(`✅ Finished storing ${label} chunks`);
// // // }

// // // // -----------------------------
// // // // Main function
// // // // -----------------------------
// // // async function main() {
// // //   try {
// // //     console.log('🚀 Starting web scraping and embedding process...\n');
    
// // //     // List existing collections
// // //     await listCollections();
// // //     console.log('');
    
// // //     // Create new collection with unique name
// // //     const collection = await createCollection();
// // //     console.log('');
    
// // //     // Scrape webpage
// // //     const url = 'https://piyushgarg.com';
// // //     const { headings, bodyText } = await scrapeWebpage(url);
// // //     console.log('');
    
// // //     // Process and store headings
// // //     if (headings.length > 0) {
// // //       const headingChunks = splitText(headings.join(' '), 500);
// // //       await storeEmbeddings(collection, headingChunks, 'HEADINGS');
// // //       console.log('');
// // //     }
    
// // //     // Process and store body text
// // //     if (bodyText) {
// // //       const bodyChunks = splitText(bodyText, 2000);
// // //       await storeEmbeddings(collection, bodyChunks, 'BODY');
// // //       console.log('');
// // //     }
    
// // //     // Verify the collection was created
// // //     const collections = await listCollections();
// // //     const currentCollection = collections.find(col => col.name === collection.name);
    
// // //     if (currentCollection) {
// // //       console.log(`\n🎉 Success! Collection "${collection.name}" created with embeddings`);
// // //       console.log(`🔗 You can query this collection using the name: ${collection.name}`);
// // //     } else {
// // //       console.log('\n⚠️  Collection created but not found in list');
// // //     }
    
// // //   } catch (error) {
// // //     console.error('❌ Fatal error:', error.message);
// // //     process.exit(1);
// // //   }
// // // }

// // // // -----------------------------
// // // // Run the main function
// // // // -----------------------------
// // // main().catch(console.error);
// // import axios from 'axios';
// // import * as cheerio from 'cheerio';
// // import dotenv from 'dotenv';
// // import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
// // import { ChromaClient } from 'chromadb';

// // dotenv.config();

// // // -----------------------------
// // // Initialize Chroma client
// // // -----------------------------
// // const chroma = new ChromaClient({ url: 'http://localhost:8000' });

// // // -----------------------------
// // // Initialize Gemini embeddings
// // // -----------------------------
// // const embeddingsClient = new GoogleGenerativeAIEmbeddings({
// //   model: 'models/gemini-embedding-001',
// //   taskType: 'RETRIEVAL_DOCUMENT',
// //   apiKey: process.env.GOOGLE_API_KEY,
// // });

// // // -----------------------------
// // // Generate unique collection name with timestamp
// // // -----------------------------
// // function generateCollectionName() {
// //   const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
// //   return `webpage_embeddings_${timestamp}`;
// // }

// // // -----------------------------
// // // Create collection with unique name
// // // -----------------------------
// // async function createCollection() {
// //   const collectionName = generateCollectionName();
// //   console.log(`📦 Creating collection: ${collectionName}`);
  
// //   const collection = await chroma.createCollection({
// //     name: collectionName,
// //   });
  
// //   return collection;
// // }

// // // -----------------------------
// // // List all collections (for debugging)
// // // -----------------------------
// // async function listCollections() {
// //   try {
// //     const collections = await chroma.listCollections();
// //     console.log('📋 Available collections:');
// //     collections.forEach((col, index) => {
// //       console.log(`  ${index + 1}. ${col.name}`);
// //     });
// //     return collections;
// //   } catch (error) {
// //     console.log('❌ Could not list collections:', error.message);
// //     return [];
// //   }
// // }

// // // -----------------------------
// // // Scrape webpage
// // // -----------------------------
// // async function scrapeWebpage(url = '') {
// //   try {
// //     console.log(`🌐 Scraping: ${url}`);
// //     const { data } = await axios.get(url);
// //     const $ = cheerio.load(data);

// //     const headings = [];
// //     $('h1, h2, h3, h4, h5, h6').each((_, el) => {
// //       const text = $(el).text().trim();
// //       if (text) headings.push(text);
// //     });

// //     const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
    
// //     console.log(`✅ Found ${headings.length} headings and ${bodyText.length} characters of body text`);
// //     return { headings, bodyText };
// //   } catch (error) {
// //     console.error('❌ Failed to scrape webpage:', error.message);
// //     throw error;
// //   }
// // }

// // // -----------------------------
// // // Split text into chunks
// // // -----------------------------
// // function splitText(text, chunkSize = 500) {
// //   const chunks = [];
// //   for (let i = 0; i < text.length; i += chunkSize) {
// //     chunks.push(text.slice(i, i + chunkSize));
// //   }
// //   console.log(`📄 Split text into ${chunks.length} chunks of ${chunkSize} characters`);
// //   return chunks;
// // }

// // // -----------------------------
// // // Generate embeddings for text chunks
// // // -----------------------------
// // async function generateEmbeddings(textChunks) {
// //   console.log(`🧠 Generating embeddings for ${textChunks.length} chunks...`);
// //   try {
// //     const embeddings = await embeddingsClient.embedDocuments(textChunks);
// //     console.log(`✅ Generated ${embeddings.length} embeddings`);
// //     return embeddings;
// //   } catch (error) {
// //     console.error('❌ Failed to generate embeddings:', error.message);
// //     throw error;
// //   }
// // }

// // // -----------------------------
// // // Store embeddings in Chroma
// // // -----------------------------
// // async function storeEmbeddings(collection, textChunks, label) {
// //   console.log(`💾 Storing ${textChunks.length} ${label} chunks...`);
  
// //   try {
// //     // Generate embeddings first
// //     const embeddings = await generateEmbeddings(textChunks);
    
// //     // Prepare data for batch insertion
// //     const ids = [];
// //     const documents = [];
// //     const metadatas = [];
    
// //     for (let i = 0; i < textChunks.length; i++) {
// //       ids.push(`${label}_${i + 1}_${Date.now()}`);
// //       documents.push(textChunks[i]);
// //       metadatas.push({ 
// //         label, 
// //         chunk_index: i + 1,
// //         total_chunks: textChunks.length,
// //         timestamp: new Date().toISOString()
// //       });
// //     }
    
// //     // Add all chunks at once
// //     await collection.add({
// //       ids,
// //       embeddings: embeddings, // Pass the pre-computed embeddings
// //       documents,
// //       metadatas,
// //     });
    
// //     console.log(`✅ Successfully stored ${textChunks.length} ${label} chunks`);
    
// //   } catch (error) {
// //     console.error(`❌ Failed to store ${label} chunks:`, error.message);
// //     throw error;
// //   }
// // }

// // // -----------------------------
// // // Main function
// // // -----------------------------
// // async function main() {
// //   try {
// //     console.log('🚀 Starting web scraping and embedding process...\n');
    
// //     // List existing collections
// //     await listCollections();
// //     console.log('');
    
// //     // Create new collection with unique name
// //     const collection = await createCollection();
// //     console.log('');
    
// //     // Scrape webpage
// //     const url = 'https://piyushgarg.com';
// //     const { headings, bodyText } = await scrapeWebpage(url);
// //     console.log('');
    
// //     // Process and store headings
// //     if (headings.length > 0) {
// //       const headingChunks = splitText(headings.join(' '), 500);
// //       await storeEmbeddings(collection, headingChunks, 'HEADINGS');
// //       console.log('');
// //     }
    
// //     // Process and store body text
// //     if (bodyText) {
// //       const bodyChunks = splitText(bodyText, 2000);
// //       await storeEmbeddings(collection, bodyChunks, 'BODY');
// //       console.log('');
// //     }
    
// //     // Verify the collection was created and has data
// //     try {
// //       const collectionInfo = await collection.count();
// //       console.log(`📊 Collection now has ${collectionInfo} items`);
// //     } catch (error) {
// //       console.log('ℹ️  Could not get collection count, but collection was created');
// //     }
    
// //     console.log(`\n🎉 Success! Collection "${collection.name}" created with embeddings`);
// //     console.log(`🔗 You can query this collection using the name: ${collection.name}`);
    
// //   } catch (error) {
// //     console.error('❌ Fatal error:', error.message);
// //     process.exit(1);
// //   }
// // }

// // // -----------------------------
// // // Run the main function
// // // -----------------------------
// // main().catch(console.error);

// import axios from 'axios';
// import * as cheerio from 'cheerio';
// import dotenv from 'dotenv';
// import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';

// dotenv.config();

// // -----------------------------
// // Initialize Gemini embeddings
// // -----------------------------
// const embeddingsClient = new GoogleGenerativeAIEmbeddings({
//   model: 'models/embedding-001',
//   taskType: 'RETRIEVAL_DOCUMENT',
//   apiKey: process.env.GOOGLE_API_KEY,
// });

// // -----------------------------
// // Generate unique collection name with timestamp
// // -----------------------------
// function generateCollectionName() {
//   const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
//   return `webpage_embeddings_${timestamp}`;
// }

// // -----------------------------
// // Scrape webpage
// // -----------------------------
// async function scrapeWebpage(url = '') {
//   try {
//     console.log(`🌐 Scraping: ${url}`);
//     const { data } = await axios.get(url, {
//       headers: {
//         'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
//       }
//     });
//     const $ = cheerio.load(data);

//     const headings = [];
//     $('h1, h2, h3, h4, h5, h6').each((_, el) => {
//       const text = $(el).text().trim();
//       if (text) headings.push(text);
//     });

//     const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
    
//     console.log(`✅ Found ${headings.length} headings and ${bodyText.length} characters of body text`);
//     return { headings, bodyText };
//   } catch (error) {
//     console.error('❌ Failed to scrape webpage:', error.message);
//     throw error;
//   }
// }

// // -----------------------------
// // Split text into chunks
// // -----------------------------
// function splitText(text, chunkSize = 500) {
//   const chunks = [];
//   for (let i = 0; i < text.length; i += chunkSize) {
//     chunks.push(text.slice(i, i + chunkSize));
//   }
//   console.log(`📄 Split text into ${chunks.length} chunks of ${chunkSize} characters`);
//   return chunks;
// }

// // -----------------------------
// // Generate embeddings for text chunks
// // -----------------------------
// async function generateEmbeddings(textChunks) {
//   console.log(`🧠 Generating embeddings for ${textChunks.length} chunks...`);
//   try {
//     const embeddings = await embeddingsClient.embedDocuments(textChunks);
//     console.log(`✅ Generated ${embeddings.length} embeddings (dimension: ${embeddings[0]?.length || 0})`);
//     return embeddings;
//   } catch (error) {
//     console.error('❌ Failed to generate embeddings:', error.message);
//     throw error;
//   }
// }

// // -----------------------------
// // Store embeddings in Chroma using direct HTTP API
// // -----------------------------
// async function storeEmbeddingsDirect(collectionName, textChunks, label) {
//   console.log(`💾 Storing ${textChunks.length} ${label} chunks in ${collectionName}...`);
  
//   try {
//     // Generate embeddings first
//     const embeddings = await generateEmbeddings(textChunks);
    
//     // Prepare data for batch insertion
//     const data = {
//       ids: [],
//       embeddings: [],
//       documents: [],
//       metadatas: []
//     };
    
//     for (let i = 0; i < textChunks.length; i++) {
//       data.ids.push(`${label}_${i + 1}_${Date.now()}`);
//       data.embeddings.push(embeddings[i]);
//       data.documents.push(textChunks[i]);
//       data.metadatas.push({ 
//         label, 
//         chunk_index: i + 1,
//         total_chunks: textChunks.length,
//         timestamp: new Date().toISOString(),
//         source: 'web_scraping'
//       });
//     }
    
//     // Use direct HTTP API to avoid Chroma client issues
//     const response = await axios.post(
//       `http://localhost:8000/api/v1/collections/${collectionName}/add`,
//       data,
//       {
//         headers: {
//           'Content-Type': 'application/json'
//         }
//       }
//     );
    
//     console.log(`✅ Successfully stored ${textChunks.length} ${label} chunks`);
//     return response.data;
    
//   } catch (error) {
//     console.error(`❌ Failed to store ${label} chunks:`, error.message);
//     if (error.response) {
//       console.error('Error details:', error.response.data);
//     }
//     throw error;
//   }
// }

// // -----------------------------
// // Create collection using direct HTTP API
// // -----------------------------
// async function createCollectionDirect() {
//   const collectionName = generateCollectionName();
//   console.log(`📦 Creating collection: ${collectionName}`);
  
//   try {
//     const response = await axios.post(
//       'http://localhost:8000/api/v1/collections',
//       {
//         name: collectionName,
//         get_or_create: false
//       },
//       {
//         headers: {
//           'Content-Type': 'application/json'
//         }
//       }
//     );
    
//     console.log('✅ Collection created successfully');
//     return collectionName;
//   } catch (error) {
//     if (error.response?.status === 409) {
//       console.log('ℹ️ Collection already exists, using existing one');
//       return collectionName;
//     }
//     console.error('❌ Failed to create collection:', error.message);
//     throw error;
//   }
// }

// // -----------------------------
// // List collections using direct HTTP API
// // -----------------------------
// async function listCollectionsDirect() {
//   try {
//     const response = await axios.get('http://localhost:8000/api/v1/collections');
//     console.log('📋 Available collections:');
//     response.data.forEach((col, index) => {
//       console.log(`  ${index + 1}. ${col.name}`);
//     });
//     return response.data;
//   } catch (error) {
//     console.log('❌ Could not list collections:', error.message);
//     return [];
//   }
// }

// // -----------------------------
// // Main function
// // -----------------------------
// async function main() {
//   try {
//     console.log('🚀 Starting web scraping and embedding process...\n');
    
//     // Test Chroma connection
//     try {
//       await axios.get('http://localhost:8000/api/v1');
//       console.log('✅ Connected to ChromaDB successfully');
//     } catch (error) {
//       console.error('❌ Failed to connect to ChromaDB:', error.message);
//       console.log('💡 Make sure ChromaDB is running: docker-compose up -d');
//       process.exit(1);
//     }
    
//     // List existing collections
//     await listCollectionsDirect();
//     console.log('');
    
//     // Create new collection
//     const collectionName = await createCollectionDirect();
//     console.log('');
    
//     // Scrape webpage
//     const url = 'https://piyushgarg.com';
//     const { headings, bodyText } = await scrapeWebpage(url);
//     console.log('');
    
//     // Process and store headings
//     if (headings.length > 0) {
//       const headingChunks = splitText(headings.join(' '), 500);
//       await storeEmbeddingsDirect(collectionName, headingChunks, 'HEADINGS');
//       console.log('');
//     } else {
//       console.log('ℹ️ No headings found to process');
//     }
    
//     // Process and store body text
//     if (bodyText && bodyText.length > 0) {
//       const bodyChunks = splitText(bodyText, 2000);
//       await storeEmbeddingsDirect(collectionName, bodyChunks, 'BODY');
//       console.log('');
//     } else {
//       console.log('ℹ️ No body text found to process');
//     }
    
//     console.log(`\n🎉 Success! Embeddings stored successfully`);
//     console.log(`🔗 Collection name: ${collectionName}`);
//     console.log(`📊 You can query the collection at: http://localhost:8000`);
    
//   } catch (error) {
//     console.error('❌ Fatal error:', error.message);
//     process.exit(1);
//   }
// }

// // -----------------------------
// // Run the main function
// // -----------------------------
// main().catch(console.error);
import axios from 'axios';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';

dotenv.config();

// -----------------------------
// Explore available ChromaDB endpoints
// -----------------------------
async function exploreChromaEndpoints() {
  console.log('🔍 Exploring ChromaDB endpoints...');
  
  const endpointsToTest = [
    '/',
    '/api/v1/',
    '/api/v2/',
    '/api/v1/collections',
    '/api/v2/collections',
    '/api/v1/heartbeat', 
    '/api/v2/heartbeat',
    '/api/collections',
    '/api/heartbeat'
  ];
  
  for (const endpoint of endpointsToTest) {
    try {
      const response = await axios.get(`http://localhost:8000${endpoint}`, { timeout: 3000 });
      console.log(`✅ ${endpoint}: ${response.status} - ${JSON.stringify(response.data).substring(0, 100)}...`);
    } catch (error) {
      if (error.response) {
        console.log(`❌ ${endpoint}: ${error.response.status} - ${error.response.statusText}`);
      } else {
        console.log(`❌ ${endpoint}: ${error.message}`);
      }
    }
    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
  }
}

// -----------------------------
// Initialize Gemini embeddings
// -----------------------------
const embeddingsClient = new GoogleGenerativeAIEmbeddings({
  model: 'models/embedding-001',
  taskType: 'RETRIEVAL_DOCUMENT',
  apiKey: process.env.GOOGLE_API_KEY,
});

// -----------------------------
// Generate unique collection name
// -----------------------------
function generateCollectionName() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `webpage_embeddings_${timestamp}`;
}

// -----------------------------
// Scrape webpage
// -----------------------------
async function scrapeWebpage(url = '') {
  try {
    console.log(`🌐 Scraping: ${url}`);
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });
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
// Generate embeddings for text chunks
// -----------------------------
async function generateEmbeddings(textChunks) {
  console.log(`🧠 Generating embeddings for ${textChunks.length} chunks...`);
  try {
    const embeddings = await embeddingsClient.embedDocuments(textChunks);
    console.log(`✅ Generated ${embeddings.length} embeddings`);
    return embeddings;
  } catch (error) {
    console.error('❌ Failed to generate embeddings:', error.message);
    throw error;
  }
}

// -----------------------------
// Try to interact with ChromaDB using different approaches
// -----------------------------
async function tryChromaInteractions() {
  const collectionName = generateCollectionName();
  console.log(`\n🔄 Trying to interact with collection: ${collectionName}`);
  
  // Try different API approaches
  const approaches = [
    {
      name: 'Direct HTTP - Collections endpoint',
      method: async () => {
        const response = await axios.post(
          'http://localhost:8000/api/v1/collections',
          { name: collectionName },
          { headers: { 'Content-Type': 'application/json' }, timeout: 5000 }
        );
        return response.data;
      }
    },
    {
      name: 'Direct HTTP - Alternative endpoint',
      method: async () => {
        const response = await axios.post(
          'http://localhost:8000/collections',
          { name: collectionName },
          { headers: { 'Content-Type': 'application/json' }, timeout: 5000 }
        );
        return response.data;
      }
    }
  ];
  
  for (const approach of approaches) {
    try {
      console.log(`\n🔄 Trying: ${approach.name}`);
      const result = await approach.method();
      console.log(`✅ Success:`, JSON.stringify(result).substring(0, 100));
      return result;
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
      }
    }
  }
  
  throw new Error('All ChromaDB interaction approaches failed');
}

// -----------------------------
// Main function - Exploration mode
// -----------------------------
async function main() {
  try {
    console.log('🔍 ChromaDB API Explorer\n');
    
    // First, explore what endpoints are available
    await exploreChromaEndpoints();
    
    console.log('\n' + '='.repeat(60));
    console.log('\n🧪 Testing ChromaDB interactions...');
    
    // Test if we can interact with ChromaDB
    await tryChromaInteractions();
    
    console.log('\n' + '='.repeat(60));
    console.log('\n🌐 Testing web scraping (standalone)...');
    
    // Test web scraping separately
    const url = 'https://piyushgarg.com';
    const { headings, bodyText } = await scrapeWebpage(url);
    
    console.log(`\n✅ Web scraping successful:`);
    console.log(`   - Headings: ${headings.length}`);
    console.log(`   - Body text: ${bodyText.length} characters`);
    
    // Test embedding generation
    console.log(`\n🧪 Testing embedding generation...`);
    if (headings.length > 0) {
      const testTexts = [headings[0].substring(0, 50)];
      const embeddings = await generateEmbeddings(testTexts);
      console.log(`✅ Embedding generation successful:`);
      console.log(`   - Generated ${embeddings.length} embeddings`);
      console.log(`   - Embedding dimension: ${embeddings[0].length}`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('\n📋 Next steps:');
    console.log('1. Check ChromaDB version and API documentation');
    console.log('2. Use the correct API endpoints based on exploration');
    console.log('3. Consider using the ChromaDB JavaScript client with proper configuration');
    console.log('4. Or use direct HTTP calls to the working endpoints');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

// -----------------------------
// Run the exploration
// -----------------------------
main().catch(console.error);