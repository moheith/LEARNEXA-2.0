"""Seed the local database with repeatable fictional demo data.

Run from the repository root with:
    .\.venv\Scripts\python.exe backend\seed_demo_data.py
"""

from datetime import datetime, timedelta
import random
import sys
from pathlib import Path

# Make the existing Flask models importable when this file is run directly.
sys.path.insert(0, str(Path(__file__).resolve().parent))

from werkzeug.security import generate_password_hash

from app import (
    ExchangeRequest,
    Feedback,
    Skill,
    Session,
    User,
    UserSkill,
    Wallet,
    WalletTransaction,
    app,
    db,
)

DEMO_PASSWORD = "LearnexaDemo@123"

DEMO_USERS = [
    ("Aarav Sharma", "aarav.sharma@demo.learnexa.local", "Python and data enthusiast"),
    ("Aanya Patel", "aanya.patel@demo.learnexa.local", "Frontend developer and UI learner"),
    ("Arjun Mehta", "arjun.mehta@demo.learnexa.local", "Enjoys teaching public speaking"),
    ("Ananya Iyer", "ananya.iyer@demo.learnexa.local", "Design student exploring technology"),
    ("Vihaan Gupta", "vihaan.gupta@demo.learnexa.local", "Backend developer and mentor"),
    ("Diya Nair", "diya.nair@demo.learnexa.local", "Language learner and reader"),
    ("Kabir Reddy", "kabir.reddy@demo.learnexa.local", "Machine learning beginner"),
    ("Ishita Rao", "ishita.rao@demo.learnexa.local", "Creative designer and photographer"),
    ("Aditya Singh", "aditya.singh@demo.learnexa.local", "JavaScript and React learner"),
    ("Meera Joshi", "meera.joshi@demo.learnexa.local", "Communication skills coach"),
    ("Rohan Verma", "rohan.verma@demo.learnexa.local", "Video editor and content creator"),
    ("Sara Khan", "sara.khan@demo.learnexa.local", "English and public speaking learner"),
    ("Karan Malhotra", "karan.malhotra@demo.learnexa.local", "Database and Python learner"),
    ("Nisha Desai", "nisha.desai@demo.learnexa.local", "Graphic design student"),
    ("Yash Kulkarni", "yash.kulkarni@demo.learnexa.local", "Web development mentor"),
    ("Pooja Menon", "pooja.menon@demo.learnexa.local", "Data science learner"),
    ("Rahul Choudhary", "rahul.choudhary@demo.learnexa.local", "Public speaking mentor"),
    ("Kavya Bansal", "kavya.bansal@demo.learnexa.local", "Creative writing and design"),
    ("Siddharth Das", "siddharth.das@demo.learnexa.local", "Mobile and web technology fan"),
    ("Tanvi Kapoor", "tanvi.kapoor@demo.learnexa.local", "Learning analytics and communication"),
]

SKILLS = [
    ("Python", "Programming"),
    ("Java", "Programming"),
    ("JavaScript", "Programming"),
    ("HTML", "Web"),
    ("CSS", "Web"),
    ("React", "Web"),
    ("Next.js", "Web"),
    ("MySQL", "Database"),
    ("Data Science", "AI/Data"),
    ("Machine Learning", "AI/Data"),
    ("Graphic Design", "Design"),
    ("Video Editing", "Creative"),
    ("Communication", "Soft Skills"),
    ("English", "Language"),
    ("Public Speaking", "Soft Skills"),
]


def get_or_create_skills():
    skills = {}
    for name, category in SKILLS:
        skill = Skill.query.filter_by(name=name).first()
        if not skill:
            skill = Skill(name=name, category=category)
            db.session.add(skill)
            db.session.flush()
        skills[name] = skill
    return skills


def get_or_create_users():
    users = []
    password_hash = generate_password_hash(DEMO_PASSWORD)
    for name, email, bio in DEMO_USERS:
        user = User.query.filter_by(email=email).first()
        if not user:
            user = User(
                name=name,
                email=email,
                password_hash=password_hash,
                bio=bio,
                availability="Weekday evenings",
            )
            db.session.add(user)
            db.session.flush()
        users.append(user)
    return users


