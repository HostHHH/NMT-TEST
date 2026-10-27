const observerOptions = {
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
        }
    });
}, observerOptions);

document.querySelectorAll('.reveal').forEach(el => {
    observer.observe(el);
});

const guestBtn = document.getElementById('guest-btn');
if (guestBtn) {
    guestBtn.addEventListener('click', () => {
        sessionStorage.setItem('istoriya_guest', 'true');
        window.location.href = '../about/about.html';
    });
}
