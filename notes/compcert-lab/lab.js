import { examples } from "./examples.js";
import { recordedAssembly } from "./assembly.js";
import { development, rtl, stages, traceCommand, upstream } from "./guide.js";

const byId = id => document.getElementById(id);
const exampleSelect = byId("example");
const editor = byId("source");
const optimization = document.querySelectorAll('input[name="optimization"]');
const compileButton = byId("compile");
const output = byId("output");
const outputCode = output.querySelector("code");
const copyOutput = byId("copy-output");
const lineNumbers = byId("line-numbers");
const drafts = new Map();
let currentExample = exampleSelect.value;
let activeRequest;

function makeDownload(link, { source, filename }) {
  link.href = `data:text/plain;charset=utf-8,${encodeURIComponent(source)}`;
  link.download = filename;
}

function setStatus(message, state = "") {
  const status = byId("compile-status");
  status.textContent = message;
  status.dataset.state = state;
}

function syncLineNumbers() {
  const count = editor.value.split("\n").length;
  lineNumbers.textContent = Array.from({ length: count }, (_, i) => i + 1).join("\n");
  lineNumbers.scrollTop = editor.scrollTop;
}

function highlightAssembly(text) {
  const content = document.createDocumentFragment();
  for (const line of text.split("\n")) {
    const instruction = /^(\s*)([a-z][a-z\d]*)\b(.*)$/i.exec(line);
    if (line.endsWith(":")) {
      const label = document.createElement("span");
      label.className = "code-heading";
      label.textContent = line;
      content.append(label);
    } else if (instruction) {
      const [, indent, opcode, operands] = instruction;
      const token = document.createElement("span");
      token.className = "code-op";
      token.textContent = opcode;
      content.append(indent, token);
      for (const part of operands.split(/(\$-?\d+)/)) {
        if (part.startsWith("$")) {
          const immediate = document.createElement("span");
          immediate.className = "code-immediate";
          immediate.textContent = part;
          content.append(immediate);
        } else {
          content.append(part);
        }
      }
    } else {
      content.append(line);
    }
    content.append("\n");
  }
  content.lastChild.remove();
  return content;
}

function showOutput(assembly, diagnostic = "") {
  const title = byId("output-title");
  title.textContent = assembly ? "Assembly" : "Diagnostics";
  outputCode.replaceChildren();
  if (diagnostic) {
    const message = document.createElement("span");
    message.className = "code-diagnostic";
    message.textContent = diagnostic;
    outputCode.append(message);
    if (assembly) outputCode.append("\n\n");
  }
  if (assembly) outputCode.append(highlightAssembly(assembly));
  copyOutput.disabled = !outputCode.textContent;
  output.scrollTo(0, 0);
}

function selectedFlag() {
  return document.querySelector('input[name="optimization"]:checked').value;
}

function stopCompile() {
  activeRequest?.abort();
  activeRequest = undefined;
  compileButton.disabled = false;
  output.removeAttribute("aria-busy");
}

function updatePreview() {
  stopCompile();
  const flag = selectedFlag();
  if (editor.value === examples[currentExample].source) {
    showOutput(recordedAssembly[currentExample][flag]);
    setStatus(`Recorded output · x86-64 Linux · ${flag}`);
  } else {
    showOutput("", "Press Compile to see the output for this source.");
    copyOutput.disabled = true;
    setStatus(`Ready to compile · ${flag}`);
  }
}

function loadExample() {
  currentExample = exampleSelect.value;
  const example = examples[currentExample];
  editor.value = drafts.get(currentExample) ?? example.source;
  editor.scrollTop = 0;
  editor.scrollLeft = 0;
  byId("source-name").textContent = example.filename;
  byId("example-note").textContent = example.note;
  makeDownload(byId("download-source"), example);
  byId("local-commands").textContent =
    `ccomp -O1 -S ${example.filename}\n` +
    `ccomp -O1 -c ${example.filename}\n` +
    `ccomp -o demo ${example.filename.replace(/\.c$/, ".o")}\n` +
    "./demo\nprintf 'exit status: %s\\n' \"$?\"";
  syncLineNumbers();
  updatePreview();
}

async function compile() {
  if (!editor.value.trim()) {
    setStatus("Enter a C program first.", "error");
    editor.focus();
    return;
  }
  const flag = selectedFlag();
  const request = new AbortController();
  activeRequest = request;
  compileButton.disabled = true;
  output.setAttribute("aria-busy", "true");
  setStatus(`Compiling · ${flag}`);
  const timeout = setTimeout(() => request.abort(), 20000);
  try {
    const response = await fetch("https://godbolt.org/api/compiler/ccx8664_318/compile", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        source: editor.value,
        options: {
          userArguments: flag,
          filters: { directives: true, labels: true, commentOnly: true },
        },
      }),
      signal: request.signal,
    });
    if (!response.ok) throw new Error(`Compiler Explorer returned HTTP ${response.status}.`);
    const result = await response.json();
    if (activeRequest !== request) return;

    const diagnostics = [...(result.stderr ?? []), ...(result.stdout ?? [])]
      .map(line => line.text).join("\n").trim();
    if (result.code !== 0 || result.timedOut) {
      showOutput("", diagnostics || "The compiler returned no diagnostic.");
      setStatus(result.timedOut ? "Compilation timed out" : "Compilation failed", "error");
      return;
    }
    const assembly = (result.asm ?? []).map(line => line.text).join("\n").trimEnd();
    showOutput(assembly, diagnostics || (assembly ? "" : "No assembly was emitted."));
    setStatus(result.truncated ? `Output truncated · ${flag}` : `Compiled · x86-64 Linux · ${flag}`, "success");
  } catch (error) {
    if (activeRequest !== request) return;
    const reason = request.signal.aborted ? "The request timed out." : error.message;
    updatePreview();
    setStatus(`${reason} Try again or run locally.`, "error");
  } finally {
    clearTimeout(timeout);
    if (activeRequest === request) stopCompile();
  }
}

