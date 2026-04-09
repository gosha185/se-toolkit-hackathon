# Decision Maker

AI-powered decision helper that helps users make unbiased choices with support for weighted options, decision history, and natural language AI interaction.

## Demo

![Dashboard - Decision Making](https://disk.yandex.ru/i/_-ozTWN7qDrwCA)

![AI Agent Chat Interface](https://disk.yandex.ru/i/pVN44K5-c-E0TA)

## Product Context

### End Users
- People who struggle with everyday decisions (what to eat, what to watch, what book to read)
- Teams that need to randomly distribute tasks or choose between options
- AI enthusiasts who want to interact with AI for decision-making

### Problem
Every day we face countless small decisions that cause stress and waste time on deliberation. Users often get stuck on the same options, ignoring other possibilities. Additionally, traditional random number generators don't account for preferences and don't help diversify choices.

### Solution
Decision Maker provides a simple and intuitive interface for making decisions with two modes:
1. **Manual Mode** — enter options with weights and let the system choose randomly
2. **AI Agent** — simply describe your problem in natural language, and the AI will help you make a decision based on your history

The system also tracks decision history to automatically diversify choices and avoid repetition.

## Features

### ✅ Implemented
- **Weighted Random Selection** — assign different weights/probabilities to options
- **Decision History** — store and review all past decisions
- **AI Agent** — chat with AI for natural language decision-making
- **History Awareness** — automatic choice variation to avoid repetition
- **User Authentication** — secure login/password system with JWT
- **Modern UI** — responsive design with React and Bootstrap
- **SQLite Database** — lightweight, zero-configuration setup

### 🚧 Not Yet Implemented
- Categories/tags for decisions
- Decision history export
- Sharing decisions with others
- Decision templates
- Analytics dashboard
- Mobile application
- Multiple AI provider support
- Voice input

## Usage

### Manual Mode
1. Open the application and log in
2. Navigate to the **"New Decision"** page
3. Enter a question (e.g., *"What should I eat?"*)
4. Add options with optional weights:
   - Pizza (weight: 3) — 3x more likely
   - Sushi (weight: 2) — 2x more likely
   - Burgers (weight: 1) — normal chance
5. Enable **"Use history to vary decisions"** to avoid repetition
6. Click **"Decide for Me!"**

### AI Agent Mode
1. Navigate to the **"AI Agent"** page
2. Describe your task in natural language:
   - *"Choose between pizza, sushi, or burgers"*
   - *"Help me pick: movie, book, or game"*
   - *"Pick a color: blue (weight: 3), green, yellow"*
3. The AI will understand your request and make a decision for you

### Decision History
1. Navigate to the **"History"** page
2. View all your past decisions
3. Use search to find specific decisions
4. Review selected options and their weights

## Deployment

### Virtual Machine Requirements
- **OS:** Ubuntu 24.04 LTS (or another Linux distribution)
- **Minimum resources:** 1 vCPU, 1 GB RAM, 10 GB disk

### Required Software
- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **Docker** and **Docker Compose** (recommended)
- **Git**

### Step-by-Step Instructions

#### Option 1: Docker (Recommended)

1. **Install Docker and Docker Compose**
```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common

# Add Docker GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

2. **Clone the repository**
```bash
git clone https://github.com/inno-se-toolkit/se-toolkit-hackathon
cd se-toolkit-hackathon
```

3. **Configure environment**
```bash
cp .env.example .env
nano .env
# Add your QWEN_API_KEY
```

4. **Build and run**
```bash
docker-compose up -d
```

5. **Open your browser**
```
http://<your-vm-ip>:5000
```

#### Option 2: Local Installation

1. **Install Node.js**
```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Node.js and npm
sudo apt install -y nodejs npm

# Check versions
node -v  # Should be v16+
npm -v
```

2. **Clone the repository**
```bash
git clone https://github.com/inno-se-toolkit/se-toolkit-hackathon
cd se-toolkit-hackathon
```

3. **Install dependencies**
```bash
npm run install-all
```

4. **Configure environment**
```bash
cp .env.example .env
nano .env
# Add your QWEN_API_KEY
```

5. **Start the application**
```bash
# Development mode (starts both backend and frontend)
npm run dev

# Or separately:
# npm run server  # backend only
# npm run client  # frontend only
```

6. **Open your browser**
```
Frontend: http://<your-vm-ip>:3000
Backend API: http://<your-vm-ip>:5000
```

#### Reverse Proxy Setup (Optional)

For production deployment, it's recommended to set up Nginx as a reverse proxy:

```bash
sudo apt install -y nginx
sudo nano /etc/nginx/sites-available/decision-maker
```

Example Nginx configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $http_host;
    }
}
```

Activate the configuration:
```bash
sudo ln -s /etc/nginx/sites-available/decision-maker /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```
