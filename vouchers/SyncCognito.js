const COGNITO_API_KEY = "eyJhbGciOiJIUzI1NiIsImtpZCI6Ijg4YmYzNWNmLWM3ODEtNDQ3ZC1hYzc5LWMyODczMjNkNzg3ZCIsInR5cCI6IkpXVCJ9.eyJvcmdhbml6YXRpb25JZCI6IjhiNWUzOTE4LTAwYjQtNDA4NS04YzEzLWY0MmM3NzMyMTE4ZSIsImludGVncmF0aW9uSWQiOiJjODcyODdjOC1hMjY3LTQzMTEtODU0NS1hMjYxNTAxNDkwOWYiLCJjbGllbnRJZCI6IjNkZTNmODMwLWNiYzctNDZlNi1iOTZlLTVmMDE2NzcyMTgzMCIsImp0aSI6IjEzOTRjNDJhLTk4NmUtNDEzMy1hYjJlLTJmOTZhZTU4ODhkZiIsImlhdCI6MTcyOTc1ODA4NywiaXNzIjoiaHR0cHM6Ly93d3cuY29nbml0b2Zvcm1zLmNvbS8iLCJhdWQiOiJhcGkifQ.L7lDTdmgxtYEcH2YHRNdR3Bd1LoaSCl6VJExkOS5tRE"

import axios from 'axios';

const EVENT = 1; // 1 for Psifi, 2 for HackX

const options = {
    method: 'GET', 
    //url: `https://www.cognitoforms.com/api/forms`,
    // url: `https://www.cognitoforms.com/api/forms/PSIFIXVIRegistration/schema'}`,
    url: `https://www.cognitoforms.com/forms/1/entries/5?access_token=${COGNITO_API_KEY}`,
    };


try {

  const { data } = await axios.request(options);
  console.log(data);
} catch (error) {
  console.error(error.response.status);
}