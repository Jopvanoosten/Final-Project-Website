document.addEventListener('DOMContentLoaded', () => {
  const wrapper = document.querySelector('.feature-items-wrapper');
  const slides = document.querySelectorAll('.feature-item');
  const prevBtn = document.querySelector('.feature-slider .prev');
  const nextBtn = document.querySelector('.feature-slider .next');

  let currentIndex = 0;
  const totalSlides = slides.length;

  function updateSlider() {
    const slideWidth = slides[0].clientWidth;
    const visibleSlides = Math.ceil(wrapper.parentElement.offsetWidth / slideWidth) || 1; // <-- aangepast
    const maxIndex = Math.max(0, totalSlides - visibleSlides);
    if (currentIndex < 0) currentIndex = 0;
    if (currentIndex > maxIndex) currentIndex = maxIndex;
    wrapper.style.transform = `translateX(-${currentIndex * slideWidth}px)`;
    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex === maxIndex;
  }

  prevBtn.addEventListener('click', () => {
    currentIndex--;
    updateSlider();
  });

  nextBtn.addEventListener('click', () => {
    currentIndex++;
    updateSlider();
  });

  window.addEventListener('resize', () => {
    updateSlider();
  });

  updateSlider();
});
