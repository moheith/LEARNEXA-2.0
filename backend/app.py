import os
from datetime import datetime, timedelta
from functools import wraps

import jwt
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from werkzeug.security import check_password_hash, generate_password_hash

load_dotenv()

app = Flask(__name__)
CORS(app)
# Use SQLite for development, MySQL for production
db_type = os.getenv('DB_TYPE', 'sqlite')
if db_type == 'mysql':
    app.config["SQLALCHEMY_DATABASE_URI"] = (
        f"mysql+pymysql://{os.getenv('DB_USER','root')}:{os.getenv('DB_PASSWORD','')}"
        f"@{os.getenv('DB_HOST','localhost')}:{os.getenv('DB_PORT','3306')}/{os.getenv('DB_NAME','learnexa')}"
    )
else:
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///learnexa.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db = SQLAlchemy(app)
SECRET = os.getenv("JWT_SECRET", "learnexa-demo-secret")

class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    bio = db.Column(db.Text)
    availability = db.Column(db.String(255))

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

def token_for(user_id):
    return jwt.encode({"user_id": user_id, "exp": datetime.utcnow()+timedelta(hours=12)}, SECRET, algorithm="HS256")

def auth_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        token = request.headers.get("Authorization","").replace("Bearer ","")
        try:
            data = jwt.decode(token, SECRET, algorithms=["HS256"])
            user = db.session.get(User, data["user_id"])
            if not user: raise Exception()
            return fn(user, *args, **kwargs)
        except Exception:
            return jsonify({"error":"Unauthorized"}), 401
    return wrapper

@app.get("/api/health")
def health():
    return jsonify({"status":"ok","message":"LEARNEXA API is running"})

@app.post("/api/register")
def register():
    data = request.json or {}
    if not data.get("name") or not data.get("email") or not data.get("password"):
        return jsonify({"error":"Name, email and password are required"}), 400
    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"error":"Email already registered"}), 409
    u = User(name=data["name"], email=data["email"].lower(),
             password_hash=generate_password_hash(data["password"]))
    db.session.add(u); db.session.commit()
    return jsonify({"message":"Registration successful","token":token_for(u.id),"user":{"id":u.id,"name":u.name,"email":u.email}}), 201

@app.post("/api/login")
def login():
    data = request.json or {}
    u = User.query.filter_by(email=data.get("email","").lower()).first()
    if not u or not check_password_hash(u.password_hash, data.get("password","")):
        return jsonify({"error":"Invalid email or password"}), 401
    return jsonify({"token":token_for(u.id),"user":{"id":u.id,"name":u.name,"email":u.email}})

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
    data = request.json or {}
    user.bio = data.get("bio", user.bio)
    user.availability = data.get("availability", user.availability)
    db.session.commit()
    for typ in ["teach","learn"]:
        for old in UserSkill.query.filter_by(user_id=user.id, skill_type=typ).all():
            db.session.delete(old)
    for typ in ["teach","learn"]:
        for sid in data.get(typ, []):
            if db.session.get(Skill, sid):
                db.session.add(UserSkill(user_id=user.id, skill_id=sid, skill_type=typ))
    db.session.commit()
    return jsonify({"message":"Profile updated"})

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
    return jsonify(sorted(results,key=lambda x:x["score"], reverse=True))

@app.post("/api/requests")
@auth_required
def create_request(user):
    data=request.json or {}
    receiver=db.session.get(User, data.get("receiver_id"))
    if not receiver or receiver.id==user.id: return jsonify({"error":"Invalid receiver"}),400
    r=ExchangeRequest(sender_id=user.id, receiver_id=receiver.id, message=data.get("message",""))
    db.session.add(r); db.session.commit()
    return jsonify({"message":"Learning request sent","id":r.id}),201

@app.get("/api/requests")
@auth_required
def get_requests(user):
    rows=ExchangeRequest.query.filter((ExchangeRequest.sender_id==user.id)|(ExchangeRequest.receiver_id==user.id)).order_by(ExchangeRequest.created_at.desc()).all()
    out=[]
    for r in rows:
        sender=db.session.get(User,r.sender_id); receiver=db.session.get(User,r.receiver_id)
        out.append({"id":r.id,"sender":sender.name,"receiver":receiver.name,"sender_id":r.sender_id,
                    "receiver_id":r.receiver_id,"message":r.message or "","status":r.status})
    return jsonify(out)

@app.patch("/api/requests/<int:rid>")
@auth_required
def update_request(user,rid):
    r=db.session.get(ExchangeRequest,rid)
    if not r or r.receiver_id!=user.id: return jsonify({"error":"Request not found"}),404
    status=(request.json or {}).get("status")
    if status not in ["accepted","rejected"]: return jsonify({"error":"Invalid status"}),400
    r.status=status; db.session.commit()
    return jsonify({"message":"Request updated"})

@app.post("/api/sessions")
@auth_required
def create_session(user):
    data=request.json or {}
    rid=data.get("request_id"); r=db.session.get(ExchangeRequest,rid)
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
    return jsonify([{"id":s.id,"title":s.title,"date":s.session_date.isoformat(),"link":s.meeting_link or "","status":s.status} for s in rows])

@app.post("/api/feedback")
@auth_required
def feedback(user):
    data=request.json or {}
    s=db.session.get(Session,data.get("session_id"))
    if not s: return jsonify({"error":"Session not found"}),404
    r=db.session.get(ExchangeRequest,s.request_id)
    reviewee=r.receiver_id if r.sender_id==user.id else r.sender_id
    f=Feedback(session_id=s.id,reviewer_id=user.id,reviewee_id=reviewee,
               rating=int(data.get("rating",5)),comment=data.get("comment",""))
    db.session.add(f); db.session.commit()
    return jsonify({"message":"Feedback submitted"}),201

with app.app_context():
    # Tables are expected to exist from schema.sql. This also creates any missing tables.
    db.create_all()

if __name__=="__main__":
    app.run(debug=True, port=5000)
