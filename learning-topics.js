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

  function splitSentences(text) {
    return text
      .replace(/\s+/g, "")
      .split(/(?<=[。！？；])/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function cardTitle(text) {
    const first = text.split(/[。！？\n]/).find((part) => part.trim()) || "今天的新理解";
    return first
      .trim()
      .replace(/^(今天先学习了|今天我理解了|今天学到|我发现|原来)/, "")
      .replace(/[：:，,。！？\s]/g, "")
      .slice(0, 18) || "今天的新理解";
  }

  function keywordList(text) {
    const known = ["影像", "记忆", "镜头", "构图", "景别", "运动", "剪辑", "声音", "节奏", "空间", "时间", "叙事", "情绪", "视角", "光影", "色彩", "共情"];
    const hits = known.filter((word) => text.includes(word));
    return [...new Set(hits)].slice(0, 4).length ? [...new Set(hits)].slice(0, 4) : ["观察", "表达", "理解"];
  }

  function hashText(text) {
    return Array.from(text).reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0);
  }

  function wrapSvgText(text, limit, maxLines) {
    const source = String(text || "");
    const lines = [];
    let line = "";
    Array.from(source).forEach((char) => {
      line += char;
      if (line.length >= limit || "，。；！？、".includes(char)) {
        lines.push(line.trim());
        line = "";
      }
    });
    if (line.trim()) lines.push(line.trim());
    const clipped = lines.filter(Boolean).slice(0, maxLines);
    if (lines.length > maxLines && clipped.length) {
      clipped[clipped.length - 1] = `${clipped[clipped.length - 1].replace(/[。！？；，、]$/, "")}…`;
    }
    return clipped;
  }

  function extractIdeaSections(text) {
    const normalized = text.trim();
    const markerPattern = /(第[一二三四五六七八九十\d]+个?点[：:，,、]?\s*)/g;
    const markers = [...normalized.matchAll(markerPattern)];
    if (!markers.length) {
      return splitSentences(normalized).slice(0, 3).map((sentence, index) => ({
        order: index + 1,
        title: sentence.replace(/^[一二三四五六七八九十\d]+[、.]\s*/, "").slice(0, 12),
        body: sentence,
      }));
    }
    return markers.map((marker, index) => {
      const start = marker.index + marker[0].length;
      const end = markers[index + 1]?.index ?? normalized.length;
      const body = normalized.slice(start, end).trim();
      const firstBreak = body.search(/[。！？\n]/);
      const firstLine = (firstBreak >= 0 ? body.slice(0, firstBreak) : body).trim();
      const title = firstLine
        .replace(/^[：:，,、\s]+/, "")
        .replace(/^我觉得它是/, "")
        .replace(/^我觉得/, "")
        .slice(0, 14);
      const visualTitle = /视觉|想象|感受|冲击|身临其境|大眼睛/.test(body);
      return {
        order: index + 1,
        title: visualTitle && index >= 2 ? "视觉感受与共情" : title || `核心观点 ${index + 1}`,
        body,
      };
    }).filter((item) => item.body);
  }

  function compactSummary(section, allText) {
    const body = section.body;
    if (/定格|记忆|瞬间|保存/.test(body)) {
      return "把流动的世界按下暂停，让某个瞬间成为可反复回看的记忆坐标。";
    }
    if (/视觉|想象|感受|冲击|身临其境|大眼睛/.test(body)) {
      return "调动视觉、想象空间与感受力，让信息从“知道”变成更直接的共情与震撼。";
    }
    if (/情感|艺术|思想|表达|流派/.test(body)) {
      return "通过摄影方式、构图与风格，把个人情感和思想转化为可被看见的作品。";
    }
    const sentences = splitSentences(body);
    return (sentences[1] || sentences[0] || body).slice(0, 42);
  }

  function ideaIcon(section) {
    const body = section.body;
    if (/定格|记忆|瞬间|保存/.test(body)) return "⏸";
    if (/视觉|想象|感受|冲击|身临其境/.test(body)) return "◉";
    if (/情感|艺术|思想|表达|流派/.test(body)) return "✦";
    return ["01", "02", "03"][section.order - 1] || "•";
  }

  function extractCardData(topic, text, date) {
    const title = cardTitle(text);
    const sections = extractIdeaSections(text).slice(0, 3);
    while (sections.length < 3) {
      sections.push({
        order: sections.length + 1,
        title: ["记忆", "表达", "感受"][sections.length],
        body: text,
      });
    }
    const headline = text.includes("影像") ? "影像的三种作用" : title;
    const thesis = text.includes("影像")
      ? "影像不是简单记录画面，而是在时间、情感与感受力之间，建立一种可以被反复进入的经验。"
      : splitSentences(text)[0]?.slice(0, 56) || "把今天的新理解整理成可以反复回看的知识结构。";
    const keywords = keywordList(text);
    return {
      title,
      headline,
      thesis,
      keywords,
      sections: sections.map((section) => ({
        ...section,
        summary: compactSummary(section, text),
        icon: ideaIcon(section),
      })),
      date,
      topicName: topic.name,
    };
  }

  function makeCardSvg(topic, text, date) {
    const data = extractCardData(topic, text, date);
    const seed = Math.abs(hashText(text));
    const palette = [
      ["#102820", "#d9ff59", "#edf0d8", "#8eb6c6"],
      ["#173a32", "#f3aeb7", "#f2efd9", "#87b5a7"],
      ["#263d50", "#e8c5ad", "#edf0d8", "#a9d4c5"],
      ["#3d3048", "#d9e6a2", "#f2efd9", "#c9a5d1"],
    ][seed % 4];
    const sectionSvg = data.sections.map((section, index) => {
      const x = 76 + index * 348;
      const summaryLines = wrapSvgText(section.summary, 16, 4);
      const titleLines = wrapSvgText(section.title, 8, 2);
      return `<g transform="translate(${x},330)">
        <rect width="296" height="270" rx="26" fill="${palette[2]}" opacity=".09" stroke="${palette[2]}" stroke-opacity=".32"/>
        <circle cx="52" cy="56" r="27" fill="${palette[1]}" opacity=".92"/>
        <text x="52" y="66" text-anchor="middle" fill="${palette[0]}" font-size="25" font-family="serif">${escapeHtml(section.icon)}</text>
        <text x="248" y="61" text-anchor="end" fill="${palette[1]}" opacity=".85" font-size="13" letter-spacing="3" font-family="sans-serif">0${section.order}</text>
        ${titleLines.map((line, lineIndex) => `<text x="34" y="${120 + lineIndex * 35}" fill="${palette[2]}" font-size="29" font-family="Noto Serif SC, serif">${escapeHtml(line)}</text>`).join("")}
        <line x1="34" y1="184" x2="262" y2="184" stroke="${palette[1]}" opacity=".55"/>
        ${summaryLines.map((line, lineIndex) => `<text x="34" y="${224 + lineIndex * 28}" fill="${palette[2]}" opacity=".74" font-size="20" font-family="Noto Serif SC, serif">${escapeHtml(line)}</text>`).join("")}
      </g>`;
    }).join("");
    const keywordSvg = data.keywords.map((word, index) =>
      `<text x="${76 + index * 130}" y="714" fill="${palette[1]}" font-size="17" font-family="sans-serif"># ${escapeHtml(word)}</text>`
    ).join("");
    const thesisLines = wrapSvgText(data.thesis, 30, 2);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
      <rect width="1200" height="800" fill="${palette[0]}"/>
      <circle cx="970" cy="106" r="210" fill="${palette[3]}" opacity=".12"/>
      <circle cx="1035" cy="156" r="210" fill="none" stroke="${palette[1]}" stroke-width="2" opacity=".32"/>
      <circle cx="895" cy="156" r="210" fill="none" stroke="${palette[2]}" stroke-width="2" opacity=".18"/>
      <rect x="34" y="34" width="1132" height="732" rx="4" fill="none" stroke="${palette[2]}" opacity=".22"/>
      <text x="76" y="90" fill="${palette[1]}" font-size="14" letter-spacing="4" font-family="sans-serif">STRUCTURED LEARNING · ${escapeHtml(data.topicName.toUpperCase())}</text>
      <text x="76" y="175" fill="${palette[2]}" font-size="62" font-family="Noto Serif SC, serif">${escapeHtml(data.headline)}</text>
      <line x1="76" y1="222" x2="455" y2="222" stroke="${palette[1]}" opacity=".72"/>
      ${thesisLines.map((line, index) => `<text x="76" y="${270 + index * 34}" fill="${palette[2]}" opacity=".72" font-size="22" font-family="Noto Serif SC, serif">${escapeHtml(line)}</text>`).join("")}
      ${sectionSvg}
      ${keywordSvg}
      <text x="1124" y="714" text-anchor="end" fill="${palette[2]}" opacity=".5" font-size="15" font-family="sans-serif">${escapeHtml(date)}</text>
    </svg>`;
  }

  function svgToDataUrl(svg) {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  function svgToPng(svg, callback) {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1200;
      canvas.height = 800;
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
        <article class="saved-learning-card" data-card-id="${card.id}">
          <img src="${card.image}" alt="${escapeHtml(card.title)}" />
          <div>
            <span>${escapeHtml(card.date)}</span>
            <h3>${escapeHtml(card.title)}</h3>
            <p>${escapeHtml(card.content)}</p>
            <div class="saved-card-actions">
              <a href="${card.image}" download="${escapeHtml(topic.name)}-${card.id}.png">下载图片 ↓</a>
              <button type="button" data-delete-card="${card.id}">删除卡片</button>
            </div>
          </div>
        </article>
      `).join("");
      empty.hidden = topic.cards.length > 0;
      updateHeader();
    }

    document.querySelector("#learning-card-grid").addEventListener("click", (event) => {
      const deleteButton = event.target.closest("[data-delete-card]");
      if (!deleteButton) return;
      const cardId = Number(deleteButton.dataset.deleteCard);
      topic.cards = topic.cards.filter((card) => Number(card.id) !== cardId);
      topics = topics.map((item) => item.id === topic.id ? topic : item);
      saveTopics(topics);
      renderCards();
    });

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
