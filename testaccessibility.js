// testAccessibility.js

// Import the module
const { provideAccessibilitySuggestions } = require('./ai-accessibility-api');

// Sample HTML content for testing
const sampleHTML = `
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

// Test the checkAccessibility function
(async () => {
    console.log('Starting accessibility check...');

    try {
       await provideAccessibilitySuggestions(sampleHTML);
    } catch (error) {
        console.error('Error occurred:', error);
    }
})();
