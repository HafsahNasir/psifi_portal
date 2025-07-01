import fs from 'fs';
import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';

// Utility to get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load OAuth2 client credentials
const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];
const TOKEN_PATH = path.join(__dirname, 'token.json');

// Function to authorize and return Google Drive client
async function authorize() {
    const credentials = JSON.parse(fs.readFileSync(path.join(__dirname, 'regpsifi_gcp_creds.json'), 'utf8'));

    const { client_secret, client_id, redirect_uris } = credentials.web;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    // Check if we have previously stored a token.
    if (fs.existsSync(TOKEN_PATH)) {
        const token = fs.readFileSync(TOKEN_PATH, 'utf8');
        oAuth2Client.setCredentials(JSON.parse(token));
    } else {
        // // Handle the case where token is not available
        // const authUrl = oAuth2Client.generateAuthUrl({
        //     access_type: 'offline',
        //     scope: SCOPES,
        // });
        // console.log('Authorize this app by visiting this URL:', authUrl);

        const TOKEN_PATH = path.join(__dirname, 'token.json');

        oAuth2Client.getToken("4/0AVG7fiT5uQ6ULm_Oehv-POyuYvyC6oiA7qB5ClPVT9348uHPXF7pKiDoT0ukI3svNPyBCQ")

        oAuth2Client.setCredentials(token.tokens);
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(token.tokens), 'utf8');



    }

    return oAuth2Client;
}

// Function to download and read config.json from Google Drive
async function readConfigFile(fileId) {
    const auth = await authorize();
    const drive = google.drive({ version: 'v3', auth });

    // Get the file from Google Drive
    const response = await drive.files.get(
        {
            fileId,
            alt: 'media',
        },
        { responseType: 'stream' }
    );

    // Parse the file content
    return new Promise((resolve, reject) => {
        let data = '';
        response.data.on('data', (chunk) => {
            data += chunk;
        });

        response.data.on('end', () => {
            try {
                // Parse the JSON content
                const configArray = JSON.parse(data);
                resolve(configArray);
            } catch (error) {
                reject(error);
            }
        });

        response.data.on('error', (err) => {
            reject(err);
        });
    });
}

// Example usage
const fileId = 'your-file-id-here'; // Google Drive file ID of config.json

readConfigFile(fileId)
    .then((configArray) => {
        console.log(configArray);  // Array or Object parsed from config.json
    })
    .catch((error) => {
        console.error('Error reading config.json from Google Drive:', error);
    });
