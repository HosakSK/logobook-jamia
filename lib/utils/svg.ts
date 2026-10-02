/**
 * SVG Normalization and Scoping Utility
 *
 * Solves the critical issue where multiple inlined SVGs share identical class names
 * (e.g. .cls-1, .cls-2, .cls-3, .st0 from Illustrator/Figma/Inkscape) or ID references
 * (e.g. #clip-path, #linear-gradient), causing CSS rule collisions and color bleeding
 * (e.g. white text turning green when another SVG defines .cls-3 as green).
 */

export function normalizeAndScopeSvg(
  svgString: string,
  customPrefix?: string
): string {
  if (!svgString || typeof svgString !== "string") {
    return "";
  }

  let result = svgString.trim();

  // 1. Remove XML Prologue and DOCTYPE declarations
  result = result.replace(/<\?xml[\s\S]*?\?>/gi, "");
  result = result.replace(/<!DOCTYPE[\s\S]*?>/gi, "");

  // 2. Generate a random unique scope prefix if not provided
  const prefix =
    customPrefix ||
    `lb_${Math.random().toString(36).substring(2, 8)}`;

  // 3. Extract and scope all class names defined inside <style> tags
  const styleRegex = /<style[\s\S]*?>([\s\S]*?)<\/style>/gi;
  const classMap = new Map<string, string>();

  let styleMatch: RegExpExecArray | null;
  while ((styleMatch = styleRegex.exec(result)) !== null) {
    const cssBody = styleMatch[1];
    // Find all class selectors: .cls-1, .st0, .path-1, etc.
    const classSelectorRegex = /\.([a-zA-Z0-9_-]+)\s*\{/g;
    let clsMatch: RegExpExecArray | null;
    while ((clsMatch = classSelectorRegex.exec(cssBody)) !== null) {
      const origClass = clsMatch[1];
      if (!classMap.has(origClass)) {
        classMap.set(origClass, `${prefix}_${origClass}`);
      }
    }
  }

  // 4. If classes were found in <style>, rename them in <style> and class="" attributes
  if (classMap.size > 0) {
    // Replace in <style> tags
    result = result.replace(styleRegex, (fullMatch, cssBody) => {
      let updatedCss = cssBody;
      for (const [orig, scoped] of classMap.entries()) {
        // Replace .origClass with .scopedClass (word boundary or followed by { / , / space / pseudo)
        const regex = new RegExp(`\\.${orig}(?=[\\s{,:>+~])`, "g");
        updatedCss = updatedCss.replace(regex, `.${scoped}`);
      }
      return `<style>${updatedCss}</style>`;
    });

    // Replace in class="..." and class='...' attributes throughout the SVG
    result = result.replace(/class=["']([^"']+)["']/gi, (fullMatch, classList) => {
      const classes = classList.split(/\s+/);
      const updatedClasses = classes.map((c: string) => classMap.get(c) || c);
      return `class="${updatedClasses.join(" ")}"`;
    });
  }

  // 5. Scope IDs and their references (e.g. clipPath, gradients, masks)
  const idRegex = /\bid=["']([^"']+)["']/gi;
  const idMap = new Map<string, string>();
  let idMatch: RegExpExecArray | null;

  while ((idMatch = idRegex.exec(result)) !== null) {
    const origId = idMatch[1];
    // Avoid renaming generic non-def root IDs if not necessary, but defs MUST be scoped
    if (!idMap.has(origId)) {
      idMap.set(origId, `${prefix}_id_${origId}`);
    }
  }

  if (idMap.size > 0) {
    for (const [origId, scopedId] of idMap.entries()) {
      // Replace id="origId"
      const idAttrRegex = new RegExp(`\\bid=["']${origId}["']`, "g");
      result = result.replace(idAttrRegex, `id="${scopedId}"`);

      // Replace url(#origId) and url("#origId")
      const urlRegex = new RegExp(`url\\((['"]?)#${origId}\\1\\)`, "g");
      result = result.replace(urlRegex, `url(#${scopedId})`);

      // Replace href="#origId" and xlink:href="#origId"
      const hrefRegex = new RegExp(`(href|xlink:href)=["']#${origId}["']`, "g");
      result = result.replace(hrefRegex, `$1="#${scopedId}"`);
    }
  }

  return result.trim();
}
