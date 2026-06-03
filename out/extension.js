"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
/**
 * This method is called when your extension is activated.
 */
function activate(context) {
    console.log('Quick JWT Decoder extension with advanced features is now active.');
    // FEATURE 1: Enhanced Hover-to-Decode System (With Expiry Banner & Token Auto-Cleaning)
    const hoverProvider = vscode.languages.registerHoverProvider('*', {
        provideHover(document, position) {
            // Regex to catch base64 style strings (including potential header leftovers)
            const jwtRegex = /[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]*/;
            const range = document.getWordRangeAtPosition(position, jwtRegex);
            if (!range) {
                return;
            }
            let token = document.getText(range).trim();
            // ADVANCED FEATURE: Auto-Bearer Cleaner for Hover
            if (token.toLowerCase().startsWith('bearer ')) {
                token = token.substring(7).trim();
            }
            else if (token.toLowerCase().startsWith('authorization:')) {
                token = token.replace(/^authorization:\s*(bearer\s*)?/i, '').trim();
            }
            try {
                const parts = token.split('.');
                const decodedPayload = safeBase64Decode(parts[1]); // Read payload chunk
                const payloadObj = JSON.parse(decodedPayload);
                // Build a formatted markdown tooltip popup window
                const markdown = new vscode.MarkdownString();
                markdown.appendMarkdown(`### 🔑 Quick JWT Payload Inspector\n`);
                // ADVANCED FEATURE: Time Expired Banner for Hover
                if (payloadObj.exp) {
                    const isExpired = Date.now() >= payloadObj.exp * 1000;
                    if (isExpired) {
                        markdown.appendMarkdown(`> 🔴 **⚠️ Token Expired** (Ended: ${new Date(payloadObj.exp * 1000).toLocaleString()})\n\n`);
                    }
                    else {
                        markdown.appendMarkdown(`> 🟢 **✅ Token Active** (Expires: ${new Date(payloadObj.exp * 1000).toLocaleTimeString()})\n\n`);
                    }
                }
                markdown.appendMarkdown(`\`\`\`json\n${JSON.stringify(payloadObj, null, 2)}\n\`\`\``);
                return new vscode.Hover(markdown);
            }
            catch (err) {
                return; // Suppress errors for non-JWT strings
            }
        }
    });
    // FEATURE 2: Register Sidebar Interactive Panel View Container
    const sidebarProvider = new JWTWebviewProvider(context.extensionUri);
    const webviewRegister = vscode.window.registerWebviewViewProvider('jwt-decoder-view', sidebarProvider);
    context.subscriptions.push(hoverProvider, webviewRegister);
}
/**
 * Webview Management class for handling the interactive UI panel
 */
class JWTWebviewProvider {
    _extensionUri;
    constructor(_extensionUri) {
        this._extensionUri = _extensionUri;
    }
    resolveWebviewView(webviewView) {
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };
        webviewView.webview.html = this._getHtmlForWebview();
    }
    _getHtmlForWebview() {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <style>
                    body {
                        font-family: var(--vscode-font-family, sans-serif);
                        font-size: var(--vscode-font-size, 13px);
                        padding: 12px;
                        color: var(--vscode-foreground);
                        background-color: var(--vscode-sideBar-background);
                    }
                    h4 { margin-top: 0; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.8; }
                    textarea {
                        width: 100%;
                        height: 90px;
                        box-sizing: border-box;
                        background: var(--vscode-input-background);
                        color: var(--vscode-input-foreground);
                        border: 1px solid var(--vscode-input-border, #ccc);
                        border-radius: 4px;
                        padding: 8px;
                        font-family: monospace;
                        resize: vertical;
                    }
                    textarea:focus { outline: 1px solid var(--vscode-focusBorder); }
                    .badge {
                        padding: 6px 10px;
                        border-radius: 4px;
                        font-weight: bold;
                        margin-top: 10px;
                        margin-bottom: 14px;
                        display: none;
                        text-align: center;
                        font-size: 11px;
                        letter-spacing: 0.5px;
                    }
                    .badge.expired { background: #5a1818; color: #ff9999; border: 1px solid #ff3333; }
                    .badge.active { background: #133a13; color: #99ff99; border: 1px solid #33cc33; }
                    pre {
                        background: var(--vscode-textBlockCodeBlock-background, rgba(0,0,0,0.1));
                        padding: 10px;
                        overflow-x: auto;
                        font-family: var(--vscode-editor-font-family, monospace);
                        font-size: calc(var(--vscode-font-size, 13px) - 1px);
                        border-radius: 4px;
                        border: 1px solid var(--vscode-panel-border, transparent);
                        white-space: pre-wrap;
                        word-break: break-all;
                    }
                </style>
            </head>
            <body>
                <h4>Token String Input</h4>
                <textarea id="tokenInput" placeholder="Paste full JWT token, Bearer string, or raw network log header here..."></textarea>
                
                <div id="statusBadge" class="badge"></div>

                <h4>Parsed Payload</h4>
                <pre id="output">Paste a token to see parsed results...</pre>

                <script>
                    const tokenInput = document.getElementById('tokenInput');
                    const outputElement = document.getElementById('output');
                    const badgeElement = document.getElementById('statusBadge');

                    tokenInput.addEventListener('input', (e) => {
                        let rawValue = e.target.value.trim();
                        if (!rawValue) {
                            outputElement.textContent = "Paste a token to see parsed results...";
                            badgeElement.style.display = 'none';
                            return;
                        }

                        // ADVANCED FEATURE FEATURE: Auto-Bearer / Header Cleaner
                        if (rawValue.toLowerCase().startsWith('bearer ')) {
                            rawValue = rawValue.substring(7).trim();
                        } else if (rawValue.toLowerCase().startsWith('authorization:')) {
                            rawValue = rawValue.replace(/^authorization:\s*(bearer\s*)?/i, '').trim();
                        }

                        try {
                            const parts = rawValue.split('.');
                            if(parts.length < 2) { throw new Error("Invalid format"); }
                            
                            const base64Url = parts[1];
                            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                            const jsonString = decodeURIComponent(atob(base64).split('').map(function(c) {
                                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                            }).join(''));
                            
                            const payload = JSON.parse(jsonString);
                            outputElement.textContent = JSON.stringify(payload, null, 2);

                            // ADVANCED FEATURE: Time Expired Banner
                            if (payload.exp) {
                                const expired = Date.now() >= payload.exp * 1000;
                                badgeElement.style.display = 'block';
                                if(expired) {
                                    badgeElement.textContent = "⚠️ TOKEN EXPIRED";
                                    badgeElement.className = "badge expired";
                                } else {
                                    badgeElement.textContent = "✅ TOKEN ACTIVE";
                                    badgeElement.className = "badge active";
                                }
                            } else {
                                badgeElement.style.display = 'none';
                            }

                        } catch (err) {
                            outputElement.textContent = "❌ Invalid JWT token structure format.";
                            badgeElement.style.display = 'none';
                        }
                    });
                </script>
            </body>
            </html>
        `;
    }
}
/**
 * Universal Base64 decoding helper
 */
function safeBase64Decode(str) {
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    return Buffer.from(base64, 'base64').toString('utf-8');
}
function deactivate() { }
//# sourceMappingURL=extension.js.map