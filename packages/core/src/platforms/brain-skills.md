# /brain

Your personal AI brain, powered by graphify.

## Usage

```
/brain update              — rebuild the graph from raw/ and sync via git  (run inside brain folder)
/brain add <url>           — fetch a URL and add it to raw/                (run inside brain folder)
/brain templates           — list available templates                       (run inside brain folder)
/brain wiki                — generate agent-crawlable wiki from the graph  (run inside brain folder)
/brain obsidian            — generate Obsidian vault export from the graph (run inside brain folder)
/brain query <question>    — query the knowledge graph                     (works from anywhere)
/brain path <a> <b>        — find shortest path between two concepts        (works from anywhere)
/brain status              — show graph stats and tool version              (works from anywhere)
```

---

## For /brain update

Use the `skill` tool to load the skill named `graphify`, then follow its instructions as if the user typed:

```
/graphify ./raw --update
```

After the graph rebuilds, check the brain sync config:

```bash
cat .brain-config.json
```

If `gitSync` is `false` or the file does not exist, stop here — do not commit or push.

If `gitSync` is `true`, check what changed:

```bash
git diff --stat HEAD
```

Write a meaningful commit message based on what actually changed in `raw/` and `graphify-out/` (e.g. "brain: add 2 articles on Rust ownership, update graph"). Then commit and push:

```bash
git add . && git commit -m "<generated message>" && git push
```

---

## For /brain add <url>

Use the `skill` tool to load the skill named `graphify`, then follow its instructions as if the user typed:

```
/graphify add <url>
```

---

## For /brain templates

```bash
npx ai-brain templates
```

---

## For /brain wiki

Use the `skill` tool to load the skill named `graphify`, then follow its instructions as if the user typed:

```
/graphify ./raw --wiki
```

This generates `graphify-out/wiki/` — an agent-crawlable index and one markdown article per community.

---

## For /brain obsidian

First, check if the vault is configured:

```bash
cat .brain-config.json | jq '.obsidianDir'
```

- If `null` (not configured): Tell the user to run `ai-brain setup-obsidian` in the brain root folder to configure the vault first.
- If set: Use the skill tool to load `graphify` and run with the configured path:

```
/graphify ./raw --obsidian --obsidian-dir "<obsidianDir from config>"
```

---

## For /brain query <question>

Use the `ai-brain` MCP tool `query_graph` with the question. Present the result as a clear human-readable answer.

---

## For /brain path <a> <b>

Use the `ai-brain` MCP tool `shortest_path` with the two concepts. Explain the path in plain language.

---

## For /brain status

```bash
npx ai-brain status
```
