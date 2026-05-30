// ========================================
// Bregantazy.art
// Основной скрипт сайта
// ========================================


// ========================================
// 1. Подсветка активного раздела меню
// ========================================

const navLinks = document.querySelectorAll(".nav-link");
const path = window.location.pathname;

let currentPage = "home";

if (path.includes("/links")) {
  currentPage = "links";
} else if (path.includes("/thanks")) {
  currentPage = "thanks";
} else if (path.includes("/almanac")) {
  currentPage = "almanac";
}

navLinks.forEach((link) => {
  if (link.dataset.page === currentPage) {
    link.classList.add("active");
  }
});


// ========================================
// 2. Корень сайта
// Нужен, чтобы картинки и JSON работали с разных страниц
// ========================================

const scriptElement = document.currentScript;
const siteRoot = scriptElement
  ? scriptElement.src.replace("script.js", "")
  : "./";


// ========================================
// 3. Альманах
// Загружает записи: персонажи, места, миры, артефакты и т.д.
// ========================================

const almanacGrid = document.querySelector("#almanacGrid");
const almanacSearch = document.querySelector("#almanacSearch");

function escapeHTML(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function createAlmanacCard(entry) {
  const tags = (entry.tags || [])
    .map((tag) => `<span class="tag">${escapeHTML(tag)}</span>`)
    .join("");

  const image = entry.image || `${siteRoot}images/almanac/placeholder.png`;
  const type = entry.type || "Запись";
  const project = entry.project || "Bregantazy";
  const role = entry.role || type;
  const status = entry.status || "Статус неизвестен";
  const short = entry.short || "Описание пока не добавлено.";
  const pageUrl = entry.pageUrl || "";

  const tagName = pageUrl ? "a" : "article";
  const linkAttributes = pageUrl
    ? `href="${escapeHTML(pageUrl)}"`
    : "";

  return `
    <${tagName}
      class="almanac-card ${pageUrl ? "almanac-card-link" : ""}"
      ${linkAttributes}
    >
      <div class="almanac-portrait">
        <img
          src="${escapeHTML(image)}"
          alt="${escapeHTML(entry.name)}"
          loading="lazy"
        />
      </div>

      <div class="card-topline">
        <span>${escapeHTML(type)}</span>
        <span>${escapeHTML(project)}</span>
      </div>

      <h3>${escapeHTML(entry.name)}</h3>

      <div class="almanac-meta">
        <span>${escapeHTML(role)}</span>
        <span>${escapeHTML(status)}</span>
      </div>

      <p>${escapeHTML(short)}</p>

      <div class="tags">
        ${tags}
      </div>
    </${tagName}>
  `;
}

// ========================================
// Полки Альманаха
// ========================================

const almanacCategoryOrder = [
  "characters",
  "places",
  "artifacts",
  "universes"
];

const almanacCategoryFallbackTitles = {
  characters: "Персонажи",
  places: "Места",
  artifacts: "Предметы",
  universes: "Вселенные"
};

function getAlmanacCategoryTitle(entry) {
  return (
    entry.categoryTitle ||
    almanacCategoryFallbackTitles[entry.category] ||
    "Прочие записи"
  );
}

function groupAlmanacEntries(entries) {
  const groups = new Map();

  entries.forEach((entry) => {
    const category = entry.category || "other";

    if (!groups.has(category)) {
      groups.set(category, {
        category,
        title: getAlmanacCategoryTitle(entry),
        entries: []
      });
    }

    groups.get(category).entries.push(entry);
  });

  return Array.from(groups.values()).sort((a, b) => {
    const indexA = almanacCategoryOrder.indexOf(a.category);
    const indexB = almanacCategoryOrder.indexOf(b.category);

    const safeIndexA = indexA === -1 ? 999 : indexA;
    const safeIndexB = indexB === -1 ? 999 : indexB;

    return safeIndexA - safeIndexB;
  });
}

function renderAlmanac(entries) {
  if (!almanacGrid) return;

  if (entries.length === 0) {
    almanacGrid.innerHTML = `
      <p class="error-message">
        Ничего не найдено. Архив молчит, но он явно что-то скрывает.
      </p>
    `;
    return;
  }

  const groups = groupAlmanacEntries(entries);

  almanacGrid.innerHTML = groups
    .map((group) => {
      const cards = group.entries.map(createAlmanacCard).join("");

      return `
        <section class="almanac-category almanac-category-${escapeHTML(group.category)}">
          <div class="category-head">
            <p class="section-kicker">Полка Альманаха</p>

            <h3>${escapeHTML(group.title)}</h3>

            <p>
              Записей на полке: ${group.entries.length}
            </p>
          </div>

          <div class="almanac-grid">
            ${cards}
          </div>
        </section>
      `;
    })
    .join("");
}
async function loadAlmanac() {
  if (!almanacGrid) return;

  try {
    const response = await fetch(`${siteRoot}data/almanac.json`);

    if (!response.ok) {
      throw new Error(`Ошибка загрузки: ${response.status}`);
    }

    const entries = await response.json();

    renderAlmanac(entries);

    if (almanacSearch) {
      almanacSearch.addEventListener("input", () => {
        const searchValue = almanacSearch.value.toLowerCase().trim();

        const filteredEntries = entries.filter((entry) => {
          const searchableText = `
            ${entry.name}
            ${entry.type}
            ${entry.project}
            ${entry.short}
            ${entry.categoryTitle || ""}
            ${entry.tags.join(" ")}
          `.toLowerCase();

          return searchableText.includes(searchValue);
        });

        renderAlmanac(filteredEntries);
      });
    }
  } catch (error) {
    almanacGrid.innerHTML = `
      <p class="error-message">
        Не удалось загрузить записи Альманаха. Проверь файл data/almanac.json.
      </p>
    `;

    console.error(error);
  }
}

loadAlmanac();


// ========================================
// 4. Живой глаз в закладке
// При открытии страницы есть шанс моргнуть.
// Потом глаз иногда моргает сам.
// ========================================

(() => {
  const eyes = document.querySelectorAll(".bookmark-eye");

  if (eyes.length === 0) return;

  const eyeFrames = [
    `${siteRoot}images/ui/bookmark-eye-1.png`, // закрытый
    `${siteRoot}images/ui/bookmark-eye-2.png`,
    `${siteRoot}images/ui/bookmark-eye-3.png`,
    `${siteRoot}images/ui/bookmark-eye-4.png`, // открытый
  ];

  const openEye = eyeFrames[3];

  function preloadFrames() {
    eyeFrames.forEach((src) => {
      const image = new Image();
      image.src = src;
    });
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function blink(eye) {
    if (eye.dataset.blinking === "true") return;

    eye.dataset.blinking = "true";

    // Закрытие
    eye.src = eyeFrames[2];
    await sleep(70);

    eye.src = eyeFrames[1];
    await sleep(70);

    eye.src = eyeFrames[0];
    await sleep(120);

    // Открытие
    eye.src = eyeFrames[1];
    await sleep(65);

    eye.src = eyeFrames[2];
    await sleep(65);

    eye.src = eyeFrames[3];
    await sleep(90);

    eye.dataset.blinking = "false";
  }

  function scheduleRandomBlink(eye) {
    const minDelay = 4500;
    const maxDelay = 12000;

    const delay =
      Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;

    setTimeout(async () => {
      await blink(eye);
      scheduleRandomBlink(eye);
    }, delay);
  }

  function tryBlinkOnPageOpen() {
    const blinkChance = 0.35;
    const shouldBlink = Math.random() < blinkChance;

    if (!shouldBlink) return;

    setTimeout(() => {
      eyes.forEach(blink);
    }, 450);
  }

  preloadFrames();

  eyes.forEach((eye) => {
    eye.src = openEye;
    scheduleRandomBlink(eye);
  });

  window.addEventListener("DOMContentLoaded", tryBlinkOnPageOpen);

  window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
      tryBlinkOnPageOpen();
    }
  });
})();


