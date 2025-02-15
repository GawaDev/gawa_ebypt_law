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

                // パラグラフ（本文＋放送回＋王コメント）
                if (article.paragraphs && article.paragraphs.length > 0) {
                    article.paragraphs.forEach((paraData) => {
                        // 旧形式(文字列)にも対応可能なサンプル
                        let text, broadcast, kingComment;
                        if (typeof paraData === "string") {
                            text = paraData;
                            broadcast = "";
                            kingComment = "";
                        } else {
                            text = paraData.text || "";
                            broadcast = paraData.broadcast || "";
                            kingComment = paraData.kingComment || "";
                        }

                        // パラグラフ要素
                        const paragraphDiv = document.createElement("div");
                        paragraphDiv.classList.add("article-paragraph");
                        paragraphDiv.textContent = text;

                        // 追加情報 (hover/clickで表示)
                        const refInfoDiv = document.createElement("div");
                        refInfoDiv.classList.add("reference-info");

                        if (broadcast) {
                            const pBroadcast = document.createElement("p");
                            pBroadcast.innerHTML = `<span>根拠放送:</span> ${broadcast}`;
                            refInfoDiv.appendChild(pBroadcast);
                        }
                        if (kingComment) {
                            const pComment = document.createElement("p");
                            pComment.innerHTML = `<span>王コメント:</span> ${kingComment}`;
                            refInfoDiv.appendChild(pComment);
                        }

                        paragraphDiv.appendChild(refInfoDiv);
                        contentArea.appendChild(paragraphDiv);

                        // クリックで固定表示(pinned)切り替え
                        paragraphDiv.addEventListener("click", (e) => {
                            // 一旦、全ての pinned を解除
                            unpinAllParagraphs();
                            // 自分に pinned クラスを付与（解除したい場合はトグルにしてもOK）
                            paragraphDiv.classList.add("pinned");
                            // イベントバブルを止める(外側へのクリック判定をキャンセル)
                            e.stopPropagation();
                        });
                    });
                }
            });
        }
    });

    // ハンバーガーメニュー開閉
    document.getElementById("menu-button").addEventListener("click", () => {
        document.getElementById("mobile-menu").classList.add("active");
    });
    document.getElementById("close-menu").addEventListener("click", () => {
        document.getElementById("mobile-menu").classList.remove("active");
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

    // 画面全体クリックで pinned を解除(他所クリック時)
    document.addEventListener("click", (e) => {
        // メニュー系のクリックなどもありうるが、とりあえず全Paragraphのpinnedを外す
        unpinAllParagraphs();
    });

    // pinnedクラスを全て外す関数
    function unpinAllParagraphs() {
        const pinnedEls = document.querySelectorAll(".article-paragraph.pinned");
        pinnedEls.forEach(el => el.classList.remove("pinned"));
    }

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
