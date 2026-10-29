"""LEARNEXA API: authentication, skill matching, exchanges, sessions, and wallet."""

import os
from datetime import datetime, timedelta
from functools import wraps
from pathlib import Path

import jwt
from dotenv import load_dotenv
from flask import Flask, jsonify, request, Response
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import inspect, text
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from werkzeug.security import check_password_hash, generate_password_hash

load_dotenv()

app = Flask(__name__)

# Frontend origins allowed during local development. Set CORS_ORIGINS in production.
cors_origins = os.getenv("CORS_ORIGINS", "*").split(",")
CORS(app) if "*" in cors_origins else CORS(
    app, origins=[origin.strip() for origin in cors_origins]
)

# SQLite keeps local setup simple; MySQL can be selected for deployment.
db_type = os.getenv('DB_TYPE', 'sqlite')
if db_type == 'mysql':
    app.config["SQLALCHEMY_DATABASE_URI"] = (
        f"mysql+pymysql://{os.getenv('DB_USER','root')}:{os.getenv('DB_PASSWORD','')}"
        f"@{os.getenv('DB_HOST','localhost')}:{os.getenv('DB_PORT','3306')}/{os.getenv('DB_NAME','learnexa')}"
    )
else:
    sqlite_path = Path(app.root_path) / "instance" / "learnexa.db"
    sqlite_path.parent.mkdir(parents=True, exist_ok=True)
    app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{sqlite_path.as_posix()}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db = SQLAlchemy(app)
SECRET = os.getenv("JWT_SECRET", "learnexa-demo-secret")

def json_body():
    data = request.get_json(silent=True)
    return data if isinstance(data, dict) else None

# -----------------------------------------------------------------------------
# Database models
# -----------------------------------------------------------------------------

class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    bio = db.Column(db.Text)
    availability = db.Column(db.String(255))
    role = db.Column(db.String(20), default="student", nullable=False)
    is_blocked = db.Column(db.Boolean, default=False, nullable=False)

class Skill(db.Model):
    __tablename__ = "skills"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    category = db.Column(db.String(100))

class UserSkill(db.Model):
    __tablename__ = "user_skills"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    skill_id = db.Column(db.Integer, db.ForeignKey("skills.id"), nullable=False)
    skill_type = db.Column(db.Enum("teach","learn"), nullable=False)
    skill = db.relationship("Skill")

class ExchangeRequest(db.Model):
    __tablename__ = "exchange_requests"
    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    receiver_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    message = db.Column(db.Text)
    status = db.Column(db.Enum("pending","accepted","rejected","completed"), default="pending")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Session(db.Model):
    __tablename__ = "sessions"
    id = db.Column(db.Integer, primary_key=True)
    request_id = db.Column(db.Integer, db.ForeignKey("exchange_requests.id"), nullable=False)
    title = db.Column(db.String(150), nullable=False)
    session_date = db.Column(db.DateTime, nullable=False)
    meeting_link = db.Column(db.String(255))
    status = db.Column(db.Enum("scheduled","completed","cancelled"), default="scheduled")

class Feedback(db.Model):
    __tablename__ = "feedback"
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey("sessions.id"), nullable=False)
    reviewer_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    reviewee_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    rating = db.Column(db.Integer, nullable=False)
    comment = db.Column(db.Text)

class Wallet(db.Model):
    __tablename__ = "wallets"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), unique=True, nullable=False)
    security_amount = db.Column(db.Float, default=0)
    reward_points = db.Column(db.Integer, default=0)

