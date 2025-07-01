import xlsx from 'xlsx';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

// Define an async function to load the contents
export async function loadJsonFile() {
  try {
    // Construct the path to the done.json file
    const filePath = join(process.cwd(), 'done.json');
    
    // Read the file content asynchronously
    const fileContents = await readFile(filePath, 'utf-8');
    
    // Parse the JSON content into an object
    const data = JSON.parse(fileContents);
    
    // Log or return the parsed data
    // console.log(data);
    return data;
  } catch (error) {
    console.error('Error reading or parsing done.json:', error);
  }
}

// Get the current file path and directory name
export async function ReadExcel(){

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


// Function to convert Excel rows to an array of objects
function excelToArrayOfObjects(filePath) {
    // Read the Excel file
    const workbook = xlsx.readFile(filePath);

    // Assuming the first sheet is the one we're interested in
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convert the sheet to JSON format (array of objects)
    const data = xlsx.utils.sheet_to_json(sheet);

    return data;
}


// Example usage
const filePath = path.join(__dirname, 'PSIFIXVIRegistration.xlsx');
const Table = excelToArrayOfObjects(filePath);
// Call the function
const done = await loadJsonFile();


let Vouchers = []
for (let entry of Table){
    let flag = false
    for(let doneEntry of done.done){
        if(entry.PSIFIXVIRegistration_Id == doneEntry 
        ){
            flag = true;
            break;
        }
    }

    if(!flag && entry.Entry_Status == "Submitted"){
        Vouchers.push(entry) 
    }
}

    return Vouchers

}


// Define an async function to load the JSON file, add an entry, and save it
export async function updateStatus(newEntry) {
  try {
    // Construct the path to the done.json file
    const filePath = join(process.cwd(), 'done.json');
    
    // Read the file content asynchronously
    const fileContents = await readFile(filePath, 'utf-8');
    
    // Parse the JSON content into an object
    const data = JSON.parse(fileContents);
    
    // Check if the target property is an array and push the new entry
    if (Array.isArray(data.done)) {
      data.done.push(parseInt(newEntry));
    } else {
      console.error('The "entries" field is not an array.');
      return;
    }
    
    // Convert the updated data back into a JSON string
    const updatedFileContents = JSON.stringify(data, null, 2); // Pretty-print with 2 spaces
    
    // Rewrite the updated content to the done.json file
    await writeFile(filePath, updatedFileContents, 'utf-8');
    
    console.log('New entry added successfully!');
  } catch (error) {
    console.error('Error updating done.json:', error);
  }
}




// Parse out the irrelevant fields

