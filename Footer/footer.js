// Footer/footer.js
class ShpeFooter extends HTMLElement {
  async connectedCallback() {
    const shadow = this.attachShadow({ mode: 'open' });

    const resp = await fetch('Footer/footer-style.html', { cache: 'no-store' });
    const text = await resp.text();

    const wrapper = document.createElement('template');
    wrapper.innerHTML = text;

    const tpl = wrapper.content.querySelector('#footer-style');
    shadow.appendChild(tpl.content.cloneNode(true));

    // Resolve image paths relative to the document's location
    // This fixes issues with Shadow DOM not resolving relative paths correctly
    const images = shadow.querySelectorAll('img');
    images.forEach(img => {
      const originalSrc = img.getAttribute('src');
      if (originalSrc) {
        // Resolve the path relative to the current document's location
        const resolvedUrl = new URL(originalSrc, window.location.href).href;
        img.src = resolvedUrl;
      }
    });
  }
}

customElements.define('shpe-footer', ShpeFooter);