class WalletTransaction(db.Model):
    __tablename__ = "wallet_transactions"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    type = db.Column(db.String(30), nullable=False)     # "security_deposit" | "redeem"
    status = db.Column(db.String(30), default="completed")
    description = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class SessionGoal(db.Model):
    __tablename__ = "session_goals"
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey("sessions.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    goal = db.Column(db.Text, nullable=False)
    completed = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Notification(db.Model):
    __tablename__ = "notifications"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    title = db.Column(db.String(150), nullable=False)
    message = db.Column(db.Text, nullable=False)
    read = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Conversation(db.Model):
    __tablename__ = "conversations"
    id = db.Column(db.Integer, primary_key=True)
    user_one_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    user_two_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Message(db.Model):
    __tablename__ = "messages"
    id = db.Column(db.Integer, primary_key=True)
    conversation_id = db.Column(db.Integer, db.ForeignKey("conversations.id"), nullable=False)
    sender_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    body = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Report(db.Model):
    __tablename__ = "reports"
    id = db.Column(db.Integer, primary_key=True)
    reporter_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    reported_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    reason = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default="open", nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class SkillSuggestion(db.Model):
    __tablename__ = "skill_suggestions"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(100))
    status = db.Column(db.String(20), default="pending", nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# -----------------------------------------------------------------------------
# Authentication helpers
# -----------------------------------------------------------------------------

def token_for(user_id, role="student"):
    return jwt.encode(
        {"user_id": user_id, "role": role, "exp": datetime.utcnow()+timedelta(hours=12)},
        SECRET,
        algorithm="HS256",
    )

def user_json(user):
    return {"id": user.id, "name": user.name, "email": user.email,
            "role": user.role or "student"}

def auth_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        token = request.headers.get("Authorization","").replace("Bearer ","")
        try:
            data = jwt.decode(token, SECRET, algorithms=["HS256"])
            user = db.session.get(User, data["user_id"])
            if not user or user.is_blocked: raise Exception()
            return fn(user, *args, **kwargs)
        except Exception:
            return jsonify({"error":"Unauthorized"}), 401
    return wrapper

def admin_required(fn):
    @wraps(fn)
    @auth_required
    def wrapper(user, *args, **kwargs):
        if (user.role or "student") != "admin":
            return jsonify({"error": "Admin access required"}), 403
        return fn(user, *args, **kwargs)
    return wrapper

# -----------------------------------------------------------------------------
# Public and profile routes
# -----------------------------------------------------------------------------

@app.get("/api/health")
def health():
    return jsonify({"status":"ok","message":"LEARNEXA API is running"})

@app.post("/api/register")
def register():
    data = json_body()
    if data is None:
        return jsonify({"error":"A JSON object is required"}), 400
    name = str(data.get("name", "")).strip()
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))
    if not name or not email or not password:
        return jsonify({"error":"Name, email and password are required"}), 400
    if len(password) < 6:
        return jsonify({"error":"Password must be at least 6 characters"}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"error":"Email already registered"}), 409
    u = User(name=name, email=email, password_hash=generate_password_hash(password))
    db.session.add(u); db.session.commit()
    return jsonify({"message":"Registration successful","token":token_for(u.id, u.role),"user":user_json(u)}), 201

@app.post("/api/login")
def login():
    data = json_body()
    if data is None:
        return jsonify({"error":"A JSON object is required"}), 400
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))
    u = User.query.filter_by(email=email).first()
    if not u or not check_password_hash(u.password_hash, password):
        return jsonify({"error":"Invalid email or password"}), 401
    return jsonify({"token":token_for(u.id, u.role),"user":user_json(u)})

@app.get("/api/me")
@auth_required
def me(user):
    skills = UserSkill.query.filter_by(user_id=user.id).all()
    return jsonify({"id":user.id,"name":user.name,"email":user.email,"bio":user.bio or "",
                    "availability":user.availability or "",
                    "teach":[{"id":x.skill.id,"name":x.skill.name} for x in skills if x.skill_type=="teach"],
                    "learn":[{"id":x.skill.id,"name":x.skill.name} for x in skills if x.skill_type=="learn"]})

@app.get("/api/skills")
def skills():
    return jsonify([{"id":s.id,"name":s.name,"category":s.category} for s in Skill.query.order_by(Skill.name).all()])

@app.post("/api/profile")
@auth_required
def profile(user):
    data = json_body()
    if data is None:
        return jsonify({"error":"A JSON object is required"}), 400
    for typ in ("teach", "learn"):
        skill_ids = data.get(typ, data.get(f"{typ}_skills", []))
        if not isinstance(skill_ids, list):
            return jsonify({"error":f"{typ} must be a list of skill IDs"}),400
    user.bio = data.get("bio", user.bio)
    user.availability = data.get("availability", user.availability)
    db.session.commit()
    for typ in ["teach","learn"]:
        for old in UserSkill.query.filter_by(user_id=user.id, skill_type=typ).all():
            db.session.delete(old)
    for typ in ["teach", "learn"]:
        skill_ids = data.get(typ, data.get(f"{typ}_skills", []))
        for sid in skill_ids:
            if db.session.get(Skill, sid):
                db.session.add(UserSkill(user_id=user.id, skill_id=sid, skill_type=typ))
    db.session.commit()
    return jsonify({"message":"Profile updated"})

