// Muziek functionaliteit voor alle pagina's via base.html
// Dit script regelt mute/unmute, volume en localStorage voor de muziek

document.addEventListener('DOMContentLoaded', () => {
    const audio = document.getElementById('background-music');
    const muteToggle = document.getElementById('muteToggle');
    const volumeSlider = document.getElementById('volumeSlider');

    if (!audio) {
        console.error("Audio element (ID: background-music) not found!");
        return;
    }

    // Check of dit een volledige reload is (nieuwe sessie/tab)
    if (!sessionStorage.getItem('musicVisited')) {
        // Eerste keer deze sessie: start muziek vanaf begin
        audio.currentTime = 0;
        sessionStorage.setItem('musicVisited', 'true');
    } else {
        // Bij navigatie binnen de site: probeer tijd uit localStorage te laden
        const storedTime = localStorage.getItem('musicCurrentTime');
        if (storedTime !== null) {
            audio.currentTime = parseFloat(storedTime);
        }
    }

    function loadAudioState() {
        const storedVolume = localStorage.getItem('musicVolume');
        const musicWasPlaying = localStorage.getItem('musicWasPlaying') === 'true';
        const musicUserUnmuted = localStorage.getItem('musicUserUnmuted') === 'true';

        if (musicWasPlaying) {
            audio.play().catch(e => {
                console.warn("Audio play on load (possibly muted) failed:", e);
                if (!audio.muted) {
                    audio.muted = true;
                    if (muteToggle) muteToggle.textContent = 'Unmute Music';
                }
            });
        }

        if (storedVolume !== null) {
            audio.volume = parseFloat(storedVolume);
            if (volumeSlider) volumeSlider.value = audio.volume;
        } else {
            audio.volume = volumeSlider ? parseFloat(volumeSlider.value) : 0.1;
        }
        if (musicUserUnmuted) {
            audio.muted = false;
            if (muteToggle) muteToggle.textContent = 'Mute Music';
        } else {
            audio.muted = true;
            if (muteToggle) muteToggle.textContent = 'Unmute Music';
        }
    }

    function saveAudioState() {
        if (audio) {
            localStorage.setItem('musicCurrentTime', audio.currentTime);
            localStorage.setItem('musicVolume', audio.volume);
            localStorage.setItem('musicWasPlaying', !audio.paused);
            localStorage.setItem('musicUserUnmuted', !audio.muted && audio.volume > 0);
        }
    }

    loadAudioState();
    window.addEventListener('beforeunload', saveAudioState);

    if (muteToggle) {
        muteToggle.addEventListener('click', () => {
            if (audio.muted) {
                audio.muted = false;
                muteToggle.textContent = 'Mute Music';
                if (audio.volume === 0 && volumeSlider) {
                    audio.volume = 0.1;
                    volumeSlider.value = audio.volume;
                }
                audio.play().catch(e => console.warn("Audio play on unmute failed:", e));
            } else {
                audio.muted = true;
                muteToggle.textContent = 'Unmute Music';
            }
        });
    }

    if (volumeSlider) {
        volumeSlider.addEventListener('input', () => {
            audio.volume = parseFloat(volumeSlider.value);
            if (audio.volume === 0) {
                if (!audio.muted) {
                    audio.muted = true;
                    if (muteToggle) muteToggle.textContent = 'Unmute Music';
                }
            } else {
                if (audio.muted) {
                    audio.muted = false;
                    if (muteToggle) muteToggle.textContent = 'Mute Music';
                    audio.play().catch(e => console.warn("Audio play on volume change failed:", e));
                }
            }
        });
    }

    function updateUserInterfaceForAudio() {
        if (!audio || !muteToggle) return;
        if (audio.muted || audio.volume === 0) {
            muteToggle.textContent = 'Unmute Music';
        } else {
            muteToggle.textContent = 'Mute Music';
        }
    }
    setTimeout(updateUserInterfaceForAudio, 100);
});
