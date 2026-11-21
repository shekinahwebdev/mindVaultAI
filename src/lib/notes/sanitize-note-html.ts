const ALLOWED_TAGS = new Set([
  "a",
  "blockquote",
  "br",
  "code",
  "div",
  "em",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "img",
  "li",
  "ol",
  "p",
  "pre",
  "span",
  "strong",
  "table",
  "tbody",
  "td",
  "th",
  "thead",
  "tr",
  "ul",
]);

const URL_ATTRS = new Set(["href", "src"]);

function isSafeUrl(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return false;
  if (normalized.startsWith("javascript:") || normalized.startsWith("data:text/html")) {
    return false;
  }
  return (
    normalized.startsWith("http://") ||
    normalized.startsWith("https://") ||
    normalized.startsWith("mailto:") ||
    normalized.startsWith("/") ||
    normalized.startsWith("#")
  );
}

/** Strip scripts and unsafe markup for read-only note HTML bodies. */
export function sanitizeNoteHtml(html: string): string {
  if (typeof DOMParser === "undefined") {
    return html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "");
  }

  const doc = new DOMParser().parseFromString(html, "text/html");
  const root = doc.body;

  function cleanNode(node: Node) {
    const children = [...node.childNodes];
    for (const child of children) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as HTMLElement;
        const tag = el.tagName.toLowerCase();
        if (!ALLOWED_TAGS.has(tag)) {
          while (el.firstChild) {
            el.parentNode?.insertBefore(el.firstChild, el);
          }
          el.remove();
          continue;
        }

        for (const attr of [...el.attributes]) {
          const name = attr.name.toLowerCase();
          if (name.startsWith("on")) {
            el.removeAttribute(attr.name);
            continue;
          }
          if (URL_ATTRS.has(name) && !isSafeUrl(attr.value)) {
            el.removeAttribute(attr.name);
          }
        }

        if (tag === "a") {
          el.setAttribute("rel", "noopener noreferrer");
          if (el.getAttribute("target") === "_blank") {
            /* keep */
          } else if (el.getAttribute("href")?.startsWith("http")) {
            el.setAttribute("target", "_blank");
          }
        }

        cleanNode(el);
      }
    }
  }

  cleanNode(root);
  return root.innerHTML;
}