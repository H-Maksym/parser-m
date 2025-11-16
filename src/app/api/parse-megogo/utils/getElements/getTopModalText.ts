import { PuppeteerPage } from '../../config';

export async function getTopModalText(
  page: PuppeteerPage,
): Promise<string | null> {
  return await page.evaluate(() => {
    // recursively get the text of the element and the shadow DOM
    function extractText(el: HTMLElement): string {
      let text = '';

      // Shadow DOM
      const shadowRoot = (el as HTMLElement & { shadowRoot?: ShadowRoot })
        .shadowRoot;
      if (shadowRoot) {
        text += getShadowText(shadowRoot);
      }

      // The text of the element itself
      text += el.innerText ? el.innerText + '\n' : '';

      // Children
      const children = Array.from(el.children) as HTMLElement[];
      for (const child of children) {
        text += extractText(child);
      }

      return text;
    }

    function getShadowText(root: ShadowRoot): string {
      let text = '';
      for (const child of Array.from(root.children)) {
        if (child instanceof HTMLElement) {
          text += child.innerText + '\n';
          if (child.shadowRoot) text += getShadowText(child.shadowRoot);
        }
      }
      return text;
    }

    // collect all the elements
    const allElements = Array.from(
      document.body.querySelectorAll<HTMLElement>('*'),
    );

    // filter the visible ones
    const visibleElements = allElements.filter(el => {
      const style = window.getComputedStyle(el);
      return (
        el.offsetWidth > 0 &&
        el.offsetHeight > 0 &&
        style.display !== 'none' &&
        style.visibility !== 'hidden'
      );
    });

    // Sort by z-index (highest on top)
    visibleElements.sort((a, b) => {
      const zA = parseInt(window.getComputedStyle(a).zIndex || '0', 10);
      const zB = parseInt(window.getComputedStyle(b).zIndex || '0', 10);
      return zB - zA;
    });

    const topElement = visibleElements[0] ?? null;
    return topElement ? extractText(topElement).trim() : null;
  });
}
