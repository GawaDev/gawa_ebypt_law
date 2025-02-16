document.addEventListener("DOMContentLoaded", async () => {
    let lawData;
    try {
        const response = await fetch("data/ebypt_law_teian.json");
        lawData = await response.json();
    } catch (error) {
        console.error("JSONデータの取得に失敗しました:", error);
        return;
    }

    const tocElement = document.getElementById("toc");
    const mobileTocElement = document.getElementById("mobile-toc");
    const contentArea = document.getElementById("content-area");
    const lawTitleElement = document.getElementById("law-title");

    lawTitleElement.textContent = lawData.title || "無題の法律";

    let allParagraphNodes = [];

    lawData.chapters.forEach((chapter) => {
        const chapterId = `chapter-${chapter.chapterNumber}`;

        // TOCリンク (PC)
        const chapterLink = document.createElement("a");
        chapterLink.href = `#${chapterId}`;
        chapterLink.textContent = `第${toKanjiNumber(chapter.chapterNumber)}章 ${chapter.chapterTitle}`;
        tocElement.appendChild(chapterLink);

        // TOCリンク (モバイル)
        const chapterLinkMobile = chapterLink.cloneNode(true);
        mobileTocElement.appendChild(chapterLinkMobile);

        // 章見出し
        const chapterHeading = document.createElement("h2");
        chapterHeading.classList.add("chapter-heading");
        chapterHeading.id = chapterId;
        chapterHeading.textContent = `第${toKanjiNumber(chapter.chapterNumber)}章 ${chapter.chapterTitle}`;
        contentArea.appendChild(chapterHeading);

        // 条文
        if (chapter.articles && chapter.articles.length > 0) {
            chapter.articles.forEach((article) => {
                const articleId = `${chapterId}-article-${article.articleNumber}`;

                const articleHeading = document.createElement("h3");
                articleHeading.classList.add("article-heading");
                articleHeading.id = articleId;
                articleHeading.textContent = `第${article.articleNumber}条（${article.articleTitle}）`;
                contentArea.appendChild(articleHeading);

                if (article.paragraphs && article.paragraphs.length > 0) {
                    article.paragraphs.forEach((paraData) => {
                        let text, evidence, kingComment;
                        if (typeof paraData === "string") {
                            text = paraData;
                            evidence = "";
                            kingComment = "";
                        } else {
                            text = paraData.text || "";
                            evidence = paraData.evidence || "";
                            kingComment = paraData.kingComment || "";
                        }

                        const paragraphDiv = document.createElement("div");
                        paragraphDiv.classList.add("article-paragraph");

                        // --- 段落生成時 ---
                        // 例: 各段落の p 要素を生成する際に
                        const textP = document.createElement("p");
                        textP.textContent = text;
                        // 元のテキストを data-original 属性に保存
                        textP.setAttribute("data-original", text);
                        paragraphDiv.appendChild(textP);
                        allParagraphNodes.push(textP);



                        const referenceBox = document.createElement("div");
                        referenceBox.classList.add("reference-box");

                        if (evidence) {
                            const pEvidence = document.createElement("p");
                            pEvidence.innerHTML = `<span>根拠</span>${evidence}`;
                            referenceBox.appendChild(pEvidence);
                        }
                        if (kingComment) {
                            const pComment = document.createElement("p");
                            pComment.innerHTML = `<span>王コメント</span>${kingComment}`;
                            referenceBox.appendChild(pComment);
                        }

                        paragraphDiv.appendChild(referenceBox);
                        contentArea.appendChild(paragraphDiv);

                        paragraphDiv.addEventListener("click", () => {
                            paragraphDiv.classList.toggle("pinned");
                        });
                    });
                }
            });
        }
    });

    // ハンバーガーメニュー開閉
    const mobileMenu = document.getElementById("mobile-menu");
    document.getElementById("menu-button").addEventListener("click", () => {
        mobileMenu.classList.add("active");
    });
    document.getElementById("close-menu").addEventListener("click", () => {
        mobileMenu.classList.remove("active");
    });
    document.querySelectorAll("#mobile-toc a").forEach(link => {
        link.addEventListener("click", () => {
            mobileMenu.classList.remove("active");
        });
    });

    window.addEventListener("scroll", () => {
        if (window.innerWidth < 768) return;
        const chapterHeadings = document.querySelectorAll(".chapter-heading");
        let currentChapterId = "";
        chapterHeadings.forEach((heading) => {
            const rect = heading.getBoundingClientRect();
            if (rect.top <= 120) {
                currentChapterId = heading.id;
            }
        });
        const tocLinks = document.querySelectorAll("#toc a");
        tocLinks.forEach((link) => {
            link.classList.remove("active");
            if (link.getAttribute("href") === `#${currentChapterId}`) {
                link.classList.add("active");
            }
        });
    });

    // ======== 検索機能 =========
    const searchToggleBtn = document.getElementById("search-toggle");
    const searchBar = document.getElementById("search-bar");
    const searchInput = document.getElementById("search-input");
    const searchFirstBtn = document.getElementById("search-first");
    const searchPrevBtn = document.getElementById("search-prev");
    const searchNextBtn = document.getElementById("search-next");
    const searchLastBtn = document.getElementById("search-last");
    const searchCurrentSpan = document.getElementById("search-current");

    let searchResults = [];
    let currentIndex = 0;

    function escapeHTML(str) {
        var div = document.createElement("div");
        div.textContent = str;
        return div.innerHTML;
    }

    function doSearch(keyword) {
        clearHighlights();
        searchResults = [];
        currentIndex = 0;
        if (!keyword) {
            updateSearchUI();
            return;
        }
        allParagraphNodes.forEach((p) => {
            const text = p.textContent;
            const reg = new RegExp(keyword, "gi");
            const matches = [...text.matchAll(reg)];
            if (matches.length > 0) {
                let newHTML = "";
                let lastIndex = 0;
                matches.forEach((match, i) => {
                    newHTML += escapeHTML(text.substring(lastIndex, match.index));
                    newHTML += `<span class="highlight" data-occurrence-index="${i}">${escapeHTML(match[0])}</span>`;
                    lastIndex = match.index + match[0].length;
                });
                newHTML += escapeHTML(text.substring(lastIndex));
                p.innerHTML = newHTML;
                const spans = p.querySelectorAll("span.highlight");
                spans.forEach(span => {
                    searchResults.push(span);
                });
            }
        });
        updateSearchUI();
        if (searchResults.length > 0) {
            scrollToResult(0);
        }
    }

    // clearHighlights() の修正
    function clearHighlights() {
        // 保存している data-original の内容で全段落を復元
        allParagraphNodes.forEach((p) => {
            const originalText = p.getAttribute("data-original");
            if (originalText !== null) {
                p.innerHTML = escapeHTML(originalText);
            }
        });
        searchResults = [];
    }


    function scrollToResult(index) {
        document.querySelectorAll(".highlight.current").forEach(span => {
            span.classList.remove("current");
        });
        const span = searchResults[index];
        if (span) {
            span.classList.add("current");
            span.scrollIntoView({ behavior: "smooth", block: "center" });
            currentIndex = index;
            updateSearchUI();
        }
    }

    function updateSearchUI() {
        const total = searchResults.length;
        const current = total === 0 ? 0 : (currentIndex + 1);
        searchCurrentSpan.textContent = `${current}/${total}`;
    }

    searchToggleBtn.addEventListener("click", () => {
        searchBar.classList.toggle("active");
        if (!searchBar.classList.contains("active")) {
            clearHighlights();
            searchInput.value = "";
            updateSearchUI();
        }
    });

    searchInput.addEventListener("input", () => {
        doSearch(searchInput.value.trim());
    });

    searchFirstBtn.addEventListener("click", () => {
        if (searchResults.length > 0) {
            currentIndex = 0;
            scrollToResult(currentIndex);
        }
    });
    searchPrevBtn.addEventListener("click", () => {
        if (searchResults.length > 0) {
            currentIndex = (currentIndex - 1 + searchResults.length) % searchResults.length;
            scrollToResult(currentIndex);
        }
    });
    searchNextBtn.addEventListener("click", () => {
        if (searchResults.length > 0) {
            currentIndex = (currentIndex + 1) % searchResults.length;
            scrollToResult(currentIndex);
        }
    });
    searchLastBtn.addEventListener("click", () => {
        if (searchResults.length > 0) {
            currentIndex = searchResults.length - 1;
            scrollToResult(currentIndex);
        }
    });
});

function toKanjiNumber(num) {
    const kanjiNumbers = ["〇", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
    if (num < 10) {
        return kanjiNumbers[num];
    } else if (num < 100) {
        const tens = Math.floor(num / 10);
        const ones = num % 10;
        let result = "";
        if (tens > 1) result += kanjiNumbers[tens];
        result += "十";
        if (ones > 0) result += kanjiNumbers[ones];
        return result;
    }
    return num;
}
