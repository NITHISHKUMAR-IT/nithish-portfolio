(() => {

  /* =========================================================
     REVEAL ANIMATION
  ========================================================= */

  const revealEls = document.querySelectorAll(".reveal");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  revealEls.forEach((el) => observer.observe(el));


  /* =========================================================
     MOBILE NAVIGATION
  ========================================================= */

  const mobileMenu = document.getElementById("mobileMenu");
  const nav = document.getElementById("nav");

  if (mobileMenu && nav) {
    mobileMenu.addEventListener("click", () => {
      nav.classList.toggle("open");
      mobileMenu.textContent = nav.classList.contains("open")
        ? "CLOSE"
        : "MENU";
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        nav.classList.remove("open");
        mobileMenu.textContent = "MENU";
      });
    });
  }


  /* =========================================================
     TIMELINE PROGRESS
  ========================================================= */

  const timeline = document.querySelector(".timeline");
  const progress = document.getElementById("timelineProgress");

  const updateTimeline = () => {
    if (!timeline || !progress) return;

    const rect = timeline.getBoundingClientRect();
    const viewport = window.innerHeight;
    const start = viewport * 0.75;
    const total = rect.height + viewport * 0.25;

    const traveled = Math.max(
      0,
      Math.min(total, start - rect.top)
    );

    progress.style.height = `${(traveled / total) * 100}%`;
  };

  updateTimeline();

  window.addEventListener(
    "scroll",
    updateTimeline,
    { passive: true }
  );

  window.addEventListener(
    "resize",
    updateTimeline
  );


  /* =========================================================
     PAUSE SVG ANIMATIONS IN BACKGROUND TAB
  ========================================================= */

  document.addEventListener("visibilitychange", () => {
    document.querySelectorAll("svg").forEach((svg) => {
      try {
        if (document.hidden) {
          svg.pauseAnimations();
        } else {
          svg.unpauseAnimations();
        }
      } catch (error) {}
    });
  });


  /* =========================================================
     ADMIN -> PUBLIC WEBSITE SYNC
  ========================================================= */

  const syncAdminData = () => {
    try {
      const raw = localStorage.getItem("nithish_admin_v1");

      if (!raw) return;

      const data = JSON.parse(raw);


      /* PROFILE NAME */

      if (data?.profile?.name) {
        const fullName = String(data.profile.name).trim();
        const spaceIndex = fullName.indexOf(" ");

        const firstName =
          spaceIndex >= 0
            ? fullName.slice(0, spaceIndex)
            : fullName;

        const lastName =
          spaceIndex >= 0
            ? fullName.slice(spaceIndex + 1)
            : "";

        const firstNameEl = document.querySelector(
          '[data-public="profile.firstName"]'
        );
        const lastNameEl = document.querySelector(
          '[data-public="profile.lastName"]'
        );

        if (firstNameEl) firstNameEl.textContent = firstName;
        if (lastNameEl) lastNameEl.textContent = lastName;
      }


      /* PROFILE ROLE */

      if (data?.profile?.role) {
        const role = document.querySelector("[data-public-role]");

        if (role) {
          const upper = String(data.profile.role)
            .trim()
            .toUpperCase();

          const index = upper.lastIndexOf("ENGINEER");

          role.innerHTML =
            index >= 0
              ? `${upper.slice(0, index).trim()} <b>ENGINEER</b>`
              : upper;
        }
      }


      /* GENERIC PUBLIC DATA */

      document
        .querySelectorAll("[data-public]")
        .forEach((element) => {
          const path = element.dataset.public.split(".");

          let value = data;

          for (const key of path) {
            value = value?.[key];
          }

          if (
            typeof value === "string" &&
            value.trim()
          ) {
            element.textContent = value;
          }
        });


      /* RESUME */

      if (
        data?.resume?.url &&
        data.resume.enabled !== false
      ) {
        document
          .querySelectorAll("a[download]")
          .forEach((link) => {
            link.href = data.resume.url;
          });
      }


      /* SOCIAL LINKS */

      const social = data?.social || {};

      const linkMap = {
        linkedin: social.linkedin,
        github: social.github,
        whatsapp: social.whatsapp,
        gmail: social.gmail
      };

      Object.entries(linkMap).forEach(([key, value]) => {
        if (!value) return;

        const link = document.querySelector(
          `[data-social-link="${key}"]`
        );

        if (!link) return;

        if (key === "gmail") {
          link.href = `mailto:${value}`;
        }

        else if (key === "whatsapp") {
          const digits = String(value).replace(/\D/g, "");
          link.href = `https://wa.me/${digits}`;
        }

        else {
          link.href = value;
        }
      });


      /* PROJECTS */

      if (Array.isArray(data?.projects)) {

        document
          .querySelectorAll("[data-project-index]")
          .forEach((card) => {

            const index = Number(
              card.dataset.projectIndex
            );

            const project = data.projects[index];

            if (!project) return;


            const title = card.querySelector(
              ".project-info h3"
            );

            const status = card.querySelector(
              ".project-topline .status"
            );

            const description = card.querySelector(
              ".project-info > p"
            );


            if (title && project.title) {
              title.textContent = project.title;
            }

            if (status && project.status) {
              status.textContent = project.status;
            }

            if (description && project.summary) {
              description.textContent = project.summary;
            }


            const links = card.querySelector(
              ".project-links"
            );

            if (links) {
              links
                .querySelectorAll("a")
                .forEach((link) => {

                  const text = link.textContent.toUpperCase();

                  if (
                    text.includes("GITHUB") &&
                    project.github
                  ) {
                    link.href = project.github;
                  }

                  if (
                    text.includes("LIVE") &&
                    project.demo
                  ) {
                    link.href = project.demo;
                  }

                });
            }

          });


        /* ACTIONSHIELD */

        const shield = data.projects[6];

        if (shield) {

          const title = document.querySelector(
            "[data-actionshield-title]"
          );

          const description = document.querySelector(
            "[data-actionshield-description]"
          );


          if (title && shield.title) {
            const words = shield.title
              .trim()
              .split(/\s+/);

            const last = words.pop() || "";

            title.innerHTML =
              `${words.join(" ")} <span>${last}</span>`;
          }

          if (
            description &&
            shield.summary
          ) {
            description.textContent =
              shield.summary;
          }

        }

      }


      /* CREDENTIALS */

      if (Array.isArray(data?.credentials)) {

        document
          .querySelectorAll("[data-credential-index]")
          .forEach((card) => {

            const index = Number(
              card.dataset.credentialIndex
            );

            const credential =
              data.credentials[index];

            if (!credential) return;


            const label =
              card.querySelector("span");

            const title =
              card.querySelector("h3");


            if (
              label &&
              credential.issuer
            ) {
              label.textContent =
                `${String(index + 1).padStart(2, "0")} / ${credential.issuer}`;
            }

            if (
              title &&
              credential.name
            ) {
              title.textContent =
                credential.name;
            }

          });

      }

    }

    catch (error) {
      console.warn(
        "Admin sync skipped:",
        error
      );
    }
  };


  syncAdminData();

  window.addEventListener(
    "storage",
    syncAdminData
  );


  /* =========================================================
     MAGNETIC BUTTONS
  ========================================================= */

  const initMagneticButtons = () => {

    if (
      !window.matchMedia(
        "(hover:hover) and (pointer:fine)"
      ).matches
    ) {
      return;
    }

    document
      .querySelectorAll(
        ".button, .header-cta, .resume-nav"
      )
      .forEach((element) => {

        element.addEventListener(
          "mousemove",
          (event) => {

            const rect =
              element.getBoundingClientRect();

            const dx =
              event.clientX -
              (
                rect.left +
                rect.width / 2
              );

            const dy =
              event.clientY -
              (
                rect.top +
                rect.height / 2
              );


            element.style.transform =
              `translate(${dx * 0.10}px, ${dy * 0.10}px)`;

          }
        );


        element.addEventListener(
          "mouseleave",
          () => {

            element.style.transform =
              "";

          }
        );

      });

  };


  initMagneticButtons();


  /* =========================================================
     NK CURSOR — SIGNAL EDITION
     Compact premium cursor: small glowing dot + thin lagging
     ring, contextual labels only, no HUD/trail/particles.
  ========================================================= */




  /* =========================================================
     CREDENTIAL LIBRARY — ADMIN SYNC
  ========================================================= */

  const getCredentialData = () => {
    const defaults = Array.isArray(window.NK_DEFAULT_CREDENTIALS)
      ? window.NK_DEFAULT_CREDENTIALS
      : [];

    try {
      const raw = localStorage.getItem("nithish_admin_v1");
      if (!raw) return defaults;

      const saved = JSON.parse(raw);
      if (!Array.isArray(saved?.credentials)) return defaults;

      return saved.credentials;
    } catch (error) {
      console.warn("Credential data fallback:", error);
      return defaults;
    }
  };

  const escapeHTML = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    })[char]);

  const renderFeaturedCredentials = () => {
    const box = document.getElementById("featuredCredentials");
    if (!box) return;

    const all = getCredentialData();
    let featured = all.filter((item) => item?.featured !== false && item?.featured);
    if (featured.length < 4) {
      const extras = all.filter((item) => !featured.includes(item));
      featured = featured.concat(extras).slice(0, 4);
    } else {
      featured = featured.slice(0, 4);
    }

    box.innerHTML = featured.map((item, index) => {
      const media = item.badge
        ? `<img src="${escapeHTML(item.badge)}" alt="${escapeHTML(item.name)} badge or certificate preview">`
        : `<div class="cred-card-placeholder">${escapeHTML(item.issuer || "CRED")}</div>`;

      const target = item.verify || item.certificate || "cred-library.html";
      return `
        <article class="featured-cred reveal credential" data-credential-index="${index}">
          <div class="featured-cred-media">${media}</div>
          <div class="featured-cred-meta">
            <span>${escapeHTML(item.issuer || "CREDENTIAL")}</span>
            <span>${escapeHTML(item.category || "LEARNING")}</span>
          </div>
          <h3>${escapeHTML(item.name || "Credential")}</h3>
          <a class="featured-cred-link" href="${escapeHTML(target)}"
             ${/^https?:/.test(target) ? 'target="_blank" rel="noreferrer"' : ''}>
             ${item.verify ? "VERIFY BADGE ↗" : "VIEW PROOF ↗"}
          </a>
        </article>
      `;
    }).join("");

    box.querySelectorAll(".reveal").forEach((el) => el.classList.add("visible"));
  };

  const renderCredentialLibrary = (query = "") => {
    const box = document.getElementById("credLibraryGrid");
    if (!box) return;

    const normalizedQuery = query.trim().toLowerCase();
    const all = getCredentialData();
    const filtered = all.filter((item) => {
      const haystack = [
        item?.issuer,item?.name,item?.category
      ].join(" ").toLowerCase();
      return !normalizedQuery || haystack.includes(normalizedQuery);
    });

    const count = document.getElementById("libraryCount");
    if (count) count.textContent = String(all.length);

    box.innerHTML = filtered.map((item, index) => {
      const image = item.badge
        ? `<img src="${escapeHTML(item.badge)}" alt="${escapeHTML(item.name)} preview">`
        : `<div class="cred-card-placeholder">${escapeHTML(item.issuer || "CRED")}</div>`;

      const certificateButton = item.certificate
        ? `<button type="button" class="primary" data-open-credential="${index}" data-kind="certificate">VIEW CERTIFICATE</button>`
        : "";

      const badgeButton = item.badge
        ? `<button type="button" data-open-credential="${index}" data-kind="badge">VIEW BADGE</button>`
        : "";

      const verifyButton = item.verify
        ? `<a href="${escapeHTML(item.verify)}" target="_blank" rel="noreferrer">VERIFY ↗</a>`
        : "";

      return `
        <article class="cred-card credential">
          <div class="cred-card-media">${image}</div>
          <div class="cred-card-topline">
            <span>${String(index + 1).padStart(2,"0")} / ${escapeHTML(item.issuer || "CRED")}</span>
            <span>${escapeHTML(item.category || "LEARNING")}</span>
          </div>
          <h3>${escapeHTML(item.name || "Credential")}</h3>
          <div class="cred-card-actions">
            ${certificateButton}${badgeButton}${verifyButton}
          </div>
        </article>
      `;
    }).join("");

    box.querySelectorAll("[data-open-credential]").forEach((button) => {
      button.addEventListener("click", () => {
        const item = filtered[Number(button.dataset.openCredential)];
        openCredentialModal(item, button.dataset.kind);
      });
    });
  };

  const openCredentialModal = (item, kind) => {
    const modal = document.getElementById("credentialModal");
    if (!modal || !item) return;

    const media = document.getElementById("credentialModalMedia");
    const issuer = document.getElementById("credentialModalIssuer");
    const title = document.getElementById("credentialModalTitle");
    const actions = document.getElementById("credentialModalActions");

    issuer.textContent = `${item.issuer || "CREDENTIAL"} / ${item.category || "LEARNING"}`;
    title.textContent = item.name || "Credential";

    if (kind === "badge" && item.badge) {
      media.innerHTML = `<img src="${escapeHTML(item.badge)}" alt="${escapeHTML(item.name)} badge">`;
    } else if (item.certificate) {
      media.innerHTML = `<iframe src="${escapeHTML(item.certificate)}#toolbar=0" title="${escapeHTML(item.name)} certificate"></iframe>`;
    } else if (item.badge) {
      media.innerHTML = `<img src="${escapeHTML(item.badge)}" alt="${escapeHTML(item.name)} badge">`;
    } else {
      media.innerHTML = `<div class="cred-card-placeholder">NO PREVIEW</div>`;
    }

    actions.innerHTML = [
      item.certificate ? `<a href="${escapeHTML(item.certificate)}" target="_blank" rel="noreferrer">OPEN CERTIFICATE ↗</a>` : "",
      item.badge ? `<a href="${escapeHTML(item.badge)}" target="_blank" rel="noreferrer">OPEN BADGE ↗</a>` : "",
      item.verify ? `<a href="${escapeHTML(item.verify)}" target="_blank" rel="noreferrer">VERIFY CREDENTIAL ↗</a>` : ""
    ].join("");

    modal.hidden = false;
    document.body.style.overflow = "hidden";
  };

  document.querySelectorAll("[data-close-credential]").forEach((el) => {
    el.addEventListener("click", () => {
      const modal = document.getElementById("credentialModal");
      if (modal) modal.hidden = true;
      document.body.style.overflow = "";
    });
  });

  const credSearch = document.getElementById("credSearch");
  if (credSearch) {
    credSearch.addEventListener("input", () => renderCredentialLibrary(credSearch.value));
  }

  renderFeaturedCredentials();
  renderCredentialLibrary();

  window.addEventListener("storage", () => {
    renderFeaturedCredentials();
    renderCredentialLibrary(credSearch?.value || "");
  });


  /* =========================================================
     NEGATIVE CLOUD SIGNATURE CURSOR
  ========================================================= */

  const initCloudCursor = () => {
    if (!window.matchMedia("(hover:hover) and (pointer:fine)").matches) return;

    const cursor = document.getElementById("cloudCursor");
    const shell = document.getElementById("cloudShell");
    const label = document.getElementById("cloudLabel");
    if (!cursor || !shell || !label) return;

    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let sx = mx;
    let sy = my;

    document.addEventListener("mousemove", (event) => {
      mx = event.clientX;
      my = event.clientY;
      cursor.classList.add("visible");
    });

    const resolveCloudLabel = (element) => {
      if (element.closest(".architecture-board")) return "TRACE";
      if (element.closest(".project")) return "VIEW";
      if (element.closest(".credential,.cred-card,.featured-cred")) return "VERIFY";
      if (element.closest("[download]")) return "DOWNLOAD";
      if (element.closest('a[href^="mailto:"]')) return "CONNECT";
      if (element.closest("a,button")) return "OPEN";
      return "OPEN";
    };

    document.querySelectorAll(
      "a,button,.project,.architecture-board,.credential,.cred-card,.featured-cred"
    ).forEach((element) => {
      element.addEventListener("mouseenter", () => {
        cursor.classList.add("hover");
        label.textContent = resolveCloudLabel(element);
      });
      element.addEventListener("mouseleave", () => {
        cursor.classList.remove("hover");
        label.textContent = "OPEN";
      });
    });

    const loop = () => {
      sx += (mx - sx) * 0.22;
      sy += (my - sy) * 0.22;
      cursor.style.transform = `translate3d(${mx}px,${my}px,0)`;
      shell.style.marginLeft = `${sx - mx}px`;
      shell.style.marginTop = `${sy - my}px`;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    document.addEventListener("mousedown", () => {
      cursor.classList.add("click");
      const pulse = document.createElement("span");
      pulse.className = "cloud-pulse";
      pulse.style.left = `${mx}px`;
      pulse.style.top = `${my}px`;
      document.body.appendChild(pulse);
      pulse.addEventListener("animationend", () => pulse.remove());
    });

    document.addEventListener("mouseup", () => cursor.classList.remove("click"));
    document.addEventListener("mouseleave", () => cursor.classList.remove("visible"));
  };

  initCloudCursor();

})();