exampleSelect.addEventListener("change", loadExample);
for (const control of optimization) control.addEventListener("change", updatePreview);
editor.addEventListener("input", () => {
  drafts.set(currentExample, editor.value);
  syncLineNumbers();
  updatePreview();
});
editor.addEventListener("scroll", () => {
  lineNumbers.scrollTop = editor.scrollTop;
});
byId("reset").addEventListener("click", () => {
  drafts.delete(currentExample);
  loadExample();
  editor.focus();
});
compileButton.addEventListener("click", compile);

const copyTimers = new WeakMap();
async function copyText(button, content) {
  clearTimeout(copyTimers.get(button));
  try {
    await navigator.clipboard.writeText(content);
    button.textContent = "Copied";
  } catch {
    button.textContent = "Copy unavailable";
  }
  copyTimers.set(button, setTimeout(() => { button.textContent = "Copy"; }, 1700));
}

copyOutput.addEventListener("click", () => copyText(copyOutput, outputCode.textContent));
for (const button of document.querySelectorAll("[data-copy]")) {
  button.addEventListener("click", () => copyText(button, byId(button.dataset.copy).textContent));
}

function setupTabs(list, panel, render) {
  const tabs = [...list.querySelectorAll('[role="tab"]')];
  function activate(tab) {
    for (const item of tabs) {
      const selected = item === tab;
      item.setAttribute("aria-selected", selected);
      item.tabIndex = selected ? 0 : -1;
    }
    panel.setAttribute("aria-labelledby", tab.id);
    render(tab);
  }
  for (const tab of tabs) tab.addEventListener("click", () => activate(tab));
  list.addEventListener("keydown", event => {
    if (!tabs.includes(event.target)) return;
    const index = tabs.indexOf(event.target);
    const positions = {
      ArrowLeft: (index + tabs.length - 1) % tabs.length,
      ArrowRight: (index + 1) % tabs.length,
      Home: 0,
      End: tabs.length - 1,
    };
    if (!Object.hasOwn(positions, event.key)) return;
    event.preventDefault();
    const tab = tabs[positions[event.key]];
    activate(tab);
    tab.focus();
  });
  activate(tabs.find(tab => tab.getAttribute("aria-selected") === "true"));
}

function renderStage(key) {
  const stage = stages[key];
  const isRtl = key === "rtl";
  const comparison = byId("rtl-view").value;
  byId("stage-title").textContent = stage.title;
  byId("stage-file").textContent = stage.file;
  byId("stage-description").textContent = stage.info;
  byId("stage-link").href = upstream + stage.file;
  byId("rtl-control").hidden = !isRtl;
  byId("stage-caption").textContent = isRtl
    ? `choose.rtl.${comparison === "before" ? 3 : 4} · excerpt`
    : stage.caption;
  const code = byId("stage-code");
  code.textContent = isRtl ? rtl[comparison] : stage.code;
  code.parentElement.scrollTo(0, 0);
}

function renderDevelopment(key) {
  const step = development[key];
  byId("dev-title").textContent = step.title;
  byId("dev-description").textContent = step.info;
  byId("dev-caption").textContent = step.caption;
  const code = byId("dev-code");
  code.textContent = step.code(byId("target").value).trimEnd();
  code.parentElement.scrollTo(0, 0);
  byId("target-control").hidden = key !== "build";
  byId("dev-download").hidden = key !== "trace";
  const link = byId("dev-link");
  link.href = step.link;
  link.textContent = step.linkText;
}

function updateExperiment() {
  const fuel = Number(byId("fuel").value);
  const condition = byId("condition").value;
  const visited = ["entry"];
  if (fuel > 0) visited.push("branch");
  if (fuel > 1 && condition !== "unknown") visited.push(condition);
  const last = visited.at(-1);
  for (const node of document.querySelectorAll("[data-node]")) {
    node.toggleAttribute("data-visited", visited.includes(node.dataset.node));
    if (node.dataset.node === last) node.setAttribute("aria-current", "step");
    else node.removeAttribute("aria-current");
  }
  const messages = {
    entry: "L1 remains the successor. A zero budget stops immediately.",
    branch: fuel === 1
      ? "L2 becomes the successor. Skipping the no-op used the only step."
      : "L2 becomes the successor. The branch is still unknown.",
    true: "L3 becomes the successor. The known true edge bypasses the branch.",
    false: "L4 becomes the successor. The known false edge bypasses the branch.",
  };
  byId("experiment-result").textContent = messages[last];
}

byId("rtl-view").addEventListener("change", () => renderStage("rtl"));
byId("target").addEventListener("change", () => renderDevelopment("build"));
byId("fuel").addEventListener("change", updateExperiment);
byId("condition").addEventListener("change", updateExperiment);
byId("trace-command").textContent = traceCommand;
makeDownload(byId("trace-download"), examples.branch);
makeDownload(byId("dev-download"), examples.branch);

loadExample();
setupTabs(byId("stage-tabs"), byId("stage-panel"), tab => renderStage(tab.dataset.stage));
setupTabs(byId("dev-tabs"), byId("dev-panel"), tab => renderDevelopment(tab.dataset.step));
updateExperiment();