# -----------------------------------------------------------------------------
# Matching and exchange-request routes
# -----------------------------------------------------------------------------

def names_for(user_id, typ):
    return [x.skill.name.lower() for x in UserSkill.query.filter_by(user_id=user_id, skill_type=typ).all()]

@app.get("/api/recommendations")
@auth_required
def recommendations(user):
    my_teach, my_learn = names_for(user.id,"teach"), names_for(user.id,"learn")
    users = User.query.filter(User.id != user.id).all()
    if not users: return jsonify([])
    # Matching text: skills I want to learn + skills I can teach.
    mine = " ".join(my_learn + my_teach)
    results=[]
    for other in users:
        oteach, olearn = names_for(other.id,"teach"), names_for(other.id,"learn")
        # Strong signal: my learn matches their teach; my teach matches their learn.
        direct = len(set(my_learn)&set(oteach)) + len(set(my_teach)&set(olearn))
        interest = len(set(my_learn)&set(olearn)) + len(set(my_teach)&set(oteach))
        texts=[mine, " ".join(oteach+olearn)]
        sim=float(cosine_similarity(TfidfVectorizer().fit_transform(texts))[0,1]) if mine.strip() and texts[1].strip() else 0
        score=min(100, round(direct*35 + interest*10 + sim*25))
        results.append({"id":other.id,"name":other.name,"bio":other.bio or "",
                        "teach":oteach,"learn":olearn,"score":score})
    results = sorted(results,key=lambda x:x["score"], reverse=True)
    search = request.args.get("search", "").strip().lower()
    if search:
        results = [r for r in results if search in r["name"].lower() or search in r["bio"].lower()
                   or any(search in skill for skill in r["teach"] + r["learn"])]
    if request.args.get("page") or request.args.get("per_page"):
        page, per_page = page_args()
        start = (page - 1) * per_page
        return jsonify({"recommendations": results[start:start + per_page], "items": results[start:start + per_page],
                        "page": page, "per_page": per_page, "total": len(results)})
    return jsonify(results)

@app.post("/api/requests")
@auth_required
def create_request(user):
    data=json_body()
    if data is None:
        return jsonify({"error":"A JSON object is required"}),400
    receiver_id=data.get("receiver_id")
    if not isinstance(receiver_id, int):
        return jsonify({"error":"A valid receiver is required"}),400
    receiver=db.session.get(User, receiver_id)
    if not receiver or receiver.id==user.id: return jsonify({"error":"Invalid receiver"}),400
    r=ExchangeRequest(sender_id=user.id, receiver_id=receiver.id, message=data.get("message",""))
    db.session.add(r); db.session.commit()
    return jsonify({"message":"Learning request sent","id":r.id}),201

@app.get("/api/requests")
@auth_required
def get_requests(user):
    rows=ExchangeRequest.query.filter((ExchangeRequest.sender_id==user.id)|(ExchangeRequest.receiver_id==user.id)).order_by(ExchangeRequest.created_at.desc()).all()
    search = request.args.get("search", "").lower()
    status_filter = request.args.get("status")
    if status_filter: rows = [r for r in rows if r.status == status_filter]
    out=[]
    for r in rows:
        sender=db.session.get(User,r.sender_id); receiver=db.session.get(User,r.receiver_id)
        out.append({"id":r.id,"sender":sender.name,"receiver":receiver.name,
                "sender_name":sender.name,"receiver_name":receiver.name,
                "sender_id":r.sender_id,"receiver_id":r.receiver_id,
                "message":r.message or "","status":r.status,
                "created_at":r.created_at.isoformat() if r.created_at else None})
    if search:
        out = [x for x in out if search in x["sender"].lower() or search in x["receiver"].lower()
               or search in x["message"].lower()]
    if request.args.get("page") or request.args.get("per_page"):
        page, per_page = page_args()
        return jsonify({"items": out[(page-1)*per_page:page*per_page], "page": page,
                        "per_page": per_page, "total": len(out)})
    return jsonify(out)

