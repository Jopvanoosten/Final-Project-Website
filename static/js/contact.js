document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.querySelector('.contact-form');
    // Maak of selecteer een globale floating melding
    let successMsg = document.getElementById('floating-success-message');
    if (!successMsg) {
        successMsg = document.createElement('div');
        successMsg.id = 'floating-success-message';
        successMsg.style.display = 'none';
        document.body.appendChild(successMsg);
    }
    if (contactForm) {
        contactForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const formData = new FormData(contactForm);
            const data = {};
            for (let [key, value] of formData.entries()) {
                data[key] = value;
            }
            fetch('https://formspree.io/f/xgvyvygp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            })
            .then(async response => {
                let result = {};
                try { result = await response.json(); } catch(e) {}
                if (response.ok) {
                    successMsg.textContent = 'Je bericht is succesvol verzonden!';
                    successMsg.style.display = 'block';
                    successMsg.className = 'form-success-message-floating';
                    contactForm.reset();
                    setTimeout(() => { successMsg.style.display = 'none'; }, 5000);
                } else {
                    alert('Er is een fout opgetreden: ' + (result.message || 'Onbekende fout.'));
                }
            })
            .catch(error => {
                console.error('Fout bij verzenden:', error);
                alert('Er is een fout opgetreden bij het verzenden van je bericht. Probeer het later opnieuw.');
            });
        });
    }
});