document.addEventListener('DOMContentLoaded', () => {
    const registrationSection = document.getElementById('registration');
    const form = document.getElementById('registration-form');
    const message = document.getElementById('form-message');
    const registerButtons = document.querySelectorAll('.btn-register');

    registerButtons.forEach((button) => {
        button.addEventListener('click', () => {
            if (!registrationSection) {
                return;
            }

            registrationSection.scrollIntoView({
                behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
                block: 'start',
            });
            form?.querySelector('[name="name"]')?.focus({ preventScroll: true });
        });
    });

    if (!form) {
        return;
    }

    // shortcut: API errors have no field id; match known messages until the API provides one.
    const errorFields = new Map([
        ['Укажите имя.', 'name'],
        ['Укажите телефон.', 'phone'],
        ['Укажите корректный e-mail.', 'email'],
        ['Укажите цель прохождения курса.', 'purpose'],
    ]);
    let invalidField = null;
    let originalDescription = null;

    const clearFieldError = () => {
        if (!invalidField) {
            return;
        }

        invalidField.removeAttribute('aria-invalid');
        if (originalDescription) {
            invalidField.setAttribute('aria-describedby', originalDescription);
        } else {
            invalidField.removeAttribute('aria-describedby');
        }
        invalidField = null;
    };

    form.addEventListener('input', (event) => {
        if (event.target === invalidField) {
            clearFieldError();
            message.textContent = '';
            message.className = 'form-message';
        }
    });

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const submitButton = form.querySelector('button[type="submit"]');
        const formData = new FormData(form);
        const activeElement = document.activeElement;
        let focusTarget = message;

        clearFieldError();
        form.setAttribute('aria-busy', 'true');

        if (submitButton instanceof HTMLButtonElement) {
            submitButton.disabled = true;
        }

        if (message) {
            message.textContent = '';
            message.className = 'form-message';
        }

        try {
            const response = await fetch(form.action, {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok || !data.ok) {
                throw new Error(data.error || 'Не удалось отправить заявку.');
            }

            if (message) {
                message.textContent = 'Заявка успешно отправлена. Мы свяжемся с вами в ближайшее время.';
                message.className = 'form-message success';
            }

            form.reset();
        } catch (error) {
            if (message) {
                message.textContent = error instanceof Error ? error.message : 'Не удалось отправить заявку.';
                message.className = 'form-message error';

                const fieldName = errorFields.get(message.textContent);
                const field = fieldName ? form.elements.namedItem(fieldName) : null;
                if (field && field.value === formData.get(fieldName)) {
                    invalidField = field;
                    originalDescription = field.getAttribute('aria-describedby');
                    field.setAttribute('aria-invalid', 'true');
                    field.setAttribute('aria-describedby', [originalDescription, message.id].filter(Boolean).join(' '));
                    focusTarget = field;
                } else if (field) {
                    focusTarget = null;
                }
            }
        } finally {
            if (submitButton instanceof HTMLButtonElement) {
                submitButton.disabled = false;
            }
            form.removeAttribute('aria-busy');
            if (document.activeElement === activeElement || document.activeElement === document.body) {
                focusTarget?.focus();
            }
        }
    });
});
