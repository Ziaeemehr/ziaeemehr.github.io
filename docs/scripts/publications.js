// Renders publications from ziaeemehr.bib (the single source of truth).
// <ul data-pubs="latest" data-limit="5"> shows the newest entries;
// <ul data-pubs="all"> shows everything grouped by year, with filters.

const OWN_NAME = /ziaee[\s-]?mehr/i;

function cleanLatex(value) {
  return value
    .replace(/\\&/g, "&")
    .replace(/\\_/g, "_")
    .replace(/\{\\[a-zA-Z]+\{([a-zA-Z])\}\}/g, "$1")
    .replace(/\{\\[a-zA-Z]+\s*([a-zA-Z])\}/g, "$1")
    .replace(/\\'\{?([a-zA-Z])\}?/g, "$1")
    .replace(/[{}]/g, "")
    .replace(/--/g, "–")
    .replace(/\\/g, "");
}

// Reads `name = {braced}`, `name = "quoted"` or `name = bare` fields,
// tracking brace depth so nested groups like {\'{e}} survive.
function readFields(body) {
  const fields = {};
  let i = 0;
  while (i < body.length) {
    const m = /\s*,?\s*(\w+)\s*=\s*/y;
    m.lastIndex = i;
    const head = m.exec(body);
    if (!head) break;
    i = m.lastIndex;
    let value = "";
    if (body[i] === "{") {
      let depth = 0;
      const begin = i + 1;
      for (; i < body.length; i++) {
        if (body[i] === "{") depth++;
        else if (body[i] === "}" && --depth === 0) break;
      }
      value = body.slice(begin, i);
      i++;
    } else if (body[i] === '"') {
      const close = body.indexOf('"', i + 1);
      value = body.slice(i + 1, close);
      i = close + 1;
    } else {
      const bare = /[^,\s}]+/y;
      bare.lastIndex = i;
      const b = bare.exec(body);
      value = b ? b[0] : "";
      i = bare.lastIndex;
    }
    fields[head[1].toLowerCase()] = cleanLatex(value.replace(/\s+/g, " ").trim());
  }
  return fields;
}

