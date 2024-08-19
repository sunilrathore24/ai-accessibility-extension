// testAccessibility.js

// Import the module
const { checkAccessibility, provideAccessibilitySuggestions } = require('./ai-accessibility-api');

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
        const suggestions = await checkAccessibility(sampleHTML);
        console.log('Accessibility suggestions:', suggestions);
        
        // Optionally, you can also apply company guidelines and print enhanced suggestions
        const enhancedSuggestions = await provideAccessibilitySuggestions(sampleHTML);
        console.log('Enhanced suggestions:', enhancedSuggestions);
    } catch (error) {
        console.error('Error occurred:', error);
    }
})();
