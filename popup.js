document.addEventListener('DOMContentLoaded', async () => {
    // Elements
    const tabs = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.section');
    const apiKeyInput = document.getElementById('api-key');
    const providerSelect = document.getElementById('model-provider');
    const saveSettingsBtn = document.getElementById('save-settings');
    const askBtn = document.getElementById('ask-btn');
    const userInput = document.getElementById('user-input');
    const explainResult = document.getElementById('explain-result');
    const repoStatus = document.getElementById('repo-status');
    const repoStats = document.getElementById('repo-stats');

    // Load Settings
    const stored = await chrome.storage.sync.get(['apiKey', 'provider']);
    if (stored.apiKey) apiKeyInput.value = stored.apiKey;
    if (stored.provider) providerSelect.value = stored.provider;

    // Tabs Logic
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));

            tab.classList.add('active');
            const targetId = tab.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');

            if (targetId === 'tab-repo') {
                checkRepoStatus();
            }
        });
    });

    // Save Settings
    saveSettingsBtn.addEventListener('click', () => {
        const apiKey = apiKeyInput.value.trim();
        const provider = providerSelect.value;
        chrome.storage.sync.set({ apiKey, provider }, () => {
            const originalText = saveSettingsBtn.innerText;
            saveSettingsBtn.innerText = 'Saved!';
            setTimeout(() => saveSettingsBtn.innerText = originalText, 1500);
        });
    });

    // Ask Question / Explain Code
    askBtn.addEventListener('click', async () => {
        const text = userInput.value.trim();
        if (!text) return;

        askBtn.disabled = true;
        askBtn.innerHTML = '<div class="spinner"></div> Processing...';
        explainResult.classList.remove('hidden');
        explainResult.innerHTML = 'Thinking...';

        try {
            const { apiKey, provider } = await chrome.storage.sync.get(['apiKey', 'provider']);
            if (!apiKey) {
                throw new Error('Please set your API Key in Settings first.');
            }

            const response = await callAI(text, apiKey, provider || 'gemini');
            explainResult.innerHTML = formatResponse(response);
        } catch (error) {
            explainResult.innerHTML = `<span style="color: var(--error-color)">Error: ${error.message}</span>`;
        } finally {
            askBtn.disabled = false;
            askBtn.innerHTML = '<span>Explain / Answer</span>';
        }
    });

    // Repo Analysis Logic
    async function checkRepoStatus() {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.url.includes('github.com')) {
            repoStatus.innerHTML = '<p>Please navigate to a GitHub repository page.</p>';
            repoStats.classList.add('hidden');
            return;
        }

        repoStatus.innerHTML = '<p>Scanning repository...</p>';

        try {
            // Send message to content script
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'scanRepo' });
            if (response && response.success) {
                repoStatus.style.display = 'none';
                repoStats.classList.remove('hidden');

                document.getElementById('stat-files').innerText = response.fileCount || '0';
                document.getElementById('stat-langs').innerText = response.languages || 'Unknown';

                // Simple complexity heuristic
                const count = parseInt(response.fileCount) || 0;
                const complexitySpan = document.getElementById('stat-complexity');
                if (count > 50) {
                    complexitySpan.innerText = 'High';
                    complexitySpan.className = 'badge high';
                } else if (count > 10) {
                    complexitySpan.innerText = 'Medium';
                    complexitySpan.className = 'badge medium';
                } else {
                    complexitySpan.innerText = 'Low';
                    complexitySpan.className = 'badge low';
                }
            } else {
                repoStatus.innerHTML = '<p>Could not analyze this page. Make sure you are on a repo code page.</p>';
            }
        } catch (e) {
            repoStatus.innerHTML = '<p>Please refresh the page content script is not ready.</p>';
        }
    }

    // AI Call Helper
    async function callAI(prompt, apiKey, provider) {
        // Simple internal prompt engineering
        const systemPrompt = "You are an expert coding assistant. Explain the following code or answer the question. If it's a question, provide pseudocode if applicable. be concise.";

        // Mock fetch structure due to environment limitations, 
        // normally this would be a real fetch to https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent
        // For this demo, I will simulate it or try a real fetch for Gemini if you have one.
        // I'll implement the real logic below but it will fail without a key.

        if (provider === 'gemini') {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
            const payload = {
                contents: [{
                    parts: [{ text: `${systemPrompt}\n\nUser Question/Code:\n${prompt}` }]
                }]
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
            // OpenAI logic
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

    function formatResponse(text) {
        // Simple markdown to HTML conversion could go here
        // For now just escaping or simple bolding
        return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
            .replace(/\n/g, '<br>');
    }
});
