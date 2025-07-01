import puppeteer from 'puppeteer-extra';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { MailSlurp } from 'mailslurp-client';
import { addEmail } from './addEmails.js';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import Recaptchaplugin from 'puppeteer-extra-plugin-recaptcha'


const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');


// Example usage:
const filePath = join(__dirname, 'emails.json');



// Replace with your MailSlurp API Key

const apiKey = '1e9b2dfc0c7ea028780a8410f40b1f3d91ef98fef41dfef353904cf9de281dc6';

export const generateEmail = async (first_name, last_name) => {
    try {
       
        // Initialize the MailSlurp client
        const mailslurp = new MailSlurp({ apiKey });

        // Step 1: Create a new inbox
        const inbox = await mailslurp.createInbox();
        console.log(`Created new email address: ${inbox.emailAddress}`);


        
        // puppeteer.use(
        //     Recaptchaplugin({
        //       provider: {
        //         id: '2captcha',
        //         token: '4b4b221ea80068ba422528b8caff2dbe' // REPLACE THIS WITH YOUR OWN 2CAPTCHA API KEY ⚡
        //       },
        //       visualFeedback: true // colorize reCAPTCHAs (violet = detected, green = solved)
        //     })
        //   )

          const browser = await puppeteer.launch({ headless: false });
          const page = await browser.newPage();
  
          // Set viewport to match MacBook Air 2019 dimensions
          await page.setViewport({
              width: 1440,
              height: 900,
          });
  
          await page.goto('https://register.lums.edu.pk/register.php');

        await page.type('input[name="txt_first_name"]', first_name);
        await new Promise(resolve => setTimeout(resolve, 100));
        await page.type('input[name="txt_last_name"]', last_name);
        await new Promise(resolve => setTimeout(resolve, 100));
        await page.type('input[name="txt_email"]', inbox.emailAddress);
        await new Promise(resolve => setTimeout(resolve, 100));
        await page.type('input[name="txt_password"]', "123");
        await new Promise(resolve => setTimeout(resolve, 100));

        
        // await page.solveRecaptchas()

        // Step 2: Wait for an email to arrive in the inbox
        console.log(`Waiting for email...`);
        const email = await mailslurp.waitForLatestEmail(inbox.id, 4800000); // Wait up to 30 seconds
        console.log(`Received Activation Link`);


        // console.log(email.body)


        // Step 3: Parse the email content to find a specific link
        const $ = cheerio.load(email.body);
        const targetLink = $('a[href*="activate.php"]').attr('href');

        if (!targetLink) {
            console.log('No matching link found in the email.');
            return;
        }
                
        addEmail(filePath, inbox.emailAddress);

        // Step 4: Simulate a click on the link (HTTP request)
        const response = await axios.get(targetLink);
        console.log(`Account Activated`);

        
        await browser.close();

        return inbox.emailAddress;

    } catch (error) {
        console.error(`An error occurred: ${error.message}`);
    }
};