def add_skill_preferences(users, skills):
    generator = random.Random(20261006)
    skill_list = list(skills.values())

    for index, user in enumerate(users):
        existing = UserSkill.query.filter_by(user_id=user.id).count()
        if existing:
            continue

        teach = generator.sample(skill_list, 2)
        remaining = [skill for skill in skill_list if skill not in teach]
        learn = generator.sample(remaining, 2)
        for skill in teach:
            db.session.add(UserSkill(user_id=user.id, skill_id=skill.id, skill_type="teach"))
        for skill in learn:
            db.session.add(UserSkill(user_id=user.id, skill_id=skill.id, skill_type="learn"))


def add_exchange_examples(users):
    examples = [
        (0, 1, "I can help with Python if you can help me practise React.", "accepted"),
        (2, 3, "Would you like to exchange public speaking and graphic design tips?", "pending"),
        (4, 5, "Let's exchange backend and English conversation practice.", "accepted"),
        (6, 7, "I would like to learn design fundamentals from you.", "rejected"),
        (8, 9, "Can we practise JavaScript and communication together?", "accepted"),
    ]
    requests = []
    for sender_index, receiver_index, message, status in examples:
        sender = users[sender_index]
        receiver = users[receiver_index]
        request = ExchangeRequest.query.filter_by(
            sender_id=sender.id, receiver_id=receiver.id
        ).first()
        if not request:
            request = ExchangeRequest(
                sender_id=sender.id,
                receiver_id=receiver.id,
                message=message,
                status=status,
            )
            db.session.add(request)
            db.session.flush()
        requests.append(request)
    return requests


def add_session_examples(requests):
    session_specs = [
        (requests[0], "Python and React Exchange", "completed", 7),
        (requests[2], "Backend and English Practice", "scheduled", 14),
        (requests[4], "JavaScript and Communication", "scheduled", 21),
    ]
    sessions = []
    for request, title, status, days_from_now in session_specs:
        session = Session.query.filter_by(request_id=request.id, title=title).first()
        if not session:
            session = Session(
                request_id=request.id,
                title=title,
                session_date=datetime.utcnow() + timedelta(days=days_from_now),
                meeting_link="https://meet.example.com/learnexa-demo",
                status=status,
            )
            db.session.add(session)
            db.session.flush()
        sessions.append(session)
    return sessions


def add_feedback_example(session, request):
    reviewer_id = request.sender_id
    reviewee_id = request.receiver_id
    existing = Feedback.query.filter_by(
        session_id=session.id, reviewer_id=reviewer_id
    ).first()
    if not existing:
        db.session.add(
            Feedback(
                session_id=session.id,
                reviewer_id=reviewer_id,
                reviewee_id=reviewee_id,
                rating=5,
                comment="Clear explanations and a very helpful exchange.",
            )
        )


def add_wallet_examples(users):
    for index, user in enumerate(users[:5]):
        wallet = Wallet.query.filter_by(user_id=user.id).first()
        if not wallet:
            amount = 100.0 + index * 50
            wallet = Wallet(
                user_id=user.id,
                security_amount=amount,
                reward_points=int(amount // 10),
            )
            db.session.add(wallet)
            db.session.flush()
            db.session.add(
                WalletTransaction(
                    user_id=user.id,
                    amount=amount,
                    type="security_deposit",
                    status="completed",
                    description="Demo security amount",
                )
            )


with app.app_context():
    db.create_all()
    skills = get_or_create_skills()
    users = get_or_create_users()
    add_skill_preferences(users, skills)
    requests = add_exchange_examples(users)
    sessions = add_session_examples(requests)
    add_feedback_example(sessions[0], requests[0])
    add_wallet_examples(users)
    db.session.commit()

    print(f"Seeded {len(users)} demo users.")
    print(f"Demo login password for all demo users: {DEMO_PASSWORD}")
    print("Demo email format: firstname.lastname@demo.learnexa.local")
