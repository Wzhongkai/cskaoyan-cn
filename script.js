const state = {
  sites: [],
  health: new Map(),
};

const elements = {
  grid: document.querySelector("#site-grid"),
  template: document.querySelector("#site-card-template"),
  status: document.querySelector("#status-panel"),
  visibleCount: document.querySelector("#visible-count"),
  contact: document.querySelector("#contact-button"),
  contactDialog: document.querySelector("#contact-dialog"),
  dialogClose: document.querySelector("#dialog-close"),
  copyEmail: document.querySelector("#copy-email"),
  backToTop: document.querySelector("#back-to-top"),
  year: document.querySelector("#year"),
};

const cardThemes = [
  { color: "#6750a4", aura: "#eaddff" },
  { color: "#7d5260", aura: "#ffd8e4" },
  { color: "#386a20", aura: "#b7f397" },
  { color: "#00639b", aura: "#cce5ff" },
  { color: "#785900", aura: "#ffdf9e" },
  { color: "#8c4a60", aura: "#ffd9e2" },
];

function normalizeMarkdownLink(line) {
  const nestedLink = line.match(/^\[\[([^\]]+)\]\((https?:\/\/[^)]+)\)\]\((https?:\/\/[^)]+)\)\s*$/);
  if (nestedLink) {
    return { label: nestedLink[1].trim(), url: nestedLink[3].trim() };
  }

  const standardLink = line.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)\s*$/);
  if (standardLink) {
    return { label: standardLink[1].trim(), url: standardLink[2].trim() };
  }

  const plainUrl = line.match(/^(https?:\/\/\S+)\s*$/);
  if (plainUrl) {
    return { label: "访问站点", url: plainUrl[1].trim() };
  }

  return null;
}

function inlineText(value) {
  return value
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^[-*+]\s+/, "")
    .trim();
}

function parseSites(markdown) {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const sites = [];
  let current = null;

  function commitCurrent() {
    if (!current) return;

    const description = current.description
      .map(inlineText)
      .filter(Boolean);

    if (current.url) {
      sites.push({
        ...current,
        description: description.length ? description : ["暂无介绍。"],
      });
    }
  }

  lines.forEach((rawLine) => {
    const line = rawLine.trim();
    const heading = line.match(/^##(?!#)\s+(?:\*\*)?(.+?)(?:\*\*)?\s*$/);

    if (heading) {
      commitCurrent();
      current = {
        shortName: heading[1].replace(/^\*\*|\*\*$/g, "").trim(),
        name: "",
        url: "",
        description: [],
        order: sites.length,
      };
      return;
    }

    if (!current || !line) return;

    if (!current.url) {
      const link = normalizeMarkdownLink(line);
      if (link) {
        current.name = link.label === "访问站点" ? current.shortName : link.label;
        current.url = link.url;
        return;
      }
    }

    const image = line.match(/^!\[([^\]]*)\]\((\S+)\)\s*$/);
    if (image) {
      current.imageAlt = image[1].trim();
      current.image = image[2].trim();
      return;
    }

    current.description.push(line);
  });

  commitCurrent();
  return sites;
}

function getVisibleSites() {
  return [...state.sites].sort((a, b) => a.order - b.order);
}

function renderStructuredData(sites) {
  document.querySelector("#site-list-schema")?.remove();

  const schema = document.createElement("script");
  schema.id = "site-list-schema";
  schema.type = "application/ld+json";
  schema.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": "https://cskaoyan.cn/#site-list",
    name: "国科大计算机考研院所专题站",
    description: "国科大及中国科学院相关院所的计算机考研报考信息站点列表。",
    numberOfItems: sites.length,
    itemListElement: sites.map((site, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "WebSite",
        name: site.name,
        alternateName: site.shortName,
        url: site.url,
        description: site.description.join(" "),
        inLanguage: "zh-CN",
      },
    })),
  });
  document.head.append(schema);
}

function applyHealthState(siteId, status) {
  document.querySelectorAll(`[data-site-id="${siteId}"] .site-health`).forEach((badge) => {
    badge.classList.remove("is-checking", "is-online", "is-offline");
    badge.classList.add(`is-${status}`);

    const label = badge.querySelector(".health-label");
    if (status === "online") {
      label.textContent = "可访问";
      badge.title = "网站连接正常";
    } else if (status === "offline") {
      label.textContent = "检测异常";
      badge.title = "暂时无法建立连接，目标网站仍可能正常运行";
    } else {
      label.textContent = "检测中";
      badge.title = "正在检测网站连通性";
    }
  });
}

