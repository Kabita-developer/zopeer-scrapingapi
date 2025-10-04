#!/usr/bin/env node

/**
 * Batch HTML Unicode Cleaner
 * 
 * This script cleans multiple HTML files in a directory or file list
 * by removing invisible unicode characters.
 * 
 * Usage: 
 *   node batch-clean-html.js <directory>
 *   node batch-clean-html.js file1.html file2.html file3.html
 */

const fs = require('fs');
const path = require('path');
const { cleanHtmlFile } = require('./clean-html-unicode.js');

/**
 * Get all HTML files in a directory
 * @param {string} dirPath - Directory path
 * @returns {Array} - Array of HTML file paths
 */
function getHtmlFiles(dirPath) {
  try {
    const files = fs.readdirSync(dirPath);
    return files
      .filter(file => file.toLowerCase().endsWith('.html'))
      .map(file => path.join(dirPath, file));
  } catch (error) {
    console.error(`Error reading directory ${dirPath}: ${error.message}`);
    return [];
  }
}

/**
 * Clean multiple HTML files
 * @param {Array} filePaths - Array of file paths to clean
 * @returns {Promise<Object>} - Batch processing results
 */
async function batchCleanHtmlFiles(filePaths) {
  const results = {
    total: filePaths.length,
    success: 0,
    failed: 0,
    totalRemoved: 0,
    totalOriginalSize: 0,
    totalCleanedSize: 0,
    files: []
  };
  
  console.log(`🔄 Processing ${filePaths.length} HTML files...\n`);
  
  for (let i = 0; i < filePaths.length; i++) {
    const filePath = filePaths[i];
    const fileName = path.basename(filePath);
    
    console.log(`[${i + 1}/${filePaths.length}] Processing: ${fileName}`);
    
    try {
      const result = await cleanHtmlFile(filePath);
      results.success++;
      results.totalRemoved += result.removedChars;
      results.totalOriginalSize += result.originalSize;
      results.totalCleanedSize += result.cleanedSize;
      
      results.files.push({
        file: filePath,
        status: 'success',
        removed: result.removedChars,
        originalSize: result.originalSize,
        cleanedSize: result.cleanedSize,
        outputFile: result.outputFile
      });
      
      console.log(`   ✅ Success - Removed ${result.removedChars} invisible characters`);
      
    } catch (error) {
      results.failed++;
      results.files.push({
        file: filePath,
        status: 'failed',
        error: error.message
      });
      
      console.log(`   ❌ Failed - ${error.message}`);
    }
    
    console.log(''); // Add spacing between files
  }
  
  return results;
}

/**
 * Print batch processing summary
 * @param {Object} results - Batch processing results
 */
function printSummary(results) {
  console.log('📊 Batch Processing Summary');
  console.log('=' .repeat(50));
  console.log(`Total files processed: ${results.total}`);
  console.log(`Successful: ${results.success}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Success rate: ${Math.round((results.success / results.total) * 100)}%`);
  console.log('');
  console.log(`Total invisible characters removed: ${results.totalRemoved}`);
  console.log(`Total original size: ${results.totalOriginalSize.toLocaleString()} characters`);
  console.log(`Total cleaned size: ${results.totalCleanedSize.toLocaleString()} characters`);
  console.log(`Total size reduction: ${(results.totalOriginalSize - results.totalCleanedSize).toLocaleString()} characters`);
  
  if (results.failed > 0) {
    console.log('\n❌ Failed files:');
    results.files
      .filter(file => file.status === 'failed')
      .forEach(file => {
        console.log(`   ${path.basename(file.file)}: ${file.error}`);
      });
  }
  
  console.log('\n✅ Successfully cleaned files:');
  results.files
    .filter(file => file.status === 'success')
    .forEach(file => {
      console.log(`   ${path.basename(file.file)} → ${path.basename(file.outputFile)} (${file.removed} chars removed)`);
    });
}

/**
 * Main function
 */
async function main() {
  try {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
      console.log('Usage:');
      console.log('  node batch-clean-html.js <directory>');
      console.log('  node batch-clean-html.js file1.html file2.html file3.html');
      console.log('');
      console.log('Examples:');
      console.log('  node batch-clean-html.js scrspedhtml/');
      console.log('  node batch-clean-html.js file1.html file2.html');
      console.log('');
      console.log('This script will clean all HTML files by removing invisible unicode characters.');
      process.exit(1);
    }
    
    let filePaths = [];
    
    // Determine if first argument is a directory or individual files
    const firstArg = args[0];
    
    if (fs.existsSync(firstArg) && fs.statSync(firstArg).isDirectory()) {
      // Directory mode
      console.log(`📁 Scanning directory: ${firstArg}`);
      filePaths = getHtmlFiles(firstArg);
      
      if (filePaths.length === 0) {
        console.log('No HTML files found in the directory.');
        process.exit(0);
      }
      
      console.log(`Found ${filePaths.length} HTML files\n`);
    } else {
      // Individual files mode
      filePaths = args.filter(filePath => {
        if (!fs.existsSync(filePath)) {
          console.log(`⚠️  Warning: File does not exist: ${filePath}`);
          return false;
        }
        if (!filePath.toLowerCase().endsWith('.html')) {
          console.log(`⚠️  Warning: Not an HTML file: ${filePath}`);
          return false;
        }
        return true;
      });
      
      if (filePaths.length === 0) {
        console.log('No valid HTML files provided.');
        process.exit(1);
      }
    }
    
    // Process the files
    const results = await batchCleanHtmlFiles(filePaths);
    
    // Print summary
    printSummary(results);
    
    console.log('\n🎉 Batch cleaning completed!');
    
  } catch (error) {
    console.error(`💥 Fatal error: ${error.message}`);
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
  main();
}

module.exports = {
  getHtmlFiles,
  batchCleanHtmlFiles,
  printSummary
};
