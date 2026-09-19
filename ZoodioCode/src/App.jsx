import "./App.css";
import "@fontsource/poppins";
import Editor from "@monaco-editor/react";
import { useState } from "react";

const defaultCode = {
  javascript: `console.log("Hello from JavaScript!");`,

  python: `print("Hello from Python!")`,

  java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from Java!");
    }
}`,
};

const editorConfig = {
  javascript: {
    label: "JavaScript",
    file: "script.js",
    language: "javascript",
  },

  python: {
    label: "Python",
    file: "main.py",
    language: "python",
  },

  java: {
    label: "Java",
    file: "Main.java",
    language: "java",
  },
};

function App() {
  const [select, setSelect] = useState("javascript");

  const [codeByLanguage, setCodeByLanguage] = useState(defaultCode);

  const [output, setOutput] = useState(
    "> Click Run to execute the selected code.",
  );

  const [isRunning, setIsRunning] = useState(false);

  const activeEditor = editorConfig[select];

  const activeCode = codeByLanguage[select] || "";

  const handleEditorChange = (value) => {
    setCodeByLanguage((prev) => ({
      ...prev,
      [select]: value || "",
    }));
  };

  const runCode = async () => {
    if (isRunning) return;

    const codeToRun = activeCode.trim();

    if (!codeToRun) {
      setOutput("> No code entered. Please write something first.");
      return;
    }

    setIsRunning(true);

    setOutput(`> Running ${activeEditor.file}...`);

    try {
      const response = await fetch("https://zoodio-code-studio-u5eo.vercel.app/api/run", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          language: activeEditor.language,
          code: codeToRun,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error || `Request failed with status ${response.status}`,
        );
      }

      if (result.success) {
        setOutput(
          `> ${activeEditor.label} execution finished

> Output:

${result.output || "No output returned."}`,
        );
      } else {
        setOutput(
          `> ${activeEditor.label} execution failed

> Error:

${result.error || "Unknown execution error."}`,
        );
      }
    } catch (error) {
      setOutput(
        `> Execution Error:

${error.message}

> Make sure the backend is running on http://localhost:5000`,
      );
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">Z</div>

          <div className="brand-text">
            <strong>Zoodio</strong>
            <span>Code Studio</span>
          </div>
        </div>

        <nav className="language-nav" aria-label="Language selector">
          {Object.entries(editorConfig).map(([key, editor]) => (
            <button
              key={key}
              type="button"
              className={`language-btn ${select === key ? "active" : ""}`}
              onClick={() => setSelect(key)}
            >
              <span className={`lang-dot ${key}`}>
                {editor.label.slice(0, 2)}
              </span>

              {editor.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="editor-panel">
        <header className="topbar">
          <div className="topbar-left">
            <div className="window-controls">
              <span className="dot red"></span>
              <span className="dot yellow"></span>
              <span className="dot green"></span>
            </div>

            <div className="file-tab">{activeEditor.file}</div>
          </div>

          <div className="topbar-right">
            <button
              type="button"
              className="ghost-button"
              onClick={runCode}
              disabled={isRunning}
            >
              {isRunning ? "Running..." : "Run"}
            </button>

            <button type="button" className="primary-button">
              Build
            </button>
          </div>
        </header>

        <div className="editor-toolbar">
          <div className="breadcrumbs">src / {activeEditor.file}</div>

          <div className="status-pills">
            <span className="pill">UTF-8</span>

            <span className="pill">{activeEditor.label}</span>

            <span className="pill success">
              {isRunning ? "Running" : "Ready"}
            </span>
          </div>
        </div>

        <div className="editor-surface">
          <Editor
            className="code-editor"
            height="100%"
            language={activeEditor.language}
            theme="vs-dark"
            value={activeCode}
            onChange={handleEditorChange}
            options={{
              minimap: {
                enabled: false,
              },

              fontSize: 14,

              lineNumbersMinChars: 3,

              roundedSelection: false,

              scrollBeyondLastLine: false,

              padding: {
                top: 18,
                bottom: 18,
              },

              fontFamily: "'Fira Code', 'Consolas', monospace",

              wordWrap: "on",
            }}
          />
        </div>

        <section className="output-panel" aria-label="Code output terminal">
          <div className="terminal-header">
            <span className="terminal-title">Output</span>

            <span className="terminal-dot"></span>
          </div>

          <pre className="terminal-output">{output}</pre>
        </section>
      </main>
    </div>
  );
}

export default App;