// ========================================
// 5. Карточки
// ПК: клик открывает ссылку.
// Телефон: 1 тап раскрывает, 2 тап открывает ссылку.
// ========================================

(() => {
  const cards = document.querySelectorAll(".link-card");

  if (cards.length === 0) return;

  const isMobileLike = window.matchMedia(
    "(hover: none), (pointer: coarse), (max-width: 700px)"
  ).matches;

  function getCardUrl(card) {
    const isAnchorCard = card.tagName.toLowerCase() === "a";
    return isAnchorCard ? card.href : card.dataset.url;
  }

  function getCardTarget(card) {
    const isAnchorCard = card.tagName.toLowerCase() === "a";
    return isAnchorCard ? card.target : card.dataset.target;
  }

  function openCardUrl(card) {
    const url = getCardUrl(card);
    const target = getCardTarget(card) || "_self";

    if (!url) return;

    if (target === "_blank") {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      window.location.href = url;
    }
  }

  function closeOtherCards(currentCard) {
    cards.forEach((card) => {
      if (card !== currentCard) {
        card.classList.remove("is-open");
        card.setAttribute("aria-expanded", "false");
      }
    });
  }

  cards.forEach((card) => {
    const hasUrl = Boolean(getCardUrl(card));

    card.setAttribute("tabindex", "0");
    card.setAttribute("aria-expanded", "false");

    if (hasUrl) {
      card.setAttribute("role", "link");
    }

    card.addEventListener(
      "click",
      (event) => {
        const isAnchorCard = card.tagName.toLowerCase() === "a";
        const isOpen = card.classList.contains("is-open");

        // ПК:
        // Если карточка всё ещё <a>, браузер сам откроет ссылку.
        // Если карточка <article data-url>, открываем ссылку вручную.
        if (!isMobileLike) {
          if (!isAnchorCard && hasUrl) {
            openCardUrl(card);
          }

          return;
        }

        // Телефон:
        // Первый тап всегда только раскрывает карточку.
        if (!isOpen) {
          event.preventDefault();
          event.stopPropagation();

          closeOtherCards(card);

          card.classList.add("is-open");
          card.setAttribute("aria-expanded", "true");

          return;
        }

        // Телефон:
        // Второй тап открывает ссылку, если она есть.
        event.preventDefault();
        event.stopPropagation();

        if (hasUrl) {
          openCardUrl(card);
        }
      },
      true
    );

    card.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;

      event.preventDefault();

      if (isMobileLike) {
        card.click();
      } else if (hasUrl) {
        openCardUrl(card);
      }
    });
  });

  document.addEventListener("click", (event) => {
    if (!isMobileLike) return;
    if (event.target.closest(".link-card")) return;

    cards.forEach((card) => {
      card.classList.remove("is-open");
      card.setAttribute("aria-expanded", "false");
    });
  });
})();
// ========================================
// 6. Моргание персонажей в досье
// Работает с любым img, у которого есть data-character-blink
// ========================================

