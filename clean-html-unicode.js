#!/usr/bin/env node

/**
 * HTML Unicode Cleaner
 * 
 * This script removes invisible unicode characters from HTML files
 * that can cause issues in VS Code and other text editors.
 * 
 * Usage: node clean-html-unicode.js <input-file>
 * Example: node clean-html-unicode.js scrspedhtml/TheBodyShop.html
 */

const fs = require('fs');
const path = require('path');

// Define invisible unicode characters to remove
const INVISIBLE_CHARS = {
  // Zero-width characters
  ZERO_WIDTH_SPACE: '\u200B',           // U+200B
  ZERO_WIDTH_NON_JOINER: '\u200C',      // U+200C
  ZERO_WIDTH_JOINER: '\u200D',          // U+200D
  WORD_JOINER: '\u2060',                // U+2060
  
  // Byte Order Mark and related
  BYTE_ORDER_MARK: '\uFEFF',            // U+FEFF
  
  // Format characters
  LEFT_TO_RIGHT_MARK: '\u200E',         // U+200E
  RIGHT_TO_LEFT_MARK: '\u200F',         // U+200F
  LEFT_TO_RIGHT_EMBEDDING: '\u202A',    // U+202A
  RIGHT_TO_LEFT_EMBEDDING: '\u202B',    // U+202B
  POP_DIRECTIONAL_FORMATTING: '\u202C', // U+202C
  LEFT_TO_RIGHT_OVERRIDE: '\u202D',     // U+202D
  RIGHT_TO_LEFT_OVERRIDE: '\u202E',     // U+202E
  
  // Other invisible characters
  SOFT_HYPHEN: '\u00AD',                // U+00AD
  MONGOLIAN_VOWEL_SEPARATOR: '\u180E',  // U+180E
  OBJECT_REPLACEMENT_CHARACTER: '\uFFFC', // U+FFFC
  
  // Non-breaking spaces (multiple variants)
  NON_BREAKING_SPACE: '\u00A0',         // U+00A0
  EN_QUAD: '\u2000',                    // U+2000
  EM_QUAD: '\u2001',                    // U+2001
  EN_SPACE: '\u2002',                   // U+2002
  EM_SPACE: '\u2003',                   // U+2003
  THREE_PER_EM_SPACE: '\u2004',         // U+2004
  FOUR_PER_EM_SPACE: '\u2005',          // U+2005
  SIX_PER_EM_SPACE: '\u2006',           // U+2006
  FIGURE_SPACE: '\u2007',               // U+2007
  PUNCTUATION_SPACE: '\u2008',          // U+2008
  THIN_SPACE: '\u2009',                 // U+2009
  HAIR_SPACE: '\u200A',                 // U+200A
  NARROW_NO_BREAK_SPACE: '\u202F',      // U+202F
  MEDIUM_MATHEMATICAL_SPACE: '\u205F',  // U+205F
  IDEOGRAPHIC_SPACE: '\u3000',          // U+3000
};

// Create regex pattern for all invisible characters
const INVISIBLE_CHARS_REGEX = new RegExp(
  Object.values(INVISIBLE_CHARS).map(char => 
    char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escape regex special chars
  ).join('|'), 
  'g'
);

/**
 * Clean invisible unicode characters from text
 * @param {string} text - Input text to clean
 * @returns {string} - Cleaned text
 */
function cleanInvisibleChars(text) {
  if (typeof text !== 'string') {
    throw new Error('Input must be a string');
  }
  
  return text.replace(INVISIBLE_CHARS_REGEX, '');
}

/**
 * Get character information for debugging
 * @param {string} text - Text to analyze
 * @returns {Object} - Character analysis results
 */
