function markInvalid(field) {
    field.style.borderColor = "#b94a2d";
    field.focus();
}

function handleSignup(button) {
    const form = button.closest("form");
    const email = form.querySelector('input[type="email"]');

    if (!email.value.trim() || !email.value.includes("@")) {
        markInvalid(email);
        return;
    }

    button.textContent = "You're in";
    button.disabled = true;
    form.querySelectorAll("input, textarea").forEach((field) => {
        field.disabled = true;
    });
}

document.querySelectorAll(".signup").forEach((form) => {
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        handleSignup(form.querySelector("button"));
    });
});
