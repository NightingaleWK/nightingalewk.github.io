'use strict';

const blocks = [...document.querySelectorAll('[data-bh-mermaid]')];
const mermaid = window.mermaid;

if (blocks.length && mermaid) {
  let renderSerial = 0;

  blocks.forEach(block => {
    block.dataset.bhMermaidSource = block.textContent.trim();
  });

  const render = async () => {
    const dark = document.documentElement.dataset.theme === 'dark';
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      theme: dark ? 'dark' : 'default',
      themeVariables: {
        background: dark ? '#1b201d' : '#ffffff',
        primaryColor: dark ? '#2d4032' : '#eef3e8',
        primaryTextColor: dark ? '#f1f4ef' : '#263a25',
        primaryBorderColor: dark ? '#829c86' : '#657a6a',
        lineColor: dark ? '#aab8ad' : '#59695d',
        secondaryColor: dark ? '#28332b' : '#f5f7f3',
        tertiaryColor: dark ? '#202821' : '#fafbf9'
      }
    });

    for (const block of blocks) {
      const source = block.dataset.bhMermaidSource || '';
      const id = `breezehome-mermaid-${renderSerial++}`;
      try {
        const result = await mermaid.render(id, source);
        block.innerHTML = result.svg;
        if (result.bindFunctions) result.bindFunctions(block);
        block.removeAttribute('data-bh-mermaid-error');
      } catch {
        block.textContent = source;
        block.dataset.bhMermaidError = 'true';
      }
    }
  };

  render();
  document.addEventListener('breezehome:themechange', render);
}
