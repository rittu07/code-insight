# CodeInsight - Explainer & Repo Analyzer

CodeInsight is a powerful Chrome extension designed to help developers understand code faster. It offers one-click code explanations, GitHub repository complexity analysis, and a helper for programming questions.

## Features

-   **Code Explanation**: Select any code snippet on a webpage, right-click, and get a detailed explanation instantly.
-   **Repo Analyzer**: Analyze the complexity of GitHub repositories to get insights into the project structure and size.
-   **Q&A Helper**: Highlight a programming question or problem statement to generate pseudocode and a conceptual overview.
-   **Complexity Analysis**: Visual breakdown of file sizes, languages used, and estimated maintenance effort.

## Technologies Used

-   **Frontend**: HTML, CSS, JavaScript
-   **Extension**: Chrome Extension Manifest V3
-   **Analysis**: Heuristic-based code complexity algorithms

## Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/rittu07/code-insight.git
    ```
2.  Open Chrome and navigate to `chrome://extensions/`.
3.  Enable **Developer mode** in the top right.
4.  Click **Load unpacked** and select the `code-insight` directory.

## Usage

1.  **Explain Code**: Highlight a snippet, right-click, and select "Explain Code".
2.  **Analyze Repo**: Navigate to a GitHub repository page and click the extension icon to see analysis stats.
3.  **Ask Question**: Select a problem description and choose "Explain Question" to get pseudocode.

