# 🎯 Decision Maker - AI-Powered Decision Helper

A full-featured web application that helps users make unbiased, random decisions with support for weighted options, decision history, and an AI agent for natural language interaction.

## ✨ Features

### Core Functionality
- **Weighted Random Selection** - Assign different weights/chances to options
- **History-Aware Decisions** - Automatically varies choices to avoid repetition
- **Decision History** - Store and review all past decisions
- **User Authentication** - Secure login/password system with JWT
- **SQLite Database** - Lightweight, zero-configuration database

### AI Agent
- **Natural Language Processing** - Chat with an AI agent to make decisions
- **Context Awareness** - Agent understands your decision history
- **No Commands Needed** - Just describe what you need help with

### User Interface
- **Modern React Frontend** - Built with React and Bootstrap
- **Responsive Design** - Works on desktop and mobile
- **Real-time Feedback** - Animated decision results and visual weights
- **Search & Filter** - Find past decisions easily

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Docker (optional, recommended)

### Option 1: Docker (Recommended)

```bash
# 1. Configure environment
cp .env.example .env
# Edit .env and add your QWEN_API_KEY

# 2. Build and run
docker-compose up -d

# 3. Open http://localhost:5000
```

See [DOCKER.md](DOCKER.md) for detailed instructions.

### Option 2: Local Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd se-toolkit-hackathon
```

2. **Install dependencies**
```bash
npm run install-all
```

3. **Configure environment**
```bash
# Copy .env.example to .env
copy .env.example .env

# Edit .env and add your Qwen API key
# QWEN_API_KEY=your-qwen-api-key-here
```

4. **Start the application**

**Development mode (runs both backend and frontend):**
```bash
npm run dev
```

**Or start separately:**
```bash
# Backend only
npm run server

# Frontend only (in another terminal)
npm run client
```

5. **Open your browser**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 📖 Usage

### Making a Decision (Manual Mode)
1. Navigate to "New Decision" page
2. Enter your question (e.g., "What should I eat?")
3. Add options with optional weights:
   - Pizza (weight: 3) - 3x more likely to be chosen
   - Sushi (weight: 2) - 2x more likely
   - Burgers (weight: 1) - Normal chance
4. Toggle "Use history to vary decisions" to avoid repetition
5. Click "Decide for Me!"

### Using AI Agent
1. Go to "AI Agent" page
2. Type naturally what you need help with:
   - "Should I eat pizza, sushi, or burgers?"
   - "Help me choose between: movie, book, game"
   - "Pick a color: blue (weight: 3), green, yellow"
3. The agent will understand and make a decision for you

### Viewing History
1. Navigate to "History" page
2. See all your past decisions
3. Search for specific decisions
4. Review chosen options and weights

## 🏗️ Architecture

### Backend (Node.js + Express)
```
backend/
├── server.js              # Express server setup
├── database.js            # SQLite initialization & schema
├── middleware/
│   └── auth.js            # JWT authentication
├── routes/
│   ├── auth.js            # Login/Register endpoints
│   ├── decisions.js       # Decision CRUD & history
│   └── agent.js           # AI agent chat & decisions
└── utils/
    └── randomizer.js      # Weighted selection logic
```

### Frontend (React)
```
frontend/
├── src/
│   ├── App.js             # Main app with routing
│   ├── index.js           # Entry point
│   ├── context/
│   │   └── AuthContext.js # Authentication state
│   ├── services/
│   │   └── api.js         # API client
│   └── components/
│       ├── Login.js
│       ├── Register.js
│       ├── Navbar.js
│       ├── Dashboard.js        # Main decision maker
│       ├── DecisionResult.js   # Result display
│       ├── History.js          # Decision history
│       └── AgentChat.js        # AI agent interface
```

### Database Schema
```
users               - User accounts
decision_requests   - Decision queries
options             - Available choices with weights
decisions           - Made decisions (chosen options)
chat_sessions       - AI conversation sessions
```

## ⚙️ Configuration

### Environment Variables
```env
PORT=5000                           # Backend server port
JWT_SECRET=your-secret-key          # Secret for JWT tokens
OPENAI_API_KEY=your-key            # OpenAI API key (optional)
DATABASE_PATH=./database.sqlite     # SQLite database file
```

### Weight System
- Weight = 1: Normal chance
- Weight = 2: 2x more likely to be chosen
- Weight = 0.5: Half the normal chance
- Weight = 0: Never chosen (excluded)

### History Awareness
When enabled, the system reduces the weight of frequently chosen options to promote variety. For example:
- If "Pizza" was chosen 5 times recently
- And "Sushi" was chosen 1 time
- Pizza's effective weight is reduced by up to 50%

## 🧪 Testing

### Test Backend APIs
```bash
# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass123"}'

# Make a decision (replace TOKEN with your JWT)
curl -X POST http://localhost:5000/api/decisions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"query":"What to eat?","options":[{"text":"Pizza","weight":3},{"text":"Sushi","weight":2}]}'
```

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Create new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user info

### Decisions
- `POST /api/decisions` - Make a new decision
- `GET /api/decisions/history` - Get decision history
- `GET /api/decisions/:id` - Get decision details
- `GET /api/decisions/stats/summary` - Get user statistics

### AI Agent
- `POST /api/agent/chat` - Chat with AI agent
- `POST /api/agent/decide` - Quick decision via AI

## 🎨 Technologies

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **SQLite3** - Database (better-sqlite3)
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **OpenAI API** - Natural language processing (optional)

### Frontend
- **React 18** - UI library
- **React Router** - Navigation
- **React Bootstrap** - UI components
- **Bootstrap 5** - Styling framework

## 🔐 Security

- Passwords hashed with bcrypt
- JWT token authentication
- Protected API endpoints
- SQL injection prevention (parameterized queries)
- CORS enabled for development

## 🌟 Future Enhancements

- [ ] Categories/tags for decisions
- [ ] Export decision history
- [ ] Share decisions with others
- [ ] Decision templates
- [ ] Analytics dashboard
- [ ] Mobile app
- [ ] Multiple AI providers
- [ ] Voice input support

## 📄 License

MIT

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
