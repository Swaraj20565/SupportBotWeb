
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
// // // Wrap Gemini embeddings to Chroma embedding function
// // // -----------------------------
// // const myEmbeddingFunction = async (texts) => {
// //   const vectors = await embeddingsClient.embedDocuments(texts);
// //   return vectors;
// // };

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
// //     embeddingFunction: myEmbeddingFunction,
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
// // // Store embeddings in Chroma
// // // -----------------------------
// // async function storeEmbeddings(collection, textChunks, label) {
// //   console.log(`💾 Storing ${textChunks.length} ${label} chunks...`);
  
// //   for (const [i, chunk] of textChunks.entries()) {
// //     try {
// //       await collection.add({
// //         ids: [`${label}_${i + 1}_${Date.now()}`],
// //         documents: [chunk],
// //         metadatas: [{ 
// //           label, 
// //           chunk_index: i + 1,
// //           total_chunks: textChunks.length,
// //           timestamp: new Date().toISOString()
// //         }],
// //       });
      
// //       if ((i + 1) % 5 === 0 || i + 1 === textChunks.length) {
// //         console.log(`   ↳ Stored ${label} chunk ${i + 1}/${textChunks.length}`);
// //       }
// //     } catch (error) {
// //       console.error(`❌ Failed to store chunk ${i + 1}:`, error.message);
// //     }
// //   }
  
// //   console.log(`✅ Finished storing ${label} chunks`);
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
    
// //     // Verify the collection was created
// //     const collections = await listCollections();
// //     const currentCollection = collections.find(col => col.name === collection.name);
    
// //     if (currentCollection) {
// //       console.log(`\n🎉 Success! Collection "${collection.name}" created with embeddings`);
// //       console.log(`🔗 You can query this collection using the name: ${collection.name}`);
// //     } else {
// //       console.log('\n⚠️  Collection created but not found in list');
// //     }
    
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
// import { ChromaClient } from 'chromadb';

// dotenv.config();

// // -----------------------------
// // Initialize Chroma client
// // -----------------------------
// const chroma = new ChromaClient({ url: 'http://localhost:8000' });

// // -----------------------------
// // Initialize Gemini embeddings
// // -----------------------------
// const embeddingsClient = new GoogleGenerativeAIEmbeddings({
//   model: 'models/gemini-embedding-001',
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
// // Create collection with unique name
// // -----------------------------
// async function createCollection() {
//   const collectionName = generateCollectionName();
//   console.log(`📦 Creating collection: ${collectionName}`);
  
//   const collection = await chroma.createCollection({
//     name: collectionName,
//   });
  
//   return collection;
// }

// // -----------------------------
// // List all collections (for debugging)
// // -----------------------------
// async function listCollections() {
//   try {
//     const collections = await chroma.listCollections();
//     console.log('📋 Available collections:');
//     collections.forEach((col, index) => {
//       console.log(`  ${index + 1}. ${col.name}`);
//     });
//     return collections;
//   } catch (error) {
//     console.log('❌ Could not list collections:', error.message);
//     return [];
//   }
// }

// // -----------------------------
// // Scrape webpage
// // -----------------------------
// async function scrapeWebpage(url = '') {
//   try {
//     console.log(`🌐 Scraping: ${url}`);
//     const { data } = await axios.get(url);
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
//     console.log(`✅ Generated ${embeddings.length} embeddings`);
//     return embeddings;
//   } catch (error) {
//     console.error('❌ Failed to generate embeddings:', error.message);
//     throw error;
//   }
// }

// // -----------------------------
// // Store embeddings in Chroma
// // -----------------------------
// async function storeEmbeddings(collection, textChunks, label) {
//   console.log(`💾 Storing ${textChunks.length} ${label} chunks...`);
  
//   try {
//     // Generate embeddings first
//     const embeddings = await generateEmbeddings(textChunks);
    
//     // Prepare data for batch insertion
//     const ids = [];
//     const documents = [];
//     const metadatas = [];
    
//     for (let i = 0; i < textChunks.length; i++) {
//       ids.push(`${label}_${i + 1}_${Date.now()}`);
//       documents.push(textChunks[i]);
//       metadatas.push({ 
//         label, 
//         chunk_index: i + 1,
//         total_chunks: textChunks.length,
//         timestamp: new Date().toISOString()
//       });
//     }
    
//     // Add all chunks at once
//     await collection.add({
//       ids,
//       embeddings: embeddings, // Pass the pre-computed embeddings
//       documents,
//       metadatas,
//     });
    
//     console.log(`✅ Successfully stored ${textChunks.length} ${label} chunks`);
    
//   } catch (error) {
//     console.error(`❌ Failed to store ${label} chunks:`, error.message);
//     throw error;
//   }
// }

// // -----------------------------
// // Main function
// // -----------------------------
// async function main() {
//   try {
//     console.log('🚀 Starting web scraping and embedding process...\n');
    
//     // List existing collections
//     await listCollections();
//     console.log('');
    
//     // Create new collection with unique name
//     const collection = await createCollection();
//     console.log('');
    
//     // Scrape webpage
//     const url = 'https://piyushgarg.com';
//     const { headings, bodyText } = await scrapeWebpage(url);
//     console.log('');
    
