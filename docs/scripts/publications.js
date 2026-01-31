function cleanLatex(value) {
  return value
    .replace(/\\&/g, "&")
    .replace(/\{\\[a-zA-Z]+\{([a-zA-Z])\}\}/g, "$1")
    .replace(/\{\\[a-zA-Z]+\s*([a-zA-Z])\}/g, "$1")
    .replace(/[{}]/g, "")
    .replace(/[’]/g, "'")
    .replace(/[–]/g, "-")
    .replace(/\\/g, "");
}

function parseBib(text) {
  const entries = [];
  const chunks = text.split(/@/g).slice(1);
  chunks.forEach((chunk) => {
    const bodyStart = chunk.indexOf("{");
    if (bodyStart === -1) return;
    const body = chunk.slice(bodyStart + 1).trim();
    const fields = {};
    body.split(/\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("%")) return;
      const match = trimmed.match(/^([a-zA-Z]+)\s*=\s*[{"](.*)[}"]\s*,?$/);
      if (match) {
        fields[match[1].toLowerCase()] = cleanLatex(match[2].trim());
      }
    });
    if (Object.keys(fields).length) {
      // Extract link from doi, url, arXiv, or publisher
      if (fields.doi) {
        fields.link = `https://doi.org/${fields.doi}`;
      } else if (fields.url) {
        fields.link = fields.url;
      } else if (fields.journal && fields.journal.includes('arXiv preprint arXiv:')) {
        const arxivId = fields.journal.match(/arXiv:([0-9.]+)/);
        if (arxivId) {
          fields.link = `https://arxiv.org/abs/${arxivId[1]}`;
        }
      } else if (fields.publisher && fields.publisher.includes('http')) {
        fields.link = fields.publisher;
      }
      entries.push(fields);
    }
  });
  return entries;
}

function formatAuthors(authors) {
  if (!authors) return "";
  return authors.replace(/\s+and\s+/g, ", ");
}

function formatVenue(entry) {
  const parts = [];
  if (entry.journal) parts.push(entry.journal);
  if (entry.booktitle) parts.push(entry.booktitle);
  if (entry.volume) parts.push(`vol. ${entry.volume}`);
  if (entry.number) parts.push(`no. ${entry.number}`);
  if (entry.pages) parts.push(`pp. ${entry.pages}`);
  return parts.join(", ");
}

function renderLatest(entries, container, limit) {
  const sorted = entries
    .filter((entry) => entry.year)
    .sort((a, b) => Number(b.year) - Number(a.year));

  sorted.slice(0, limit).forEach((entry) => {
    const listItem = document.createElement("li");
    listItem.className = "pub-item";
    const title = document.createElement("h4");
    if (entry.link) {
      const link = document.createElement("a");
      link.href = entry.link;
      link.textContent = entry.title || "Untitled";
      link.target = "_blank";
      title.appendChild(link);
    } else {
      title.textContent = entry.title || "Untitled";
    }
    const meta = document.createElement("p");
    const venue = formatVenue(entry);
    meta.textContent = `${formatAuthors(entry.author)}${venue ? " · " + venue : ""}${entry.year ? " · " + entry.year : ""}`;
    listItem.appendChild(title);
    listItem.appendChild(meta);
    container.appendChild(listItem);
  });
}

function renderAll(entries, container) {
  const byYear = {};
  entries.forEach((entry) => {
    const year = entry.year || "Other";
    if (!byYear[year]) byYear[year] = [];
    byYear[year].push(entry);
  });

  const years = Object.keys(byYear).sort((a, b) => Number(b) - Number(a));
  years.forEach((year) => {
    const heading = document.createElement("li");
    heading.className = "pub-year";
    heading.textContent = year;
    container.appendChild(heading);

    byYear[year].forEach((entry) => {
      const item = document.createElement("li");
      item.className = "pub-item";
      const title = document.createElement("h4");
      if (entry.link) {
        const link = document.createElement("a");
        link.href = entry.link;
        link.textContent = entry.title || "Untitled";
        link.target = "_blank";
        title.appendChild(link);
      } else {
        title.textContent = entry.title || "Untitled";
      }
      const meta = document.createElement("p");
      const venue = formatVenue(entry);
      meta.textContent = `${formatAuthors(entry.author)}${venue ? " · " + venue : ""}`;
      item.appendChild(title);
      item.appendChild(meta);
      container.appendChild(item);
    });
  });
}

async function initPublications() {
  const latestContainer = document.querySelector("[data-pubs='latest']");
  const allContainer = document.querySelector("[data-pubs='all']");
  if (!latestContainer && !allContainer) return;

  let text = null;
  const bibScript = document.getElementById("bib-data");
  if (bibScript) {
    text = bibScript.textContent;
  } else {
    // Fallback to fetch
    const script = document.querySelector("script[data-bib]");
    const bibPath = script && script.dataset.bib ? script.dataset.bib : "ziaeemehr.bib";
    const scriptUrl = script ? new URL(script.src, window.location.href) : null;
    const scriptDir = scriptUrl ? scriptUrl.href.slice(0, scriptUrl.href.lastIndexOf("/") + 1) : "";
    const cacheBust = `v=${Date.now()}`;
    const withCacheBust = (path) => (path.includes("?") ? `${path}&${cacheBust}` : `${path}?${cacheBust}`);
    const fallbackPaths = [
      bibPath,
      bibPath.startsWith("./") ? bibPath.slice(2) : `./${bibPath}`,
      new URL(bibPath, window.location.href).href,
      scriptDir ? `${scriptDir}${bibPath}` : null,
      scriptDir ? `${scriptDir}${bibPath.replace("./", "")}` : null,
      "/ziaeemehr.bib",
    ].filter(Boolean).map(withCacheBust);

    try {
      for (const path of fallbackPaths) {
        const response = await fetch(path, { cache: "no-store" });
        if (response.ok) {
          text = await response.text();
          break;
        }
      }
    } catch (error) {
      // Ignore fetch errors
    }
  }

  if (!text) {
    const target = latestContainer || allContainer;
    if (target) {
      target.innerHTML = `<li>Unable to load publications.</li>`;
    }
    return;
  }

  const entries = parseBib(text);
  if (latestContainer) {
    renderLatest(entries, latestContainer, 5);
  }
  if (allContainer) {
    renderAll(entries, allContainer);
  }
}

document.addEventListener("DOMContentLoaded", initPublications);
