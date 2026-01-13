class eboard extends HTMLElement {
	async connectedCallback() {
	const shadow = this.attachShadow({ mode: 'open' });
	const resp = await fetch('eboard/eboard.html');
	const text = await resp.text();


	const wrapper = document.createElement('template');
    wrapper.innerHTML = text;

	const tpl = wrapper.content.querySelector('#eboard');
    shadow.appendChild(tpl.content.cloneNode(true));

	}
}

customElements.define('shpe-eboard', eboard);

