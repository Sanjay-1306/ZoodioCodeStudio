import express from "express";
import cors from "cors";
import { spawn } from "child_process";
import fs from "fs/promises";
import os from "os";
import path from "path";
import crypto from "crypto";

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

const tempRoot = path.join(os.tmpdir(), "zoodio-code-studio");

async function runProcess(command, args, options = {}) {
  return new Promise((resolve) => {
    const process = spawn(command, args, {
      cwd: options.cwd,
      windowsHide: true,
    });

    let stdout = "";
    let stderr = "";
    let finished = false;

    const timer = setTimeout(() => {
      if (!finished) {
        finished = true;
        process.kill();
        resolve({
          stdout,
          stderr: "Execution timed out.",
        });
      }
    }, 10000);

    process.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    process.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    process.on("error", (error) => {
      clearTimeout(timer);

      if (!finished) {
        finished = true;
        resolve({
          stdout,
          stderr: error.message,
        });
      }
    });

    process.on("close", () => {
      clearTimeout(timer);

      if (!finished) {
        finished = true;
        resolve({
          stdout,
          stderr,
        });
      }
    });
  });
}

async function executeJavaScript(code) {
  const directory = path.join(tempRoot, crypto.randomUUID());

  await fs.mkdir(directory, { recursive: true });

  const file = path.join(directory, "main.js");

  await fs.writeFile(file, code, "utf8");

  const result = await runProcess("node", [file]);

  await fs.rm(directory, {
    recursive: true,
    force: true,
  });

  return result;
}

async function executePython(code) {
  const directory = path.join(tempRoot, crypto.randomUUID());

  await fs.mkdir(directory, { recursive: true });

  const file = path.join(directory, "main.py");

  await fs.writeFile(file, code, "utf8");

  const result = await runProcess("python", [file]);

  await fs.rm(directory, {
    recursive: true,
    force: true,
  });

  return result;
}

async function executeJava(code) {
  const directory = path.join(tempRoot, crypto.randomUUID());

  await fs.mkdir(directory, { recursive: true });

  const source = path.join(directory, "Main.java");

  await fs.writeFile(source, code, "utf8");

  const compileResult = await runProcess("javac", [source]);

  if (compileResult.stderr) {
    await fs.rm(directory, {
      recursive: true,
      force: true,
    });

    return compileResult;
  }

  const runResult = await runProcess("java", ["-cp", directory, "Main"]);

  await fs.rm(directory, {
    recursive: true,
    force: true,
  });

  return runResult;
}

app.get("/", (req, res) => {
  res.json({
    message: "Zoodio Code Studio Backend is running",
  });
});

app.post("/api/run", async (req, res) => {
  try {
    const { language, code } = req.body;

    if (!language || typeof code !== "string") {
      return res.status(400).json({
        success: false,
        error: "Language and code are required.",
      });
    }

    let result;

    switch (language) {
      case "javascript":
        result = await executeJavaScript(code);
        break;

      case "python":
        result = await executePython(code);
        break;

      case "java":
        result = await executeJava(code);
        break;

      default:
        return res.status(400).json({
          success: false,
          error: "Unsupported language.",
        });
    }

    const output = result.stdout || "";
    const error = result.stderr || "";

    res.json({
      success: !error,
      output,
      error,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.listen(PORT, async () => {
  await fs.mkdir(tempRoot, { recursive: true });

  console.log(`Zoodio Code Studio backend running on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
});