function analyzeInvisibleChars(text) {
  const analysis = {
    totalChars: text.length,
    invisibleChars: {},
    invisibleCount: 0
  };
  
  Object.entries(INVISIBLE_CHARS).forEach(([name, char]) => {
    const count = (text.match(new RegExp(char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
    if (count > 0) {
      analysis.invisibleChars[name] = {
        character: char,
        unicode: `U+${char.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}`,
        count: count
      };
      analysis.invisibleCount += count;
    }
  });
  
  return analysis;
}

/**
 * Clean HTML file and save cleaned version
 * @param {string} inputFilePath - Path to input HTML file
 * @returns {Promise<Object>} - Result object with success status and file paths
 */
async function cleanHtmlFile(inputFilePath) {
  try {
    // Validate input file path
    if (!inputFilePath) {
      throw new Error('Input file path is required');
    }
    
    if (!fs.existsSync(inputFilePath)) {
      throw new Error(`Input file does not exist: ${inputFilePath}`);
    }
    
    // Read the original file
    console.log(`📖 Reading file: ${inputFilePath}`);
    const originalContent = fs.readFileSync(inputFilePath, 'utf8');
    
    // Analyze invisible characters before cleaning
    const beforeAnalysis = analyzeInvisibleChars(originalContent);
    console.log(`🔍 Found ${beforeAnalysis.invisibleCount} invisible characters`);
    
    if (beforeAnalysis.invisibleCount > 0) {
      console.log('📊 Invisible characters detected:');
      Object.entries(beforeAnalysis.invisibleChars).forEach(([name, info]) => {
        console.log(`   ${name}: ${info.count} occurrences (${info.unicode})`);
      });
    }
    
    // Clean the content
    console.log('🧹 Cleaning invisible characters...');
    const cleanedContent = cleanInvisibleChars(originalContent);
    
    // Analyze after cleaning
    const afterAnalysis = analyzeInvisibleChars(cleanedContent);
    const removedCount = beforeAnalysis.invisibleCount - afterAnalysis.invisibleCount;
    
    // Generate output file path
    const inputDir = path.dirname(inputFilePath);
    const inputBasename = path.basename(inputFilePath, path.extname(inputFilePath));
    const inputExt = path.extname(inputFilePath);
    const outputFileName = `${inputBasename}_clean${inputExt}`;
    const outputFilePath = path.join(inputDir, outputFileName);
    
    // Save cleaned content
    console.log(`💾 Saving cleaned file: ${outputFilePath}`);
    fs.writeFileSync(outputFilePath, cleanedContent, 'utf8');
    
    // Return result
    const result = {
      success: true,
      inputFile: inputFilePath,
      outputFile: outputFilePath,
      originalSize: originalContent.length,
      cleanedSize: cleanedContent.length,
      removedChars: removedCount,
      analysis: {
        before: beforeAnalysis,
        after: afterAnalysis
      }
    };
    
    console.log(`✅ Successfully cleaned HTML file!`);
    console.log(`📁 Output file: ${outputFilePath}`);
    console.log(`📊 Removed ${removedCount} invisible characters`);
    console.log(`📏 File size: ${originalContent.length} → ${cleanedContent.length} characters`);
    
    return result;
    
  } catch (error) {
    console.error(`❌ Error cleaning HTML file: ${error.message}`);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    // Get input file from command line arguments
    const inputFile = process.argv[2];
    
    if (!inputFile) {
      console.log('Usage: node clean-html-unicode.js <input-file>');
      console.log('');
      console.log('Examples:');
      console.log('  node clean-html-unicode.js scrspedhtml/TheBodyShop.html');
      console.log('  node clean-html-unicode.js ./data/page.html');
      console.log('');
      console.log('This script will:');
      console.log('1. Read the specified HTML file');
      console.log('2. Remove invisible unicode characters');
      console.log('3. Save cleaned content to <filename>_clean.html');
      console.log('4. Log detailed cleaning statistics');
      process.exit(1);
    }
    
    // Clean the file
    const result = await cleanHtmlFile(inputFile);
    
    // Additional success message
    console.log('');
    console.log('🎉 HTML file cleaning completed successfully!');
    console.log(`📂 Original file: ${result.inputFile}`);
    console.log(`📂 Cleaned file: ${result.outputFile}`);
    
  } catch (error) {
    console.error(`💥 Fatal error: ${error.message}`);
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
  main();
}

// Export functions for use as a module
module.exports = {
  cleanInvisibleChars,
  analyzeInvisibleChars,
  cleanHtmlFile,
  INVISIBLE_CHARS
};
