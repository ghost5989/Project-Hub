/**
 * Contact form handler using Web3Forms - Optimized for speed
 */

export function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  // Set website URL dynamically - do this immediately
  const websiteInput = document.getElementById('website-url');
  if (websiteInput) {
    websiteInput.value = window.location.origin;
  }

  const result = document.getElementById('contact-result');
  const submitBtn = document.getElementById('contact-submit');
  const messageInput = document.getElementById('contact-message');
  const charCount = document.getElementById('contact-char-count');

  // Character counter - optimized with requestAnimationFrame
  if (messageInput && charCount) {
    let updateTimeout;
    messageInput.addEventListener('input', () => {
      if (updateTimeout) {
        cancelAnimationFrame(updateTimeout);
      }
      updateTimeout = requestAnimationFrame(() => {
        const length = messageInput.value.length;
        charCount.textContent = `${length} / 5000`;
        charCount.className = 'form-hint';
        if (length > 4000) charCount.classList.add('warning');
        if (length > 4800) charCount.classList.add('danger');
      });
    });
  }

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Clear previous results immediately
    result.style.display = 'none';
    result.className = 'contact-result';
    result.textContent = '';
    
    // Clear previous errors
    clearContactErrors();
    
    // Get values
    const name = document.getElementById('contact-name').value.trim();
    const email = document.getElementById('contact-email').value.trim();
    const message = messageInput.value.trim();
    
    // Quick validation - fail fast
    let hasError = false;
    
    if (!name) {
      showContactError('name', 'Name is required');
      hasError = true;
    }
    
    if (!email) {
      showContactError('email', 'Email is required');
      hasError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showContactError('email', 'Please enter a valid email address');
      hasError = true;
    }
    
    if (!message) {
      showContactError('message', 'Message is required');
      hasError = true;
    } else if (message.length > 5000) {
      showContactError('message', 'Message is too long (maximum 5000 characters)');
      hasError = true;
    }
    
    if (hasError) return;
    
    // Show loading state immediately
    setLoading(submitBtn, true);
    result.style.display = 'block';
    result.className = 'contact-result loading';
    result.textContent = 'Sending...';
    
    // Prepare form data - optimize by using FormData directly
    const formData = new FormData(form);
    const json = JSON.stringify(Object.fromEntries(formData));
    
    // Use AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
    
    // Send to Web3Forms with optimized fetch
    fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: json,
      signal: controller.signal,
      // Add keepalive for faster connection reuse
      keepalive: true,
    })
    .then(async (response) => {
      clearTimeout(timeoutId);
      const json = await response.json();
      if (response.status == 200) {
        // Success - show message immediately
        result.className = 'contact-result success';
        result.textContent = '✅ Message sent!';
        form.reset();
        if (charCount) charCount.textContent = '0 / 5000';
        // Show toast notification
        showToast('Message sent!', 'success');
      } else {
        throw new Error(json.message || 'Something went wrong');
      }
    })
    .catch(error => {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        result.className = 'contact-result error';
        result.textContent = '⏱️ Request timed out. Please try again.';
        showToast('Request timed out. Please try again.', 'error');
      } else {
        console.error('Contact form error:', error);
        result.className = 'contact-result error';
        result.textContent = '❌ Failed to send. Please try again.';
        showToast('Failed to send message', 'error');
      }
    })
    .finally(() => {
      setLoading(submitBtn, false);
      // Auto-hide success message after 4 seconds
      if (result.classList.contains('success')) {
        setTimeout(() => {
          result.style.display = 'none';
        }, 4000);
      }
    });
  });
}

function showContactError(field, message) {
  const errorEl = document.getElementById(`contact-${field}-error`);
  const input = document.getElementById(`contact-${field}`);
  if (errorEl) {
    errorEl.textContent = message;
    // Use requestAnimationFrame for faster DOM updates
    requestAnimationFrame(() => {
      errorEl.style.display = 'block';
    });
  }
  if (input) input.setAttribute('aria-invalid', 'true');
}

function clearContactErrors() {
  ['name', 'email', 'message'].forEach((field) => {
    const errorEl = document.getElementById(`contact-${field}-error`);
    const input = document.getElementById(`contact-${field}`);
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.style.display = '';
    }
    if (input) input.removeAttribute('aria-invalid');
  });
}

function setLoading(btn, isLoading) {
  if (!btn) return;
  // Toggle class instantly
  if (isLoading) {
    btn.classList.add('loading');
    btn.disabled = true;
  } else {
    btn.classList.remove('loading');
    btn.disabled = false;
  }
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  
  // Create toast with minimal DOM operations
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.role = 'status';
  
  const span = document.createElement('span');
  span.textContent = message;
  toast.appendChild(span);
  
  container.appendChild(toast);
  
  // Use requestAnimationFrame for smooth removal
  const removeToast = () => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    requestAnimationFrame(() => {
      setTimeout(() => {
        if (toast.parentNode) toast.remove();
      }, 220);
    });
  };
  
  setTimeout(removeToast, 2500);
}
