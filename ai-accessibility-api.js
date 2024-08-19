

const fetch = require('node-fetch');
const https = require('https');
const prompt = require('./prompt.js');

const Promptmessage = [{"speaker":"human","text":"You are Cody, an AI-powered coding assistant created by Sourcegraph. You work inside a text editor. You have access to my currently open files. You perform the following actions:\n- Answer general programming questions.\n- Answer questions about the code that I have provided to you.\n- Generate code that matches a written description.\n- Explain what a section of code does.\n\nIn your responses, obey the following rules:\n- If you do not have access to code, files or repositories always stay in character as Cody when you apologize.\n- Be as brief and concise as possible without losing clarity.\n- All code snippets have to be markdown-formatted, and placed in-between triple backticks like this ```.\n- Answer questions only if you know the answer or can make a well-informed guess. Otherwise, tell me you don't know and what context I need to provide you for you to answer the question.\n- If you do not have access to a repository, tell me to add additional repositories to the chat context using repositories selector below the input box to help you answer the question.\n- Only reference file names, repository names or URLs if you are sure they exist."},
  {"speaker":"assistant","text":"Understood. I am Cody, an AI assistant made by Sourcegraph to help with programming tasks.\nI work inside a text editor. I have access to your currently open files in the editor.\nI will answer questions, explain code, and generate code as concisely and clearly as possible.\nMy responses will be formatted using Markdown syntax for code blocks.\nI will acknowledge when I don't know an answer or need more context."}]
 
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
     
     Go through this URL 'https://www.w3.org/TR/WCAG22' to provide better suggestions for the given HTML code. Also, consider this URL 'https://github.com/angular-eslint/angular-eslint/tree/main/packages/eslint-plugin-template/docs/rules' to provide suggestions based on the Angular ESLint rules.
     
     Please provide only necessary suggestions with fixes that can be directly applied at the specified offsets. Do not provide any other suggestions.
     
     Thoroughly check the HTML code before giving any suggestions to avoid false positives. Ensure that you understand the entire HTML code and do not provide suggestions on attribute values.
     
     ${html}
     
     Provide suggestions in the following JSON format so that the response can be used as an array of objects without any modification. Do not include any header or footer with the suggestions.
     
     Pay close attention to counting offsets and the length of the text in the response. also do not provide any false positive if you are not sure.
     
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
               "end": 14
             },
             "newText": "<nav aria-label=\"Main Navigation\">"
           }
         ]
       }
       ...
     ]
     `;
     

  
    const response = await sendCodyPrompts(promptNew);

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
        temperature: 0.2,
        topK: -1,
        topP: -1,
        maxTokensToSample: 2000,
        messages: [...Promptmessage, {'speaker': 'human', 'text': prompt}]
      })
    });

    if (response.status !== 200) {
      console.log(`Error: Received status code ${response.status}`);
      return null;
    }

    const data = await response.text();
    // console.log('data ='+ data);
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
      console.log('suggestion = '+ secondLastCompletionEvent?.data?.completion);
      return JSON.parse(secondLastCompletionEvent?.data?.completion);
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

async function provideAccessibilitySuggestions(html) {
  return await checkAccessibility(html);
}

module.exports = {
  checkAccessibility,
  provideAccessibilitySuggestions,
};
