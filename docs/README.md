# Personal Website - Abolfazl Ziaeemehr

This repository contains the source code for my personal academic website hosted at [ziaeemehr.github.io](https://ziaeemehr.github.io).

## About

This is a static website showcasing my academic profile, including:
- Personal information and biography
- CV and publications
- Research projects
- Teaching activities
- Contact information

## Structure

```
docs/
├── index.html          # Home page
├── cv.html            # Curriculum Vitae
├── publications.html  # Publications list
├── projects.html      # Research projects
├── teaching.html      # Teaching activities
├── contact.html       # Contact information
├── images/            # Image assets
├── scripts/           # JavaScript files
└── styles/            # CSS stylesheets
```

## Technologies

- HTML5
- CSS3
- JavaScript
- GitHub Pages

## Local Development

To view the website locally:

1. Clone the repository:
```bash
git clone https://github.com/Ziaeemehr/ziaeemehr.github.io.git
cd ziaeemehr.github.io
```

2. Open the HTML files directly in your browser, or use a local server:
```bash
# Using Python
python -m http.server 8000

# Using Node.js (if you have http-server installed)
npx http-server docs/
```

3. Navigate to `http://localhost:8000/docs/` in your browser

## Deployment

This site is automatically deployed via GitHub Pages from the `docs/` folder on the `main` branch.

## Updates

To update the website:

1. Make your changes to the HTML/CSS/JS files
2. Commit and push to the `main` branch:
```bash
git add .
git commit -m "Update content"
git push origin main
```

3. Changes will be live at [ziaeemehr.github.io](https://ziaeemehr.github.io) within a few minutes

## License

© 2026 Abolfazl Ziaeemehr. All rights reserved.

## Contact

For any inquiries, please visit the [contact page](https://ziaeemehr.github.io/contact.html).