async function checkSiteHealth(site) {
  if (state.health.has(site.order)) {
    applyHealthState(site.order, state.health.get(site.order));
    return;
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 8000);
  const healthUrl = new URL("/favicon.ico", site.url);
  healthUrl.searchParams.set("health-check", Date.now().toString());

  try {
    await fetch(healthUrl, {
      mode: "no-cors",
      cache: "no-store",
      signal: controller.signal,
    });
    state.health.set(site.order, "online");
  } catch {
    state.health.set(site.order, "offline");
  } finally {
    window.clearTimeout(timeout);
    applyHealthState(site.order, state.health.get(site.order));
  }
}

function renderSites() {
  const sites = getVisibleSites();
  const fragment = document.createDocumentFragment();

  elements.grid.replaceChildren();
  elements.visibleCount.textContent = String(sites.length);

  sites.forEach((site, index) => {
    const node = elements.template.content.cloneNode(true);
    const card = node.querySelector(".site-card");
    const theme = cardThemes[(site.order + index) % cardThemes.length];

    card.dataset.siteId = String(site.order);
    card.style.setProperty("--card-color", theme.color);
    card.style.setProperty("--card-aura", theme.aura);

    if (site.image) {
      card.classList.add("site-card--cover");
      card.style.setProperty("--card-cover", `url("${site.image}")`);
    }
    if (site.imageAlt === "标题封面") {
      card.classList.add("site-card--title-only");
    }
    node.querySelector(".site-monogram").textContent = site.shortName;

    const title = node.querySelector("h3");
    if (site.imageAlt === "标题封面" && site.name.endsWith("报考指南")) {
      const academy = document.createElement("span");
      const institution = document.createElement("span");
      const guide = document.createElement("span");
      const institutionName = site.name.slice(0, -4);
      const academyPrefix = "中国科学院";
      academy.className = "title-academy";
      institution.className = "title-institution";
      guide.className = "title-guide";
      academy.textContent = institutionName.startsWith(academyPrefix) ? academyPrefix : "";
      institution.textContent = institutionName.startsWith(academyPrefix)
        ? institutionName.slice(academyPrefix.length)
        : institutionName;
      guide.textContent = "报考指南";
      title.replaceChildren(academy, institution, guide);
    } else {
      title.textContent = site.name;
    }

    const knownHealth = state.health.get(site.order);
    if (knownHealth) {
      const badge = node.querySelector(".site-health");
      badge.classList.remove("is-checking");
      badge.classList.add(`is-${knownHealth}`);
      badge.querySelector(".health-label").textContent = knownHealth === "online" ? "可访问" : "检测异常";
    }

    const description = node.querySelector(".site-description");
    site.description.forEach((paragraph) => {
      const p = document.createElement("p");
      p.textContent = paragraph;
      description.append(p);
    });

    const link = node.querySelector(".site-link");
    link.href = site.url;
    link.setAttribute("aria-label", `访问 ${site.name}`);
    fragment.append(node);
  });

  elements.grid.append(fragment);
  elements.grid.hidden = sites.length === 0;

  sites.forEach(checkSiteHealth);
}

async function loadSites() {
  try {
    const response = await fetch("sites.md", { cache: "no-cache" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    state.sites = parseSites(await response.text());
    if (!state.sites.length) {
      throw new Error("sites.md 中没有可显示的有效站点");
    }

    elements.status.hidden = true;
    elements.grid.hidden = false;
    renderStructuredData(state.sites);
    renderSites();
  } catch (error) {
    elements.visibleCount.textContent = "0";
    elements.status.innerHTML = `
      <div class="empty-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24"><path d="M12 8v5M12 17h.01"/><path d="M10.3 4.7 2.9 17.5A2 2 0 0 0 4.6 20h14.8a2 2 0 0 0 1.7-2.5L13.7 4.7a2 2 0 0 0-3.4 0Z"/></svg>
      </div>
      <p><strong>站点目录读取失败</strong><br><span>${error.message}</span></p>
    `;
  }
}

elements.backToTop.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

elements.contact.addEventListener("click", () => {
  elements.contactDialog.showModal();
});

elements.dialogClose.addEventListener("click", () => {
  elements.contactDialog.close();
});

elements.contactDialog.addEventListener("click", (event) => {
  if (event.target === elements.contactDialog) elements.contactDialog.close();
});

elements.copyEmail.addEventListener("click", async () => {
  const email = elements.copyEmail.dataset.email;

  try {
    await navigator.clipboard.writeText(email);
  } catch {
    const input = document.createElement("textarea");
    input.value = email;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.append(input);
    input.select();
    document.execCommand("copy");
    input.remove();
  }

  const label = elements.copyEmail.querySelector("span");
  label.textContent = "已复制";
  window.setTimeout(() => {
    label.textContent = "复制邮箱";
  }, 1800);
});

window.addEventListener(
  "scroll",
  () => elements.backToTop.classList.toggle("is-visible", window.scrollY > 520),
  { passive: true },
);

elements.year.textContent = new Date().getFullYear();
loadSites();