@app.patch("/api/requests/<int:rid>")
@auth_required
def update_request(user,rid):
    r=db.session.get(ExchangeRequest,rid)
    if not r or r.receiver_id!=user.id: return jsonify({"error":"Request not found"}),404
    data=json_body()
    if data is None:
        return jsonify({"error":"A JSON object is required"}),400
    status=data.get("status")
    if status not in ["accepted","rejected"]: return jsonify({"error":"Invalid status"}),400
    r.status=status; db.session.commit()
    return jsonify({"message":"Request updated"})

# -----------------------------------------------------------------------------
# Session and feedback routes
# -----------------------------------------------------------------------------

@app.post("/api/sessions")
@auth_required
def create_session(user):
    data=json_body()
    if data is None:
        return jsonify({"error":"A JSON object is required"}),400
    rid=data.get("request_id")
    if not isinstance(rid, int):
        return jsonify({"error":"A valid request is required"}),400
    r=db.session.get(ExchangeRequest,rid)
    if not r or user.id not in [r.sender_id,r.receiver_id] or r.status!="accepted":
        return jsonify({"error":"Accepted request required"}),400
    try: dt=datetime.fromisoformat(data["session_date"])
    except: return jsonify({"error":"Use ISO date/time"}),400
    s=Session(request_id=rid,title=data.get("title","Skill Exchange Session"),session_date=dt,meeting_link=data.get("meeting_link",""))
    db.session.add(s); db.session.commit()
    return jsonify({"message":"Session scheduled","id":s.id}),201

@app.get("/api/sessions")
@auth_required
def sessions(user):
    reqs=ExchangeRequest.query.filter((ExchangeRequest.sender_id==user.id)|(ExchangeRequest.receiver_id==user.id)).all()
    ids=[r.id for r in reqs]
    rows=Session.query.filter(Session.request_id.in_(ids)).order_by(Session.session_date).all() if ids else []
    return jsonify([{"id":s.id,"title":s.title,"date":s.session_date.isoformat(),"link":s.meeting_link or "","status":s.status,
                     "goals": [{"id": g.id, "goal": g.goal, "completed": g.completed}
                               for g in SessionGoal.query.filter_by(session_id=s.id).all()]} for s in rows])

@app.post("/api/feedback")
@auth_required
def feedback(user):
    data=json_body()
    if data is None:
        return jsonify({"error":"A JSON object is required"}),400
    session_id=data.get("session_id")
    if not isinstance(session_id, int):
        return jsonify({"error":"A valid session is required"}),400
    s=db.session.get(Session,session_id)
    if not s: return jsonify({"error":"Session not found"}),404
    r=db.session.get(ExchangeRequest,s.request_id)
    if not r or user.id not in [r.sender_id, r.receiver_id]:
        return jsonify({"error":"Session not found"}),404
    if s.status != "completed":
        return jsonify({"error":"Feedback is available after the session is completed"}),400
    if Feedback.query.filter_by(session_id=s.id, reviewer_id=user.id).first():
        return jsonify({"error":"You already submitted feedback for this session"}),409
    try:
        rating = int(data.get("rating", 5))
    except (TypeError, ValueError):
        return jsonify({"error":"Rating must be a number"}),400
    if rating < 1 or rating > 5:
        return jsonify({"error":"Rating must be between 1 and 5"}),400
    reviewee=r.receiver_id if r.sender_id==user.id else r.sender_id
    f=Feedback(session_id=s.id,reviewer_id=user.id,reviewee_id=reviewee,
               rating=rating,comment=data.get("comment",""))
    db.session.add(f); db.session.commit()
    return jsonify({"message":"Feedback submitted"}),201

# -----------------------------------------------------------------------------
# Wallet routes
# -----------------------------------------------------------------------------

def get_or_create_wallet(user_id):
    wallet = Wallet.query.filter_by(user_id=user_id).first()
    if not wallet:
        wallet = Wallet(user_id=user_id, security_amount=0, reward_points=0)
        db.session.add(wallet)
        db.session.commit()
    return wallet

@app.get("/api/wallet")
@auth_required
def get_wallet(user):
    wallet = get_or_create_wallet(user.id)
    query = WalletTransaction.query.filter_by(user_id=user.id)
    if request.args.get("type"): query = query.filter_by(type=request.args.get("type"))
    if request.args.get("status"): query = query.filter_by(status=request.args.get("status"))
    txns = query.order_by(WalletTransaction.created_at.desc()).all()
    return jsonify({
        "balance": wallet.security_amount,
        "security_amount": wallet.security_amount,
        "reward_points": wallet.reward_points,
        "transactions": [{
            "id": t.id, "amount": t.amount, "type": t.type, "status": t.status,
            "description": t.description or "", "created_at": t.created_at.isoformat()
        } for t in txns]
    })

