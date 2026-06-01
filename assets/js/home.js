// ── Scroll Reveal with IntersectionObserver ──
const revealElements = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                revealObserver.unobserve(entry.target);
            }
        });
    },
    {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px',
    }
);

revealElements.forEach((el) => revealObserver.observe(el));

// ── Active nav highlighting ──
const sections = document.querySelectorAll('section[id], div[id]');
const navLinks = document.querySelectorAll('nav a');

function onScroll() {
    let current = '';
    sections.forEach((s) => {
        if (window.scrollY >= s.offsetTop - 120) current = s.id;
    });
    navLinks.forEach((a) => {
        a.classList.toggle('active', a.getAttribute('href') === '#' + current);
    });
}

window.addEventListener('scroll', onScroll, { passive: true });

// ── Newsletter signup ──
function handleSignup(btn) {
    const input = btn.previousElementSibling;
    const email = input.value.trim();
    if (!email || !email.includes('@')) {
        input.style.outline = '2px solid #e55';
        input.focus();
        setTimeout(() => {
            input.style.outline = '';
        }, 2000);
        return;
    }
    btn.textContent = "You're in ✓";
    btn.style.background = '#2d7d46';
    btn.disabled = true;
    input.disabled = true;
    input.style.opacity = '0.6';
}

// ── Smooth page load ──
document.body.style.opacity = '0';
document.body.style.transition = 'opacity 0.5s ease';
window.addEventListener('load', () => {
    document.body.style.opacity = '1';
});

// ── Video placeholder interaction ──
const videoPlaceholder = document.getElementById('video-placeholder');
if (videoPlaceholder) {
    videoPlaceholder.addEventListener('click', () => {
        // Replace with YouTube embed when a real video ID is available
        // For now, show a message
        const inner = videoPlaceholder.querySelector('.video-placeholder-inner');
        if (inner) {
            inner.innerHTML = `
                <div style="color: rgba(255,255,255,0.5); font-size: 0.9rem; text-align: center; padding: 20px;">
                    <p style="font-size: 1.1rem; margin-bottom: 8px; color: rgba(255,255,255,0.7);">🎬 Coming Soon</p>
                    <p>Add your YouTube video ID to embed it here</p>
                </div>
            `;
        }
    });

    videoPlaceholder.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            videoPlaceholder.click();
        }
    });
}
