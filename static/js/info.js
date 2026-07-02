document.addEventListener('DOMContentLoaded', () => {
    // --- Slider Functionaliteit voor de persoonlijke sliders ---

    // Deze functie initialiseert EEN ENKELE slider
    function initializeSlider(sliderElement) {
        const featureItemsWrapper = sliderElement.querySelector('.feature-items-wrapper');
        const prevButton = sliderElement.querySelector('.prev');
        const nextButton = sliderElement.querySelector('.next');
        const featureItems = featureItemsWrapper.children; // Gebruik .children voor directe kinderen

        let currentIndex = 0;
        const itemsPerView = 1; // Voor persoonlijke sliders altijd 1 item per keer

        // Functie om de slider te updaten
        function updateSlider() {
            if (featureItems.length === 0) {
                prevButton.disabled = true;
                nextButton.disabled = true;
                return;
            }
            // Breedte van de zichtbare slider
            const sliderWidth = sliderElement.offsetWidth;
            // De wrapper moet alle slides naast elkaar bevatten
            featureItemsWrapper.style.width = (featureItems.length * sliderWidth) + 'px';
            featureItemsWrapper.style.display = 'flex';
            for (let i = 0; i < featureItems.length; i++) {
                featureItems[i].style.width = sliderWidth + 'px';
                featureItems[i].style.flex = '0 0 ' + sliderWidth + 'px';
            }
            // Schuif naar de juiste afbeelding
            const offset = -currentIndex * sliderWidth;
            featureItemsWrapper.style.transform = `translateX(${offset}px)`;
            prevButton.disabled = currentIndex === 0;
            nextButton.disabled = currentIndex >= featureItems.length - itemsPerView;
            if (currentIndex > featureItems.length - itemsPerView) {
                currentIndex = Math.max(0, featureItems.length - itemsPerView);
                featureItemsWrapper.style.transform = `translateX(${-currentIndex * sliderWidth}px)`;
            }
        }

        // Event Listeners voor de navigatieknoppen
        prevButton.addEventListener('click', () => {
            if (currentIndex > 0) {
                currentIndex--;
                updateSlider();
            }
        });

        nextButton.addEventListener('click', () => {
            if (currentIndex < featureItems.length - itemsPerView) {
                currentIndex++;
                updateSlider();
            }
        });

        // Update bij resize
        window.addEventListener('resize', updateSlider);
        updateSlider(); // Eerste initiatie
    }

    // Zoek alle sliders op de pagina en initialiseer ze
    const allSliders = document.querySelectorAll('.feature-slider');
    allSliders.forEach(slider => {
        initializeSlider(slider);
    });
});