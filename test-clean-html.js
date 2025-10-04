#!/usr/bin/env node

/**
 * Test script for HTML Unicode Cleaner
 * This script demonstrates how to use the clean-html-unicode.js module
 */

const { cleanInvisibleChars, analyzeInvisibleChars, cleanHtmlFile } = require('./clean-html-unicode.js');

async function testCleaner() {
  console.log('🧪 Testing HTML Unicode Cleaner...\n');
  
  // Test with sample text containing invisible characters
  const testText = 'Hello\u200BWorld\uFEFF!\u200C This\u200D is\u00A0a test\u2060.';
  console.log('📝 Test text with invisible characters:');
  console.log(`   "${testText}"`);
  console.log(`   Length: ${testText.length} characters\n`);
  
  // Analyze invisible characters
  const analysis = analyzeInvisibleChars(testText);
  console.log('🔍 Analysis:');
  console.log(`   Total characters: ${analysis.totalChars}`);
  console.log(`   Invisible characters: ${analysis.invisibleCount}`);
  
  if (analysis.invisibleCount > 0) {
    console.log('   Invisible character details:');
    Object.entries(analysis.invisibleChars).forEach(([name, info]) => {
      console.log(`     ${name}: ${info.count} occurrences (${info.unicode})`);
    });
  }
  
  // Clean the text
  const cleanedText = cleanInvisibleChars(testText);
  console.log(`\n✨ Cleaned text: "${cleanedText}"`);
  console.log(`   Length: ${cleanedText.length} characters`);
  console.log(`   Removed: ${testText.length - cleanedText.length} characters\n`);
  
  // Test with actual HTML file if it exists
  const testFilePath = 'scrspedhtml/TheBodyShop.html';
  if (require('fs').existsSync(testFilePath)) {
    console.log(`🧹 Testing with actual HTML file: ${testFilePath}`);
    try {
      const result = await cleanHtmlFile(testFilePath);
      console.log('\n✅ File cleaning completed successfully!');
      console.log(`📊 Results:`);
      console.log(`   Original size: ${result.originalSize} characters`);
      console.log(`   Cleaned size: ${result.cleanedSize} characters`);
      console.log(`   Removed: ${result.removedChars} invisible characters`);
      console.log(`   Output file: ${result.outputFile}`);
    } catch (error) {
      console.error(`❌ Error cleaning file: ${error.message}`);
    }
  } else {
    console.log(`ℹ️  Test HTML file not found: ${testFilePath}`);
    console.log('   You can test with any HTML file using:');
    console.log('   node clean-html-unicode.js <your-file.html>');
  }
}

// Run the test
testCleaner().catch(console.error);
