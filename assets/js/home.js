const sections = document.querySelectorAll('section[id], div[id]');
const navLinks = document.querySelectorAll('nav a');

function onScroll() {
    let current = '';
    sections.forEach(s => {
        if (window.scrollY >= s.offsetTop - 120) current = s.id;
    });
    navLinks.forEach(a => {
        a.classList.toggle('active', a.getAttribute('href') === '#' + current);
    });
}

window.addEventListener('scroll', onScroll, { passive: true });

function handleSignup(btn) {
    const input = btn.previousElementSibling;
    const email = input.value.trim();
    if (!email || !email.includes('@')) {
        input.style.borderColor = '#e55';
        input.focus();
        return;
    }
    btn.textContent = 'You\'re in ✓';
    btn.style.background = '#333';
    btn.disabled = true;
    input.disabled = true;
}

// Fade-in on load
document.body.style.opacity = '0';
document.body.style.transition = 'opacity 0.4s ease';
window.addEventListener('load', () => {
    document.body.style.opacity = '1';
});
