
import puppeteer from 'puppeteer';
import * as path from 'path';
import { fileURLToPath } from 'url';
import axios from "axios";
import * as fs from 'fs';

function excelDateToDate(excelDate) {
  // Convert Excel date to JavaScript date
  const jsDate = new Date((excelDate - 25569) * 86400 * 1000);

  // Format date as DD/MM/YYYY
  const day = String(jsDate.getDate()); // Get day and pad with zer
  return `${day}`; // Return formatted date string
}



export const generateVoucher = async (email, password, team) => {
  
  // Setup Browser
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const localFilePath = path.resolve(__dirname, 'image.png');

  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // Set viewport to match MacBook Air 2019 dimensions
  await page.setViewport({
      width: 1440,
      height: 900,
  });

  await page.goto('https://register.lums.edu.pk/index.php');


  // Login
  await page.type('input[name="txt_email"]', email);
  await page.type('input[name="txt_password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForNavigation();

  // Select an Event: LSS
  await page.waitForSelector('a[href="event.php"]'); // Wait for it to load
  await page.click('a[href="event.php"]'); // Opens Event List
  await new Promise(resolve => setTimeout(resolve, 200));
  await page.click('#select2-chosen-1'); // Opens Dropdown
  await page.type('#s2id_autogen1_search', "PSIFI"); // Types PSIFI
  await page.keyboard.press('Enter'); // Selects PSIFI
  await page.click('button[type="submit"]'); // Clicks Submit
  await page.waitForNavigation();

  // Team Info
  await page.waitForSelector("#txt_team_name");
  await page.type("#txt_team_name", team.TeamName)

  await page.select('select#sel_event_participation', team.CategoryDetails_NumberOfEvents == "2" ? "1027" : team.CategoryDetails_NumberOfEvents == "3" ? "1028" : "1029");
  await new Promise(resolve => setTimeout(resolve, 3000));
  await page.select('select#sel_team_type_amb', team.HowDidYouHearAboutPSIFI.includes("Campus Ambassador") ? "1030" : "1031");

  // await page.click("#select2-chosen-1")
  // await page.type("#s2id_autogen1_search", team.institute)
  // await page.keyboard.press('Enter');

  // Add New Member
  await page.click('a[href="javascript:void(0);"]');



  // DELEGATE 1
  await page.waitForSelector('#sel_participant_type'); // Wait for it to load
  await page.select('select#sel_participant_type', "Head Delegate");
  await page.type('input[name="txt_g_name"]', team.TeamMember1HeadDelegateDetails_NameOfHeadDelegate_First + " " + team.TeamMember1HeadDelegateDetails_NameOfHeadDelegate_Last);

  await page.type('input[name="txt_g_cnic"]', team.TeamMember1HeadDelegateDetails_CNICPassportNumber);
  await page.locator('input[name="txt_g_email"]').fill(team.TeamMember1HeadDelegateDetails_Email);
  await page.type('input[name="txt_g_contact_number"]', team.TeamMember1HeadDelegateDetails_ContactNumber);
  // await page.type('input[name="txt_g_institution"]', delegate.institute);
  // Upload an Image, In Catch, Ideally you should upload a default image
  const [fileChooser] = await Promise.all([
      page.waitForFileChooser(),
      page.click('#file_photograph'), // Button that triggers file input
  ]);
  await fileChooser.accept([localFilePath]);

  // Figure out Accomodations

  if(team.TeamMember1HeadDelegateDetails_WillYouBeRequiringAccommodation == "Yes") {

    team.TeamMember1HeadDelegateDetails_DateOfArrival = excelDateToDate(team.TeamMember1HeadDelegateDetails_DateOfArrival);
    team.TeamMember1HeadDelegateDetails_DateOfDeparture = excelDateToDate(team.TeamMember1HeadDelegateDetails_DateOfDeparture);


    await page.select('select#sel_g_accomodation', "Yes");
    
    // Arrival Date
    await page.locator('input[name="txt_g_arrival_date"]').click();
    await page.waitForSelector('td.day'); 
    
    await page.evaluate((team) => {
      const dayElements = Array.from(document.querySelectorAll('td.day'));
      const targetElement = dayElements.find(element => element.textContent === team.TeamMember1HeadDelegateDetails_DateOfArrival.split('/').slice(0, 2)[0] && !element.classList.contains('disabled'));
      
      if (targetElement) {
        targetElement.click();
      }
    }, team);
    
    // Departure Date
    await page.locator('input[name="txt_g_departure_date"]').click();
    
    await page.waitForSelector('td.day'); 
    
    await page.evaluate((team) => {
      const dayElements = Array.from(document.querySelectorAll('td.day'));
      const targetElement = dayElements.find(element => element.textContent === team.TeamMember1HeadDelegateDetails_DateOfDeparture.split('/').slice(0, 2)[0] && !element.classList.contains('disabled'));
      if (targetElement) {
        console.log(targetElement)
        targetElement.click();
      }
    }, team);
  }
  else{
    await page.select('select#sel_g_accomodation', "No");
  }

  await page.locator('::-p-xpath(//button[@class="btn green" and @onclick="submitForm();"])').click();
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Delegate Two

  if(team.NumberOfTeamMembersIncludingTheHeadDelegate2 > 1){
    await new Promise(resolve => setTimeout(resolve, 6000));
    await page.waitForSelector('#sel_participant_type'); // Wait for it to load
  await page.select('select#sel_participant_type', "Team Member");
  await page.type('input[name="txt_g_name"]', team.TeamMember2Details2_Name_First + " " + team.TeamMember2Details2_Name_Last);

  await page.type('input[name="txt_g_cnic"]', team.TeamMember2Details2_CNICPassportNumber);
  await page.locator('input[name="txt_g_email"]').fill(team.TeamMember2Details2_Email);
  await page.type('input[name="txt_g_contact_number"]', team.TeamMember2Details2_ContactNumber);
  // await page.type('input[name="txt_g_institution"]', delegate.institute);
  // Upload an Image, In Catch, Ideally you should upload a default image
  const [fileChooser] = await Promise.all([
      page.waitForFileChooser(),
      page.click('#file_photograph'), // Button that triggers file input
  ]);
  await fileChooser.accept([localFilePath]);

  // Figure out Accomodations

  if(team.TeamMember2Details2_WillYouBeRequiringAccommodation == "Yes") {

    team.TeamMember2Details2_DateOfArrival = excelDateToDate(team.TeamMember2Details2_DateOfArrival);
    team.TeamMember2Details2_DateOfDeparture = excelDateToDate(team.TeamMember2Details2_DateOfDeparture);


    await page.select('select#sel_g_accomodation', "Yes");
    

    // Arrival Date

    await page.locator('input[name="txt_g_arrival_date"]').click();
    await page.waitForSelector('th.clear[style="display: table-cell;"][colspan="7"]'); // Wait for the element to be visible
    await page.click('th.clear[style="display: table-cell;"][colspan="7"]'); // Click the element
    await page.locator('input[name="txt_g_arrival_date"]').click();
    


    await page.waitForSelector('td.day'); 
    
    // add sleep of 200 ms
   
    await page.evaluate((team) => {
      const dayElements = Array.from(document.querySelectorAll('td.day'));
      const targetElement = dayElements.find(element => element.textContent === team.TeamMember2Details2_DateOfArrival.split('/').slice(0, 2)[0] && !element.classList.contains('disabled'));
      
      if (targetElement) {
        targetElement.click();
      }
    }, team);
    
    // Departure Date
    await page.locator('input[name="txt_g_departure_date"]').click();
      await page.waitForSelector('th.clear[style="display: table-cell;"][colspan="7"]'); // Wait for the element to be visible
      await page.click('th.clear[style="display: table-cell;"][colspan="7"]'); // Click the element
      await page.locator('input[name="txt_g_departure_date"]').click();
      
    
    await page.waitForSelector('td.day'); 
    
    await page.evaluate((team) => {
      const dayElements = Array.from(document.querySelectorAll('td.day'));
      const targetElement = dayElements.find(element => element.textContent === team.TeamMember2Details2_DateOfDeparture.split('/').slice(0, 2)[0] && !element.classList.contains('disabled'));
      if (targetElement) {
        console.log(targetElement)
        targetElement.click();
      }
    }, team);

    
  }
  else{
    await page.select('select#sel_g_accomodation', "No");
  }

  await page.locator('::-p-xpath(//button[@class="btn green" and @onclick="submitForm();"])').click();
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  }

  

    // Delegate 3
  
    if(team.NumberOfTeamMembersIncludingTheHeadDelegate2 > 2){
      await new Promise(resolve => setTimeout(resolve, 6000));
      await page.waitForSelector('#sel_participant_type'); // Wait for it to load
    await page.select('select#sel_participant_type', "Team Member");
    await page.type('input[name="txt_g_name"]', team.TeamMember3Details2_Name_First + " " + team.TeamMember3Details2_Name_Last);
  
    await page.type('input[name="txt_g_cnic"]', team.TeamMember3Details2_CNICPassportNumber);
    await page.locator('input[name="txt_g_email"]').fill(team.TeamMember3Details2_Email);
    await page.type('input[name="txt_g_contact_number"]', team.TeamMember3Details2_ContactNumber);
    // await page.type('input[name="txt_g_institution"]', delegate.institute);
    // Upload an Image, In Catch, Ideally you should upload a default image
    const [fileChooser] = await Promise.all([
        page.waitForFileChooser(),
        page.click('#file_photograph'), // Button that triggers file input
    ]);
    await fileChooser.accept([localFilePath]);
  
    // Figure out Accomodations
  
    if(team.TeamMember3Details2_WillYouBeRequiringAccommodation == "Yes") {
  
      team.TeamMember3Details2_DateOfArrival = excelDateToDate(team.TeamMember3Details2_DateOfArrival);
      team.TeamMember3Details2_DateOfDeparture = excelDateToDate(team.TeamMember3Details2_DateOfDeparture);
  
  
      await page.select('select#sel_g_accomodation', "Yes");
      
      // Arrival Date
      await page.locator('input[name="txt_g_arrival_date"]').click();
      await page.waitForSelector('th.clear[style="display: table-cell;"][colspan="7"]'); // Wait for the element to be visible
      await page.click('th.clear[style="display: table-cell;"][colspan="7"]'); // Click the element
      await page.locator('input[name="txt_g_arrival_date"]').click();
    
      await page.waitForSelector('td.day'); 
      
      await page.evaluate((team) => {
        const dayElements = Array.from(document.querySelectorAll('td.day'));
        const targetElement = dayElements.find(element => element.textContent === team.TeamMember3Details2_DateOfArrival.split('/').slice(0, 2)[0] && !element.classList.contains('disabled'));
        
        if (targetElement) {
          targetElement.click();
        }
      }, team);
      
      // Departure Date
      await page.locator('input[name="txt_g_departure_date"]').click();
      await page.waitForSelector('th.clear[style="display: table-cell;"][colspan="7"]'); // Wait for the element to be visible
      await page.click('th.clear[style="display: table-cell;"][colspan="7"]'); // Click the element
      await page.locator('input[name="txt_g_departure_date"]').click();
      
      await page.waitForSelector('td.day'); 
      
      await page.evaluate((team) => {
        const dayElements = Array.from(document.querySelectorAll('td.day'));
        const targetElement = dayElements.find(element => element.textContent === team.TeamMember3Details2_DateOfDeparture.split('/').slice(0, 2)[0] && !element.classList.contains('disabled'));
        if (targetElement) {
          console.log(targetElement)
          targetElement.click();
        }
      }, team);
    }
    else{
      await page.select('select#sel_g_accomodation', "No");
    }
  
    await page.locator('::-p-xpath(//button[@class="btn green" and @onclick="submitForm();"])').click();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    }

  

    // Delegate Four

    if(team.NumberOfTeamMembersIncludingTheHeadDelegate2 > 3){
      await new Promise(resolve => setTimeout(resolve, 6000));
      await page.waitForSelector('#sel_participant_type'); // Wait for it to load
    await page.select('select#sel_participant_type', "Team Member");
    await page.type('input[name="txt_g_name"]', team.TeamMember4Details2_Name_First + " " + team.TeamMember4Details2_Name_Last);
  
    await page.type('input[name="txt_g_cnic"]', team.TeamMember4Details2_CNICPassportNumber);
    await page.locator('input[name="txt_g_email"]').fill(team.TeamMember4Details2_Email);
    await page.type('input[name="txt_g_contact_number"]', team.TeamMember4Details2_ContactNumber);
    // await page.type('input[name="txt_g_institution"]', delegate.institute);
    // Upload an Image, In Catch, Ideally you should upload a default image
    const [fileChooser] = await Promise.all([
        page.waitForFileChooser(),
        page.click('#file_photograph'), // Button that triggers file input
    ]);
    await fileChooser.accept([localFilePath]);
  
    // Figure out Accomodations In discrete math, when are two vertices of a graph adjacent 
  
    if(team.TeamMember4Details2_WillYouBeRequiringAccommodation == "Yes") {
  
      team.TeamMember4Details2_DateOfArrival = excelDateToDate(team.TeamMember4Details2_DateOfArrival);
      team.TeamMember4Details2_DateOfDeparture = excelDateToDate(team.TeamMember4Details2_DateOfDeparture);
  
  
      await page.select('select#sel_g_accomodation', "Yes");
      
      // Arrival Date
      await page.locator('input[name="txt_g_arrival_date"]').click();
      await page.waitForSelector('th.clear[style="display: table-cell;"][colspan="7"]'); // Wait for the element to be visible
      await page.click('th.clear[style="display: table-cell;"][colspan="7"]'); // Click the element
      await page.locator('input[name="txt_g_arrival_date"]').click();
      
    await page.waitForSelector('td.day'); 
      
      await page.evaluate((team) => {
        const dayElements = Array.from(document.querySelectorAll('td.day'));
        const targetElement = dayElements.find(element => element.textContent === team.TeamMember4Details2_DateOfArrival.split('/').slice(0, 2)[0] && !element.classList.contains('disabled'));
        
        if (targetElement) {
          targetElement.click();
        }
      }, team);
      
      // Departure Date
      await page.locator('input[name="txt_g_departure_date"]').click();
      await page.waitForSelector('th.clear[style="display: table-cell;"][colspan="7"]'); // Wait for the element to be visible
      await page.click('th.clear[style="display: table-cell;"][colspan="7"]'); // Click the element
      await page.locator('input[name="txt_g_departure_date"]').click();
     
      await page.waitForSelector('td.day'); 
      
      await page.evaluate((team) => {
        const dayElements = Array.from(document.querySelectorAll('td.day'));
        const targetElement = dayElements.find(element => element.textContent === team.TeamMember4Details2_DateOfDeparture.split('/').slice(0, 2)[0] && !element.classList.contains('disabled'));
        if (targetElement) {
          console.log(targetElement)
          targetElement.click();
        }
      }, team);
    }
    else{
      await page.select('select#sel_g_accomodation', "No");
    }
  
    await page.locator('::-p-xpath(//button[@class="btn green" and @onclick="submitForm();"])').click();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    }



    
    // Delegate Five
  
    if(team.NumberOfTeamMembersIncludingTheHeadDelegate2 > 4){
      await new Promise(resolve => setTimeout(resolve, 6000));
      await page.waitForSelector('#sel_participant_type'); // Wait for it to load
    await page.select('select#sel_participant_type', "Team Member");
    await page.type('input[name="txt_g_name"]', team.TeamMember5Details_Name_First + " " + team.TeamMember5Details_Name_Last);
  
    await page.type('input[name="txt_g_cnic"]', team.TeamMember5Details_CNICPassportNumber);
    await page.locator('input[name="txt_g_email"]').fill(team.TeamMember5Details_Email);
    await page.type('input[name="txt_g_contact_number"]', team.TeamMember5Details_ContactNumber);
    // await page.type('input[name="txt_g_institution"]', delegate.institute);
    // Upload an Image, In Catch, Ideally you should upload a default image
    const [fileChooser] = await Promise.all([
        page.waitForFileChooser(),
        page.click('#file_photograph'), // Button that triggers file input
    ]);
    await fileChooser.accept([localFilePath]);
  
    // Figure out Accomodations
  
    if(team.TeamMember5Details_WillYouBeRequiringAccommodation == "Yes") {
  
      team.TeamMember5Details_DateOfArrival = excelDateToDate(team.TeamMember5Details_DateOfArrival);
      team.TeamMember5Details_DateOfDeparture = excelDateToDate(team.TeamMember5Details_DateOfDeparture);
  
  
      await page.select('select#sel_g_accomodation', "Yes");
      
      // Arrival Date
      await page.locator('input[name="txt_g_arrival_date"]').click();
      await page.waitForSelector('th.clear[style="display: table-cell;"][colspan="7"]'); // Wait for the element to be visible
      await page.click('th.clear[style="display: table-cell;"][colspan="7"]'); // Click the element
      await page.locator('input[name="txt_g_arrival_date"]').click();
      
      
      await page.waitForSelector('td.day'); 
      
      await page.evaluate((team) => {
        const dayElements = Array.from(document.querySelectorAll('td.day'));
        const targetElement = dayElements.find(element => element.textContent === team.TeamMember5Details_DateOfArrival.split('/').slice(0, 2)[0] && !element.classList.contains('disabled'));
        
        if (targetElement) {
          targetElement.click();
        }
      }, team);
      
      // Departure Date
      await page.locator('input[name="txt_g_departure_date"]').click();
      await page.waitForSelector('th.clear[style="display: table-cell;"][colspan="7"]'); // Wait for the element to be visible
      await page.click('th.clear[style="display: table-cell;"][colspan="7"]'); // Click the element
      await page.locator('input[name="txt_g_departure_date"]').click();
     
      await page.waitForSelector('td.day'); 
      
      await page.evaluate((team) => {
        const dayElements = Array.from(document.querySelectorAll('td.day'));
        const targetElement = dayElements.find(element => element.textContent === team.TeamMember5Details_DateOfDeparture.split('/').slice(0, 2)[0] && !element.classList.contains('disabled'));
        if (targetElement) {
          console.log(targetElement)
          targetElement.click();
        }
      }, team);
    }
    else{
      await page.select('select#sel_g_accomodation', "No");
    }
  
    await page.locator('::-p-xpath(//button[@class="btn green" and @onclick="submitForm();"])').click();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    }



  
  // Breaks out of the dialoge box
  await page.locator('::-p-xpath(//button[@data-dismiss="modal" and @class="btn blue" and @type="button" and text()="Close"])').click();

  // await page.locator('input[name="txt_emr_name"]').fill(team.emergency_name);
  // await page.locator('input[name="txt_emr_email"]').fill(team.emergency_email);
  // await page.locator('input[name="txt_emr_contact_number"]').fill(team.emergency_phone);
  // await page.locator('input[name="txt_emr_cnic"]').fill(team.emergency_cnic);
  // await page.locator('input[name="txt_emr_designation"]').fill(team.emergency_designation);
  
  // Checkbox bhi XPATH se click kro, <a href="download_voucher.php?ID=VkZaU2FtVlZNWEZTV0dkNlRucGpOVTFWTVhGaGVrcFBWa1pyTUE9PQ==&amp;action=VkZaU2FtVlZNWEZTV0dkNVZGZHdjazFyTlZWWFZGRTk=">Download Voucher</a> and this is URL for download, iska bhi figure out an XPATH
  
  await page.select('select#sel_team_acom_staff', "No");
    
  // // Submit

  // await page.locator('input[name="txt_tm_acm_name"]').fill(team.advisor_name);
  
  // await page.locator('input[name="txt_tm_acm_email"]').fill(team.advisor_email);
  
  // await page.locator('input[name="txt_tm_acm_contact_number"]').fill(team.advisor_phone);
  
  // await page.locator('input[name="txt_tm_acm_cnic"]').fill(team.advisor_cnic);
  
  // await page.locator('input[name="txt_tm_acm_designation"]').fill(team.advisor_designation);
  
  // await page.locator('input[name="txt_tm_acm_department"]').fill(team.advisor_dept);
  

  // sleep for 200 ms
  await new Promise(resolve => setTimeout(resolve, 1000));


  // Without XPATH
  await page.waitForSelector('#chl_liablity');
  await page.locator('#chl_liablity').click();


  // Submit
  await page.locator('button[name="action"][value="2"].btn.green').click();
  await page.waitForNavigation();

  // AWAIT 
   
  
  // Download Voucher
  // await page.waitForSelector('a[href^="download_voucher.php?ID="][href*="&action="]');
  // await page.click('a[href^="download_voucher.php?ID="][href*="&action="]');

  // Sleep for 1 second
  await new Promise(resolve => setTimeout(resolve, 1000));

  await page.waitForSelector('a[href^="download_voucher.php?ID="][href*="&action="]');
  await page.evaluate(() => {
    const link = document.querySelector('a[href^="download_voucher.php?ID="][href*="&action="]');
    if (link) {
      link.click();
    }
  });


  // Sleep for 3 seconds to let download complete
  await new Promise(resolve => setTimeout(resolve, 3000));

  await browser.close();
}

{/* <a href="download_voucher.php?ID=VkZaU2FtVlZPVlZaZWsxNlQwUm5lVTB3TVhGaGVsWk9ZV3RXTlE9PQ==&amp;action=VkZaU2FtVlZPVlZaZWsxNVZGZHdjazVWTVhGU1dHczk=">Download Voucher</a> */}


// // At Runtime

// // const email = "faxewok199@orsbap.com";
// // const email = "hivihiv505@fuzitea.com";
// const email = "hevewob138@ruhtan.com";
// const password = "123";

// const team = {
//   name: "test-abf",
//   institute: "Private",
//   event: "2",
//   delegates: [
//     {
//       head: true,
//       name: "Ali",
//       email: "myemail@gmail.com",
//       cnic: "0",
//       phone: "123",
//       institute: "idk",
//       accomodation: false,
//       pic: "https://drive.google.com/open?id=14_nBW7ciCHYtdMDTcAX1nIM_Grzpt0D-"
//     },
//     {
//       head: false,
//       name: "Faisal",
//       email: "faisal@a.com",
//       cnic: "0",
//       phone: "456",
//       institute: "idk2",
//       accomodation: false,
//       pic: "https://drive.google.com/open?id=14_nBW7ciCHYtdMDTcAX1nIM_Grzpt0D-"
//     },
//     {
//       head: false,
//       name: "Ali",
//       email: "ali@a.com",
//       phone: "123",
//       cnic: "0",
//       institute: "idk",
//       accomodation: false,
//       pic: "https://drive.google.com/open?id=14_nBW7ciCHYtdMDTcAX1nIM_Grzpt0D-"
//     },
//     {
//       head: false,
//       name: "Ali",
//       email: "ali@a.com",
//       phone: "123",
//       cnic: "0",
//       institute: "idk",
//       accomodation: false,
//       pic: "https://drive.google.com/open?id=14_nBW7ciCHYtdMDTcAX1nIM_Grzpt0D-"
//     },
//   ],
//   faculty_advisor: "Yes",
//   advisor_name: "Ali",
//   advisor_email: "a@b.com",
//   advisor_phone: "123",
//   advisor_cnic: "123",
//   advisor_designation: "idk",
//   advisor_dept: "idk"
// }

// generateVoucher(email, password, team)





    // // Download the file using axios 
    // const regex = /id=([^&]+)/;
    // const fileId = delegate.pic.match(regex);
    // ENSURE THAT THE DRIVE LINK IS PUBLICLY ACCESSIBLE
    // const response = await axios.get(`https://drive.usercontent.google.com/u/0/uc?id=${fileId[1]}&export=download`, {
    //   responseType: 'arraybuffer', // Set the response type to arraybuffer
    // });

    // // Save the downloaded file locally
    // const buffer = Buffer.from(response.data, 'binary'); // Convert the response data to a Buffer
    // fs.writeFileSync(localFilePath, buffer); // Write the Buffer to a file
