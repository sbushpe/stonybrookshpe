(() => {
  const form = document.getElementById("contact-form");
  if (!form || typeof emailjs === "undefined") {
    return;
  }

  const statusEl = document.getElementById("contact-form-status");
  const submitBtn = form.querySelector('button[type="submit"]');

  const SERVICE_ID = "service_7wp1sp9";
  const TEMPLATE_ID = "template_bprpocf";
  const PUBLIC_KEY = "8k1Ky9wwSWcF-yCJg";

  const isConfigured = ![SERVICE_ID, TEMPLATE_ID, PUBLIC_KEY].some((value) =>
    value.startsWith("YOUR_")
  );

  const setStatus = (message, isError) => {
    if (!statusEl) {
      return;
    }
    statusEl.textContent = message;
    statusEl.classList.toggle("is-error", Boolean(isError));
  };

  if (!isConfigured) {
    setStatus("EmailJS is not configured yet.", true);
    return;
  }

  emailjs.init(PUBLIC_KEY);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    setStatus("Sending...", false);

    if (submitBtn) {
      submitBtn.disabled = true;
    }

    const nameInput = form.querySelector('[name="name"]');
    const emailInput = form.querySelector('[name="email"]');
    const messageInput = form.querySelector('[name="message"]');
    const originalMessage = messageInput ? messageInput.value : "";
    const nameValue = nameInput ? nameInput.value.trim() : "";
    const emailValue = emailInput ? emailInput.value.trim() : "";

    if (!form.checkValidity()) {
      if (typeof form.reportValidity === "function") {
        form.reportValidity();
      }
      setStatus("Please fill out all required fields.", true);
      if (submitBtn) {
        submitBtn.disabled = false;
      }
      return;
    }

    if (emailInput && !emailInput.checkValidity()) {
      setStatus("Please enter a valid email address.", true);
      if (submitBtn) {
        submitBtn.disabled = false;
      }
      return;
    }

    if (messageInput && (nameValue || emailValue || originalMessage)) {
      const safeName = nameValue || "N/A";
      const safeEmail = emailValue || "N/A";
      messageInput.value = `Name: ${safeName} Email: ${safeEmail} Message: ${originalMessage}`;
    }

    let didError = false;
    emailjs.sendForm(SERVICE_ID, TEMPLATE_ID, form).then(
      () => {
        setStatus(
          "Thank you for reaching out! You should receive a response from sbshpe@gmail.com within 1-5 business days.",
          false
        );
        form.reset();
      },
      () => {
        setStatus("Sorry, something went wrong. Please try again.", true);
        didError = true;
      }
    ).finally(() => {
      if (messageInput && didError) {
        messageInput.value = originalMessage;
      }
      if (submitBtn) {
        submitBtn.disabled = false;
      }
    });
  });
})();
