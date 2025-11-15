import { Page } from 'puppeteer-core';

export async function getDeepText(
  page: Page,
  selector: string,
): Promise<string | null> {
  return await page.evaluate((sel: string) => {
    function extract(el: HTMLElement): string {
      let text = '';

      // iframe
      if (el.tagName === 'IFRAME') {
        const iframe = el as HTMLIFrameElement;
        try {
          const doc = iframe.contentDocument || iframe.contentWindow?.document;
          if (doc?.body) text += doc.body.innerText + '\n';
        } catch {}
      }

      // shadow DOM
      const shadowRoot = (el as HTMLElement & { shadowRoot?: ShadowRoot })
        .shadowRoot;
      if (shadowRoot) {
        text += getShadowText(shadowRoot);
      }

      // текст елемента
      text += el.innerText ? el.innerText + '\n' : '';

      // рекурсія по дітях
      const children = Array.from(el.children) as HTMLElement[];
      for (const child of children) text += extract(child);

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

    const root = document.querySelector(sel) as HTMLElement | null;
    return root ? extract(root).trim() : null;
  }, selector);
}
