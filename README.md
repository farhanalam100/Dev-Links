# DevLinks - My Developer Resource Hub

> *A personal project I built to organize all the developer tools I use daily*

## The Story Behind This Project

I started building DevLinks because I was tired of having my favorite developer tools scattered across different browsers, bookmark folders, and random text files. I wanted one place where I could quickly find everything I need for my coding projects.

What started as a simple list of links quickly grew into something more as I kept adding features I actually needed:
- Search functionality because I couldn't remember where I put everything
- Dark mode because I code late at night
- Categories because the list was getting too long
- Save functionality for my personal favorites

## Features I Actually Use

- **Live Search** - Find tools instantly (I use this every day)
- **Theme Switching** - Dark/Light/Auto modes
- **Category Filtering** - Design, Coding, Hosting, AI Tools, Learning
- **Custom Resources** - Add your own tools
- **Save System** - Bookmark your favorites
- **Command Palette** - Quick access with Ctrl+K
- **Mobile Friendly** - Works on my phone too

## How I Built It

This is my first real web project! I used:
- **HTML5** for structure
- **CSS3** with custom properties for theming
- **Vanilla JavaScript** (no frameworks - I wanted to learn the fundamentals)
- **LocalStorage** for saving preferences

## What I Learned

Building this taught me so much:
- CSS custom properties are amazing for theming
- Event delegation is way better than individual listeners
- Mobile-first design saves headaches
- How to handle user data securely
- The importance of clean, maintainable code

## Project Structure

```
devlinks/
|-- index.html          # Main page and all the resource cards
|-- style.css           # All styling, themes, and responsive design
|-- script.js           # Search, filters, themes, and all interactions
|-- dashboard.js        # Analytics dashboard (recent addition)
|-- collections.js      # Collections feature (experimental)
|-- sharing.js          # Export/import functionality
|-- shortcuts.js        # Keyboard shortcuts
|-- suggestions.js      # Search suggestions
|-- DEPLOYMENT.md       # How I deployed this
|-- CHANGELOG.md        # Development history
|-- package.json        # Project configuration
|-- .gitignore          # Git ignore rules
`-- README.md           # This file!
```

## Current Version: 1.2.0

I'm still actively developing this! Recent additions:
- Command palette with keyboard shortcuts
- Custom resource management
- Analytics dashboard
- Collections feature
- Better mobile experience

## Known Issues (Being Honest!)

- Command palette sometimes doesn't close on escape (working on it)
- Mobile menu could be smoother
- Search could be faster with lots of resources
- Haven't added tests yet (next on my list)

## Try It Out

You can use this live at: [your deployment URL]

Or run it locally:
```bash
# Clone the repo
git clone https://github.com/farhanalam100/Dev-Links.git
cd Dev-Links

# Start a local server
python -m http.server 8000

# Open http://localhost:8000
```

## Contributing

I'm learning and open to suggestions! If you find bugs or have ideas for improvements, please open an issue or submit a PR.

## Hack Club Submission

This project was built for the Hack Club Horizons program! I'm excited to compete in the IRL hackathon in Manhattan.

**What I'm proud of:**
- Built everything from scratch using vanilla web technologies
- Solved a real problem I faced daily as a developer
- Learned so much about web development through this project
- Actually use this tool every day for my own coding projects

**Challenges I overcame:**
- Mobile responsiveness was tricky but I got it working
- Theme switching required learning CSS custom properties
- Search functionality needed optimization for performance
- Command palette was complex but super rewarding to build

## License

MIT - feel free to use and modify!

*Built with passion by Farhan Alam*  
*Started in October 2024, still learning and improving*

How to Run Locally

1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/devlinks.git
```

2. Open the folder in VS Code
```bash
cd devlinks
code .
```

3. Open `index.html` with Live Server or just double-click it
