import { generateVoucher } from "./voucherGenerator.js";
import { ReadExcel, updateStatus, loadJsonFile } from "./ExcelReader.js";
import { loadEmails, markEmailAsUsed } from "./addEmails.js";
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { generateEmail } from "./emails.js";


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const filePath = join(__dirname, 'emails.json');


async function generator() {
    const vouchers = await ReadExcel();
    
    for (let team of vouchers){  
        const done = await loadJsonFile();
        
        let email = await generateEmail(team.TeamMember1HeadDelegateDetails_NameOfHeadDelegate_First, team.TeamMember1HeadDelegateDetails_NameOfHeadDelegate_Last);
        

        if(email == ""){
            console.log("No more emails left");
        }


        // Calculate teamID

        team.teamID = `PSI-${team.AreYouRegisteringThroughAnInstitutionOrPrivate == "Private" ? "P" : "S"}-${done.done.length.toString().padStart(4, '0')}`


        const password = "123";
        await generateVoucher(email, password, team);
        await updateStatus(team.PSIFIXVIRegistration_Id);
        await markEmailAsUsed(filePath, email, team.PSIFIXVIRegistration_Id);
        
        console.log("Generated Voucher for Reg Id ", team.PSIFIXVIRegistration_Id);
    }
    // Add a new email
}

generator();

