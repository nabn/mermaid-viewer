import { render } from 'pele';
import './style.css';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const source = $<HTMLTextAreaElement>('source');
const workspace = $('workspace');
const diagram = $('diagram');
const errorBox = $('error');
const exportButton = $<HTMLButtonElement>('export');
const toggle = $('toggle');
let editing = true;
let autoPreview = true;
let lastSVG = '';
let timer: ReturnType<typeof setTimeout>;

function saved(key: string) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function save(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* Theme persistence is optional. */ }
}

const examples: Record<string, string> = {
  flowchart: `flowchart LR
  A([An idea]) --> B[Make a little space]
  B --> C{See the big picture}
  C -->|Refine| B
  C -->|Ready| D([Bring it to life])`,
  sequence: `sequenceDiagram
  participant You
  participant Meridian
  You->>Meridian: Paste a Mermaid diagram
  Meridian-->>You: A clearer picture
  You->>Meridian: Make a small change
  Meridian-->>You: Updated, instantly`,
  mindmap: `mindmap
  root((A good idea))
    Explore
      Ask questions
      Connect the dots
    Create
      Start small
      Keep it simple
    Share
      Tell a story
      Make it clear`,
};

function setEditing(value: boolean) {
  editing = value;
  $('editor').hidden = !value;
  workspace.classList.toggle('editing', value);
  toggle.setAttribute('aria-expanded', String(value));
  $('toggle-label').textContent = value ? 'View diagram' : 'Edit source';
  if (value) source.focus();
  else diagram.focus();
}

function updateLineNumbers() {
  const count = source.value.split('\n').length;
  $('line-count').textContent = `${count} ${count === 1 ? 'line' : 'lines'}`;
  $('line-numbers').textContent = Array.from({ length: count }, (_, i) => i + 1).join('\n');
}

function normalize(value: string) {
  return value.trim().replace(/^```(?:mermaid)?\s*\n([\s\S]*?)\n```$/i, '$1').trim();
}

function update(allowFlip = false) {
  const text = normalize(source.value);
  updateLineNumbers();
  errorBox.hidden = true;
  $('preview-error').hidden = true;
  if (!text) {
    diagram.replaceChildren();
    diagram.hidden = true;
    $('empty-state').hidden = false;
    workspace.classList.add('empty');
    exportButton.disabled = true;
    lastSVG = '';
    $('status').textContent = 'Ready when you are';
    return;
  }
  try {
    const result = render(text, {
      fontFamily: 'system-ui, sans-serif', fontSize: 15, padding: 32,
      autoDirection: false, images: false, links: false,
    });
    diagram.innerHTML = result.svg;
    diagram.hidden = false;
    $('empty-state').hidden = true;
    workspace.classList.remove('empty');
    lastSVG = result.svg;
    exportButton.disabled = false;
    $('status').textContent = 'Preview updated';
    if (allowFlip && autoPreview) {
      autoPreview = false;
      setEditing(false);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    errorBox.textContent = message;
    errorBox.hidden = false;
    $('status').textContent = lastSVG ? '● Syntax needs attention · showing last valid diagram' : '● Syntax needs attention';
    if (!editing) {
      $('preview-error').textContent = 'This source needs a small fix. Open Edit source to see the details.';
      $('preview-error').hidden = false;
    }
  }
}

source.addEventListener('input', () => {
  updateLineNumbers();
  clearTimeout(timer);
  timer = setTimeout(() => update(true), 600);
});
source.addEventListener('scroll', () => { $('line-numbers').scrollTop = source.scrollTop; });
source.addEventListener('keydown', (event) => {
  if (event.key === 'Tab') {
    event.preventDefault();
    source.setRangeText('  ', source.selectionStart, source.selectionEnd, 'end');
    source.dispatchEvent(new Event('input'));
  }
});
toggle.addEventListener('click', () => {
  clearTimeout(timer);
  autoPreview = false;
  update();
  setEditing(!editing);
});
document.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
    event.preventDefault();
    toggle.click();
  }
});
$('new').addEventListener('click', () => {
  if (source.value.trim() && !window.confirm('Start a new diagram? This replaces your current local draft.')) return;
  clearTimeout(timer);
  source.value = '';
  autoPreview = true;
  setEditing(true);
  update();
});
for (const button of document.querySelectorAll<HTMLButtonElement>('[data-example]')) {
  button.addEventListener('click', () => {
    clearTimeout(timer);
    source.value = examples[button.dataset.example!];
    autoPreview = true;
    update(true);
  });
}

function setTheme(theme: string) {
  document.documentElement.dataset.theme = theme;
  $('theme').innerHTML = theme === 'dark' ? '☾ <span>Dark</span>' : '☀ <span>Light</span>';
  $('theme').setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`);
  save('meridian-theme', theme);
}
$('theme').addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));
const initialTheme = saved('meridian-theme');
setTheme(initialTheme === 'dark' ? 'dark' : 'light');

exportButton.addEventListener('click', () => {
  if (!lastSVG) return;
  const svg = new DOMParser().parseFromString(lastSVG, 'image/svg+xml').documentElement;
  const styles = getComputedStyle(diagram);
  const properties = ['bg', 'fg', 'muted', 'line', 'surface', 'surface-alt', 'border', 'accent', 'critical', 'error', ...Array.from({ length: 8 }, (_, i) => `series-${i + 1}`)];
  svg.setAttribute('style', properties.map(name => `--pele-${name}:${styles.getPropertyValue(`--pele-${name}`)}`).join(';') + `;background:${styles.getPropertyValue('--pele-bg')}`);
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'diagram.svg';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

try { localStorage.removeItem('meridian-source'); } catch { /* Clear legacy drafts when storage is available. */ }
source.value = '';
update();
