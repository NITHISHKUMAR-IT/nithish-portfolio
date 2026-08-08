(async () => {
"use strict";


/* =========================================================
   SUPABASE PASSWORDLESS EMAIL OTP AUTH
========================================================= */

const SUPABASE_URL = "https://bfnjiclzxhjigqgfevfi.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Kaxq3gq1irM6PI_28gLcaw_8xPHSOqv";
const AUTHORIZED_EMAIL = "nithishdev29@gmail.com";

const sb = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);

const authGate = document.getElementById("authGate");
const adminShell = document.getElementById("adminShell");
const authMessage = document.getElementById("authMessage");
const sendOtpForm = document.getElementById("sendOtpForm");
const verifyOtpForm = document.getElementById("verifyOtpForm");
const otpEmail = document.getElementById("otpEmail");
const otpCode = document.getElementById("otpCode");
const sendOtpBtn = document.getElementById("sendOtpBtn");
const verifyOtpBtn = document.getElementById("verifyOtpBtn");
const resendOtpBtn = document.getElementById("resendOtpBtn");


function authStatus(message, type = "") {

  if (!authMessage) return;

  authMessage.textContent = message;

  authMessage.className =
    "auth-message" +
    (type ? " " + type : "");

}


function showAdmin() {

  if (authGate) {

    authGate.hidden = true;

    authGate.setAttribute(
      "aria-hidden",
      "true"
    );

    authGate.style.setProperty(
      "display",
      "none",
      "important"
    );

  }


  if (adminShell) {

    adminShell.hidden = false;

    adminShell.removeAttribute(
      "aria-hidden"
    );

    adminShell.style.setProperty(
      "display",
      "grid",
      "important"
    );

  }


  document.body.classList.add(
    "admin-authenticated"
  );


  window.scrollTo(
    0,
    0
  );

}


function showLogin() {

  if (adminShell) {

    adminShell.hidden = true;

    adminShell.setAttribute(
      "aria-hidden",
      "true"
    );

    adminShell.style.setProperty(
      "display",
      "none",
      "important"
    );

  }


  if (authGate) {

    authGate.hidden = false;

    authGate.removeAttribute(
      "aria-hidden"
    );

    authGate.style.setProperty(
      "display",
      "grid",
      "important"
    );

  }


  document.body.classList.remove(
    "admin-authenticated"
  );


  window.scrollTo(
    0,
    0
  );

}


/* =========================================================
   CHECK AUTHORIZED ADMIN
========================================================= */

async function isAuthorizedAdmin() {

  const {
    data: { user },
    error: userError
  } = await sb.auth.getUser();


  if (
    userError ||
    !user
  ) {

    return false;

  }


  const userEmail =
    (user.email || "")
      .trim()
      .toLowerCase();


  if (
    userEmail !==
    AUTHORIZED_EMAIL
  ) {

    return false;

  }


  const {
    data: allowed,
    error: rpcError
  } = await sb.rpc(
    "is_portfolio_admin"
  );


  if (rpcError) {

    console.error(
      "Admin authorization check failed:",
      rpcError
    );

    return false;

  }


  return allowed === true;

}


/* =========================================================
   EXISTING SESSION CHECK
========================================================= */

async function checkSession() {

  showLogin();


  authStatus(
    "Checking secure session…"
  );


  const {
    data: { session }
  } = await sb.auth.getSession();


  if (!session) {

    authStatus(
      "Enter the authorised email OTP to continue."
    );

    return;

  }


  const allowed =
    await isAuthorizedAdmin();


  if (allowed) {

    authStatus(
      "Session verified.",
      "ok"
    );


    showAdmin();


    return;

  }


  await sb.auth
    .signOut({
      scope: "local"
    })
    .catch(() => {});


  showLogin();


  authStatus(
    "Session is not authorised. Please sign in again.",
    "error"
  );

}


/* =========================================================
   SEND OTP
========================================================= */

async function sendOtp() {

  const email =
    (otpEmail?.value || "")
      .trim()
      .toLowerCase();


  if (
    email !==
    AUTHORIZED_EMAIL
  ) {

    authStatus(
      "This email is not authorised.",
      "error"
    );

    return;

  }


  sendOtpBtn.disabled =
    true;


  if (resendOtpBtn) {

    resendOtpBtn.disabled =
      true;

  }


  authStatus(
    "Sending a fresh one-time code…"
  );


  const {
    error
  } = await sb.auth.signInWithOtp({

    email,

    options: {

      shouldCreateUser: false

    }

  });


  sendOtpBtn.disabled =
    false;


  if (resendOtpBtn) {

    resendOtpBtn.disabled =
      false;

  }


  if (error) {

    console.error(
      "OTP send failed:",
      error
    );


    authStatus(
      error.message,
      "error"
    );


    return;

  }


  verifyOtpForm.classList.add(
    "show"
  );


  otpCode.value = "";


  otpCode.focus();


  authStatus(
    "OTP sent. Use only the newest code from your email.",
    "ok"
  );

}


/* =========================================================
   SEND OTP FORM
========================================================= */

sendOtpForm?.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();

    await sendOtp();

  }
);


