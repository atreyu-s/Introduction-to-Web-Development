// script.js — starter script
// Adds toggleMenu() to show/hide the navigation when the hamburger is clicked.

function toggleMenu() {
  const btn = document.getElementById('hamburger');
  const nav = document.getElementById('nav');
  if (!btn || !nav) return;

  const isOpen = nav.classList.toggle('open');
  // Update accessibility attributes
  btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  nav.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('script.js loaded');

  const btn = document.getElementById('hamburger');
  if (btn) btn.addEventListener('click', toggleMenu);

  // Expose to global for debugging/testing (e.g., call toggleMenu() from console)
  window.toggleMenu = toggleMenu;
  
  // Smooth scroll behavior for in-page nav links.
  // Intercept clicks on nav anchors and use scrollIntoView for consistent behavior
  const navAnchors = document.querySelectorAll('nav#nav a[href^="#"]');
  navAnchors.forEach(a => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (!href || href === '#') return; // ignore
      const id = href.slice(1);
      const target = document.getElementById(id);
      if (target) {
        e.preventDefault();
        // Use smooth scroll; CSS provides native fallback but this ensures behavior programmatically
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // If the nav is open (mobile), close it after navigation
        const nav = document.getElementById('nav');
        if (nav && nav.classList.contains('open')) toggleMenu();
        // Update focus for accessibility
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
        // remove the temporary tabindex after focus moves
        target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
      }
    });
  });

  // Contact form validation + real-time feedback
  const form = document.getElementById('contact-form');
  const feedback = document.getElementById('contact-feedback');
  if (form) {
    const nameInput = document.getElementById('contact-name');
    const emailInput = document.getElementById('contact-email');
    const messageInput = document.getElementById('contact-message');

    const errors = {
      name: document.getElementById('contact-name-error'),
      email: document.getElementById('contact-email-error'),
      message: document.getElementById('contact-message-error')
    };

    function isValidEmail(email){
      // Simple email validation
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function showError(input, message){
      const errEl = errors[input.name];
      if (errEl) errEl.textContent = message;
      input.classList.add('input-error');
    }

    function clearError(input){
      const errEl = errors[input.name];
      if (errEl) errEl.textContent = '';
      input.classList.remove('input-error');
    }

    function validateField(input){
      const val = (input.value || '').trim();
      if (!val) {
        showError(input, 'This field is required');
        return false;
      }
      if (input === emailInput && !isValidEmail(val)){
        showError(input, 'Please enter a valid email');
        return false;
      }
      clearError(input);
      return true;
    }

    // Real-time validation
    [nameInput, emailInput, messageInput].forEach(inp => {
      if (!inp) return;
      inp.addEventListener('input', () => validateField(inp));
      inp.addEventListener('blur', () => validateField(inp));
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let ok = true;
      [nameInput, emailInput, messageInput].forEach(inp => {
        if (inp && !validateField(inp)) ok = false;
      });

      if (!ok) {
        feedback.classList.remove('visually-hidden');
        feedback.classList.remove('success-message');
        feedback.classList.add('error-message');
        feedback.textContent = 'Please fix the errors above and try again.';
        return;
      }

      // Simulate successful submission
      feedback.classList.remove('visually-hidden', 'error-message');
      feedback.classList.add('success-message');
      feedback.textContent = 'Thanks — your message has been sent.';

      // Optionally close the mobile nav if open
      const nav = document.getElementById('nav');
      if (nav && nav.classList.contains('open')) toggleMenu();

      // Clear form fields
      form.reset();

      // Remove any error styles
      [nameInput, emailInput, messageInput].forEach(inp => { if (inp) clearError(inp); });

      // Focus feedback for screen reader users
      feedback.setAttribute('tabindex','-1');
      feedback.focus({preventScroll:true});
      feedback.addEventListener('blur', () => feedback.removeAttribute('tabindex'), { once:true });
    });
  }

  // ====================================================
  // PROJECT FILTERING
  // ====================================================
  function filterProjects(category) {
    console.log('Filtering projects by category:', category);
    const projects = document.querySelectorAll('article.project');
    let visibleCount = 0;

    projects.forEach(project => {
      const projectTags = project.getAttribute('data-category') || '';
      // Show if category is 'all' or if project has the category
      if (category === 'all' || projectTags.includes(category)) {
        project.style.display = 'block';
        project.setAttribute('aria-hidden', 'false');
        visibleCount++;
      } else {
        project.style.display = 'none';
        project.setAttribute('aria-hidden', 'true');
      }
    });

    console.log('Projects visible after filter:', visibleCount);
    return visibleCount;
  }

  // Wire up filter buttons if they exist
  const filterButtons = document.querySelectorAll('[data-filter]');
  if (filterButtons.length > 0) {
    filterButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const category = btn.getAttribute('data-filter');
        
        // Update active state
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Filter projects
        filterProjects(category);
      });
    });
    
    // Show all projects by default
    filterProjects('all');
  }

  // Expose filterProjects to global for testing
  window.filterProjects = filterProjects;

  // ====================================================
  // LIGHTBOX / MODAL FOR PROJECT IMAGES
  // ====================================================
  function createLightbox() {
    // Create modal container if it doesn't exist
    let modal = document.getElementById('lightbox-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'lightbox-modal';
      modal.className = 'lightbox-modal';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-hidden', 'true');
      modal.innerHTML = `
        <div class="lightbox-content">
          <button class="lightbox-close" aria-label="Close modal">
            <span aria-hidden="true">&times;</span>
          </button>
          <div class="lightbox-image-container">
            <img id="lightbox-image" src="" alt="Project image" class="lightbox-image">
            <p id="lightbox-caption" class="lightbox-caption"></p>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      // Close button handler
      const closeBtn = modal.querySelector('.lightbox-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', closeLightbox);
      }

      // Backdrop click to close
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeLightbox();
      });

      // Escape key to close
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') {
          closeLightbox();
        }
      });
    }
    return modal;
  }

  function openLightbox(imageSrc, caption) {
    const modal = createLightbox();
    const img = modal.querySelector('#lightbox-image');
    const captionEl = modal.querySelector('#lightbox-caption');
    
    img.src = imageSrc;
    img.alt = caption || 'Project image';
    captionEl.textContent = caption || '';
    
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    
    // Focus the close button for accessibility
    const closeBtn = modal.querySelector('.lightbox-close');
    if (closeBtn) closeBtn.focus();
    
    console.log('Lightbox opened with image:', imageSrc);
  }

  function closeLightbox() {
    const modal = document.getElementById('lightbox-modal');
    if (modal) {
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      console.log('Lightbox closed');
    }
  }

  // Wire up lightbox to project images
  const projectImages = document.querySelectorAll('.project-image[data-lightbox]');
  if (projectImages.length > 0) {
    projectImages.forEach(img => {
      img.style.cursor = 'pointer';
      img.addEventListener('click', (e) => {
        e.preventDefault();
        const src = img.getAttribute('data-lightbox') || img.style.backgroundImage;
        const caption = img.getAttribute('data-caption') || img.textContent;
        openLightbox(src, caption);
      });
      
      // Make clickable with keyboard
      img.setAttribute('role', 'button');
      img.setAttribute('tabindex', '0');
      img.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const src = img.getAttribute('data-lightbox') || img.style.backgroundImage;
          const caption = img.getAttribute('data-caption') || img.textContent;
          openLightbox(src, caption);
        }
      });
    });
  }

  // Expose lightbox functions to global for testing
  window.openLightbox = openLightbox;
  window.closeLightbox = closeLightbox;
});

