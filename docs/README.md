# ziaeemehr.github.io

**Live site: [ziaeemehr.github.io](https://ziaeemehr.github.io)**

Source of my personal page, served by GitHub Pages from `docs/`.

Preview locally (the publication lists fetch the `.bib` file, so `file://` won't work):

    python -m http.server 8000 --directory docs

- Publications: edit `docs/ziaeemehr.bib`; pinned home-page entries are the `data-keys` in `index.html`.
- CV: edit `docs/cv/Ziaeemehr.tex`, then `tectonic docs/cv/Ziaeemehr.tex`.
- Email links are built by `docs/scripts/email.js` from a reversed address in `data-mail`.
