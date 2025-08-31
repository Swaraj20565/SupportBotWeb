import * as cheerio from 'cheerio';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import { ChromaClient } from 'chromadb';
import readline from 'readline';

dotenv.config();

// -----------------------------
// Initialize clients
// -----------------------------
const chromaClient = new ChromaClient({
  path: 'http://localhost:8000'
});

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// -----------------------------
// Generate vector embeddings for text
// -----------------------------
async function generateVectorEmbeddings(text) {
  try {
    const model = genAI.getGenerativeModel({ model: 'embedding-001' });
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error('❌ Failed to generate embeddings:', error.message);
    console.error('Embedding error details:', error);
    throw error;
  }
}

// -----------------------------
// Generate embeddings for multiple documents
// -----------------------------
async function generateEmbeddings(textChunks) {
  console.log(`🧠 Generating embeddings for ${textChunks.length} chunks...`);
  try {
    const embeddings = [];
    const model = genAI.getGenerativeModel({ model: 'embedding-001' });
    
    for (const chunk of textChunks) {
      const result = await model.embedContent(chunk);
      embeddings.push(result.embedding.values);
    }
    
    console.log(`✅ Generated ${embeddings.length} embeddings`);
    return embeddings;
  } catch (error) {
    console.error('❌ Failed to generate embeddings:', error.message);
    throw error;
  }
}

// -----------------------------
// Generate unique collection name
// -----------------------------
function generateCollectionName() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const randomSuffix = Math.floor(Math.random() * 1000);
  return `webpage_embeddings_${timestamp}_${randomSuffix}`;
}

// -----------------------------
// Generate answer using Gemini with retry
// -----------------------------
async function generateAnswer(question, context, retries = 3) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });
    const prompt = `
Based EXCLUSIVELY on the following context, provide a clear and concise answer to the question.
If the context doesn't contain relevant information, say "I don't have enough information about that."

CONTEXT:
${context}

QUESTION: ${question}

ANSWER:`;
  
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
    
  } catch (error) {
    if (error.status === 429 && retries > 0) {
      const retryDelay = error.errorDetails?.[2]?.retryDelay?.replace('s', '') || 3;
      console.warn(`⚠️ Rate limit hit, retrying in ${retryDelay}s...`);
      await new Promise(res => setTimeout(res, parseInt(retryDelay) * 1000));
      return generateAnswer(question, context, retries - 1);
    }
    console.error('❌ Failed to generate answer:', error.message);
    console.error('Error details:', error);
    return "Sorry, I couldn't generate an answer at the moment.";
  }
}

// -----------------------------
// Enhanced chat function with answer generation
// -----------------------------
async function enhancedChat(question = '') {
  try {
    console.log(`\n💬 Question: ${question}`);
    
    // Generate embedding for the question
    const questionEmbedding = await generateVectorEmbeddings(question);
    
    // Get collections and use the most recent one
    const collections = await chromaClient.listCollections();
    if (collections.length === 0) {
      console.log('❌ No collections found in ChromaDB');
      return;
    }
    
    collections.sort((a, b) => b.name.localeCompare(a.name));
    const mostRecentCollection = collections[0];
    
    const collection = await chromaClient.getCollection({ 
      name: mostRecentCollection.name 
    });
    
    console.log(`📁 Using collection: ${collection.name}`);
    
    // Query the collection
    const results = await collection.query({
      nResults: 3,
      queryEmbeddings: [questionEmbedding],
    });
    
    if (!results.documents || !results.documents[0] || results.documents[0].length === 0) {
      console.log('❌ No relevant information found');
      return;
    }
    
    const context = results.documents[0].slice(0, 2).join('\n\n');
    
    console.log('🧠 Generating answer...');
    const answer = await generateAnswer(question, context);
    
    console.log(`\n🤖 Answer: ${answer}`);
    
    console.log('\n🔍 Sources:');
    results.metadatas[0].slice(0, 2).forEach((meta, index) => {
      const similarity = (1 - results.distances[0][index]).toFixed(3);
      const preview = results.documents[0][index].substring(0, 100) + '...';
      console.log(`\n   ${index + 1}. [${similarity}] ${meta.label} - Chunk ${meta.chunk_index}`);
      console.log(`      ${preview}`);
    });
    
  } catch (error) {
    console.error('❌ Chat failed:', error.message);
  }
}

// -----------------------------
// Interactive chat interface
// -----------------------------
function createChatInterface() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  console.log('\n🤖 AI Assistant Ready!');
  console.log('💡 Ask me anything about Artificial Intelligence');
  console.log('🚪 Type "exit" or "quit" to end the conversation\n');
  
  console.log('💬 Your question:');
  
  rl.on('line', async (input) => {
    const question = input.trim();
    
    if (question.toLowerCase() === 'exit' || question.toLowerCase() === 'quit') {
      console.log('\n👋 Goodbye!');
      rl.close();
      return;
    }
    
    if (question === '') {
      console.log('💬 Your question:');
      return;
    }
    
    await enhancedChat(question);
    console.log('\n💬 Your next question:');
  });
  
  rl.on('close', () => {
    console.log('\n🎯 Conversation ended');
    process.exit(0);
  });
}

