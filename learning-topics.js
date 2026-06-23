(function () {
  const STORAGE_KEY = "nuonuo-learning-topics-v1";
  const DEFAULT_TOPICS = [
    {
      id: "visual-language",
      name: "视听语言",
      description: "学习镜头、构图、运动、剪辑与声音如何共同完成表达。",
      category: "AI 产品与创造",
      accent: "#aac8e1",
      cards: [],
    },
  ];

  function loadTopics() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (Array.isArray(stored) && stored.length) return stored;
    } catch (error) {
      console.warn("Unable to read learning topics", error);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_TOPICS));
    return JSON.parse(JSON.stringify(DEFAULT_TOPICS));
  }

  function saveTopics(topics) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(topics));
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function renderTopicIndex() {
    const grid = document.querySelector("#ai-topic-grid");
    if (!grid) return;
    const topics = loadTopics();
    grid.innerHTML = topics.map((topic, index) => `
      <a class="learning-topic-card" href="learning-topic.html?topic=${encodeURIComponent(topic.id)}" style="--topic-accent:${topic.accent}">
        <div class="topic-cover">
          <span>0${index + 1}</span>
          <i></i><i></i><i></i>
          <strong>${escapeHtml(topic.name)}</strong>
        </div>
        <div class="topic-card-copy">
          <small>${escapeHtml(topic.category)}</small>
          <h4>${escapeHtml(topic.name)}</h4>
          <p>${escapeHtml(topic.description)}</p>
          <div><span>${topic.cards.length} 张知识卡</span><b>进入专题 →</b></div>
        </div>
      </a>
    `).join("") + `
      <button class="new-topic-card" id="new-topic-card" type="button">
        <span>＋</span><strong>新建学习专题</strong><small>为下一片知识创建房间</small>
      </button>
    `;

    document.querySelector("#new-topic-card")?.addEventListener("click", () => {
      const name = window.prompt("新专题叫什么名字？");
      if (!name?.trim()) return;
      const id = `topic-${Date.now()}`;
      topics.push({
        id,
        name: name.trim(),
        description: "一个正在生长的新学习专题。",
        category: "AI 产品与创造",
        accent: ["#aac8e1", "#a9d4c5", "#e8c5ad", "#d9e6a2"][topics.length % 4],
        cards: [],
      });
      saveTopics(topics);
      window.location.href = `learning-topic.html?topic=${encodeURIComponent(id)}`;
    });
  }

  function splitText(text, limit) {
    const chunks = [];
    let line = "";
    Array.from(text).forEach((char) => {
      line += char;
      if (line.length >= limit || "，。；！？：".includes(char)) {
        chunks.push(line.trim());
        line = "";
      }
    });
    if (line.trim()) chunks.push(line.trim());
    return chunks.filter(Boolean);
  }

  function cardTitle(text) {
    const first = text.split(/[。！？\n]/).find((part) => part.trim()) || "今天的新理解";
    return first.trim().replace(/^(今天我理解了|今天学到|我发现|原来)/, "").slice(0, 22) || "今天的新理解";
  }

  function keywordList(text) {
    const known = ["镜头", "构图", "景别", "运动", "剪辑", "声音", "节奏", "空间", "时间", "叙事", "情绪", "视角", "光影", "色彩"];
    const hits = known.filter((word) => text.includes(word));
    return [...new Set(hits)].slice(0, 4).length ? [...new Set(hits)].slice(0, 4) : ["观察", "表达", "理解"];
  }

  function hashText(text) {
    return Array.from(text).reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0);
  }

  function makeCardSvg(topic, text, date) {
    const title = cardTitle(text);
    const lines = splitText(text, 20).slice(0, 6);
    const keywords = keywordList(text);
    const seed = Math.abs(hashText(text));
    const palette = [
      ["#102820", "#d9ff59", "#edf0d8", "#8eb6c6"],
      ["#173a32", "#f3aeb7", "#f2efd9", "#87b5a7"],
      ["#263d50", "#e8c5ad", "#edf0d8", "#a9d4c5"],
      ["#3d3048", "#d9e6a2", "#f2efd9", "#c9a5d1"],
    ][seed % 4];
    const shapes = Array.from({ length: 5 }, (_, index) => {
      const x = 540 + ((seed >> index) % 220);
      const y = 70 + ((seed >> (index + 2)) % 300);
      const r = 75 + ((seed >> (index + 4)) % 110);
      return `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${palette[(index % 2) + 1]}" stroke-width="2" opacity="${0.24 + index * 0.07}"/>`;
    }).join("");
    const lineSvg = lines.map((line, index) =>
      `<text x="76" y="${315 + index * 35}" fill="${palette[2]}" opacity="${index === 0 ? 0.92 : 0.7}" font-size="${index === 0 ? 20 : 16}" font-family="Noto Serif SC, serif">${escapeHtml(line)}</text>`
    ).join("");
    const keywordSvg = keywords.map((word, index) =>
      `<text x="${76 + index * 105}" y="548" fill="${palette[1]}" font-size="13" font-family="sans-serif"># ${escapeHtml(word)}</text>`
    ).join("");
    return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600" viewBox="0 0 900 600">
      <rect width="900" height="600" fill="${palette[0]}"/>
      <rect x="26" y="26" width="848" height="548" rx="2" fill="none" stroke="${palette[2]}" opacity=".22"/>
      ${shapes}
      <text x="76" y="82" fill="${palette[1]}" font-size="12" letter-spacing="3" font-family="sans-serif">LEARNING NOTE · ${escapeHtml(topic.name.toUpperCase())}</text>
      <text x="76" y="172" fill="${palette[2]}" font-size="42" font-family="Noto Serif SC, serif">${escapeHtml(title)}</text>
      <line x1="76" y1="220" x2="410" y2="220" stroke="${palette[1]}" opacity=".7"/>
      ${lineSvg}
      ${keywordSvg}
      <text x="824" y="548" text-anchor="end" fill="${palette[2]}" opacity=".5" font-size="12" font-family="sans-serif">${escapeHtml(date)}</text>
    </svg>`;
  }

  function svgToDataUrl(svg) {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  function svgToPng(svg, callback) {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 900;
      canvas.height = 600;
      canvas.getContext("2d").drawImage(image, 0, 0);
      callback(canvas.toDataURL("image/png"));
    };
    image.src = svgToDataUrl(svg);
  }

  function renderTopicPage() {
    const titleElement = document.querySelector("#topic-title");
    if (!titleElement) return;

    const topicId = new URLSearchParams(window.location.search).get("topic") || "visual-language";
    let topics = loadTopics();
    let topic = topics.find((item) => item.id === topicId) || topics[0];
    const input = document.querySelector("#learning-input");
    const preview = document.querySelector("#generated-preview");
    const emptyPreview = document.querySelector("#empty-preview");
    let latestPng = "";

    function updateHeader() {
      document.title = `${topic.name} · 学习专题`;
      titleElement.textContent = topic.name;
      document.querySelector("#topic-description").textContent = topic.description;
      document.querySelector("#card-count").textContent = topic.cards.length;
    }

    function renderCards() {
      const grid = document.querySelector("#learning-card-grid");
      const empty = document.querySelector("#empty-library");
      grid.innerHTML = topic.cards.map((card) => `
        <article class="saved-learning-card">
          <img src="${card.image}" alt="${escapeHtml(card.title)}" />
          <div>
            <span>${escapeHtml(card.date)}</span>
            <h3>${escapeHtml(card.title)}</h3>
            <p>${escapeHtml(card.content)}</p>
            <a href="${card.image}" download="${escapeHtml(topic.name)}-${card.id}.png">下载图片 ↓</a>
          </div>
        </article>
      `).join("");
      empty.hidden = topic.cards.length > 0;
      updateHeader();
    }

    document.querySelector("#rename-topic").addEventListener("click", () => {
      const dialog = document.querySelector("#rename-dialog");
      document.querySelector("#rename-input").value = topic.name;
      document.querySelector("#description-input").value = topic.description;
      dialog.hidden = false;
    });
    document.querySelector("#cancel-rename").addEventListener("click", () => {
      document.querySelector("#rename-dialog").hidden = true;
    });
    document.querySelector("#save-rename").addEventListener("click", () => {
      const name = document.querySelector("#rename-input").value.trim();
      if (!name) return;
      topic.name = name;
      topic.description = document.querySelector("#description-input").value.trim() || topic.description;
      saveTopics(topics);
      document.querySelector("#rename-dialog").hidden = true;
      updateHeader();
    });

    document.querySelector("#generate-card").addEventListener("click", () => {
      const text = input.value.trim();
      if (!text) {
        input.focus();
        input.placeholder = "先讲下一点今天学到的内容吧。";
        return;
      }
      const now = new Date();
      const date = now.toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" });
      const svg = makeCardSvg(topic, text, date);
      const svgUrl = svgToDataUrl(svg);
      document.querySelector("#preview-image").src = svgUrl;
      emptyPreview.hidden = true;
      preview.hidden = false;
      svgToPng(svg, (png) => {
        latestPng = png;
        const card = {
          id: Date.now(),
          title: cardTitle(text),
          content: text,
          date,
          image: png,
        };
        topic.cards.unshift(card);
        saveTopics(topics);
        renderCards();
      });
    });

    document.querySelector("#download-card").addEventListener("click", () => {
      if (!latestPng) return;
      const link = document.createElement("a");
      link.href = latestPng;
      link.download = `${topic.name}-${Date.now()}.png`;
      link.click();
    });
    document.querySelector("#continue-learning").addEventListener("click", () => {
      input.value = "";
      preview.hidden = true;
      emptyPreview.hidden = false;
      input.focus();
    });

    updateHeader();
    renderCards();
  }

  renderTopicIndex();
  renderTopicPage();
})();