//     // Process and store headings
//     if (headings.length > 0) {
//       const headingChunks = splitText(headings.join(' '), 500);
//       await storeEmbeddings(collection, headingChunks, 'HEADINGS');
//       console.log('');
//     }
    
//     // Process and store body text
//     if (bodyText) {
//       const bodyChunks = splitText(bodyText, 2000);
//       await storeEmbeddings(collection, bodyChunks, 'BODY');
//       console.log('');
//     }
    
//     // Verify the collection was created and has data
//     try {
//       const collectionInfo = await collection.count();
//       console.log(`📊 Collection now has ${collectionInfo} items`);
//     } catch (error) {
//       console.log('ℹ️  Could not get collection count, but collection was created');
//     }
    
//     console.log(`\n🎉 Success! Collection "${collection.name}" created with embeddings`);
//     console.log(`🔗 You can query this collection using the name: ${collection.name}`);
    
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
import { ChromaClient } from 'chromadb';

dotenv.config();

// -----------------------------
// Initialize Chroma client
// -----------------------------
const chroma = new ChromaClient({ 
  url: 'http://localhost:8000',
  fetchOptions: {
    headers: {
      'Content-Type': 'application/json',
    }
  }
});

// -----------------------------
// Initialize Gemini embeddings
// -----------------------------
const embeddingsClient = new GoogleGenerativeAIEmbeddings({
  model: 'models/embedding-001',
  taskType: 'RETRIEVAL_DOCUMENT',
  apiKey: process.env.GOOGLE_API_KEY,
});

// -----------------------------
// Generate unique collection name with timestamp
// -----------------------------
function generateCollectionName() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `webpage_embeddings_${timestamp}`;
}

// -----------------------------
// Create collection without embedding function
// -----------------------------
async function createCollection() {
  const collectionName = generateCollectionName();
  console.log(`📦 Creating collection: ${collectionName}`);
  
  try {
    const collection = await chroma.createCollection({
      name: collectionName,
    });
    return collection;
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('ℹ️ Collection already exists, using existing one');
      return await chroma.getCollection({ name: collectionName });
    }
    throw error;
  }
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
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
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
    console.log(`✅ Generated ${embeddings.length} embeddings (dimension: ${embeddings[0]?.length || 0})`);
    return embeddings;
  } catch (error) {
    console.error('❌ Failed to generate embeddings:', error.message);
    throw error;
  }
}

// -----------------------------
// Store embeddings in Chroma
// -----------------------------
async function storeEmbeddings(collection, textChunks, label) {
  console.log(`💾 Storing ${textChunks.length} ${label} chunks...`);
  
  try {
    // Generate embeddings first
    const embeddings = await generateEmbeddings(textChunks);
    
    // Prepare data for batch insertion
    const ids = [];
    const documents = [];
    const metadatas = [];
    
    for (let i = 0; i < textChunks.length; i++) {
      ids.push(`${label}_${i + 1}_${Date.now()}`);
      documents.push(textChunks[i]);
      metadatas.push({ 
        label, 
        chunk_index: i + 1,
        total_chunks: textChunks.length,
        timestamp: new Date().toISOString(),
        source: 'web_scraping'
      });
    }
    
    // Add all chunks at once with pre-computed embeddings
    await collection.add({
      ids,
      embeddings, // Pass the pre-computed embeddings
      documents,
      metadatas,
    });
    
    console.log(`✅ Successfully stored ${textChunks.length} ${label} chunks`);
    
  } catch (error) {
    console.error(`❌ Failed to store ${label} chunks:`, error.message);
    throw error;
  }
}

// -----------------------------
// Get collection count
// -----------------------------
async function getCollectionCount(collection) {
  try {
    const count = await collection.count();
    return count;
  } catch (error) {
    console.log('ℹ️ Could not get collection count:', error.message);
    return 'unknown';
  }
}

// -----------------------------
// Main function
// -----------------------------
async function main() {
  try {
    console.log('🚀 Starting web scraping and embedding process...\n');
    
    // Test Chroma connection
    try {
      await chroma.heartbeat();
      console.log('✅ Connected to ChromaDB successfully');
    } catch (error) {
      console.error('❌ Failed to connect to ChromaDB:', error.message);
      console.log('💡 Make sure ChromaDB is running: docker-compose up -d');
      process.exit(1);
    }
    
    // List existing collections
    const collections = await listCollections();
    console.log('');
    
    // Create new collection
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
    } else {
      console.log('ℹ️ No headings found to process');
    }
    
    // Process and store body text
    if (bodyText && bodyText.length > 0) {
      const bodyChunks = splitText(bodyText, 2000);
      await storeEmbeddings(collection, bodyChunks, 'BODY');
      console.log('');
    } else {
      console.log('ℹ️ No body text found to process');
    }
    
    // Verify the collection was created and has data
    const count = await getCollectionCount(collection);
    console.log(`📊 Collection "${collection.name}" has ${count} items`);
    
    console.log(`\n🎉 Success! Embeddings stored successfully`);
    console.log(`🔗 Collection name: ${collection.name}`);
    console.log(`📊 Total items: ${count}`);
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    if (error.response) {
      console.error('Error details:', error.response.data);
    }
    process.exit(1);
  }
}

// -----------------------------
// Run the main function
// -----------------------------
main().catch(console.error);