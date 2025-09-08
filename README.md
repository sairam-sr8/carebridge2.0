# 🏥 CareBridge - AI-Powered Mental Health Platform

A comprehensive mental health triage platform connecting patients, doctors, and administrators with AI-powered insights and crisis management.

## 🚀 Features

### 👑 Admin Features
- **User Management** - Create admin, doctor, patient profiles
- **Activity Monitoring** - Real-time activity tracking
- **Crisis Management** - Handle urgent alerts
- **System Analytics** - User stats and reports

### 👨‍⚕️ Doctor Features
- **Patient Management** - View assigned patients
- **Medical Notes** - Treatment notes and history
- **Alert System** - Patient crisis alerts
- **Professional Dashboard** - Clean interface

### 🏥 Patient Features
- **AI Chat Companion** - Mental health support
- **Mood Journal** - Daily mood tracking
- **Progress Analytics** - Mood trends over time
- **Crisis Support** - Emergency resources

## 🛠️ Tech Stack

**Frontend:**
- React 18 + Vite
- React Router v6
- Lucide React Icons
- Modern CSS (Inline Styles)

**Backend:**
- FastAPI (Python)
- SQLAlchemy ORM
- JWT Authentication
- PostgreSQL/SQLite

**Deployment:**
- Frontend: Vercel
- Backend: Railway
- Database: Railway PostgreSQL

## 🔐 Demo Credentials

- **Admin:** `admin@carebridge.com` / `admin123`
- **Doctor:** `doctor@carebridge.com` / `doctor123`
- **Patient:** `patient@carebridge.com` / `patient123`

## 🚀 Local Development

### Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python setup_database.py
python -m uvicorn main:app --reload --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 🌐 Production Deployment

This app is configured for easy deployment:

1. **Fork this repository**
2. **Deploy backend to Railway** - Connect GitHub repo
3. **Deploy frontend to Vercel** - Connect GitHub repo
4. **Set environment variables**
5. **Done!** 🎉

## 📁 Project Structure

```
CareBridge/
├── backend/           # FastAPI backend
│   ├── models.py     # Database models
│   ├── routers/      # API routes
│   ├── main.py       # FastAPI app
│   └── database.py   # Database config
├── frontend/         # React frontend
│   ├── src/
│   │   ├── pages/    # Page components
│   │   ├── components/  # Reusable components
│   │   ├── services/    # API & Auth
│   │   └── config/      # Configuration
│   └── public/       # Static assets
└── README.md
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 💬 Support

For support, email support@carebridge.com or join our Slack channel.

---

**Built with ❤️ for mental health awareness**