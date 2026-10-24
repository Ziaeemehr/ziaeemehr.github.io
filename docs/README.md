# Personal Website - Abolfazl Ziaeemehr

This repository contains the source code for my personal academic website hosted at [ziaeemehr.github.io](https://ziaeemehr.github.io).

## About

A static portfolio of my scientific software, publications and CV:
- Home page with a live logistic-map bifurcation diagram and featured software
- Software catalogue (JaxCont, lyapax, VBI, LitForge, MD Viewer and more)
- Publications, rendered from `ziaeemehr.bib`
- CV (HTML, plus the LaTeX source and PDF in `cv/`)
- Teaching and contact pages

## Structure

```
docs/
├── index.html          # Home page
├── cv.html            # Curriculum Vitae
├── publications.html  # Publications list
├── projects.html      # Software catalogue
├── ziaeemehr.bib      # Single source for the publication lists
├── cv/                # Ziaeemehr.tex and the built Ziaeemehr.pdf
├── teaching.html      # Teaching activities
├── contact.html       # Contact information
├── images/            # Image assets
├── scripts/           # orbit.js (hero figure), publications.js (bib renderer)
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

2. Serve the `docs/` folder (the publication lists fetch `ziaeemehr.bib`, which
   browsers block for pages opened as `file://`):
```bash
python -m http.server 8000 --directory docs
```

3. Open `http://localhost:8000/` in your browser.

## Updating content

- **Publications:** edit `docs/ziaeemehr.bib`. Both the home page (pinned keys in
  `data-keys`) and the publications page read it.
- **Email:** links carry the address reversed in `data-mail` and `scripts/email.js`
  rebuilds it in the browser, so it never appears as plain text in the HTML.
- **CV:** edit `docs/cv/Ziaeemehr.tex` and rebuild the PDF, e.g. `tectonic docs/cv/Ziaeemehr.tex`.

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
