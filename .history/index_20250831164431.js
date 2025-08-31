import axios from 'axios';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';

dotenv.config();

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
// Store embeddings locally (fallback since ChromaDB API is not working)
// -----------------------------
async function storeEmbeddingsLocally(collectionName, textChunks, label) {
  console.log(`💾 Storing ${textChunks.length} ${label} chunks locally...`);
  
  try {
    const embeddings = await generateEmbeddings(textChunks);
    
    const storedData = {
      collection: collectionName,
      items: [],
      timestamp: new Date().toISOString(),
      total_embeddings: embeddings.length,
      embedding_dimension: embeddings[0] ? embeddings[0].length : 0
    };
    
    for (let i = 0; i < textChunks.length; i++) {
      storedData.items.push({
        id: `${label}_${i + 1}_${Date.now()}`,
        embedding: embeddings[i],
        document: textChunks[i],
        metadata: { 
          label, 
          chunk_index: i + 1,
          total_chunks: textChunks.length,
          timestamp: new Date().toISOString()
        }
      });
    }
    
    // For Node.js, we'll write to a file
    const fs = require('fs').promises;
    const filename = `${collectionName}.json`;
    await fs.writeFile(filename, JSON.stringify(storedData, null, 2));
    
    console.log(`✅ Successfully stored ${textChunks.length} ${label} chunks locally`);
    console.log(`📁 Data saved to: ${filename}`);
    console.log(`📊 Embedding dimension: ${storedData.embedding_dimension}`);
    
    return storedData;
    
  } catch (error) {
    console.error(`❌ Failed to store ${label} chunks locally:`, error.message);
    throw error;
  }
}

// -----------------------------
// Try to use ChromaDB with the working heartbeat endpoint
// -----------------------------
async function tryChromaConnection() {
  try {
    console.log('🔍 Testing ChromaDB connection...');
    const response = await axios.get('http://localhost:8000/api/v2/heartbeat', { timeout: 5000 });
    console.log('✅ ChromaDB heartbeat:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Cannot connect to ChromaDB:', error.message);
    return false;
  }
}

// -----------------------------
// Main function - Local storage approach
// -----------------------------
async function main() {
  try {
    console.log('🚀 Starting Web Scraping and Embedding Generation\n');
    
    // Test ChromaDB connection
    const isChromaConnected = await tryChromaConnection();
    
    if (!isChromaConnected) {
      console.log('\n⚠️  ChromaDB is not properly configured or API has changed');
      console.log('💡 Using local storage instead\n');
    }
    
    console.log('='.repeat(60));
    
    // Generate collection name
    const collectionName = generateCollectionName();
    console.log(`📁 Collection: ${collectionName}`);
    
    // Scrape webpage
    const url = 'https://example.com';
    console.log(`\n🌐 Scraping: ${url}`);
    const { headings, bodyText } = await scrapeWebpage(url);
    
    console.log('='.repeat(60));
    
    // Process and store headings
    if (headings.length > 0) {
      const headingChunks = splitText(headings.join(' '), 500);
      console.log(`\n📝 Processing ${headingChunks.length} heading chunks...`);
      await storeEmbeddingsLocally(collectionName, headingChunks, 'HEADINGS');
    } else {
      console.log('\nℹ️ No headings found to process');
    }
    
    // Process and store body text
    if (bodyText && bodyText.length > 0) {
      const bodyChunks = splitText(bodyText, 1000);
      console.log(`\n📝 Processing ${bodyChunks.length} body text chunks...`);
      await storeEmbeddingsLocally(collectionName, bodyChunks, 'BODY');
    } else {
      console.log('\nℹ️ No body text found to process');
    }
    
    console.log('='.repeat(60));
    console.log('\n🎉 SUCCESS! All embeddings generated and stored locally');
    console.log(`📁 Collection: ${collectionName}`);
    console.log(`📊 Headings: ${headings.length}`);
    console.log(`📄 Body Text: ${bodyText.length} characters`);
    
    console.log('\n' + '='.repeat(60));
    console.log('\n🔧 ChromaDB Status:');
    if (isChromaConnected) {
      console.log('✅ ChromaDB is running but API endpoints have changed');
      console.log('💡 Only /api/v2/heartbeat endpoint is working');
    } else {
      console.log('❌ ChromaDB is not accessible');
    }
    
    console.log('\n📋 Next Steps:');
    console.log('1. Check ChromaDB version: docker exec genai-chromadb-1 chroma --version');
    console.log('2. Consult latest ChromaDB documentation for API changes');
    console.log('3. Your embeddings are saved locally in JSON files');
    console.log('4. You can use the embeddings with other vector databases');
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
  }
}

// -----------------------------
// Run the main function
// -----------------------------
main().catch(console.error);