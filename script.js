(function () {
      const schoolDetails = {
        bokakhat: {
          title: "Bokakhat Jatiya Bidyalay: Our Flagship Institution",
          paragraphs: [
            "Established in 2005, Bokakhat Jatiya Bidyalay represents the culmination of PACB's early educational outreach efforts and serves as the cornerstone for all our subsequent initiatives. Located near the Agaratoli range of Kaziranga National Park, the school provides comprehensive education from pre-primary through Class XII, with post-matriculation students offered choices among Science, Humanities, and Commerce streams. The institution currently serves 580 students, with a dedicated teaching faculty of 32 educators committed to academic excellence and holistic development.",
            "Bokakhat Jatiya Bidyalay is equipped with modern educational amenities, including a fully functional science laboratory and computer lab, ensuring students receive quality technical education alongside traditional academics. The saha-pathyokrom (co-curricular program) offers students diverse creative options including Satriya classical dance, music, visual arts, and violin, enabling seamless integration of artistic expression with conventional academic learning. The school also provides residential facilities for students who require accommodation.",
            "Our approach emphasizes comprehensive mentorship that nurtures both intellectual growth and cultural awareness. This methodology has yielded remarkable results, with BJV students consistently excelling in prestigious competitions, including the National Children's Science Congress and other state and national-level contests. Academic performance remains consistently strong, with students achieving excellent results in their matriculation and higher secondary examinations. Many graduates have gained admission to renowned institutions such as the National Law University and Judicial Academy Assam (NLUJA), English and Foreign Languages University (EFLU), Indian Institute of Science Education and Research (IISER), Cotton University, and Guwahati Medical College, among others.",
            "Bokakhat Jatiya Bidyalay continues to embody PACB's vision of providing quality education that empowers students from marginalized communities to achieve their full potential while maintaining strong connections to their roots."
          ],
          principal: {
            initials: "IA",
            image: "IMAGES/staf/INJU AHMED.jpeg",
            name: "Inju Ahmed",
            designation: "Principal",
            email: "injuahmedbjb@gmail.com"
          }
        },
        mohuramukh: {
          title: "Mohuramukh Jatiya Bidyalay",
          paragraphs: [
            "Established in 2015, Mohuramukh Jatiya Bidyalay was founded to address the educational requirements of the Mohuramukh region. The school provides education from pre-primary through Class X, currently accommodating 400 students with a teaching staff of 20 dedicated educators."
          ],
          principal: {
            initials: "IB",
            image: "IMAGES/staf/INDESHWAR BARUA.jpeg",
            name: "Indeshwar Baruah",
            designation: "Director",
            extraName: "Gyanabi Saikia",
            extraDesignation: "Headmistress",
            extraImage: "IMAGES/staf/GYANABI SAIKIA.jpeg",
            email: "Email to be added"
          }
        },
        brahmaputra: {
          title: "Brahmaputra Jatiya Bidyalay",
          paragraphs: [
            "Brahmaputra Jatiya Bidyalay is located along the banks of the Dhansiri River in Rongagora and delivers comprehensive education to the local community.",
            "The school supports children from pre-primary to Class X and continues PACB's work among riverine and rural communities."
          ],
          principal: {
            initials: "BS",
            image: "IMAGES/staf/BINOD SARMA.jpeg",
            name: "Binod Sarma",
            designation: "Headmaster",
            email: "binodjaan83@gmail.com"
          }
        }
      };

      const modal = document.getElementById("schoolDetailModal");
      const title = document.getElementById("schoolDetailTitle");
      const text = document.getElementById("schoolDetailText");
      const principal = document.getElementById("schoolPrincipalCard");
      const closeButton = document.getElementById("schoolDetailClose");

      function escapeHTML(value) {
        const div = document.createElement("div");
        div.textContent = String(value || "");
        return div.innerHTML;
      }

      function renderPrincipal(details) {
        const email = details.email.includes("@")
          ? `<a href="mailto:${escapeHTML(details.email)}">${escapeHTML(details.email)}</a>`
          : `<a>${escapeHTML(details.email)}</a>`;
        const primaryImage = details.image
          ? `<img src="${escapeHTML(details.image)}" alt="${escapeHTML(details.name)}" loading="lazy">`
          : `<div class="principal-placeholder">${escapeHTML(details.initials)}</div>`;
        const extraImage = details.extraImage
          ? `<img src="${escapeHTML(details.extraImage)}" alt="${escapeHTML(details.extraName)}" loading="lazy">`
          : "";
        const extraPerson = details.extraName
          ? `<div class="principal-extra">${extraImage}<h3>${escapeHTML(details.extraName)}</h3><strong>${escapeHTML(details.extraDesignation || "")}</strong></div>`
          : "";

        return `
          ${primaryImage}
          <h3>${escapeHTML(details.name)}</h3>
          <strong>${escapeHTML(details.designation)}</strong>
          ${extraPerson}
          ${email}
        `;
      }

      function openSchoolDetails(key) {
        const details = schoolDetails[key];
        if (!details) return;

        title.textContent = details.title;
        text.innerHTML = details.paragraphs.map((paragraph) => `<p>${escapeHTML(paragraph)}</p>`).join("");
        principal.innerHTML = renderPrincipal(details.principal);
        modal.classList.add("is-open");
        closeButton.focus();
      }

      function closeSchoolDetails() {
        modal.classList.remove("is-open");
      }

      document.querySelectorAll(".school-show-more").forEach((button) => {
        button.addEventListener("click", () => openSchoolDetails(button.dataset.school));
      });

      closeButton.addEventListener("click", closeSchoolDetails);
      modal.addEventListener("click", (event) => {
        if (event.target === modal) closeSchoolDetails();
      });
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && modal.classList.contains("is-open")) {
          closeSchoolDetails();
        }
      });
    })();

(function () {
      const showcase = document.querySelector("[data-prayas-showcase]");
      if (!showcase) return;

      const slides = Array.from(showcase.querySelectorAll(".prayas-slide-media"));
      const dots = Array.from(showcase.querySelectorAll(".prayas-showcase-dots button"));
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let activeIndex = 0;
      let timerId = null;

      if (slides.length < 2) return;

      function setActiveSlide(index) {
        activeIndex = (index + slides.length) % slides.length;
        slides.forEach((slide, slideIndex) => {
          const isActive = slideIndex === activeIndex;
          slide.classList.toggle("is-active", isActive);
          slide.setAttribute("aria-hidden", String(!isActive));
        });
        dots.forEach((dot, dotIndex) => {
          const isActive = dotIndex === activeIndex;
          dot.classList.toggle("is-active", isActive);
          dot.setAttribute("aria-current", isActive ? "true" : "false");
        });
      }

      function stopRotation() {
        if (timerId) window.clearInterval(timerId);
        timerId = null;
      }

      function startRotation() {
        if (reduceMotion || timerId) return;
        timerId = window.setInterval(() => setActiveSlide(activeIndex + 1), 3500);
      }

      dots.forEach((dot, index) => {
        dot.addEventListener("click", () => {
          setActiveSlide(index);
          stopRotation();
          startRotation();
        });
      });

      showcase.addEventListener("mouseenter", stopRotation);
      showcase.addEventListener("mouseleave", startRotation);
      showcase.addEventListener("focusin", stopRotation);
      showcase.addEventListener("focusout", startRotation);

      setActiveSlide(0);
      startRotation();
    })();
