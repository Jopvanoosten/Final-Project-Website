document.addEventListener('DOMContentLoaded', () => {
    const spotForm = document.getElementById('spot-form'); // Selecteer het uploadformulier

    // --- Upload formulier functionaliteit ---
    if (spotForm) {
        spotForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            // Creëer een FormData object van het formulier
            const formData = new FormData(spotForm); // Haalt automatisch alle named inputs op

            try {
                const res = await fetch('/api/spots', {
                    method: 'POST',
                    body: formData // GEEN Content-Type header toevoegen; de browser doet dit voor FormData
                });

                if (res.ok) {
                    alert('Spot succesvol geüpload!');
                    spotForm.reset(); 
                    // Optioneel: navigeer naar de spots pagina na succesvolle upload
                    // window.location.href = '/spots'; // of de directe URL naar de spots pagina
                } else {
                    const errorData = await res.json(); 
                    alert(`Fout bij uploaden: ${errorData.message || res.statusText}`);
                    console.error('Server response error:', errorData);
                }
            } catch (err) {
                console.error('Upload mislukt (netwerk of server niet bereikbaar):', err);
                alert('Upload mislukt: Kan geen verbinding maken met de server.');
            }
        });
    }
});