(() => {
  const blinkingCharacters = document.querySelectorAll("[data-character-blink]");

  if (blinkingCharacters.length === 0) return;

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function preloadImages(frames) {
    frames.forEach((src) => {
      const image = new Image();
      image.src = src;
    });
  }

  async function blink(characterImage) {
    if (characterImage.dataset.blinking === "true") return;

    const openFrame = characterImage.dataset.blinkOpen;
    const halfFrame = characterImage.dataset.blinkHalf;
    const closedFrame = characterImage.dataset.blinkClosed;

    if (!openFrame || !halfFrame || !closedFrame) return;

    characterImage.dataset.blinking = "true";

    characterImage.src = halfFrame;
    await sleep(70);

    characterImage.src = closedFrame;
    await sleep(120);

    characterImage.src = halfFrame;
    await sleep(70);

    characterImage.src = openFrame;
    await sleep(90);

    characterImage.dataset.blinking = "false";
  }

  function scheduleBlink(characterImage) {
    const minDelay = 3500;
    const maxDelay = 9500;

    const delay =
      Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;

    setTimeout(async () => {
      await blink(characterImage);
      scheduleBlink(characterImage);
    }, delay);
  }

  blinkingCharacters.forEach((characterImage) => {
    const openFrame = characterImage.dataset.blinkOpen;
    const halfFrame = characterImage.dataset.blinkHalf;
    const closedFrame = characterImage.dataset.blinkClosed;

    preloadImages([openFrame, halfFrame, closedFrame]);

    characterImage.src = openFrame;

    const firstBlinkChance = 0.45;

    if (Math.random() < firstBlinkChance) {
      setTimeout(() => {
        blink(characterImage);
      }, 700);
    }

    scheduleBlink(characterImage);
  });
})();
// ========================================
// 7. Персонаж под страницей
// Чем ближе к концу страницы, тем выше он поднимается
// ========================================

