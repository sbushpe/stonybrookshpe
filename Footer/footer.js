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
  }
}

customElements.define('shpe-footer', ShpeFooter);