/* =========================================================
   RESEND OTP
========================================================= */

resendOtpBtn?.addEventListener(
  "click",
  async () => {

    await sendOtp();

  }
);


/* =========================================================
   OTP INPUT
========================================================= */

otpCode?.addEventListener(
  "input",
  () => {

    otpCode.value =
      otpCode.value
        .replace(/\D/g, "")
        .slice(0, 8);

  }
);


/* =========================================================
   VERIFY OTP
========================================================= */

verifyOtpForm?.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();

    const token =
      (otpCode?.value || "")
        .trim();

    if (!/^\d{8}$/.test(token)) {
      authStatus(
        "Enter the latest 8-digit OTP from your email.",
        "error"
      );
      return;
    }

    verifyOtpBtn.disabled = true;

    authStatus(
      "Verifying OTP..."
    );

    const {
      data: verifyData,
      error: verifyError
    } = await sb.auth.verifyOtp({
      email: AUTHORIZED_EMAIL,
      token: token,
      type: "email"
    });

    if (verifyError) {
      verifyOtpBtn.disabled = false;

      console.error(
        "OTP verification failed:",
        verifyError
      );

      authStatus(
        verifyError.message,
        "error"
      );

      return;
    }

    if (!verifyData?.session) {
      verifyOtpBtn.disabled = false;

      authStatus(
        "OTP verified but no session was created.",
        "error"
      );

      return;
    }

    const allowed =
      await isAuthorizedAdmin();

    if (!allowed) {
      await sb.auth
        .signOut({ scope: "local" })
        .catch(() => {});

      verifyOtpBtn.disabled = false;

      showLogin();

      authStatus(
        "This account is not authorised.",
        "error"
      );

      return;
    }

    authStatus(
      "Verified. Opening admin...",
      "ok"
    );

    showAdmin();

    verifyOtpBtn.disabled = false;
  }
);

/* =========================================================
   EXISTING ADMIN DASHBOARD LOGIC
========================================================= */

const KEY = "nithish_admin_v1";