@app.post("/api/wallet/security")
@auth_required
def add_security_amount(user):
    data = json_body()
    if data is None:
        return jsonify({"error":"A JSON object is required"}),400
    amount = data.get("amount")
    try:
        amount = float(amount)
    except (TypeError, ValueError):
        return jsonify({"error": "Enter a valid amount"}), 400
    if amount <= 0:
        return jsonify({"error": "Amount must be greater than zero"}), 400

    wallet = get_or_create_wallet(user.id)
    wallet.security_amount += amount
    # Reward the student with points for building up their security amount.
    wallet.reward_points += int(amount // 10)
    db.session.add(WalletTransaction(
        user_id=user.id, amount=amount, type="security_deposit",
        status="completed", description="Security amount added"
    ))
    db.session.commit()
    return jsonify({"message": "Security amount added", "balance": wallet.security_amount,
                     "reward_points": wallet.reward_points}), 201

@app.post("/api/wallet/redeem")
@auth_required
def redeem_points(user):
    data = json_body()
    if data is None:
        return jsonify({"error":"A JSON object is required"}),400
    points = data.get("points")
    try:
        points = int(points)
    except (TypeError, ValueError):
        return jsonify({"error": "Enter a valid number of points"}), 400
    if points <= 0:
        return jsonify({"error": "Points must be greater than zero"}), 400

    wallet = get_or_create_wallet(user.id)
    if wallet.reward_points < points:
        return jsonify({"error": "Not enough reward points"}), 400

    wallet.reward_points -= points
    db.session.add(WalletTransaction(
        user_id=user.id, amount=points, type="redeem",
        status="completed", description=f"Redeemed {points} reward points"
    ))
    db.session.commit()
    return jsonify({"message": "Points redeemed", "reward_points": wallet.reward_points,
                    "demo_value": round(points / 10, 2)}), 200

@app.patch("/api/sessions/<int:sid>")
@auth_required
def update_session(user, sid):
    s = db.session.get(Session, sid)
    if not s:
        return jsonify({"error": "Session not found"}), 404
    r = db.session.get(ExchangeRequest, s.request_id)
    if not r or user.id not in [r.sender_id, r.receiver_id]:
        return jsonify({"error": "Session not found"}), 404

    data = json_body()
    if data is None:
        return jsonify({"error":"A JSON object is required"}),400
    status = data.get("status")
    if status not in ["completed", "cancelled"]:
        return jsonify({"error": "Invalid status"}), 400
    s.status = status
    db.session.commit()
    return jsonify({"message": "Session updated"})

# -----------------------------------------------------------------------------
# Goals, notifications, messaging, discovery, and moderation
# -----------------------------------------------------------------------------

def page_args():
    try:
        page = max(1, int(request.args.get("page", 1)))
        per_page = max(1, min(100, int(request.args.get("per_page", 20))))
    except (TypeError, ValueError):
        page, per_page = 1, 20
    return page, per_page

def notify(user_id, title, message):
    db.session.add(Notification(user_id=user_id, title=title, message=message))

@app.get("/api/goals")
@auth_required
def goals(user):
    rows = SessionGoal.query.filter_by(user_id=user.id).order_by(SessionGoal.created_at.desc()).all()
    return jsonify([{"id": g.id, "session_id": g.session_id, "goal": g.goal,
                    "completed": g.completed, "created_at": g.created_at.isoformat()} for g in rows])

@app.post("/api/goals")
@auth_required
def add_goal(user):
    data = json_body()
    if data is None:
        return jsonify({"error": "A JSON object is required"}), 400
    sid = data.get("session_id")
    session = db.session.get(Session, sid) if isinstance(sid, int) else None
    if not session:
        return jsonify({"error": "Session not found"}), 404
    req = db.session.get(ExchangeRequest, session.request_id)
    if not req or user.id not in (req.sender_id, req.receiver_id):
        return jsonify({"error": "Session not found"}), 404
    goal = SessionGoal(session_id=sid, user_id=user.id, goal=str(data.get("goal", "")))
    db.session.add(goal); db.session.commit()
    return jsonify({"id": goal.id, "goal": goal.goal, "completed": goal.completed}), 201

@app.patch("/api/goals/<int:gid>")
@auth_required
def update_goal(user, gid):
    goal = db.session.get(SessionGoal, gid)
    if not goal or goal.user_id != user.id:
        return jsonify({"error": "Goal not found"}), 404
    data = json_body() or {}
    if "goal" in data: goal.goal = data["goal"]
    if "completed" in data: goal.completed = bool(data["completed"])
    db.session.commit()
    return jsonify({"message": "Goal updated", "completed": goal.completed})

@app.get("/api/notifications")
@auth_required
def notifications(user):
    rows = Notification.query.filter_by(user_id=user.id).order_by(Notification.created_at.desc()).all()
    return jsonify([{"id": n.id, "title": n.title, "message": n.message, "read": n.read,
                    "created_at": n.created_at.isoformat()} for n in rows])

@app.patch("/api/notifications/<int:nid>")
@auth_required
def mark_notification(user, nid):
    n = db.session.get(Notification, nid)
    if not n or n.user_id != user.id: return jsonify({"error": "Notification not found"}), 404
    n.read = True; db.session.commit()
    return jsonify({"message": "Notification marked as read"})

def conversation_for(user, other_id):
    return Conversation.query.filter(
        ((Conversation.user_one_id == user.id) & (Conversation.user_two_id == other_id)) |
        ((Conversation.user_one_id == other_id) & (Conversation.user_two_id == user.id))
    ).first()

@app.get("/api/conversations")
@auth_required
def conversations(user):
    rows = Conversation.query.filter(
        (Conversation.user_one_id == user.id) | (Conversation.user_two_id == user.id)
    ).order_by(Conversation.updated_at.desc()).all()
    out = []
    for c in rows:
        other_id = c.user_two_id if c.user_one_id == user.id else c.user_one_id
        other = db.session.get(User, other_id)
        last = Message.query.filter_by(conversation_id=c.id).order_by(Message.created_at.desc()).first()
        out.append({"id": c.id, "user": user_json(other), "last_message": last.body if last else "",
                    "updated_at": c.updated_at.isoformat() if c.updated_at else None})
    return jsonify(out)

@app.post("/api/conversations")
@auth_required
def create_conversation(user):
    data = json_body() or {}
    other_id = data.get("user_id", data.get("recipient_id"))
    other = db.session.get(User, other_id) if isinstance(other_id, int) else None
    if not other or other.id == user.id: return jsonify({"error": "User not found"}), 404
    c = conversation_for(user, other.id)
    if not c:
        c = Conversation(user_one_id=user.id, user_two_id=other.id)
        db.session.add(c); db.session.commit()
    return jsonify({"id": c.id, "user": user_json(other)}), 201

@app.get("/api/conversations/<int:cid>/messages")
@auth_required
def conversation_messages(user, cid):
    c = db.session.get(Conversation, cid)
    if not c or user.id not in (c.user_one_id, c.user_two_id): return jsonify({"error": "Conversation not found"}), 404
    rows = Message.query.filter_by(conversation_id=cid).order_by(Message.created_at).all()
    return jsonify([{"id": m.id, "sender_id": m.sender_id, "body": m.body,
                     "created_at": m.created_at.isoformat()} for m in rows])

@app.post("/api/conversations/<int:cid>/messages")
@auth_required
def send_message(user, cid):
    c = db.session.get(Conversation, cid)
    if not c or user.id not in (c.user_one_id, c.user_two_id): return jsonify({"error": "Conversation not found"}), 404
    data = json_body() or {}
    body = str(data.get("body", data.get("message", "")))
    m = Message(conversation_id=cid, sender_id=user.id, body=body)
    c.updated_at = datetime.utcnow()
    db.session.add(m)
    notify(c.user_two_id if c.user_one_id == user.id else c.user_one_id, "New message", body)
    db.session.commit()
    return jsonify({"id": m.id, "body": m.body}), 201

@app.get("/api/students/<int:student_id>")
@app.get("/api/users/<int:student_id>")
@auth_required
def student_detail(user, student_id):
    student = db.session.get(User, student_id)
    if not student: return jsonify({"error": "User not found"}), 404
    teach, learn = names_for(student.id, "teach"), names_for(student.id, "learn")
    ratings = Feedback.query.filter_by(reviewee_id=student.id).all()
    return jsonify({**user_json(student), "bio": student.bio or "", "availability": student.availability or "",
                    "teach": teach, "learn": learn,
                    "rating": round(sum(x.rating for x in ratings) / len(ratings), 2) if ratings else None,
                    "feedback_count": len(ratings)})

@app.post("/api/reports")
@auth_required
def create_report(user):
    data = json_body() or {}
    reported_id = data.get("reported_id", data.get("user_id"))
    reported = db.session.get(User, reported_id) if isinstance(reported_id, int) else None
    if not reported: return jsonify({"error": "User not found"}), 404
    report = Report(reporter_id=user.id, reported_id=reported.id, reason=str(data.get("reason", "")))
    db.session.add(report); db.session.commit()
    return jsonify({"id": report.id, "status": report.status}), 201

@app.post("/api/users/<int:student_id>/block")
@auth_required
def block_user(user, student_id):
    target = db.session.get(User, student_id)
    if not target: return jsonify({"error": "User not found"}), 404
    target.is_blocked = True; db.session.commit()
    return jsonify({"message": "User blocked"})

@app.post("/api/skill-suggestions")
@auth_required
def suggest_skill(user):
    data = json_body() or {}
    suggestion = SkillSuggestion(user_id=user.id, name=str(data.get("name", "")), category=data.get("category"))
    db.session.add(suggestion); db.session.commit()
    return jsonify({"id": suggestion.id, "status": suggestion.status}), 201

@app.get("/api/calendar.ics")
@auth_required
def calendar(user):
    reqs = ExchangeRequest.query.filter((ExchangeRequest.sender_id == user.id) | (ExchangeRequest.receiver_id == user.id)).all()
    rows = Session.query.filter(Session.request_id.in_([r.id for r in reqs])).all() if reqs else []
    lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//LEARNEXA//EN"]
    for s in rows:
        lines += ["BEGIN:VEVENT", "UID:learnexa-session-%s" % s.id,
                  "DTSTART:%sZ" % s.session_date.strftime("%Y%m%dT%H%M%S"),
                  "SUMMARY:%s" % s.title.replace("\n", " "), "END:VEVENT"]
    lines.append("END:VCALENDAR")
    return Response("\r\n".join(lines) + "\r\n", mimetype="text/calendar",
                    headers={"Content-Disposition": "attachment; filename=learnexa.ics"})

@app.get("/api/statistics")
@auth_required
def statistics(user):
    sessions = Session.query.join(ExchangeRequest, Session.request_id == ExchangeRequest.id).filter(
        (ExchangeRequest.sender_id == user.id) | (ExchangeRequest.receiver_id == user.id)).all()
    feedback = Feedback.query.filter_by(reviewee_id=user.id).all()
    return jsonify({"sessions_total": len(sessions), "sessions_completed": sum(s.status == "completed" for s in sessions),
                    "requests_total": ExchangeRequest.query.filter(
                        (ExchangeRequest.sender_id == user.id) | (ExchangeRequest.receiver_id == user.id)).count(),
                    "average_rating": round(sum(f.rating for f in feedback) / len(feedback), 2) if feedback else 0,
                    "unread_notifications": Notification.query.filter_by(user_id=user.id, read=False).count()})

@app.get("/api/reliability")
@auth_required
def reliability(user):
    total = ExchangeRequest.query.filter(
        (ExchangeRequest.sender_id == user.id) | (ExchangeRequest.receiver_id == user.id)).count()
    completed = Session.query.join(ExchangeRequest, Session.request_id == ExchangeRequest.id).filter(
        ((ExchangeRequest.sender_id == user.id) | (ExchangeRequest.receiver_id == user.id)),
        Session.status == "completed").count()
    return jsonify({"score": round(completed / total * 100, 1) if total else 100,
                    "requests": total, "completed_sessions": completed,
                    "response_rate": round(completed / total * 100, 1) if total else 100})

@app.get("/api/admin/dashboard")
@app.get("/api/admin/dashboard-data")
@admin_required
def admin_dashboard(user):
    return jsonify({
        "users": User.query.count(), "skills": Skill.query.count(),
        "requests": ExchangeRequest.query.count(), "sessions": Session.query.count(),
        "feedback": Feedback.query.count(), "wallets": Wallet.query.count(),
        "transactions": WalletTransaction.query.count(), "notifications": Notification.query.count(),
        "conversations": Conversation.query.count(), "messages": Message.query.count(),
        "reports": Report.query.count(), "open_reports": Report.query.filter_by(status="open").count(),
        "blocked_users": User.query.filter_by(is_blocked=True).count(),
        "skill_suggestions": SkillSuggestion.query.count(),
        "pending_skill_suggestions": SkillSuggestion.query.filter_by(status="pending").count(),
    })

@app.get("/api/admin/users")
@admin_required
def admin_users(user):
    page, per_page = page_args()
    query = User.query.order_by(User.id.desc())
    search = request.args.get("search", "").strip()
    if search: query = query.filter((User.name.ilike("%%%s%%" % search)) | (User.email.ilike("%%%s%%" % search)))
    rows = query.offset((page - 1) * per_page).limit(per_page).all()
    return jsonify({"items": [{**user_json(u), "is_blocked": u.is_blocked} for u in rows],
                    "page": page, "per_page": per_page, "total": query.count()})

@app.get("/api/admin/reports")
@admin_required
def admin_reports(user):
    rows = Report.query.order_by(Report.created_at.desc()).all()
    return jsonify([{"id": r.id, "reporter_id": r.reporter_id, "reported_id": r.reported_id,
                     "reason": r.reason, "status": r.status, "created_at": r.created_at.isoformat()} for r in rows])

@app.patch("/api/admin/reports/<int:report_id>")
@admin_required
def update_report(user, report_id):
    report = db.session.get(Report, report_id)
    if not report: return jsonify({"error": "Report not found"}), 404
    data = json_body() or {}
    if data.get("status"): report.status = data["status"]
    db.session.commit()
    return jsonify({"message": "Report updated", "status": report.status})

@app.get("/api/admin/<string:resource>")
@admin_required
def admin_resource(user, resource):
    models = {"users": User, "skills": Skill, "user_skills": UserSkill,
              "requests": ExchangeRequest, "sessions": Session, "feedback": Feedback,
              "wallets": Wallet, "transactions": WalletTransaction,
              "notifications": Notification, "conversations": Conversation,
              "messages": Message, "goals": SessionGoal, "reports": Report,
              "skill_suggestions": SkillSuggestion}
    model = models.get(resource)
    if not model: return jsonify({"error": "Unknown resource"}), 404
    rows = model.query.order_by(model.id.desc()).limit(500).all()
    def value(v):
        return v.isoformat() if isinstance(v, datetime) else v
    return jsonify({"items": [{c.name: value(getattr(row, c.name)) for c in model.__table__.columns} for row in rows]})

# -----------------------------------------------------------------------------
# Local database initialization
# -----------------------------------------------------------------------------

DEFAULT_SKILLS = [
    ("Python", "Programming"), ("Java", "Programming"), ("JavaScript", "Programming"),
    ("HTML", "Web"), ("CSS", "Web"), ("React", "Web"), ("Next.js", "Web"),
    ("MySQL", "Database"), ("Data Science", "AI/Data"), ("Machine Learning", "AI/Data"),
    ("Graphic Design", "Design"), ("Video Editing", "Creative"), ("Communication", "Soft Skills"),
    ("English", "Language"), ("Public Speaking", "Soft Skills"),
]

with app.app_context():
    # Tables are expected to exist from schema.sql (production/MySQL).
    # This also creates any missing tables for local SQLite development.
    db.create_all()
    # Keep the existing SQLite database usable when new columns are introduced.
    inspector = inspect(db.engine)
    user_columns = {column["name"] for column in inspector.get_columns("users")}
    if "role" not in user_columns:
        db.session.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'student'"))
    if "is_blocked" not in user_columns:
        db.session.execute(text("ALTER TABLE users ADD COLUMN is_blocked BOOLEAN NOT NULL DEFAULT 0"))
    db.session.commit()

    # For local SQLite dev, schema.sql's seed data never runs, so the skills
    # table would otherwise be empty and nobody could select any skills.
    if Skill.query.count() == 0:
        for name, category in DEFAULT_SKILLS:
            db.session.add(Skill(name=name, category=category))
        db.session.commit()
    admin = User.query.filter_by(email="abc@gmail.com").first()
    if not admin:
        db.session.add(User(name="Demo Admin", email="abc@gmail.com",
                            password_hash=generate_password_hash("abc"), role="admin"))
        db.session.commit()
    elif admin.role != "admin":
        admin.role = "admin"
        db.session.commit()

if __name__=="__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)