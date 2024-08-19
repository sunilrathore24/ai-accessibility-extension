

const SAMPLEHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Document</title>
</head>
<body>
    <div>Test Content</div>
</body>
</html>
`;
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

const prompt = `

conside the response will be an inline warning along with a quick fix in vs code hence provide the issues and exact fix in the following format

1. "message": A clear and concise description of the accessibility issue.

2. "fix": A detailed explanation of how to resolve the issue and improve accessibility.

3. "startPoint": The character index in the HTML file where the relevant code snippet starts.

4. "endPoint": The character index in the HTML file where the relevant code snippet ends.

5. "edits": An array of objects representing the suggested code changes. Each object should contain:
   - "range": An object specifying the "start" and "end" character indices of the code to be modified.
   - "newText": The new text that should replace the existing code within the specified range.

Please ensure that the "edits" section receives the most attention, as it is crucial for accurately communicating the necessary code modifications.

example: for a html code -

${SAMPLEHTML}

the suggestions should be -


${SUGGESSIONS}

make sure to provide exact start and end offsets for the code snippets.


`

