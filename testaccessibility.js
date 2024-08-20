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
    <title>Accessibility Issues Example</title>
    <style>
        /* CSS styles */
        .button {
            background-color: #4CAF50;
            border: none;
            color: white;
            padding: 15px 32px;
            text-align: center;
            text-decoration: none;
            display: inline-block;
            font-size: 16px;
            margin: 4px 2px;
            cursor: pointer;
        }
    </style>
</head>
<body>
    <header>
        <h1>Welcome to My Website</h1>
        <nav>
            <ul>
                <li><a href="#">Home</a></li>
                <li><a href="#">About</a></li>
                <li><a href="#">Contact</a></li>
            </ul>
        </nav>
    </header>

    <main>
        <section>
            <h2>About Us</h2>
            <p>We are a company dedicated to providing high-quality products and services.</p>
            <img src="company-image.jpg" alt="">
        </section>

        <section>
            <h2>Our Products</h2>
            <ul>
                <li>Product 1</li>
                <li>Product 2</li>
                <li>Product 3</li>
            </ul>
        </section>

        <section>
            <h2>Contact Us</h2>
            <form>
                <label>Name:</label>
                <input type="text" name="name"><br>

                <label>Email:</label>
                <input type="email" name="email"><br>

                <label>Message:</label>
                <textarea name="message"></textarea><br>

                <input type="submit" value="Submit">
            </form>
        </section>
    </main>

    <footer>
        <p>&copy; 2023 My Website. All rights reserved.</p>
        <div class="button">Click Me</div>
    </footer>

    <script>
        // JavaScript code
        document.querySelector('.button').addEventListener('click', function() {
            alert('Button clicked!');
        });
    </script>
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
