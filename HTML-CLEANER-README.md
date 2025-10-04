# HTML Unicode Cleaner

A Node.js tool to remove invisible unicode characters from HTML files that can cause warnings in VS Code and other text editors.

## 🚨 Problem

VS Code shows warnings like "This document contains many invisible unicode characters" when HTML files contain invisible characters such as:
- Zero-width spaces (`\u200B`)
- Zero-width non-joiners (`\u200C`) 
- Zero-width joiners (`\u200D`)
- Byte Order Marks (`\uFEFF`)
- Non-breaking spaces (`\u00A0`)
- And many more...

## 🛠️ Solution

This tool provides three scripts to clean HTML files:

### 1. Single File Cleaner (`clean-html-unicode.js`)

Cleans a single HTML file by removing invisible unicode characters.

**Usage:**
```bash
node clean-html-unicode.js <input-file>
```

**Examples:**
```bash
node clean-html-unicode.js scrspedhtml/TheBodyShop.html
node clean-html-unicode.js ./data/page.html
```

**Features:**
- ✅ Removes 20+ types of invisible unicode characters
- ✅ Detailed analysis of characters found and removed
- ✅ Creates `_clean.html` suffix for output files
- ✅ Comprehensive logging and statistics
- ✅ Error handling and validation

### 2. Batch Cleaner (`batch-clean-html.js`)

Cleans multiple HTML files in a directory or file list.

**Usage:**
```bash
# Clean all HTML files in a directory
node batch-clean-html.js <directory>

# Clean specific HTML files
node batch-clean-html.js file1.html file2.html file3.html
```

**Examples:**
```bash
node batch-clean-html.js scrspedhtml/
node batch-clean-html.js file1.html file2.html
```

**Features:**
- ✅ Process entire directories
- ✅ Process multiple individual files
- ✅ Batch processing with progress tracking
- ✅ Comprehensive summary statistics
- ✅ Error handling for individual files

### 3. Test Script (`test-clean-html.js`)

Demonstrates the cleaner functionality with sample data.

**Usage:**
```bash
node test-clean-html.js
```

## 📊 Example Output

```
📖 Reading file: scrspedhtml/TheBodyShop.html
🔍 Found 1691 invisible characters
📊 Invisible characters detected:
   ZERO_WIDTH_SPACE: 5 occurrences (U+200B)
   NON_BREAKING_SPACE: 1686 occurrences (U+00A0)
🧹 Cleaning invisible characters...
💾 Saving cleaned file: scrspedhtml\TheBodyShop_clean.html
✅ Successfully cleaned HTML file!
📁 Output file: scrspedhtml\TheBodyShop_clean.html
📊 Removed 1691 invisible characters
📏 File size: 2170355 → 2168664 characters
```

## 🧹 Characters Removed

The tool removes these invisible unicode characters:

| Character | Unicode | Name | Description |
|-----------|---------|------|-------------|
| `\u200B` | U+200B | Zero Width Space | Invisible space character |
| `\u200C` | U+200C | Zero Width Non-Joiner | Prevents character joining |
| `\u200D` | U+200D | Zero Width Joiner | Joins characters |
| `\uFEFF` | U+FEFF | Byte Order Mark | BOM character |
| `\u00A0` | U+00A0 | Non-Breaking Space | Non-breaking space |
| `\u2000` | U+2000 | En Quad | Large space character |
| `\u2001` | U+2001 | Em Quad | Very large space character |
| `\u2002` | U+2002 | En Space | Medium space character |
| `\u2003` | U+2003 | Em Space | Large space character |
| And 12+ more... | | | Various spacing and formatting characters |

## 🔧 Technical Details

### File Structure
```
├── clean-html-unicode.js    # Main cleaning script
├── batch-clean-html.js      # Batch processing script
├── test-clean-html.js       # Test/demo script
└── HTML-CLEANER-README.md   # This documentation
```

### Dependencies
- **Node.js** (built-in modules only)
  - `fs` - File system operations
  - `path` - Path manipulation
  - No external dependencies required!

### Module Usage
```javascript
const { cleanInvisibleChars, analyzeInvisibleChars, cleanHtmlFile } = require('./clean-html-unicode.js');

// Clean text directly
const cleaned = cleanInvisibleChars('Hello\u200BWorld!');

// Analyze invisible characters
const analysis = analyzeInvisibleChars(text);

// Clean entire file
const result = await cleanHtmlFile('input.html');
```

## 🚀 Quick Start

1. **Download the scripts** to your project directory
2. **Test with a single file:**
   ```bash
   node clean-html-unicode.js your-file.html
   ```
3. **Clean multiple files:**
   ```bash
   node batch-clean-html.js your-directory/
   ```

## ✅ Benefits

- **Eliminates VS Code warnings** about invisible characters
- **Improves file readability** in text editors
- **Reduces file size** by removing unnecessary characters
- **Maintains HTML structure** and functionality
- **Safe operation** - creates new files, doesn't modify originals
- **Comprehensive logging** for transparency

## 🛡️ Safety Features

- ✅ **Non-destructive**: Creates new files with `_clean` suffix
- ✅ **Validation**: Checks file existence and permissions
- ✅ **Error handling**: Graceful failure with detailed messages
- ✅ **Backup friendly**: Original files remain untouched

## 📈 Performance

- **Fast processing**: Regex-based character removal
- **Memory efficient**: Processes files line by line
- **Batch support**: Handles multiple files efficiently
- **Progress tracking**: Real-time status updates

---

**Made with ❤️ for developers who hate invisible characters!**