const defaults = {

  profile: {
    name: "NITHISHKUMAR K",
    role: "Aspiring Cloud & DevOps Engineer",
    hero:
      "Final-year B.Tech IT student building practical AWS infrastructure, Linux deployments, container workflows and repeatable cloud automation.",
    about:
      "I focus on hands-on cloud engineering: architecture, deployment, networking, security, automation, monitoring and troubleshooting."
  },

  resume: {
    label: "Download Resume",
    url: "assets/resume/NITHISHKUMAR-K-Resume.pdf",
    enabled: true
  },

  social: {
    linkedin:
      "https://www.linkedin.com/in/nithishkumar-k-072726388",

    github:
      "https://github.com/NITHISHKUMAR-IT",

    whatsapp:
      "+91 63831 43107",

    gmail:
      "nithishdev29@gmail.com"
  },

  settings: {
    title:
      "NITHISHKUMAR K — Cloud & DevOps Portfolio",

    description:
      "Personal Cloud & DevOps portfolio for NITHISHKUMAR K."
  },

  projects: [

    {
      title:
        "Highly Available 3-Tier AWS",

      status:
        "Architecture In Progress",

      summary:
        "Production-inspired multi-AZ AWS architecture with ALB, private application tier, Auto Scaling and private RDS.",

      github:
        "https://github.com/NITHISHKUMAR-IT/aws-3tier-web-application",

      demo: ""
    },

    {
      title:
        "EC2 + Nginx Hosting",

      status:
        "Completed + Verified",

      summary:
        "Amazon EC2 + Linux + Nginx deployment with Security Groups and restricted administration.",

      github:
        "https://github.com/NITHISHKUMAR-IT/aws-ec2-nginx-hosting",

      demo:
        "https://nithishkumar-it.github.io/aws-ec2-nginx-hosting/"
    },

    {
      title:
        "Dockerized Nginx Web App",

      status:
        "Completed",

      summary:
        "Dockerized Nginx web application with reproducible container runtime.",

      github:
        "https://github.com/NITHISHKUMAR-IT/dockerized-nginx-web-app",

      demo:
        "https://nithishkumar-it.github.io/dockerized-nginx-web-app/"
    },

    {
      title:
        "CloudFormation IaC",

      status:
        "Completed + Verified",

      summary:
        "Reusable CloudFormation YAML for automated AWS infrastructure provisioning.",

      github:
        "https://github.com/NITHISHKUMAR-IT/aws-cloudformation-iac",

      demo:
        "https://nithishkumar-it.github.io/aws-cloudformation-iac/"
    },

    {
      title:
        "S3 Static Website Hosting",

      status:
        "Completed",

      summary:
        "Amazon S3 static website hosting with endpoint and bucket policy.",

      github:
        "https://github.com/NITHISHKUMAR-IT/aws-s3-static-website-hosting",

      demo: ""
    },

    {
      title:
        "Secure RAG FastAPI Backend",

      status:
        "Backend Project",

      summary:
        "FastAPI RAG backend using embeddings and FAISS semantic retrieval.",

      github:
        "https://github.com/NITHISHKUMAR-IT/secure-rag-fastapi-backend",

      demo: ""
    },

    {
      title:
        "ActionShield AI",

      status:
        "Research / Major Project",

      summary:
        "Intent-aware runtime validation for autonomous cloud agent actions against prompt injection.",

      github: "",

      demo: ""
    }

  ],

  credentials: structuredClone(window.NK_DEFAULT_CREDENTIALS || [])

};


/* =========================================================
   LOAD LOCAL ADMIN DATA
========================================================= */

let data;

try {

  data = {
    ...structuredClone(defaults),
    ...JSON.parse(
      localStorage.getItem(KEY) || "{}"
    )
  };

}
catch (error) {

  data =
    structuredClone(defaults);

}


/* Merge older saved credential data with the new credential schema. */
if (!Array.isArray(data.credentials)) {
  data.credentials = structuredClone(window.NK_DEFAULT_CREDENTIALS || []);
} else {
  data.credentials = data.credentials.map((item) => ({
    issuer: item?.issuer || "CREDENTIAL",
    name: item?.name || "Untitled Credential",
    category: item?.category || "",
    certificate: item?.certificate || item?.url || "",
    badge: item?.badge || "",
    verify: item?.verify || "",
    featured: item?.featured === true
  }));
}



let dirty = false;


/* =========================================================
   NAVIGATION
========================================================= */

const titleMap = {

  dashboard:
    "Dashboard",

  profile:
    "Profile",

  projects:
    "Projects",

  credentials:
    "Cred Library",

  resume:
    "Resume",

  social:
    "Social Links",

  settings:
    "Site Settings"

};


document
  .querySelectorAll("nav button")
  .forEach((button) => {

    button.onclick = () => {

      document
        .querySelectorAll(
          "nav button"
        )
        .forEach((item) => {

          item.classList.remove(
            "active"
          );

        });


      button.classList.add(
        "active"
      );


      document
        .querySelectorAll(
          ".page"
        )
        .forEach((page) => {

          page.classList.toggle(
            "active",
            page.dataset.panel ===
              button.dataset.page
          );

        });


      const pageTitle =
        document.getElementById(
          "pageTitle"
        );


      if (pageTitle) {

        pageTitle.textContent =
          titleMap[
            button.dataset.page
          ];

      }

    };

  });


