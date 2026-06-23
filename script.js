const panel = document.querySelector(".story-panel");
const backdrop = document.querySelector(".panel-backdrop");
const storyInput = document.querySelector("#story-input");
const growButton = document.querySelector("#grow-button");
const growthResult = document.querySelector(".growth-result");
const panelIntro = [...panel.children].filter(
  (el) => !el.classList.contains("growth-result") && !el.classList.contains("panel-close"),
);

function openPanel() {
  panel.classList.add("open");
  backdrop.classList.add("open");
  panel.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  setTimeout(() => storyInput.focus(), 650);
}

function closePanel() {
  panel.classList.remove("open");
  backdrop.classList.remove("open");
  panel.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

document.querySelectorAll("[data-open-story]").forEach((button) => {
  button.addEventListener("click", openPanel);
});

document.querySelector(".panel-close").addEventListener("click", closePanel);
document.querySelector(".back-world").addEventListener("click", closePanel);
backdrop.addEventListener("click", closePanel);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closePanel();
});

document.querySelectorAll("[data-fill]").forEach((button) => {
  button.addEventListener("click", () => {
    storyInput.value = button.dataset.fill;
    storyInput.focus();
  });
});

growButton.addEventListener("click", () => {
  if (!storyInput.value.trim()) {
    storyInput.placeholder = "先留下一句话吧，花园在听。";
    storyInput.focus();
    return;
  }

  panelIntro.forEach((el) => {
    el.style.display = "none";
  });
  growthResult.classList.add("visible");

  window.dispatchEvent(new CustomEvent("garden:grow", {
    detail: { story: storyInput.value.trim(), type: "courage" },
  }));
});

const orb = document.querySelector(".cursor-orb");
window.addEventListener("pointermove", (event) => {
  orb.style.left = `${event.clientX}px`;
  orb.style.top = `${event.clientY}px`;
});

const cards = document.querySelectorAll(".life-card");
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.animate(
          [
            { opacity: 0, transform: "translateY(45px)" },
            { opacity: 1, transform: "translateY(0)" },
          ],
          {
            duration: 700,
            delay: Number(entry.target.querySelector(".card-top span").textContent) * 70,
            easing: "cubic-bezier(.2,.75,.3,1)",
            fill: "both",
          },
        );
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.2 },
);
cards.forEach((card) => observer.observe(card));

document.querySelector(".sound-button").addEventListener("click", (event) => {
  event.currentTarget.classList.toggle("muted");
  event.currentTarget.querySelectorAll("span").forEach((bar) => {
    bar.style.animationPlayState = event.currentTarget.classList.contains("muted")
      ? "paused"
      : "running";
  });
});
