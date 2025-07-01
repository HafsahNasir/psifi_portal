import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

// Get __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

// Function to load all emails from emails.json
export function loadEmails(filePath) {
    try {
        const data = readFileSync(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        if (err.code === 'ENOENT') {
            return []; // If file doesn't exist, return an empty array
        } else {
            throw err; // Throw any other errors
        }
    }
}

// Function to save updated emails to emails.json
export function saveEmails(filePath, emails) {
    writeFileSync(filePath, JSON.stringify(emails, null, 4), 'utf-8');
}

// Function to add a new email
export function addEmail(filePath, newEmail) {
    let emails = loadEmails(filePath);

    // Check if the email already exists
    const emailExists = emails.some(emailEntry => emailEntry.email === newEmail);

    if (emailExists) {
        console.log(`Email ${newEmail} already exists.`);
    } else {
        // Add the new email with "unused" status
        emails.push({ email: newEmail, status: "unused" });
        saveEmails(filePath, emails);
        console.log(`Email ${newEmail} added.`);
    }
}

// Function to mark an email as used
export function markEmailAsUsed(filePath, emailToMark, ID) {
    let emails = loadEmails(filePath);

    // Find the email to mark as used
    const emailEntry = emails.find(emailEntry => emailEntry.email === emailToMark);

    if (emailEntry) {
        if (emailEntry.status != "unused") {
            console.log(`Email ${emailToMark} is already marked as used.`);
        } else {
            emailEntry.status = ID;
            saveEmails(filePath, emails);
            console.log(`Email ${emailToMark} marked as used.`);
        }
    } else {
        console.log(`Email ${emailToMark} not found in the list.`);
    }
}

