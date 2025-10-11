
const root = document.documentElement;
const themeToggle = document.querySelector('#themeToggle');
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'light') root.classList.add('light');
updateThemeButton();

themeToggle?.addEventListener('click', () => {
    root.classList.toggle('light');
    const mode = root.classList.contains('light') ? 'light' : 'dark';
    localStorage.setItem('theme', mode);
    updateThemeButton();
});

function updateThemeButton() {
    const light = root.classList.contains('light');
    themeToggle?.setAttribute('aria-pressed', String(light));
    themeToggle && (themeToggle.textContent = light ? 'Light' : ' Dark');
}

for (const btn of document.querySelectorAll('[data-toggle]')) {
    btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-toggle');
        const target = document.getElementById(id);
        const isHidden = target.hasAttribute('hidden');
        if (isHidden) target.removeAttribute('hidden'); else target.setAttribute('hidden', '');
        btn.setAttribute('aria-expanded', String(isHidden));
        btn.textContent = isHidden ? 'Hide details' : 'Show details';
    });
}

const backToTop = document.getElementById('backToTop');
window.addEventListener('scroll', () => {
    const show = window.scrollY > 400;
    if (show) backToTop?.removeAttribute('hidden');
    else backToTop?.setAttribute('hidden', '');
});

const yearEl = document.getElementById('year');
yearEl && (yearEl.textContent = new Date().getFullYear());

const form = document.getElementById('contactForm');
const status = document.getElementById('formStatus');
form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const name = data.get('name');
    status.textContent = `Thanks, ${name}! Your message has been sent.`;
    form.reset();
});
