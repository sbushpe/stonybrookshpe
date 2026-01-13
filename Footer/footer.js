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
    
    // Get the base path from the current document's location
    // This works for both file:// and http:// protocols
    const getBasePath = () => {
      const location = window.location;
      if (location.protocol === 'file:') {
        // For file:// protocol, get the directory path
        const path = location.pathname;
        const lastSlash = path.lastIndexOf('/');
        return location.origin + path.substring(0, lastSlash + 1);
      } else {
        // For http:// and https://, use origin + pathname directory
        const path = location.pathname;
        const lastSlash = path.lastIndexOf('/');
        return location.origin + path.substring(0, lastSlash + 1);
      }
    };
    
    const basePath = getBasePath();
    
    images.forEach(img => {
      const originalSrc = img.getAttribute('src');
      if (originalSrc) {
        // Remove leading slash if present (we want relative to basePath)
        const cleanPath = originalSrc.startsWith('/') ? originalSrc.slice(1) : originalSrc;
        // Construct the full URL
        img.src = basePath + cleanPath;
      }
    });
  }
}

customElements.define('shpe-footer', ShpeFooter);
