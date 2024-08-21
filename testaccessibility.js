// testAccessibility.js

// Import the module
const { provideAccessibilitySuggestions } = require('./ai-accessibility-api');

// Sample HTML content for testing
const sampleHTML = `
<body>
  <header>
    <h1>Welcome to My Website</h1>
    <nav>
      <ul id="nav1">
        <li id="item1"><a href="#">Home</a></li>
        <li id="item2"><a href="#">About</a></li>
        <li id="item3"><a href="#">Contact</a></li>
      </ul>
    </nav>
  </header>

  <main>
    <section>
      <h2>About Us</h2>
      <p>We are a company dedicated to providing high-quality products and services.</p>
      <img src="company-image.jpg" alt="" />
    </section>

    <section>
      <h2>Our Products</h2>
      <ul id="list2">
        <li id="listitem1">Product 1</li>
        <li id="listitem2">Product 2</li>
        <li id="listitem3">Product 3</li>
      </ul>
    </section>

    <section>
      <h2>Contact Us</h2>
      <form>
        <label for="message">Message:</label> for="email">Email: for="name">Name:>Name:
        <input type="text" id="name" name="name" />/><br />

        <label>Email:</label>
        <input type="email" id="email" name="email" />/><br />

        <label>Message:</label>
        <textarea id="message" name="message" />/><br />

        <input type="submit" value="Submit" />
      </form>
      <div role="listbox" id="listbox3">
        <div id="listbox1-1" class="selected" aria-selected="true"> Green </div>
        <div id="listbox1-2">Orange</div>
        <div id="listbox1-3">Red</div>
        <div id="listbox1-4">Blue</div>
        <div id="listbox1-5">Violet</div>
        <div id="listbox1-6">Periwinkle</div>
      </div>
      <div role="combobox" id="combobox2">
        <input type="text" aria-autocomplete="list" aria-controls="options" aria-expanded="false" />
        <ul id="options" role="listbox">
          <li id="combobox-1">Option 1</li>
          <li id="combobox-2">Option 2</li>
          <li id="combobox-3">Option 3</li>
        </ul>
      </div>
      <div role="tree" id="tree1">
        <div id="treeitem-1">Green</div>
        <div id="treeitem-2">Orange</div>
        <div id="treeitem-3">Red</div>
        <div id="treeitem-4">Blue</div>
        <div id="treeitem-5">Violet</div>
        <div id="treeitem-6">Periwinkle</div>
      </div>
      <ul role="menu" id="menu1">
        <li id="menuitem-1">File</li>
        <li id="menuitem-2">Edit</li>
        <li id="menuitem-3">View</li>
      </ul>
      <div role="tablist">
        <button aria-selected="true" aria-controls="panel1">Tab 1</button>
        <button aria-selected="false" aria-controls="panel2">Tab 2</button>
      </div>
      <div id="panel1"> Content for Tab 1 </div>
      <div id="panel2"> Content for Tab 2 </div>
      <div aria-live="random"><p>Status: Loading...</p></div>
      <nav aria-label="Secondary Navigation">
        <ul id="secondary-nav">
          <li id="secondary-nav1"><a href="/" aria-current="date">Home</a></li>
          <li id="secondary-nav2"><a href="/about">About</a></li>
          <li id="secondary-nav3"><a href="/contact">Contact</a></li>
        </ul>
      </nav>
    </section>
  </main>
</body>
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
