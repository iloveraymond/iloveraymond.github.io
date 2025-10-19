const navToggle = document.querySelector(".floating-nav__toggle");
const navLinks = document.querySelector(".floating-nav__links");
const scrollTopButton = document.querySelector(".scroll-top");
const sectionAnchors = document.querySelectorAll(".floating-nav__links a[href^='#']");

// Toggle navigation visibility on small screens
if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });
}

// Highlight active section link based on scroll position
const sections = [...sectionAnchors].map((anchor) => {
  const id = anchor.getAttribute("href")?.replace("#", "");
  return id ? document.getElementById(id) : null;
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      const targetIndex = sections.indexOf(entry.target);
      if (targetIndex === -1) {
        return;
      }

      const relatedLink = sectionAnchors[targetIndex];
      if (entry.isIntersecting) {
        sectionAnchors.forEach((link) => link.classList.remove("is-active"));
        relatedLink.classList.add("is-active");
      }
    });
  },
  {
    rootMargin: "-40% 0px -55% 0px",
    threshold: 0.2,
  }
);

sections.forEach((section) => {
  if (section) {
    observer.observe(section);
  }
});

// Scroll-to-top button
if (scrollTopButton) {
  scrollTopButton.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

// Close the navigation after selecting a link on mobile
sectionAnchors.forEach((anchor) => {
  anchor.addEventListener("click", () => {
    if (navLinks?.classList.contains("is-open")) {
      navLinks.classList.remove("is-open");
      navToggle?.setAttribute("aria-expanded", "false");
    }
  });
});
