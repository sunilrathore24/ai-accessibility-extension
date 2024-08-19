

const fetch = require('node-fetch');
const https = require('https');
const prompt = require('./prompt.js');
 
 const SOURCEGRAPH_API_URL =
  'https://laxtst-insg-001.office.cyberu.com/.api/completions/stream?api-version=1&client-name=web&client-version=0.0.1';

const SUGGESSIONS = [
  {
    "message": "Provide a more descriptive text for the navigation links.",
    "fix": "Replace generic text like 'Home', 'About', 'Contact' with more meaningful descriptions.",
    "startPoint": 31,
    "endPoint": 136,
    "edits": [
      {
        "range": {
          "start": 76,
          "end": 80
        },
        "newText": "Home Page"
      },
      {
        "range": {
          "start": 112,
          "end": 117
        },
        "newText": "About Us"
      },
      {
        "range": {
          "start": 149,
          "end": 156
        },
        "newText": "Contact Information"
      }
    ]
  },
  {
    "message": "Add aria-label or aria-labelledby attributes to the navigation landmarks.",
    "fix": "Include aria-label=\"Main Navigation\" or aria-labelledby=\"nav-heading\" to provide accessible names for the navigation landmarks.",
    "startPoint": 10,
    "endPoint": 14,
    "edits": [
      {
        "range": {
          "start": 10,
          "end": 15
        },
        "newText": "<nav aria-label=\"Main Navigation\">"
      }
    ]
  }
]

async function checkAccessibility(html) {
  try {
    console.log('prompt value = '+ prompt);
    console.log('inside checkAccessibility method with cody');

    const finalPrompt = ` 
   Please analyze the following HTML code and provide accessibility fixes based on WCAG guidelines, focus on tags such as missing role, aria-lable and all other general accessibility and screen reader improvements:
    
      ${html}
      
     provide the following details in the specified format as shown below:
     
     ${prompt}`;

     const promptNew = `
     Please analyze the following HTML code and provide accessibility suggestions based on WCAG guidelines:

     ${html}

     Provide suggestions in the following format:
     [
        {
         "message": "Add aria-label or aria-labelledby attributes to the navigation landmarks.",
         "fix": "Include aria-label=\"Main Navigation\" or aria-labelledby=\"nav-heading\" to provide accessible names for the navigation landmarks.",
         "startPoint": 10,
         "endPoint": 14,
         "edits": [
           {
             "range": {
               "start": 10,
               "end": 15
             },
             "newText": "<nav aria-label=\"Main Navigation\">"
           }
         ]
       }
       ...
     ]
   `;

    console.log('prompt value 1 = ' + finalPrompt);

    const response = await sendCodyPrompts(promptNew);

    console.log('response from open ai = ', response);

    // const suggestions = JSON.parse(response.data.choices[0].text.trim());
    return response;
  } catch (error) {
    console.error('Error occurred while checking accessibility:', error);
    return [];
  }
}

const sendCodyPrompts = async (prompt)  => {
  try {
    console.log('inside send cody prompts method');
    console.log('prompt value 1 = ' + prompt);

    const agent = new https.Agent({
      rejectUnauthorized: false,
    });
    const response = await fetch(SOURCEGRAPH_API_URL, {
      agent,
      method: 'POST',
      headers: {
        Authorization: `token ${process.env.CODY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        temperature: 0,
        topK: -1,
        topP: -1,
        maxTokensToSample: 1000,
        messages: [{'speaker': 'human', 'text': prompt}]
      })
    });

    console.log('cody response = ' +  response);

    if (response.status !== 200) {
      console.log(`Error: Received status code ${response.status}`);
      return null;
    }

    const data = await response.text();
    console.log('data ='+ data);
    const regex = /event: (\w+)\s+data: (\{.*?\})(?=\s*event:|\s*$)/gs;

    let match;
    const events = [];

    while ((match = regex.exec(data)) !== null) {
      const eventType = match[1];
      const eventData = JSON.parse(match[2]);
      events.push({ event: eventType, data: eventData });
    }

    // Filter events to get only those of type 'completion'
    const completionEvents = events.filter(event => event.event === 'completion');

    // Get the second-to-last 'completion' event
    const secondLastCompletionEvent = completionEvents[completionEvents.length - 2];

    if (secondLastCompletionEvent?.data?.completion) {
      return secondLastCompletionEvent?.data?.completion;
    } else {
      return null;
    }
  } catch (err) {
    console.log('inside catch block');
    console.log('cach error = '+ err);
    error(`Error sending prompt to Cody:`, err);

    return null;
  }
};

function applyCompanyGuidelines(suggestions) {
  const enhancedSuggestions = suggestions.map((suggestion) => {
    const guidelineKey = Object.keys(companyGuidelines).find((key) =>
      suggestion.message.toLowerCase().includes(key)
    );

    if (guidelineKey) {
      const guideline = companyGuidelines[guidelineKey];
      suggestion.message = guideline.message;
      suggestion.fix = typeof guideline.fix === 'function'
        ? guideline.fix(suggestion.fix)
        : guideline.fix;
    }

    return suggestion;
  });

  return enhancedSuggestions;
}

async function provideAccessibilitySuggestions(html) {
  const suggestions = await checkAccessibility(html);
  // const enhancedSuggestions = applyCompanyGuidelines(suggestions);
  return suggestions;
}

module.exports = {
  checkAccessibility,
  provideAccessibilitySuggestions,
};
