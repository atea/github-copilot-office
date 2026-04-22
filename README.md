# GitHub Copilot for Office — Atea Edition

> [!IMPORTANT]
> This is a **preview / proof-of-concept**. Things might break, and APIs may change.

An Office Add-in that brings **GitHub Copilot** directly into Word, Excel and PowerPoint — enhanced with **Atea brand design skills** and **Microsoft Work IQ** (calendar, email, Teams, people search via MCP).

---

## ✨ What can it do?

| Capability | Example prompt |
|---|---|
| **Create on-brand presentations** | *"Create a 5-slide customer pitch for Atea's cloud services using our brand guidelines"* |
| **Read & edit documents** | *"Summarise this Word document in three bullet points"* |
| **Work with spreadsheets** | *"Create a chart from the data in A1:D10"* |
| **Access your M365 data** | *"What meetings do I have tomorrow?"* |
| **Search people & org** | *"Find the person responsible for Azure at Atea"* |
| **Combine it all** | *"Check my calendar for next week and create a PowerPoint status update using Atea branding"* |

---

## 🚀 Getting Started

### Prerequisites

| Requirement | Notes |
|---|---|
| **Node.js 20+** | [nodejs.org](https://nodejs.org/) |
| **GitHub Copilot license** | Individual, Business or Enterprise |
| **Microsoft 365** | Office on the web or desktop (with add-in support) |
| **Git** | To clone the repo |

### 1. Clone & install

```bash
git clone https://github.com/atea/github-copilot-office.git
cd github-copilot-office
npm install
```

### 2. Register the add-in manifest

**macOS / Linux:**
```bash
./register.sh
```

**Windows (PowerShell):**
```powershell
.\register.ps1
```

This tells Office where to find the add-in and trusts the local SSL certificate.

### 3. Start the server

```bash
npm run start:tray
```

The server starts on `https://localhost:52390`. Keep this terminal open.

### 4. Load the add-in in Office

1. Open **PowerPoint**, **Word** or **Excel** (desktop or web)
2. Go to **Insert → Add-ins → My Add-ins**
3. Under **Shared Folder** (desktop) or **My Organization** (web), select **GitHub Copilot**
4. The Copilot chat panel appears on the right side

### 5. Sign in

The first time you open the add-in you'll be prompted to sign in with your **GitHub account**. This authenticates you against your Copilot license.

> **📖 For more detailed setup instructions, see [GETTING_STARTED.md](GETTING_STARTED.md).**
>
> **🔧 For the full list of Office tools, see [TOOLS_CATALOG.md](TOOLS_CATALOG.md).**

---

## 🎨 Prompting with the Atea Design Skill

The add-in includes the **Atea Corporate** design skill, which teaches Copilot the full Atea brand guidelines — colors, typography, layout rules, and do's & don'ts. Every slide it generates follows the Atea visual identity automatically.

### Good prompts

| Prompt | What happens |
|---|---|
| *"Create a title slide for a presentation about cloud migration"* | Creates a slide with Atea Green (#008A00), Arial Bold title, proper 16:9 layout |
| *"Add a slide with three key benefits in the green-box pattern"* | Uses the signature Atea green box motif with white text |
| *"Build a 5-slide deck: title, agenda, three content slides about our managed services offering"* | Full branded deck with consistent styling |
| *"Make a slide comparing on-prem vs cloud costs with a chart"* | Chart using Atea's color sequence (Green, Grey, Bright Green, Light Grey…) |

### Tips for best results

- **Be specific about content** — give Copilot the actual text/data, not just the topic
- **Mention the number of slides** — *"Create 5 slides about…"* works better than *"Create a presentation about…"*
- **Ask for specific layouts** — *"Use a two-column layout"* or *"Add a full-width image slide"*
- **Iterate** — after generating, say *"Make the title shorter"* or *"Change the subtitle to…"*
- **Reference the brand** — *"Use Atea branding"* or *"Follow our brand guidelines"* reinforces the design skill

---

## 🔌 Prompting with Work IQ (M365 Integration)

Work IQ connects Copilot to your **Microsoft 365 data** via MCP — emails, calendar, Teams messages, documents and people.

### Good prompts

| Prompt | What it does |
|---|---|
| *"What meetings do I have this week?"* | Queries your Outlook calendar |
| *"Summarise my unread emails"* | Reads your inbox via Microsoft Graph |
| *"Find Teams messages about the Azure migration project"* | Searches your Teams conversations |
| *"Who in Atea works on Kubernetes?"* | People search across the organization |
| *"Check my calendar for Monday and create a PowerPoint agenda slide"* | Combines Work IQ + Office tools + design skill |

### First-time setup

When you first ask a Work IQ question, you'll be prompted to **sign in with your Microsoft account**. This is a one-time consent per session.

---

## 💡 Why this instead of regular M365 Copilot?

| | M365 Copilot | This Add-in |
|---|---|---|
| **Model** | GPT-4o (Microsoft-hosted) | GitHub Copilot models (GPT-4o, Claude, etc.) — you choose |
| **Brand awareness** | Generic styling | Atea brand guidelines baked in via skills |
| **Extensibility** | Limited to Microsoft's built-in capabilities | MCP servers, custom skills, custom tools |
| **Presentation quality** | Basic slide generation | Code-level PowerPoint control (shapes, charts, formatting) |
| **M365 data access** | Built-in | Via Work IQ MCP (calendar, email, Teams, people) |
| **Cost** | $30/user/month M365 Copilot license | GitHub Copilot license (included if you already have one) |
| **Customisation** | None | Add your own skills, MCP servers and tools |
| **Transparency** | Black box | Open source — inspect and modify everything |

### Key advantages

1. **On-brand by default** — every slide follows Atea's design system without manual fixing
2. **Model choice** — switch between GPT-4o, Claude Sonnet, and other models
3. **Composable** — combine Office tools + M365 data + custom skills in a single prompt
4. **Extensible** — add new MCP servers (e.g. Jira, ServiceNow) or custom tools
5. **Cost-effective** — no additional M365 Copilot license needed if you already have GitHub Copilot

---

## 🛠 Available Design Skills

| Skill | Description |
|---|---|
| `atea-corporate` | Full Atea brand — colors, typography, layouts, green-box pattern |
| `github-brand` | GitHub brand guidelines |
| `microsoft-default` | Microsoft presentation defaults |
| `minimal-light` | Clean minimal design |

Skills are loaded from the `skills/` directory. Each skill contains a `SKILL.md` file with design guidelines that Copilot follows when creating presentations.

---

## Office Videos

### PowerPoint
https://github.com/user-attachments/assets/4c2731e4-e157-4968-842f-e496a6e8ed8b

### Excel
https://github.com/user-attachments/assets/42478d69-fd26-415e-8ef7-4efe8450d695

### Word
https://github.com/user-attachments/assets/41408f8d-a9b8-45b6-a826-f50931c7c249

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build frontend for production |
| `npm run start:tray` | Run production server |

## Troubleshooting

**Add-in doesn't appear in Office:**
- Make sure you ran `./register.sh` (or `.\register.ps1`)
- Restart Office after registering
- Check that the dev server is running (`npm run dev`)

**Stuck on "Connecting…":**
- Make sure `npm run start:tray` is running and showing `Server running on https://localhost:52390`
- Try refreshing the add-in panel (close and reopen)

**Work IQ not responding:**
- Ensure you have internet access and `npx` is available in your PATH
- Run `workiq accept-eula` once to accept End User License Agreement from Microsoft
- Sign in when prompted — Work IQ requires Microsoft account consent

**SSL Certificate errors:**
- Re-run the register script (`./register.sh`)
- Or manually trust `certs/localhost.pem`