// -----------------------------
// Improved webpage scraping
// -----------------------------
async function scrapeBetterContent(url = '') {
  try {
    console.log(`🌐 Scraping: ${url}`);
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000
    });
    const $ = cheerio.load(data);

    const mainContent = $('#mw-content-text').text().replace(/\s+/g, ' ').trim();
    
    const headings = [];
    $('h1, h2, h3, h4, h5, h6').each((_, el) => {
      const text = $(el).text().trim();
      if (text && !text.includes('Contents') && !text.includes('Navigation')) {
        headings.push(text);
      }
    });

    let cleanContent = mainContent.replace(/\[\d+\]/g, '').replace(/\s+/g, ' ').trim();
    
    console.log(`✅ Found ${headings.length} headings and ${cleanContent.length} characters of content`);
    return { headings, bodyText: cleanContent };
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
// Create data directory if it doesn't exist
// -----------------------------
async function ensureDataDirectory() {
  try {
    await fs.access('data');
  } catch (error) {
    await fs.mkdir('data', { recursive: true });
    console.log('📁 Created data directory');
  }
}

// -----------------------------
// Store embeddings locally
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
      embedding_dimension: embeddings[0] ? embeddings[0].length : 0,
      source: 'web_scraping'
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
          timestamp: new Date().toISOString(),
          chars: textChunks[i].length
        }
      });
    }
    
    await ensureDataDirectory();
    const filename = path.join('data', `${collectionName}_${label}.json`);
    await fs.writeFile(filename, JSON.stringify(storedData, null, 2));
    
    console.log(`✅ Successfully stored ${textChunks.length} ${label} chunks`);
    console.log(`📁 Data saved to: ${filename}`);
    
    return storedData;
    
  } catch (error) {
    console.error(`❌ Failed to store ${label} chunks:`, error.message);
    throw error;
  }
}

// -----------------------------
// Store embeddings in ChromaDB
// -----------------------------
async function storeEmbeddingsChroma(collectionName, textChunks, label) {
  console.log(`💾 Storing ${textChunks.length} ${label} chunks in ChromaDB...`);
  
  try {
    const embeddings = await generateEmbeddings(textChunks);
    
    const collection = await chromaClient.getOrCreateCollection({
      name: collectionName,
    });
    
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
        chars: textChunks[i].length
      });
    }
    
    await collection.add({
      ids,
      embeddings,
      documents,
      metadatas,
    });
    
    console.log(`✅ Successfully stored ${textChunks.length} ${label} chunks in ChromaDB`);
    return true;
    
  } catch (error) {
    console.error(`❌ Failed to store ${label} chunks in ChromaDB:`, error.message);
    return false;
  }
}

// -----------------------------
// Test ChromaDB connection
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
// Display file information
// -----------------------------
async function displayFileInfo() {
  try {
    const files = await fs.readdir('data');
    console.log('\n📋 Stored files:');
    files.forEach((file, index) => {
      console.log(`   ${index + 1}. ${file}`);
    });
  } catch (error) {
    console.log('📁 No data files found yet');
  }
}

// -----------------------------
// Main function
// -----------------------------
async function main() {
  try {
    console.log('🚀 Starting Enhanced Web Scraping and RAG System\n');
    
    const isChromaConnected = await tryChromaConnection();
    const collectionName = generateCollectionName();
    console.log(`📁 Collection: ${collectionName}`);
    
    const url = 'https://www.piyushgarg.dev/cohort';
    console.log(`\n🌐 Scraping: ${url}`);
    const { headings, bodyText } = await scrapeBetterContent(url);
    
    console.log('='.repeat(60));
    
    if (headings.length > 0) {
      const headingChunks = splitText(headings.join(' '), 500);
      console.log(`\n📝 Processing ${headingChunks.length} heading chunks...`);
      
      if (isChromaConnected) {
        await storeEmbeddingsChroma(collectionName, headingChunks.slice(0, 5), 'HEADINGS');
      } else {
        await storeEmbeddingsLocally(collectionName, headingChunks.slice(0, 5), 'HEADINGS');
      }
    }
    
    if (bodyText && bodyText.length > 0) {
      const bodyChunks = splitText(bodyText, 1000);
      console.log(`\n📝 Processing ${bodyChunks.length} body text chunks...`);
      
      if (isChromaConnected) {
        await storeEmbeddingsChroma(collectionName, bodyChunks.slice(0, 10), 'BODY');
      } else {
        await storeEmbeddingsLocally(collectionName, bodyChunks.slice(0, 10), 'BODY');
      }
    }
    
    console.log('='.repeat(60));
    console.log('\n🎉 SUCCESS! All embeddings generated and stored');
    console.log(`📁 Collection: ${collectionName}`);
    console.log(`📊 Headings: ${headings.length}`);
    console.log(`📄 Content: ${bodyText.length} characters`);
    
    await displayFileInfo();
    
    if (isChromaConnected) {
      console.log('\n' + '='.repeat(60));
      console.log('\n🤖 Starting interactive chat interface...');
      setTimeout(() => {
        createChatInterface();
      }, 1000);
    } else {
      console.log('\n🔧 ChromaDB not available - using local storage only');
    }
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
    }
  }
}

// -----------------------------
// Run the main function
// -----------------------------
main().catch(console.error);