(() => {
  const riseStages = document.querySelectorAll("[data-scroll-rise]");

  if (riseStages.length === 0) return;

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function updateRiseStages() {
    const documentElement = document.documentElement;

    const maxScroll = documentElement.scrollHeight - window.innerHeight;
    const currentScroll = window.scrollY || documentElement.scrollTop;
    const distanceToBottom = maxScroll - currentScroll;

    const riseDistance = 850;

    const progress = clamp(
      1 - distanceToBottom / riseDistance,
      0,
      1
    );

    riseStages.forEach((stage) => {
      const character = stage.querySelector(".dossier-character-art");

      if (!character) return;

      /*
        115% = полностью спрятана снизу.
        0% = стоит на нижнем краю.
      */
      const hiddenY = 115;
      const visibleY = 0;

      const currentY =
        hiddenY - (hiddenY - visibleY) * progress;

      const currentOpacity =
        progress <= 0 ? 0 : 0.15 + 0.85 * progress;

      character.style.transform = `translateY(${currentY}%)`;
      character.style.opacity = currentOpacity.toFixed(2);
    });
  }

  window.addEventListener("scroll", updateRiseStages, { passive: true });
  window.addEventListener("resize", updateRiseStages);

  updateRiseStages();
})();
// ========================================
// 8. Змеиная инерция Цербеллы от мышки
// Голова ведёт, тело и юбка уходят в противофазу
// ========================================

