document.addEventListener('DOMContentLoaded', () => {
    // --- Functionaliteit voor het tonen van de spots ---
    const gridContainer = document.querySelector('.grid');
    const mainPhotoContainer = document.querySelector('.main-photo');
    const spotDetailsContainer = document.querySelector('.spot-details');

    let allSpots = [];

    async function fetchSpots() {
        try {
            const response = await fetch('/api/spots'); // Haal spots op van de Flask API
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const spots = await response.json();
            allSpots = spots;
            return spots;
        } catch (error) {
            console.error('Fout bij het ophalen van spots:', error);
            return []; // Retourneer een lege array bij fouten
        }
    }

    function formatDate(isoDate) {
        if (!isoDate) return 'Onbekend';
        const [year, month, day] = isoDate.split('-');
        return `${day}-${month}-${year}`;
    }

    function renderSpots(spots) {
        if (!gridContainer || !mainPhotoContainer || !spotDetailsContainer) {
            console.error("Containers for spots not found in HTML.");
            return;
        }

        gridContainer.innerHTML = ''; // Leeg de grid voordat we nieuwe spots toevoegen
        mainPhotoContainer.innerHTML = ''; // Leeg de main photo
        spotDetailsContainer.innerHTML = ''; // Leeg de spot details

        if (spots.length === 0) {
            gridContainer.innerHTML = '<p>Voeg de eerste spot toe!</p>';
            return;
        }

        // Toon de meest recente (of geselecteerde) spot in de 'main-spot-display'
        const mainSpot = spots[0]; // De backend retourneert de nieuwste spots eerst (ORDER BY id DESC)
        if (mainSpot) {
            const mainImg = document.createElement('img');
            mainImg.src = mainSpot.afbeelding_url;
            mainImg.alt = mainSpot.naam || mainSpot.merk || 'Spot';
            mainPhotoContainer.appendChild(mainImg);

            const detailsHtml = `
                <h3>${mainSpot.naam || mainSpot.merk || 'Onbekende Auto'}</h3>
                <p><strong>Merk:</strong> ${mainSpot.merk || 'Onbekend'}</p>
                <p><strong>Locatie:</strong> ${mainSpot.locatie || 'Onbekend'}</p>
                <p><strong>Datum:</strong> ${formatDate(mainSpot.datum) || 'Onbekend'}</p>
                <p><strong>Fotograaf:</strong> ${mainSpot.fotograaf || 'Onbekend'}</p>
            `;
            spotDetailsContainer.innerHTML = detailsHtml;
        }

        // Toon de rest van de spots in de grid (vanaf de tweede spot)
        spots.slice(1).forEach((spot, idx) => {
            const spotElement = document.createElement('div');
            spotElement.classList.add('spot-item');
            spotElement.innerHTML = `
                <img src="${spot.afbeelding_url}" alt="${spot.naam || spot.merk}">
                <div class="spot-info">
                    <h4>${spot.naam || spot.merk || 'Onbekende Auto'}</h4>
                    <p>${spot.locatie || 'Onbekend'} - ${formatDate(spot.datum) || 'Onbekend'}</p>
                </div>
            `;
            // Voeg click event toe om deze spot als hoofdspot te tonen
            spotElement.addEventListener('click', () => {
                // Zet deze spot vooraan in de lijst en render opnieuw
                const newOrder = [spot, ...spots.filter((s, i) => i !== idx + 1)];
                renderSpots(newOrder);
            });
            gridContainer.appendChild(spotElement);
        });
    }

    // Laad en render de spots wanneer de pagina geladen is
    fetchSpots().then(spots => {
        renderSpots(spots);
    });

});