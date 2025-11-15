import type { PuppeteerPage } from './puppeteer-config';

export async function getTopModalText(
  page: PuppeteerPage,
): Promise<string | null> {
  return await page.evaluate(() => {
    // Рекурсивно отримуємо текст елемента та shadow DOM
    function extractText(el: HTMLElement): string {
      let text = '';

      // Shadow DOM
      const shadowRoot = (el as HTMLElement & { shadowRoot?: ShadowRoot })
        .shadowRoot;
      if (shadowRoot) {
        text += getShadowText(shadowRoot);
      }

      // Текст самого елемента
      text += el.innerText ? el.innerText + '\n' : '';

      // Діти
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

    // Збираємо всі елементи
    const allElements = Array.from(
      document.body.querySelectorAll<HTMLElement>('*'),
    );

    // Фільтруємо видимі
    const visibleElements = allElements.filter(el => {
      const style = window.getComputedStyle(el);
      return (
        el.offsetWidth > 0 &&
        el.offsetHeight > 0 &&
        style.display !== 'none' &&
        style.visibility !== 'hidden'
      );
    });

    // Сортуємо по z-index (найвище зверху)
    visibleElements.sort((a, b) => {
      const zA = parseInt(window.getComputedStyle(a).zIndex || '0', 10);
      const zB = parseInt(window.getComputedStyle(b).zIndex || '0', 10);
      return zB - zA;
    });

    const topElement = visibleElements[0] ?? null;
    return topElement ? extractText(topElement).trim() : null;
  });
}