/* =========================================================
   DATA HELPERS
========================================================= */

function get(path) {

  return path
    .split(".")
    .reduce(
      (object, key) =>
        object?.[key],
      data
    );

}


function set(path, value) {

  const keys =
    path.split(".");

  let object = data;


  keys
    .slice(0, -1)
    .forEach((key) => {

      object =
        object[key] ??=
          {};

    });


  object[
    keys.at(-1)
  ] = value;


  dirty = true;


  const saveStatus =
    document.getElementById(
      "saveStatus"
    );


  if (saveStatus) {

    saveStatus.textContent =
      "UNSAVED CHANGES";

    saveStatus.style.color =
      "#ff9a72";

  }

}


/* =========================================================
   PROFILE / SETTINGS INPUTS
========================================================= */

document
  .querySelectorAll(
    "[data-path]"
  )
  .forEach((element) => {

    element.value =
      get(
        element.dataset.path
      ) || "";


    element.oninput =
      () => {

        set(
          element.dataset.path,
          element.value
        );

      };

  });


/* =========================================================
   HTML ESCAPE
========================================================= */

const esc = (value) =>
  String(value ?? "")
    .replace(
      /[&<>"']/g,
      (character) => ({

        "&":
          "&amp;",

        "<":
          "&lt;",

        ">":
          "&gt;",

        '"':
          "&quot;",

        "'":
          "&#39;"

      })[character]
    );


/* =========================================================
   RENDER PROJECTS
========================================================= */

function renderProjects() {

  const box =
    document.getElementById(
      "projects"
    );


  if (!box) return;


  box.innerHTML = "";


  data.projects.forEach(
    (project, index) => {

      const element =
        document.createElement(
          "div"
        );


      element.className =
        "editor";


      element.innerHTML = `

        <div class="editor-head">

          <div>

            <div class="kicker">
              PROJECT ${String(
                index + 1
              ).padStart(2, "0")}
            </div>

            <h3>
              ${esc(project.title)}
            </h3>

          </div>

          <button
            class="remove"
            data-rp="${index}"
          >
            REMOVE
          </button>

        </div>


        <div class="editorgrid">

          <label class="field">

            <span>
              Title
            </span>

            <input
              data-p="${index}"
              data-k="title"
              value="${esc(
                project.title
              )}"
            >

          </label>


          <label class="field">

            <span>
              Status
            </span>

            <input
              data-p="${index}"
              data-k="status"
              value="${esc(
                project.status
              )}"
            >

          </label>


          <label class="field wide">

            <span>
              Summary / Description
            </span>

            <textarea
              data-p="${index}"
              data-k="summary"
            >${esc(
              project.summary || ""
            )}</textarea>

          </label>


          <label class="field">

            <span>
              GitHub URL
            </span>

            <input
              data-p="${index}"
              data-k="github"
              value="${esc(
                project.github
              )}"
            >

          </label>


          <label class="field">

            <span>
              Live Demo URL
            </span>

            <input
              data-p="${index}"
              data-k="demo"
              value="${esc(
                project.demo
              )}"
            >

          </label>

        </div>

      `;


      box.appendChild(
        element
      );

    }
  );


  box
    .querySelectorAll(
      "[data-p]"
    )
    .forEach((element) => {

      element.oninput =
        () => {

          const projectIndex =
            Number(
              element.dataset.p
            );


          const key =
            element.dataset.k;


          data.projects[
            projectIndex
          ][key] =
            element.value;


          set(
            "projects",
            data.projects
          );


          if (
            key ===
            "title"
          ) {

            const heading =
              element
                .closest(
                  ".editor"
                )
                ?.querySelector(
                  "h3"
                );


            if (heading) {

              heading.textContent =
                element.value;

            }

          }

        };

    });


  box
    .querySelectorAll(
      "[data-rp]"
    )
    .forEach((button) => {

      button.onclick =
        () => {

          const index =
            Number(
              button.dataset.rp
            );


          if (
            !confirm(
              "Remove this project?"
            )
          ) {

            return;

          }


          data.projects.splice(
            index,
            1
          );


          set(
            "projects",
            data.projects
          );


          renderProjects();

          counts();

        };

    });

}


/* =========================================================
   RENDER CREDENTIALS
========================================================= */

function renderCreds() {

  const box = document.getElementById("credentials");
  if (!box) return;

  box.innerHTML = "";

  data.credentials.forEach((credential, index) => {

    const element = document.createElement("div");
    element.className = "editor";

    element.innerHTML = `
      <div class="editor-head">
        <div>
          <div class="kicker">
            ${esc(credential.issuer || "CREDENTIAL")} /
            ${String(index + 1).padStart(2, "0")}
          </div>
          <h3>${esc(credential.name || "Untitled Credential")}</h3>
        </div>

        <button class="remove" data-rc="${index}">
          REMOVE
        </button>
      </div>

      <div class="editorgrid">
        <label class="field">
          <span>Issuer</span>
          <input data-c="${index}" data-k="issuer" value="${esc(credential.issuer || "")}">
        </label>

        <label class="field">
          <span>Category / Tag</span>
          <input data-c="${index}" data-k="category" value="${esc(credential.category || "")}">
        </label>

        <label class="field wide">
          <span>Credential Name</span>
          <input data-c="${index}" data-k="name" value="${esc(credential.name || "")}">
        </label>

        <label class="field wide">
          <span>Certificate PDF / Image Path</span>
          <input data-c="${index}" data-k="certificate" value="${esc(credential.certificate || "")}"
                 placeholder="assets/credentials/example.pdf">
        </label>

        <label class="field wide">
          <span>Badge Image Path</span>
          <input data-c="${index}" data-k="badge" value="${esc(credential.badge || "")}"
                 placeholder="assets/credentials/badge.png">
        </label>

        <label class="field wide">
          <span>Verification URL</span>
          <input data-c="${index}" data-k="verify" value="${esc(credential.verify || "")}"
                 placeholder="https://www.credly.com/...">
        </label>

        <label class="check-field wide">
          <input type="checkbox" data-c="${index}" data-k="featured"
                 ${credential.featured ? "checked" : ""}>
          Show in the 4-card homepage Cred Library preview
        </label>
      </div>
    `;

    box.appendChild(element);
  });

  box.querySelectorAll("[data-c]").forEach((element) => {
    const eventName = element.type === "checkbox" ? "change" : "input";

    element.addEventListener(eventName, () => {
      const index = Number(element.dataset.c);
      const key = element.dataset.k;

      data.credentials[index][key] =
        element.type === "checkbox" ? element.checked : element.value;

      set("credentials", data.credentials);

      if (key === "name") {
        const heading = element.closest(".editor")?.querySelector("h3");
        if (heading) heading.textContent = element.value;
      }
    });
  });

  box.querySelectorAll("[data-rc]").forEach((button) => {
    button.onclick = () => {
      const index = Number(button.dataset.rc);

      if (!confirm("Remove this credential from the library?")) return;

      data.credentials.splice(index, 1);
      set("credentials", data.credentials);
      renderCreds();
      counts();
    };
  });
}


/* =========================================================
   DASHBOARD COUNTS
========================================================= */

function counts() {

  const projectCount =
    document.getElementById(
      "projectCount"
    );

  const credentialCount =
    document.getElementById(
      "credentialCount"
    );


  if (projectCount) {

    projectCount.textContent =
      data.projects.length;

  }


  if (credentialCount) {

    credentialCount.textContent =
      data.credentials.length;

  }

}


/* =========================================================
   ADD PROJECT
========================================================= */

const addProjectBtn =
  document.getElementById(
    "addProject"
  );


if (addProjectBtn) {

  addProjectBtn.onclick =
    () => {

      data.projects.push({

        title:
          "New Project",

        status:
          "In Progress",

        summary:
          "",

        github:
          "",

        demo:
          ""

      });


      set(
        "projects",
        data.projects
      );


      renderProjects();

      counts();

    };

}


/* =========================================================
   ADD CREDENTIAL
========================================================= */

const addCredentialBtn =
  document.getElementById("addCredential");

if (addCredentialBtn) {
  addCredentialBtn.onclick = () => {

    data.credentials.push({
      issuer: "AWS",
      name: "New Credential",
      category: "LEARNING",
      certificate: "",
      badge: "",
      verify: "",
      featured: false
    });

    set("credentials", data.credentials);
    renderCreds();
    counts();
  };
}


/* =========================================================
   SAVE
========================================================= */

const saveBtn =
  document.getElementById(
    "save"
  );


if (saveBtn) {

  saveBtn.onclick =
    () => {

      try {

        localStorage.setItem(
          KEY,
          JSON.stringify(data)
        );


        dirty =
          false;


        const saveStatus =
          document.getElementById(
            "saveStatus"
          );


        if (saveStatus) {

          saveStatus.textContent =
            "ALL CHANGES SAVED";

          saveStatus.style.color =
            "#86909a";

        }


        const toast =
          document.getElementById(
            "toast"
          );


        if (toast) {

          toast.textContent =
            "Saved successfully";

          toast.classList.add(
            "show"
          );


          setTimeout(
            () => {

              toast.classList.remove(
                "show"
              );

            },
            1800
          );

        }

      }

      catch (error) {

        console.error(
          "Save failed:",
          error
        );


        alert(
          "Unable to save portfolio data."
        );

      }

    };

}


/* =========================================================
   RESET LOCAL DATA
========================================================= */

const resetBtn =
  document.getElementById(
    "reset"
  );


if (resetBtn) {

  resetBtn.onclick =
    () => {

      const confirmed =
        confirm(
          "Reset all local admin data to defaults?"
        );


      if (!confirmed) {

        return;

      }


      localStorage.removeItem(
        KEY
      );


      data =
        structuredClone(
          defaults
        );


      dirty =
        false;


      document
        .querySelectorAll(
          "[data-path]"
        )
        .forEach(
          (element) => {

            element.value =
              get(
                element.dataset.path
              ) || "";

          }
        );


      renderProjects();

      renderCreds();

      counts();


      const saveStatus =
        document.getElementById(
          "saveStatus"
        );


      if (saveStatus) {

        saveStatus.textContent =
          "RESET COMPLETE";

        saveStatus.style.color =
          "#86909a";

      }


      const toast =
        document.getElementById(
          "toast"
        );


      if (toast) {

        toast.textContent =
          "Local data reset";

        toast.classList.add(
          "show"
        );


        setTimeout(
          () => {

            toast.classList.remove(
              "show"
            );

          },
          1800
        );

      }

    };

}


/* =========================================================
   PREVIEW / OPEN PORTFOLIO
========================================================= */

document
  .querySelectorAll(
    '[href="index.html"]'
  )
  .forEach(
    (link) => {

      link.addEventListener(
        "click",
        () => {

          if (dirty) {

            const proceed =
              confirm(
                "You have unsaved changes. Open portfolio anyway?"
              );


            if (!proceed) {

              event.preventDefault();

            }

          }

        }
      );

    }
  );


/* =========================================================
   SIGN OUT
========================================================= */

const signOutBtn =
  document.getElementById(
    "signOutBtn"
  );


if (signOutBtn) {

  signOutBtn.onclick =
    async () => {

      if (dirty) {

        const confirmed =
          confirm(
            "You have unsaved changes. Sign out anyway?"
          );


        if (!confirmed) {

          return;

        }

      }


      try {

        await sb.auth.signOut({
          scope: "local"
        });


        dirty =
          false;


        showLogin();


        authStatus(
          "Signed out securely.",
          "ok"
        );

      }

      catch (error) {

        console.error(
          "Sign out failed:",
          error
        );


        authStatus(
          "Unable to sign out. Please refresh and try again.",
          "error"
        );

      }

    };

}


/* =========================================================
   BEFORE PAGE CLOSE
========================================================= */

window.onbeforeunload =
  (event) => {

    if (!dirty) {

      return;

    }


    event.preventDefault();


    event.returnValue =
      "";

};


/* =========================================================
   INITIAL DASHBOARD RENDER
========================================================= */

renderProjects();

renderCreds();

counts();


/* =========================================================
   CHECK AUTH SESSION
========================================================= */

await checkSession();


/* =========================================================
   END
========================================================= */

})();