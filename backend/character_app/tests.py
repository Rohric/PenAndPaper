"""Tests for the rule calculations and the NPC endpoints."""

from django.test import SimpleTestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from auth_app.models import User
from character_app.models import Npc
from character_app.house_rules import bonus_points_left
from character_app.utils import (
    base_points_left,
    inspiration_points,
    round_half_up,
    skill_value,
    talent_value,
)


def skill(name, talent, points, bonus_points=0):
    """Return one complete skill entry."""
    return {"name": name, "talent": talent, "points": points, "bonus_points": bonus_points, "description": ""}


# 129 action points and 150 social points, as in the examples of the rule book.
SKILLS = [
    skill("Holzfällen", "action", 50),
    skill("Klettern", "action", 79),
    skill("Feilschen", "social", 100),
    skill("Lügen", "social", 50),
]


class RuleTests(SimpleTestCase):
    """Check the rule calculations against the examples from the rule book."""

    def test_rounding_goes_up_at_half(self):
        """Expect 12.5 to become 13 and 12.4 to stay 12."""
        self.assertEqual(round_half_up(12.5), 13)
        self.assertEqual(round_half_up(12.4), 12)

    def test_talent_value_is_a_tenth_of_the_points(self):
        """Expect 129 action points to give a talent value of 13."""
        self.assertEqual(talent_value(SKILLS, "action"), 13)

    def test_skill_value_adds_talent_value(self):
        """Expect 50 points plus talent value 13 to give 63."""
        self.assertEqual(skill_value(SKILLS[0], SKILLS), 63)

    def test_inspiration_points_are_a_tenth_of_the_talent_value(self):
        """Expect talent value 13 to give 1 point and 15 to give 2."""
        self.assertEqual(inspiration_points(SKILLS, "action"), 1)
        self.assertEqual(inspiration_points(SKILLS, "social"), 2)

    def test_talent_without_skills_is_zero(self):
        """Expect an unused talent to have the value 0."""
        self.assertEqual(talent_value(SKILLS, "knowledge"), 0)

    def test_bonus_points_raise_skill_and_talent(self):
        """Expect 11 bonus points to lift the talent from 13 to 14 and the skill to 75."""
        leveled = [skill("Holzfällen", "action", 50, 11), SKILLS[1]]
        self.assertEqual(talent_value(leveled, "action"), 14)
        self.assertEqual(skill_value(leveled[0], leveled), 75)

    def test_budgets_are_counted_separately(self):
        """Expect base and bonus points to use their own budget."""
        leveled = [skill("Holzfällen", "action", 50, 11)]
        self.assertEqual(base_points_left(leveled, 400), 350)
        self.assertEqual(bonus_points_left(leveled, 20), 9)


class NpcApiTests(APITestCase):
    """Check the NPC endpoints: rights, ownership and the list checks."""

    def setUp(self):
        """Create a game master, a second one and a player."""
        self.master = User.objects.create_user(username="master", password="x", is_game_master=True)
        self.other = User.objects.create_user(username="other", password="x", is_game_master=True)
        self.player = User.objects.create_user(username="player", password="x")
        self.client.force_authenticate(self.master)

    def test_create_needs_only_a_name(self):
        """Expect an NPC with defaults when only the name is sent."""
        response = self.client.post(reverse("npc-list"), {"name": "Wirtin"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["life_points"], 100)
        self.assertEqual(response.data["points_left"], {"base": 400, "bonus": 0})

    def test_create_returns_calculated_talents(self):
        """Expect talent value and inspiration points in the answer."""
        response = self.client.post(reverse("npc-list"), {"name": "Wirtin", "skills": SKILLS}, format="json")
        self.assertEqual(response.data["talents"]["action"], {"value": 13, "inspiration": 1})
        self.assertEqual(response.data["talents"]["social"], {"value": 15, "inspiration": 2})

    def test_skill_and_item_entries_are_completed(self):
        """Expect missing optional values to be filled with defaults."""
        data = {"name": "Wirtin", "skills": [{"name": "Kochen", "talent": "action"}], "inventory": [{"name": "Messer"}]}
        response = self.client.post(reverse("npc-list"), data, format="json")
        self.assertEqual(response.data["skills"][0], skill("Kochen", "action", 0))
        self.assertEqual(response.data["inventory"][0]["quantity"], 1)
        self.assertEqual(response.data["inventory"][0]["damage_dice"], 0)

    def test_base_budget_cannot_be_exceeded(self):
        """Expect a 400 when the base points cost more than the budget."""
        skills = [skill("A", "action", 100), skill("B", "action", 100), skill("C", "social", 100),
                  skill("D", "social", 100), skill("E", "knowledge", 1)]
        response = self.client.post(reverse("npc-list"), {"name": "Zu stark", "skills": skills}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_bonus_budget_cannot_be_exceeded(self):
        """Expect a 400 when bonus points are spent without a bonus budget."""
        data = {"name": "Gelevelt", "skills": [skill("A", "action", 10, 5)]}
        response = self.client.post(reverse("npc-list"), data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_points_above_one_hundred_are_rejected(self):
        """Expect a 400 for a skill with more than 100 base points."""
        data = {"name": "Wirtin", "skills": [skill("A", "action", 101)]}
        response = self.client.post(reverse("npc-list"), data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_unknown_talent_is_rejected(self):
        """Expect a 400 for a talent that is not part of the rule set."""
        data = {"name": "Wirtin", "skills": [skill("A", "magic", 10)]}
        response = self.client.post(reverse("npc-list"), data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_partial_update_checks_against_stored_skills(self):
        """Expect a 400 when the budget is lowered below the stored skills."""
        npc = Npc.objects.create(owner=self.master, name="Wirtin", skills=SKILLS)
        response = self.client.patch(reverse("npc-detail", args=[npc.pk]), {"skill_points_total": 100}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_list_shows_only_own_npcs(self):
        """Expect the NPC of another game master to stay hidden."""
        Npc.objects.create(owner=self.master, name="Meine")
        Npc.objects.create(owner=self.other, name="Fremde")
        names = [npc["name"] for npc in self.client.get(reverse("npc-list")).data]
        self.assertEqual(names, ["Meine"])

    def test_foreign_npc_is_not_found(self):
        """Expect a 404 for the NPC of another game master."""
        npc = Npc.objects.create(owner=self.other, name="Fremde")
        response = self.client.get(reverse("npc-detail", args=[npc.pk]))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_player_is_forbidden(self):
        """Expect a 403 for an account without the game master switch."""
        self.client.force_authenticate(self.player)
        self.assertEqual(self.client.get(reverse("npc-list")).status_code, status.HTTP_403_FORBIDDEN)
