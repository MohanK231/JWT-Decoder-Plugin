# Quick JWT Decoder ���

An instantaneous, 100% local JSON Web Token (JWT) inspector sidebar panel and hover utility built for VS Code. Decode developer tokens and check dynamic token expirations natively without ever leaving your editor or leaking sensitive security data to third-party web tools.

## ✨ Advanced Features

* **Instant Hover Inspector**: Simply hover your cursor over any raw Base64-encoded JWT payload token string in your code editor to instantly see its pretty-printed JSON data configuration window.
* **Interactive Decoder Sidebar**: Paste raw authorization strings into a dedicated sidebar container to analyze token layouts live.
* **Auto-Bearer Filter Cleaner**: Automatically parses and strips away prefixed strings like `Bearer ` or `Authorization: ` if you copy a raw backend inspector network log line straight into your input field.
* **Dynamic Token Expiry Warning Banner**: Automatically parses the `exp` payload timestamp claim and flashes a bright red **"⚠️ TOKEN EXPIRED"** alert badge if the token has run out relative to your local computer's clock time.

<!--
## ��� Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org) (v18 or higher) and [VS Code](https://visualstudio.com) installed.

### Installation & Test Run
1. Open your terminal window inside this directory root folder and execute your setup manager installer:
   ```bash
   npm install
   ```
2. Kick off the automated background compiler task script:
   ```bash
   npm run watch
   ```
3. Tap **`F5`** on your keyboard to open the **`[Extension Development Host]`** test sandbox window.
4. Click on the **Key Icon ���** in the far-left vertical sidebar toolbar menu to launch your Token Inspector user layout window pane!

---

## ��� Packaging For Production

When you are ready to bundle this tool into an installable file format to distribute to your developer team layout nodes:
```bash
npm install -g @vscode/vsce
vsce package
```
-->