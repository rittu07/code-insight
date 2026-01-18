chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "explain-code",
        title: "Explain this code",
        contexts: ["selection"]
    });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "explain-code") {
        const text = info.selectionText;
        if (!text) return;

        // 1. Notify Content Script to show 'Loading'
        try {
            await chrome.tabs.sendMessage(tab.id, { action: "showLoading" });

            // 2. Get API Key
            const { apiKey, provider } = await chrome.storage.sync.get(['apiKey', 'provider']);

            if (!apiKey) {
                await chrome.tabs.sendMessage(tab.id, {
                    action: "showResult",
                    data: "Please set your API Key in the extension settings."
                });
                return;
            }

            // 3. Call AI
            const explanation = await callAI(text, apiKey, provider || 'gemini');

            // 4. Send result
            await chrome.tabs.sendMessage(tab.id, {
                action: "showResult",
                data: explanation
            });

        } catch (error) {
            console.error(error);
            chrome.tabs.sendMessage(tab.id, {
                action: "showResult",
                data: "Error: " + error.message
            });
        }
    }
});

// Reusing the AI logic from popup.js (duplicated for simplicity in BG)
async function callAI(prompt, apiKey, provider) {
    const systemPrompt = "You are an expert coding assistant. Explain the following code concisely. If it contains a bug, point it out.";

    if (provider === 'gemini') {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        const payload = {
            contents: [{ parts: [{ text: `${systemPrompt}\n\nCode:\n${prompt}` }] }]
        };

        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error?.message || 'API Error');
        }
        const data = await res.json();
        return data.candidates[0].content.parts[0].text;
    } else {
        // OpenAI
        const url = 'https://api.openai.com/v1/chat/completions';
        const payload = {
            model: "gpt-4",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: prompt }
            ]
        };

        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error('OpenAI API Error');
        const data = await res.json();
        return data.choices[0].message.content;
    }
}
