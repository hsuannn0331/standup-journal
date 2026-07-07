# 站會筆記 · Standup Journal

一個給軟體工程師寫每日站會(Yesterday / Today / Blockers)+ 自由筆記的工具,
支援 SA / SD / SP / Meeting 等分類標籤、時數統計,並用 Firebase 做登入與雲端同步,
讓每個人各自登入、各自看到自己的資料。

## 技術棧

- React 18 + TypeScript
- Vite(建置工具)
- Firebase Authentication(Email/密碼 + Google 登入)
- Cloud Firestore(每個使用者的資料互相隔離)

## 本機開發

```bash
npm install
cp .env.example .env   # 填入你的 Firebase 專案設定
npm run dev
```

## 設定 Firebase

1. 到 [Firebase Console](https://console.firebase.google.com) 建立一個新專案(免費 Spark 方案即可)。
2. 專案設定 → 一般 → 「新增應用程式」→ 選網頁(</>)→ 取得 `firebaseConfig`。
3. 把設定值分別填入 `.env`(參考 `.env.example`)。
4. 左側選單 → Authentication → 開始使用 → 啟用「Email/密碼」和「Google」登入方式。
5. 左側選單 → Firestore Database → 建立資料庫(選正式模式,地區選離你近的,例如 `asia-east1`)。
6. 把 `firestore.rules` 的內容貼到 Firestore 的「規則」分頁,發布規則。這條規則確保每個使用者只能讀寫自己的資料,不會互相看到彼此的紀錄。

## 資料結構

```
users/{uid}/entries/{date}    → 該天的 昨天/今天/困難點/筆記
users/{uid}/meta/categories   → 該使用者自訂的分類標籤(SA/SD/SP/Meeting...)
```

每個使用者的資料完全獨立,因為 Firestore 規則限制只有 `request.auth.uid === uid` 的人才能存取對應路徑。

## 部署到 GitHub Pages

```bash
npm run build
```

會產生 `dist/` 資料夾,可以用 GitHub Pages、Vercel、或 Firebase Hosting 部署這個資料夾。

> 注意:`.env` 不會被打包進版本控制(已加入 `.gitignore`),部署到 GitHub Pages 這類純靜態平台時,
> 建議改用 GitHub Actions 的 secrets 在建置階段注入環境變數,或改用 Vercel / Netlify 的環境變數設定介面,
> 避免把 Firebase API Key 直接寫死進公開的原始碼。
>
> 補充:Firebase 的 `apiKey` 本身**不是**機密金鑰(它只是識別你的專案,真正的存取控制是靠上面的 Firestore 規則),
> 所以就算它出現在前端打包後的程式碼裡也是正常且預期的行為,只要 Firestore 規則設定正確,別人還是拿不到你的資料。

## 功能

- 昨天完成 / 今天計劃 / 困難點(可收合,收合時新增項目會自動展開)
- 昨天完成的每個項目可填時數(0–12 小時,最多兩位小數),並自動加總顯示(≥6 小時綠色、<6 小時紅色)
- SA / SD / SP / Meeting 分類標籤(單選、可在「管理分類」自訂新增/編輯/刪除)
- 自由筆記區塊
- 新增/編輯項目採「編輯 → 確認鎖定」流程,同時間整頁只有一個項目可編輯
- 歷史紀錄側邊欄,可新增/前往任一天(含「昨天忘記寫」的補登)
- 刪除項目/筆記/分類/整天紀錄前都會跳出確認提示
- 手機版側邊欄預設收合,點擊展開,選完日期後自動收合
