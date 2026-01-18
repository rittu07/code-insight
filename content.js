// Content Script

// Listen for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'scanRepo') {
        const stats = scanGitHubRepo();
        sendResponse(stats);
    } else if (request.action === 'showLoading') {
        createModal('Analyzing Code...');
        updateModalContent('<div class="explainer-spinner"></div><p style="text-align:center; margin-top:1rem;">Thinking...</p>');
    } else if (request.action === 'showResult') {
        const formatted = formatMarkdown(request.data);
        updateModalContent(formatted);
    }
});

// --- Modal Logic ---

let modalOverlay = null;
let modalContent = null;
let modalTitle = null;

function createModal(titleText) {
    if (modalOverlay) {
        modalOverlay.remove(); // Reset if exists
    }

    // Overlay
    modalOverlay = document.createElement('div');
    modalOverlay.id = 'code-explainer-modal-overlay';

    // Modal Box
    const modal = document.createElement('div');
    modal.id = 'code-explainer-modal';

    // Header
    const header = document.createElement('div');
    header.id = 'code-explainer-header';

    modalTitle = document.createElement('span');
    modalTitle.id = 'code-explainer-title';
    modalTitle.innerText = titleText;

    const closeBtn = document.createElement('button');
    closeBtn.id = 'code-explainer-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.onclick = closeModal;

    header.appendChild(modalTitle);
    header.appendChild(closeBtn);

    // Content
    modalContent = document.createElement('div');
    modalContent.id = 'code-explainer-content';

    modal.appendChild(header);
    modal.appendChild(modalContent);
    modalOverlay.appendChild(modal);

    document.body.appendChild(modalOverlay);

    // Trigger animation
    requestAnimationFrame(() => {
        modalOverlay.classList.add('visible');
    });

    // Close on click outside
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });
}

function updateModalContent(html) {
    if (modalContent) {
        modalContent.innerHTML = html;
    }
}

function closeModal() {
    if (modalOverlay) {
        modalOverlay.classList.remove('visible');
        setTimeout(() => {
            if (modalOverlay) {
                modalOverlay.remove();
                modalOverlay = null;
            }
        }, 300);
    }
}

function formatMarkdown(text) {
    // Simple formatter
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/### (.*?)\n/g, '<h3>$1</h3>')
        .replace(/## (.*?)\n/g, '<h2>$1</h2>')
        .replace(/`([^`]+)`/g, '<code>$1</code>') // Inline code
        .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>') // Block code
        .replace(/\n/g, '<br>');
}

// --- Repo Analysis Logic ---

function scanGitHubRepo() {
    if (window.location.hostname !== 'github.com') {
        return { success: false };
    }

    // Try multiple selectors for file list
    const fileRowsOld = document.querySelectorAll('.js-navigation-item[role="row"]');
    const fileRowsNew = document.querySelectorAll('.react-directory-row');
    const fileCount = Math.max(fileRowsOld.length, fileRowsNew.length);

    // Try to find languages
    let languages = "Unknown";
    const langHeader = Array.from(document.querySelectorAll('h2, h3')).find(h => h.innerText.includes('Languages'));

    if (langHeader) {
        // Usually in a sibling or nearby list
        const langContainer = langHeader.parentElement.parentElement; // Heuristic traversal
        // Or check the color bar
        const langList = document.querySelectorAll('.Layout-sidebar .list-style-none li a span.color-fg-default');
        if (langList.length > 0) {
            languages = Array.from(langList).map(s => s.innerText).join(', ');
        }
    }

    return {
        success: true,
        fileCount: fileCount,
        languages: languages
    };
}