(() => {
  const motionTargets = document.querySelectorAll("[data-character-inertia]");

  if (motionTargets.length === 0) return;

  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  if (!canHover) return;

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  const state = {
    targetX: 0,
    targetY: 0,

    headX: 0,
    headY: 0,

    bodyX: 0,
    bodyY: 0,

    skirtX: 0,
    skirtY: 0,

    jarX: 0,
    jarY: 0,

    bowX: 0,
    bowY: 0
  };

  const settings = {
    headPowerX: 16,
    headPowerY: 7,

    bodyPowerX: -10,
    bodyPowerY: 3,

    skirtPowerX: -15,
    skirtPowerY: 4,

    jarPowerX: -7,
    jarPowerY: 3,

    bowPowerX: 20,
    bowPowerY: 8,

    headInertia: 0.12,
    bodyInertia: 0.055,
    skirtInertia: 0.04,
    jarInertia: 0.065,
    bowInertia: 0.09
  };

  function setTargetsFromPointer(event) {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    const normalizedX = clamp((event.clientX - centerX) / centerX, -1, 1);
    const normalizedY = clamp((event.clientY - centerY) / centerY, -1, 1);

    state.targetX = normalizedX;
    state.targetY = normalizedY;
  }

  function resetTargets() {
    state.targetX = 0;
    state.targetY = 0;
  }

  function approach(current, target, inertia) {
    return current + (target - current) * inertia;
  }

  function animate() {
    const headTargetX = state.targetX * settings.headPowerX;
    const headTargetY = state.targetY * settings.headPowerY;

    const bodyTargetX = state.targetX * settings.bodyPowerX;
    const bodyTargetY = state.targetY * settings.bodyPowerY;

    const skirtTargetX = state.targetX * settings.skirtPowerX;
    const skirtTargetY = state.targetY * settings.skirtPowerY;

    const jarTargetX = state.targetX * settings.jarPowerX;
    const jarTargetY = state.targetY * settings.jarPowerY;

    const bowTargetX = state.targetX * settings.bowPowerX;
    const bowTargetY = state.targetY * settings.bowPowerY;

    state.headX = approach(state.headX, headTargetX, settings.headInertia);
    state.headY = approach(state.headY, headTargetY, settings.headInertia);

    state.bodyX = approach(state.bodyX, bodyTargetX, settings.bodyInertia);
    state.bodyY = approach(state.bodyY, bodyTargetY, settings.bodyInertia);

    state.skirtX = approach(state.skirtX, skirtTargetX, settings.skirtInertia);
    state.skirtY = approach(state.skirtY, skirtTargetY, settings.skirtInertia);

    state.jarX = approach(state.jarX, jarTargetX, settings.jarInertia);
    state.jarY = approach(state.jarY, jarTargetY, settings.jarInertia);

    state.bowX = approach(state.bowX, bowTargetX, settings.bowInertia);
    state.bowY = approach(state.bowY, bowTargetY, settings.bowInertia);

    motionTargets.forEach((target) => {
      target.style.setProperty("--snake-head-x", state.headX.toFixed(3));
      target.style.setProperty("--snake-head-y", state.headY.toFixed(3));
      target.style.setProperty("--snake-head-rotate", (state.headX * 0.0045).toFixed(3));

      target.style.setProperty("--snake-body-x", state.bodyX.toFixed(3));
      target.style.setProperty("--snake-body-y", state.bodyY.toFixed(3));
      target.style.setProperty("--snake-body-rotate", (state.bodyX * -0.025).toFixed(3));

      target.style.setProperty("--snake-skirt-x", state.skirtX.toFixed(3));
      target.style.setProperty("--snake-skirt-y", state.skirtY.toFixed(3));
      target.style.setProperty("--snake-skirt-rotate", (state.skirtX * -0.06).toFixed(3));

      target.style.setProperty("--snake-jar-x", state.jarX.toFixed(3));
      target.style.setProperty("--snake-jar-y", state.jarY.toFixed(3));
      target.style.setProperty("--snake-jar-rotate", (state.jarX * -0.04).toFixed(3));

      target.style.setProperty("--snake-bow-x", state.bowX.toFixed(3));
      target.style.setProperty("--snake-bow-y", state.bowY.toFixed(3));
      target.style.setProperty("--snake-bow-rotate", (state.bowX * 0.095).toFixed(3));
    });

    requestAnimationFrame(animate);
  }

  window.addEventListener("pointermove", setTargetsFromPointer, { passive: true });
  window.addEventListener("pointerleave", resetTargets);
  window.addEventListener("blur", resetTargets);

  animate();
})();
// ========================================
// 9. Телефонная анимация Цербеллы по тапу
// На касание делает движение восьмёркой
// ========================================

(() => {
  const mobileCharacters = document.querySelectorAll("[data-character-inertia]");

  if (mobileCharacters.length === 0) return;

  const isMobileLike = window.matchMedia(
    "(hover: none), (pointer: coarse), (max-width: 800px)"
  ).matches;

  if (!isMobileLike) return;

  mobileCharacters.forEach((character) => {
    character.addEventListener("pointerdown", () => {
      character.classList.remove("is-figure-eight");

      // Перезапускает CSS-анимацию
      void character.offsetWidth;

      character.classList.add("is-figure-eight");

      window.setTimeout(() => {
        character.classList.remove("is-figure-eight");
      }, 950);
    });
  });
})();