"""Focused API coverage for the Flask backend.

The suite uses Flask's test client and replaces the ignored local SQLite
database for the duration of the run, restoring the developer database after
the tests finish.
"""

import shutil
import sys
import unittest
from pathlib import Path


BACKEND = Path(__file__).resolve().parents[1]
DATABASE = BACKEND / "instance" / "learnexa.db"
BACKUP = BACKEND / "instance" / "learnexa.test-backup.db"
sys.path.insert(0, str(BACKEND))
shutil.copyfile(DATABASE, BACKUP)

from app import (  # noqa: E402
    ExchangeRequest,
    Feedback,
    Skill,
    User,
    app,
    db,
    generate_password_hash,
)


class ApiTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = app.test_client()

    @classmethod
    def tearDownClass(cls):
        with app.app_context():
            db.session.remove()
            db.engine.dispose()
        shutil.copyfile(BACKUP, DATABASE)
        BACKUP.unlink(missing_ok=True)

    def setUp(self):
        with app.app_context():
            db.drop_all()
            db.create_all()
            db.session.add_all(
                Skill(name=name, category=category)
                for name, category in (
                    ("Python", "Programming"),
                    ("JavaScript", "Programming"),
                    ("React", "Web"),
                )
            )
            db.session.add(
                User(
                    name="Demo Admin",
                    email="abc@gmail.com",
                    password_hash=generate_password_hash("abc"),
                    role="admin",
                )
            )
            db.session.add_all(
                [
                    User(
                        name="Alice Student",
                        email="alice@example.com",
                        password_hash=generate_password_hash("secret1"),
                    ),
                    User(
                        name="Bob Student",
                        email="bob@example.com",
                        password_hash=generate_password_hash("secret2"),
                    ),
                ]
            )
            db.session.commit()
            self.alice_id = User.query.filter_by(email="alice@example.com").one().id
            self.bob_id = User.query.filter_by(email="bob@example.com").one().id
            self.skill_ids = {
                skill.name: skill.id for skill in Skill.query.all()
            }

    def login(self, email, password):
        response = self.client.post(
            "/api/login", json={"email": email, "password": password}
        )
        self.assertEqual(response.status_code, 200)
        return response.get_json()["token"]

    def headers(self, token):
        return {"Authorization": f"Bearer {token}"}

    def create_accepted_session(self):
        alice = self.login("alice@example.com", "secret1")
        bob = self.login("bob@example.com", "secret2")
        request = self.client.post(
            "/api/requests",
            headers=self.headers(alice),
            json={"receiver_id": self.bob_id, "message": "Learn together"},
        )
        self.assertEqual(request.status_code, 201)
        request_id = request.get_json()["id"]
        accepted = self.client.patch(
            f"/api/requests/{request_id}",
            headers=self.headers(bob),
            json={"status": "accepted"},
        )
        self.assertEqual(accepted.status_code, 200)
        session = self.client.post(
            "/api/sessions",
            headers=self.headers(alice),
            json={
                "request_id": request_id,
                "title": "Python practice",
                "session_date": "2026-11-01T10:30:00",
            },
        )
        self.assertEqual(session.status_code, 201)
        return alice, bob, request_id, session.get_json()["id"]

    def test_health_and_seeded_admin_dashboard(self):
        health = self.client.get("/api/health")
        self.assertEqual(health.status_code, 200)
        self.assertEqual(health.get_json()["status"], "ok")

        admin = self.login("abc@gmail.com", "abc")
        dashboard = self.client.get(
            "/api/admin/dashboard", headers=self.headers(admin)
        )
        self.assertEqual(dashboard.status_code, 200)
        self.assertEqual(dashboard.get_json()["users"], 3)

        student = self.login("alice@example.com", "secret1")
        forbidden = self.client.get(
            "/api/admin/dashboard", headers=self.headers(student)
        )
        self.assertEqual(forbidden.status_code, 403)

    def test_student_authentication_and_profile(self):
        response = self.client.post(
            "/api/register",
            json={"name": "New Student", "email": "new@example.com", "password": "password"},
        )
        self.assertEqual(response.status_code, 201)
        token = response.get_json()["token"]
        me = self.client.get("/api/me", headers=self.headers(token))
        self.assertEqual(me.status_code, 200)
        self.assertEqual(me.get_json()["email"], "new@example.com")

        updated = self.client.post(
            "/api/profile",
            headers=self.headers(token),
            json={
                "bio": "Backend learner",
                "availability": "Evenings",
                "teach": [self.skill_ids["Python"]],
                "learn": [self.skill_ids["React"]],
            },
        )
        self.assertEqual(updated.status_code, 200)
        profile = self.client.get("/api/me", headers=self.headers(token)).get_json()
        self.assertEqual(profile["bio"], "Backend learner")
        self.assertEqual(profile["teach"][0]["name"], "Python")

    def test_recommendations_pagination(self):
        alice = self.login("alice@example.com", "secret1")
        profile = self.client.post(
            "/api/profile",
            headers=self.headers(alice),
            json={"teach": [self.skill_ids["Python"]], "learn": []},
        )
        self.assertEqual(profile.status_code, 200)
        page = self.client.get(
            "/api/recommendations?page=1&per_page=1",
            headers=self.headers(alice),
        )
        self.assertEqual(page.status_code, 200)
        payload = page.get_json()
        self.assertEqual(payload["page"], 1)
        self.assertEqual(payload["per_page"], 1)
        self.assertEqual(payload["total"], 2)
        self.assertEqual(len(payload["items"]), 1)

    def test_goals_notifications_conversations_and_calendar(self):
        alice, bob, _, session_id = self.create_accepted_session()
        goal = self.client.post(
            "/api/goals",
            headers=self.headers(alice),
            json={"session_id": session_id, "goal": "Practice decorators"},
        )
        self.assertEqual(goal.status_code, 201)
        goal_id = goal.get_json()["id"]
        completed = self.client.patch(
            f"/api/goals/{goal_id}",
            headers=self.headers(alice),
            json={"completed": True},
        )
        self.assertEqual(completed.status_code, 200)
        self.assertTrue(completed.get_json()["completed"])

        conversation = self.client.post(
            "/api/conversations",
            headers=self.headers(alice),
            json={"user_id": self.bob_id},
        )
        self.assertEqual(conversation.status_code, 201)
        conversation_id = conversation.get_json()["id"]
        message = self.client.post(
            f"/api/conversations/{conversation_id}/messages",
            headers=self.headers(alice),
            json={"body": "See you soon"},
        )
        self.assertEqual(message.status_code, 201)
        messages = self.client.get(
            f"/api/conversations/{conversation_id}/messages",
            headers=self.headers(bob),
        )
        self.assertEqual(messages.status_code, 200)
        self.assertEqual(messages.get_json()[0]["body"], "See you soon")

        notifications = self.client.get(
            "/api/notifications", headers=self.headers(bob)
        )
        self.assertEqual(notifications.status_code, 200)
        notification_id = notifications.get_json()[0]["id"]
        marked = self.client.patch(
            f"/api/notifications/{notification_id}", headers=self.headers(bob)
        )
        self.assertEqual(marked.status_code, 200)
        calendar = self.client.get("/api/calendar.ics", headers=self.headers(alice))
        self.assertEqual(calendar.status_code, 200)
        self.assertEqual(calendar.mimetype, "text/calendar")
        self.assertIn("BEGIN:VCALENDAR", calendar.get_data(as_text=True))
        self.assertIn("Python practice", calendar.get_data(as_text=True))

    def test_statistics_and_reliability(self):
        alice, bob, _, session_id = self.create_accepted_session()
        self.client.patch(
            f"/api/sessions/{session_id}",
            headers=self.headers(alice),
            json={"status": "completed"},
        )
        feedback = self.client.post(
            "/api/feedback",
            headers=self.headers(bob),
            json={"session_id": session_id, "rating": 4, "comment": "Great"},
        )
        self.assertEqual(feedback.status_code, 201)
        statistics = self.client.get("/api/statistics", headers=self.headers(alice))
        self.assertEqual(statistics.status_code, 200)
        self.assertEqual(statistics.get_json()["sessions_completed"], 1)
        self.assertEqual(statistics.get_json()["average_rating"], 4)
        reliability = self.client.get("/api/reliability", headers=self.headers(alice))
        self.assertEqual(reliability.status_code, 200)
        self.assertEqual(reliability.get_json()["score"], 100.0)
        self.assertEqual(reliability.get_json()["completed_sessions"], 1)

    def test_report_and_admin_report_flow(self):
        alice = self.login("alice@example.com", "secret1")
        report = self.client.post(
            "/api/reports",
            headers=self.headers(alice),
            json={"reported_id": self.bob_id, "reason": "Needs review"},
        )
        self.assertEqual(report.status_code, 201)
        report_id = report.get_json()["id"]
        admin = self.login("abc@gmail.com", "abc")
        reports = self.client.get(
            "/api/admin/reports", headers=self.headers(admin)
        )
        self.assertEqual(reports.status_code, 200)
        self.assertEqual(reports.get_json()[0]["status"], "open")
        resolved = self.client.patch(
            f"/api/admin/reports/{report_id}",
            headers=self.headers(admin),
            json={"status": "resolved"},
        )
        self.assertEqual(resolved.status_code, 200)
        self.assertEqual(resolved.get_json()["status"], "resolved")


if __name__ == "__main__":
    unittest.main()
