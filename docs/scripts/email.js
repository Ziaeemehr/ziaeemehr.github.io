// The address is stored reversed in data-mail so it never appears as plain
// text in the HTML that spam crawlers read; it is rebuilt here for visitors.
document.querySelectorAll("[data-mail]").forEach((link) => {
  const address = link.dataset.mail.split("").reverse().join("");
  link.href = `mailto:${address}`;
  if (link.dataset.mailShow !== undefined) link.textContent = address;
});
