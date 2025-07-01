// Password toggle functionality
function togglePassword(fieldId) {
  const passwordField = document.getElementById(fieldId)
  const eyeIcon = document.getElementById("eye-" + fieldId)

  if (passwordField.type === "password") {
    passwordField.type = "text"
    eyeIcon.classList.remove("fa-eye")
    eyeIcon.classList.add("fa-eye-slash")
  } else {
    passwordField.type = "password"
    eyeIcon.classList.remove("fa-eye-slash")
    eyeIcon.classList.add("fa-eye")
  }
}

// Form validation and enhancement
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("signupForm")
  const submitBtn = document.getElementById("registerBtn")
  const inputs = form.querySelectorAll(".form-input")

  // Add input event listeners for real-time validation
  inputs.forEach((input) => {
    input.addEventListener("input", function () {
      validateField(this)
    })

    input.addEventListener("blur", function () {
      validateField(this)
    })

    input.addEventListener("focus", function () {
      clearFieldErrors(this)
    })
  })

  // Form submission handling
  form.addEventListener("submit", (e) => {
    // Add loading state
    submitBtn.classList.add("loading")

    // Validate all fields
    let isValid = true
    inputs.forEach((input) => {
      if (!validateField(input)) {
        isValid = false
      }
    })

    if (!isValid) {
      e.preventDefault()
      submitBtn.classList.remove("loading")
      return false
    }

    // If validation passes, form will submit normally
    // Loading state will be removed when page reloads or redirects
  })

  function validateField(input) {
    const value = input.value.trim()
    const fieldName = input.getAttribute("data-field")

    // Clear previous validation states
    input.classList.remove("valid", "error")

    // Basic validation
    if (input.hasAttribute("required") && !value) {
      input.classList.add("error")
      return false
    }

    // Email validation
    if (input.type === "email" && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value)) {
        input.classList.add("error")
        return false
      }
    }

    // Password validation
    if (fieldName === "password1" && value) {
      if (value.length < 8) {
        input.classList.add("error")
        return false
      }
    }

    // Confirm password validation
    if (fieldName === "password2" && value) {
      const password1 = document.getElementById("id_password1").value
      if (value !== password1) {
        input.classList.add("error")
        return false
      }
    }

    // If we get here, field is valid
    if (value) {
      input.classList.add("valid")
    }

    return true
  }

  function clearFieldErrors(input) {
    input.classList.remove("error")
    const errorContainer = document.getElementById("errors-" + input.id)
    if (errorContainer) {
      const dynamicErrors = errorContainer.querySelectorAll(".dynamic-error")
      dynamicErrors.forEach((error) => error.remove())
    }
  }

  // Add smooth scroll to first error on form submission
  function scrollToFirstError() {
    const firstError = form.querySelector(".form-input.error")
    if (firstError) {
      firstError.scrollIntoView({
        behavior: "smooth",
        block: "center",
      })
      firstError.focus()
    }
  }

  // Enhanced form interaction
  inputs.forEach((input) => {
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault()
        const inputs = Array.from(form.querySelectorAll(".form-input"))
        const currentIndex = inputs.indexOf(this)
        const nextInput = inputs[currentIndex + 1]

        if (nextInput) {
          nextInput.focus()
        } else {
          form.submit()
        }
      }
    })
  })
})

// Add some visual enhancements
document.addEventListener("DOMContentLoaded", () => {
  // Add ripple effect to button
  const button = document.getElementById("registerBtn")

  button.addEventListener("click", function (e) {
    const ripple = document.createElement("span")
    const rect = this.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    const x = e.clientX - rect.left - size / 2
    const y = e.clientY - rect.top - size / 2

    ripple.style.width = ripple.style.height = size + "px"
    ripple.style.left = x + "px"
    ripple.style.top = y + "px"
    ripple.classList.add("ripple")

    this.appendChild(ripple)

    setTimeout(() => {
      ripple.remove()
    }, 600)
  })
})

// Add CSS for ripple effect
const style = document.createElement("style")
style.textContent = `
  .register-btn {
    position: relative;
    overflow: hidden;
  }
  
  .ripple {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    transform: scale(0);
    animation: ripple-animation 0.6s linear;
    pointer-events: none;
  }
  
  @keyframes ripple-animation {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }
`
document.head.appendChild(style)
