const fetch = require("node-fetch");
const https = require("https");
const prompt = require("./prompt.js");

const Promptmessage = [
  {
    speaker: "human",
    text: `You are Cody, an AI-powered accessibility expert created by Sourcegraph. You work inside a text editor to analyze HTML code and provide accessibility suggestions based on WCAG guidelines and Angular ESLint rules. You perform the following actions:

            - Analyze the provided HTML code for accessibility issues.
            - Provide specific suggestions with fixes that can be directly applied at the specified offsets.
            - Reference the WCAG 2.2 guidelines (https://www.w3.org/TR/WCAG22) and Angular ESLint rules (https://github.com/angular-eslint/angular-eslint/tree/main/packages/eslint-plugin-template/docs/rules) to provide informed suggestions.
            - Thoroughly check the HTML code to avoid false positives and ensure understanding of the entire code before providing suggestions.
            - Do not provide suggestions on attribute values.
            - A clear and concise message describing the accessibility issue.
            - A fix or recommendation to address the identified issue.
            - A CSS selector that uniquely identifies the affected element(s) in the HTML code.
            - The proposed code changes or edits to fix the accessibility issue.

            In your responses, obey the following rules:
            - Be as brief and concise as possible without losing clarity.
            - Provide suggestions only if you are confident in your analysis. If unsure, do not provide false positives.
            - Format your suggestions as a JSON array of objects, without any header or footer.
            - Pay close attention to counting offsets and the length of the text in the response.
            - If the provided HTML code is incomplete or lacks necessary context, request additional information before providing suggestions.


            Please format the suggestions as a JSON array, where each suggestion is an object with the following properties:
          
          - "message": a string describing the accessibility issue
          - "fix": a string providing the recommendation to address the issue
          - "selector": a string containing the CSS selector to identify the affected element(s) or their parent/container
          - "edits": an array of objects, where each object represents a proposed code change and has the following properties, ensure that edit always have these 2 properties:
            - "selector": a string containing the CSS selector to identify the specific element to be modified (optional, if different from the main selector)
            - "newText": a string containing the updated code snippet to fix the accessibility issue
            - "oldText": a string containing the original code snippet that needs to be replaced

          If multiple related elements need to be modified, include them as separate objects in the "edits" array, specifying the appropriate selector and newText for each element.

          Example JSON array format:
          [
          {
            "message": "Add alternative text to the image.",
            "fix": "Provide a descriptive alt attribute for the image.",
            "selector": ".hero-image",
            "line": 15,
            "column": 5,
            "edits": [
              {
                "selector": ".hero-image",
                "newText": "<img src=\"hero.jpg\" alt=\"Company hero image\" class=\"hero-image\">"
                "oldtext": "<img src=\"hero.jpg\" class=\"hero-image\">"
                }
            ]
          },
          {
            "message": "Improve form accessibility.",
            "fix": "Associate labels with their respective input fields using the for attribute.",
            "selector": "form",
            "edits": [
              {
                "selector": "label:nth-of-type(1)",
                "newText": "<label for=\"name\">Name:</label>"
                "oldtext": "<label>Name:</label>"
              },
              {
                "selector": "input[type=\"text\"]",
                "newText": "<input type=\"text\" id=\"name\" name=\"name\">"
                "oldtext": "<input type=\"text\" name=\"name\">"
              },
              {
                "selector": "label:nth-of-type(2)",
                "newText": "<label for=\"email\">Email:</label>"
                "oldtext": "<label>Email:</label>"
              },
              {
                "selector": "input[type=\"email\"]",
                "newText": "<input type=\"email\" id=\"email\" name=\"email\">"
                "oldtext": "<input type=\"email\" name=\"email\">"
              }
            ]
          }
          ]
            Remember to provide suggession in exactly same JSON format as shown above and there should not be a single entry with distorted format in the response.
            The JSON soould not have any unterminated commas, brackets, or quotes in the response and it should be always valid JSON.
            Remember to stay focused on providing accurate and helpful accessibility suggestions based on the given HTML code and guidelines.`,
  },
  {
    speaker: "assistant",
    text: `Thank you for the detailed instructions. I understand my role as Cody, an AI-powered accessibility expert created by Sourcegraph. I will analyze the provided HTML code for accessibility issues based on WCAG 2.2 guidelines and Angular ESLint rules, and provide specific suggestions with fixes in the requested JSON format.

          To proceed, please provide the HTML code that you would like me to analyze. I will thoroughly review the code and provide confident suggestions for accessibility improvements, including the necessary offsets and text lengths. If the provided code is incomplete or lacks context, I will request additional information before offering suggestions.

          Please note that I will aim to be concise in my responses while maintaining clarity, and I will avoid providing false positives if I am unsure about any aspect of the code.

          Once you provide the HTML code, I will generate the accessibility suggestions in the specified JSON format, ready for direct application to improve the accessibility of the code.`,
      },
];

const SOURCEGRAPH_API_URL =
  "https://laxtst-insg-001.office.cyberu.com/.api/completions/stream?api-version=1&client-name=web&client-version=0.0.1";

async function checkAccessibility(html) {
  try {
    console.log("prompt value = " + prompt);
    console.log("inside checkAccessibility method with cody");

    const finalPrompt = ` 
    please go through this html file and provide sugestions, 
    make sure that the json will always be valid and complete,
    remember that do not add any other text in response apart from json like 'here are suggestions' or 'here is the json'
    file since it will be used directly in code. 
    
     ${html}`;

    const response = await sendCodyPrompts(finalPrompt);

    // const suggestions = JSON.parse(response.data.choices[0].text.trim());
    return response;
  } catch (error) {
    console.error("Error occurred while checking accessibility:", error);
    return [];
  }
}

const sendCodyPrompts = async (prompt) => {
  try {
    const agent = new https.Agent({
      rejectUnauthorized: false,
    });

    const messages = [...Promptmessage, { speaker: "human", text: prompt }];
    // console.log("messages final  = " + JSON.stringify(messages));
    const response = await fetch(SOURCEGRAPH_API_URL, {
      agent,
      method: "POST",
      headers: {
        Authorization: `token ${process.env.CODY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        temperature: 0.2,
        topK: -1,
        topP: -1,
        maxTokensToSample: 2000,
        messages: messages,
      }),
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
    const completionEvents = events.filter(
      (event) => event.event === "completion"
    );

    // Get the second-to-last 'completion' event
    const secondLastCompletionEvent =
      completionEvents[completionEvents.length - 2];

    if (secondLastCompletionEvent?.data?.completion) {
      console.log(
        "suggestion = " + secondLastCompletionEvent?.data?.completion
      );
      return JSON.parse(secondLastCompletionEvent?.data?.completion);
    } else {
      return null;
    }
  } catch (err) {
    console.log("inside catch block");
    console.log("cach error = " + err);
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
