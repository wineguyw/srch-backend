const mongoose = require('mongoose');
const ExcelJS = require('exceljs');
const Product = require('./data/productModel'); // Your MongoDB model

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/srch', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Import and Parse Excel File
async function importData() {
  const workbook = new ExcelJS.Workbook();
  try {
    // Path to your Excel file
    await workbook.xlsx.readFile('./data/wine_database.xlsx'); 

    const worksheet = workbook.getWorksheet(1); // Assuming first sheet has data
    const products = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip the header row
      products.push({
        displayName: row.getCell(3).value || null, // Column C - Display Name
        wineType: row.getCell(13).value || null,   // Column M - Type
        producer: row.getCell(4).value || null,    // Column D - Producer
        country: row.getCell(7).value || null,     // Column G - Country
        region: row.getCell(8).value || null,      // Column H - Region
        subRegion: row.getCell(9).value || null,   // Column I - Sub Region
        colour: row.getCell(12).value || null,     // Column L - Colour
        classification: row.getCell(16).value || null, // Column P - Classification
        vintage: row.getCell(17).value || null,    // Column Q - Vintage
      });
    });

    // Upload data to MongoDB
    await Product.insertMany(products);
    console.log('✅ Data successfully imported to MongoDB');
  } catch (err) {
    console.error('❌ Error importing data:', err);
  } finally {
    mongoose.connection.close();
  }
}

importData();
