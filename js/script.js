/************************************************
 * 初期化処理
 ***********************************************/
document.addEventListener("DOMContentLoaded", async () => {
    let lawData;
    try {
        const response = await fetch("data/ebypt_law.json");
        lawData = await response.json();
    } catch (error) {
        console.error("JSONデータの取得に失敗しました:", error);
        return;
    }
    const tocElement = document.getElementById("toc");
    const mobileTocElement = document.getElementById("mobile-toc");
    const contentArea = document.getElementById("content-area");
    const lawTitleElement = document.getElementById("law-title");

    // タイトル設定
    lawTitleElement.textContent = lawData.title || "無題の法律";

    // 章・条文生成
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

        // 条文リスト
        if (chapter.articles && chapter.articles.length > 0) {
            chapter.articles.forEach((article) => {
                const articleId = `${chapterId}-article-${article.articleNumber}`;

                // 条タイトル
                const articleHeading = document.createElement("h3");
                articleHeading.classList.add("article-heading");
                articleHeading.id = articleId;
                articleHeading.textContent = `第${article.articleNumber}条（${article.articleTitle}）`;
                contentArea.appendChild(articleHeading);

                // パラグラフ
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

                        // パラグラフのラッパ
                        const paragraphDiv = document.createElement("div");
                        paragraphDiv.classList.add("article-paragraph");

                        // 条文テキスト
                        const textP = document.createElement("p");
                        textP.textContent = text;
                        paragraphDiv.appendChild(textP);

                        // 参照ボックス（初期は閉じる）
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

                        // クリックで開閉
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

    // ★ 追加：モバイル目次がタップされたら閉じる
    document.querySelectorAll("#mobile-toc a").forEach(link => {
        link.addEventListener("click", () => {
            // メニューを閉じる
            mobileMenu.classList.remove("active");
        });
    });

    // PCスクロール時のTOCハイライト
    window.addEventListener("scroll", () => {
        if (window.innerWidth < 768) return; // PCのみ
        const chapterHeadings = document.querySelectorAll(".chapter-heading");
        let currentChapterId = "";
        chapterHeadings.forEach((heading) => {
            const rect = heading.getBoundingClientRect();
            if (rect.top <= 120) {
                currentChapterId = heading.id;
            }
        });
        // リンク全部クリア
        const tocLinks = document.querySelectorAll("#toc a");
        tocLinks.forEach((link) => {
            link.classList.remove("active");
            if (link.getAttribute("href") === `#${currentChapterId}`) {
                link.classList.add("active");
            }
        });
    });
});


/************************************************
 * 漢数字変換 (簡易)
 ***********************************************/
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
    return num; // 100以上はそのまま数字表示
}