function parseBib(text) {
  const entries = [];
  text.split(/^@/m).slice(1).forEach((chunk) => {
    const typeMatch = chunk.match(/^(\w+)\s*\{\s*([^,]+),/);
    if (!typeMatch) return;
    const body = chunk.slice(typeMatch[0].length, chunk.lastIndexOf("}"));
    const fields = { ...readFields(body), type: typeMatch[1].toLowerCase(), key: typeMatch[2].trim() };
    if (!fields.title) return;
    if (fields.doi) fields.link = `https://doi.org/${fields.doi}`;
    else if (fields.url) fields.link = fields.url;
    fields.kind = classify(fields);
    entries.push(fields);
  });
  return entries.sort((a, b) => Number(b.year || 0) - Number(a.year || 0));
}

function classify(entry) {
  const venue = entry.journal || entry.booktitle || "";
  if (/arxiv|biorxiv|medrxiv/i.test(venue)) return "preprint";
  if (/open source software/i.test(venue)) return "software";
  if (entry.type === "inproceedings") return "conference";
  return "journal";
}

const KIND_LABEL = {
  preprint: "Preprint",
  software: "Software paper",
  conference: "Conference",
  journal: "Journal",
};

function shortName(full) {
  const name = full.trim();
  if (name === "others") return null;
  const [last, first = ""] = name.includes(",") ? name.split(/\s*,\s*/) : [name.split(" ").pop(), name.split(" ").slice(0, -1).join(" ")];
  const initials = first
    .split(/[\s.]+/)
    .filter(Boolean)
    .map((part) => part.split("-").map((p) => p[0] + ".").join("-"))
    .join(" ");
  return { text: initials ? `${initials} ${last}` : last, own: OWN_NAME.test(last) };
}

// Long author lists keep the first three, the owner, and the last author.
function authorNodes(authorField) {
  const raw = (authorField || "").split(/\s+and\s+/);
  const truncatedSource = raw.includes("others");
  const people = raw.map(shortName).filter(Boolean);
  let shown = people;
  if (people.length > 8) {
    const ownIdx = people.findIndex((p) => p.own);
    const keep = new Set([0, 1, 2]);
    if (!truncatedSource) keep.add(people.length - 1);
    if (ownIdx >= 0) keep.add(ownIdx);
    shown = [];
    let prev = -1;
    [...keep].sort((a, b) => a - b).forEach((idx) => {
      if (idx - prev > 1) shown.push(null);
      shown.push(people[idx]);
      prev = idx;
    });
  }
  const frag = document.createDocumentFragment();
  shown.forEach((person, i) => {
    if (i > 0) frag.append(", ");
    if (!person) {
      frag.append("…");
      return;
    }
    if (person.own) {
      const strong = document.createElement("strong");
      strong.textContent = person.text;
      frag.append(strong);
    } else {
      frag.append(person.text);
    }
  });
  if (truncatedSource) frag.append(", et al.");
  return frag;
}

function venueNode(entry) {
  const p = document.createElement("p");
  p.className = "pub-venue";
  const venue = entry.journal || entry.booktitle;
  if (venue) {
    const em = document.createElement("em");
    em.textContent = venue.replace(/^arXiv preprint arXiv:.*/i, "arXiv");
    p.append(em);
  }
  const details = [];
  if (entry.volume) details.push(entry.number ? `${entry.volume}(${entry.number})` : entry.volume);
  if (entry.pages) details.push(entry.pages);
  if (details.length) p.append(` ${details.join(", ")}`);
  if (entry.year) p.append(`${venue ? ", " : ""}${entry.year}`);
  if (entry.kind !== "journal") {
    const tag = document.createElement("span");
    tag.className = "pub-kind";
    tag.textContent = KIND_LABEL[entry.kind];
    p.append(tag);
  }
  return p;
}

function itemNode(entry) {
  const li = document.createElement("li");
  li.className = "pub-item";
  li.dataset.kind = entry.kind;
  const title = document.createElement("h3");
  title.className = "pub-title";
  if (entry.link) {
    const a = document.createElement("a");
    a.href = entry.link;
    a.textContent = entry.title;
    title.append(a);
  } else {
    title.textContent = entry.title;
  }
  const authors = document.createElement("p");
  authors.className = "pub-authors";
  authors.append(authorNodes(entry.author));
  li.append(title, authors, venueNode(entry));
  return li;
}

// data-keys pins specific entries in the given order; otherwise the newest.
function renderLatest(entries, container) {
  const keys = (container.dataset.keys || "").split(",").map((k) => k.trim()).filter(Boolean);
  const limit = Number(container.dataset.limit || 5);
  let chosen = keys.map((k) => {
    const entry = entries.find((e) => e.key === k);
    if (!entry) console.warn(`publications: no entry with key "${k}" in the bib file`);
    return entry;
  }).filter(Boolean);
  if (!chosen.length) chosen = entries.slice(0, limit);
  container.replaceChildren(...chosen.map(itemNode));
}

function renderAll(entries, container) {
  let year = null;
  entries.forEach((entry) => {
    if (entry.year !== year) {
      year = entry.year;
      const heading = document.createElement("li");
      heading.className = "pub-year";
      heading.textContent = year || "Undated";
      container.append(heading);
    }
    container.append(itemNode(entry));
  });
}

// Shows entries of one kind, hides empty years, and marks the first visible
// year and item so borders and spacing stay right after filtering.
function applyFilter(container, kind, announce = true) {
  let year = null;
  let firstInYear = true;
  let seenYear = false;
  let seenItem = false;
  let shown = 0;
  const finishYear = () => {
    if (!year) return;
    year.hidden = firstInYear;
    if (!year.hidden) {
      year.classList.toggle("is-top-year", !seenYear);
      seenYear = true;
    }
  };
  [...container.children].forEach((li) => {
    if (li.classList.contains("pub-year")) {
      finishYear();
      year = li;
      firstInYear = true;
      return;
    }
    const show = kind === "all" || li.dataset.kind === kind;
    li.hidden = !show;
    li.classList.toggle("is-first", show && firstInYear);
    li.classList.toggle("is-top", show && !seenItem);
    if (show) {
      firstInYear = false;
      seenItem = true;
      shown++;
    }
  });
  finishYear();
  const status = document.querySelector("[data-pub-status]");
  if (status && announce) status.textContent = `Showing ${shown} of ${container.querySelectorAll(".pub-item").length} publications.`;
}

function initFilters(container, entries) {
  const group = document.querySelector("[data-pub-filters]");
  if (!group) return;
  const counts = entries.reduce((acc, e) => ({ ...acc, [e.kind]: (acc[e.kind] || 0) + 1 }), {});
  group.querySelectorAll("button[data-kind]").forEach((button) => {
    const kind = button.dataset.kind;
    const n = kind === "all" ? entries.length : counts[kind] || 0;
    button.querySelector("[data-count]").textContent = n;
    if (!n) button.hidden = true;
    button.addEventListener("click", () => {
      group.querySelectorAll("button[data-kind]").forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
      applyFilter(container, kind);
    });
  });
}

async function loadBib() {
  const script = document.querySelector("script[data-bib]");
  const path = (script && script.dataset.bib) || "ziaeemehr.bib";
  const response = await fetch(path, { cache: "no-cache" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

async function initPublications() {
  const latest = document.querySelector("[data-pubs='latest']");
  const all = document.querySelector("[data-pubs='all']");
  if (!latest && !all) return;
  let entries;
  try {
    entries = parseBib(await loadBib());
  } catch (error) {
    [latest, all].filter(Boolean).forEach((target) => {
      target.innerHTML =
        '<li class="pub-item">The publication list could not be loaded. See <a href="https://scholar.google.com/citations?hl=en&amp;user=rmsueR0AAAAJ">Google Scholar</a> for the full list.</li>';
    });
    return;
  }
  if (latest) renderLatest(entries, latest);
  if (all) {
    renderAll(entries, all);
    initFilters(all, entries);
    applyFilter(all, "all", false);
  }
}

document.addEventListener("DOMContentLoaded", initPublications);
