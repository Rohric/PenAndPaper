"""Endpoints for battles: the game master runs them, the players of the session watch and roll."""

from functools import cached_property

from django.shortcuts import get_object_or_404
from rest_framework import generics
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from auth_app.api.permissions import IsGameMaster
from battle_app import utils
from battle_app.models import Combatant
from session_app.utils import session_for_member

from .serializers import (
    ActionSerializer,
    AttackSerializer,
    BattleSerializer,
    CombatantSerializer,
    ParrySerializer,
    PlayerActionSerializer,
    PlayerAttackSerializer,
    PlayerParrySerializer,
)

GAME_MASTER_ONLY = [IsAuthenticated, IsGameMaster]
TURN_OPEN = "Erst muss der offene Wurf abgeschlossen oder verworfen werden."
NOTHING_WAITS = "Es wartet kein Treffer auf eine Parade."
NOTHING_OPEN = "Es ist kein Wurf offen, der abgeschlossen werden kann."
NOT_YOUR_TURN = "Diesen Zug schließt der Spielleiter ab."


class BattleMixin:
    """Find the battle from the URL for the game master who runs it."""

    permission_classes = GAME_MASTER_ONLY

    @cached_property
    def battle(self):
        """Return the battle from the URL, or raise a 404 when it is not the user's."""
        battle = get_object_or_404(utils.battles_for_user(self.request.user), pk=self.kwargs["battle_id"])
        return utils.follow_characters(battle)


class BattleList(generics.ListCreateAPIView):
    """
    List and create battles.

    - GET: the battles of the requesting game master, with "?session=" only those of one session.
    - POST: create a battle; a session brings its characters along, a scene its NPCs.
    """

    serializer_class = BattleSerializer
    permission_classes = GAME_MASTER_ONLY

    def get_queryset(self):
        """Return the user's battles, narrowed to a session when one is named."""
        battles = utils.battles_for_user(self.request.user).prefetch_related("combatants")
        session = self.request.query_params.get("session")
        return battles.filter(session_id=session) if session else battles

    def perform_create(self, serializer):
        """Save the new battle with the requesting user as owner."""
        serializer.save(owner=self.request.user)


class BattleDetail(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete one battle of the requesting game master."""

    serializer_class = BattleSerializer
    permission_classes = GAME_MASTER_ONLY

    def get_queryset(self):
        """Return only the battles the requesting user runs."""
        return utils.battles_for_user(self.request.user)

    def get_object(self):
        """Return the battle with the life points its player characters have right now."""
        return utils.follow_characters(super().get_object())


class CombatantList(BattleMixin, generics.ListCreateAPIView):
    """List the combatants of a battle and add one: an NPC, a player character or just a name."""

    serializer_class = CombatantSerializer

    def get_queryset(self):
        """Return the combatants of the battle."""
        return self.battle.combatants.all()

    def perform_create(self, serializer):
        """Save the new combatant in the battle."""
        serializer.save(battle=self.battle)


class CombatantDetail(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or remove one combatant, for example to set its life points by hand."""

    serializer_class = CombatantSerializer
    permission_classes = GAME_MASTER_ONLY

    def get_queryset(self):
        """Return only combatants of the requesting user's battles."""
        return Combatant.objects.filter(battle__owner=self.request.user)

    def perform_update(self, serializer):
        """Save the combatant; life points set by hand go onto its player character, new statuses into the log."""
        before = {status["name"] for status in serializer.instance.statuses}
        combatant = serializer.save()
        if "life_points" in serializer.validated_data:
            utils.carry_life(combatant)
        utils.log_new_statuses(combatant, before)


class BattleStep(BattleMixin, APIView):
    """Base for the steps of a fight; a subclass does its step."""

    def step(self, request):
        """Do one step of the fight; overridden by the subclasses."""
        raise NotImplementedError

    def post(self, request, battle_id):
        """Do the step and return the battle as it is afterwards."""
        self.step(request)
        self.battle.refresh_from_db()
        return Response(BattleSerializer(self.battle, context={"request": request}).data)


class BattleStart(BattleStep):
    """Roll the initiative for everybody and begin round 1."""

    def step(self, request):
        """Start the fight."""
        utils.start(self.battle)


class BattleNext(BattleStep):
    """Give the turn to the next combatant without an attack; after the last one the next round begins."""

    def step(self, request):
        """Move the turn on, unless a roll is still open."""
        if self.battle.pending:
            raise ValidationError(TURN_OPEN)
        utils.next_turn(self.battle)


class BattleAttack(BattleStep):
    """Roll an attack for any combatant. It stays open until the game master closes the turn."""

    def step(self, request):
        """Check that both combatants fight in this battle, then roll the attack."""
        serializer = AttackSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        if self.battle.pending:
            raise ValidationError(TURN_OPEN)
        if {data["attacker"].battle_id, data["defender"].battle_id} != {self.battle.pk}:
            raise ValidationError("Beide Teilnehmer müssen zu diesem Kampf gehören.")
        utils.attack(
            self.battle, data["attacker"], data["defender"], data["value"], data["damage_dice"], data["damage_bonus"]
        )


class BattleAction(BattleStep):
    """Keep an action of any combatant open that is no attack, with or without a roll."""

    def step(self, request):
        """Check that the combatant fights in this battle, then note the action and roll if a value is given."""
        serializer = ActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        if self.battle.pending:
            raise ValidationError(TURN_OPEN)
        if data["actor"].battle_id != self.battle.pk:
            raise ValidationError("Der Teilnehmer muss zu diesem Kampf gehören.")
        utils.act(self.battle, data["actor"], data["label"], data["value"])


class BattleParry(BattleStep):
    """Decide the parry of the open hit as game master: the target parries with a value, or takes the damage."""

    def step(self, request):
        """Roll the parry, or the damage when the target does not parry."""
        serializer = ParrySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        if utils.stage_of(self.battle) != utils.PARRY:
            raise ValidationError(NOTHING_WAITS)
        utils.resolve(self.battle, serializer.validated_data.get("parry_value"))


class BattleClose(BattleStep):
    """Close the turn: only now the open roll counts, the damage is taken off and the next one is on."""

    def step(self, request):
        """Close the open exchange once its parry is decided."""
        if utils.stage_of(self.battle) != utils.CLOSE:
            raise ValidationError(NOTHING_OPEN)
        utils.close_turn(self.battle)


class BattleDiscard(BattleStep):
    """Throw the open roll away; nothing of it is saved."""

    def step(self, request):
        """Discard the open exchange."""
        if not self.battle.pending:
            raise ValidationError(NOTHING_OPEN)
        utils.discard(self.battle)


class BattleFinish(BattleStep):
    """End the fight."""

    def step(self, request):
        """Finish the fight."""
        utils.finish(self.battle)


class PlayerBattleMixin:
    """Find the running battle of a session for one of its players, and the player's own combatant."""

    permission_classes = [IsAuthenticated]

    @cached_property
    def battle(self):
        """Return the battle the session is fighting, or None."""
        session = session_for_member(self.request.user, self.kwargs["session_id"])
        battle = utils.running_battle(session)
        return utils.follow_characters(battle) if battle else None

    @cached_property
    def own(self):
        """Return the player's own combatant, or refuse when the player does not fight."""
        own = utils.own_combatant(self.battle, self.request.user) if self.battle else None
        if own is None or own.life_points <= 0:
            raise PermissionDenied("Dein Charakter kämpft gerade nicht.")
        return own

    def answer(self):
        """Return the battle as the players see it."""
        self.battle.refresh_from_db()
        return Response(utils.battle_for_players(self.battle, self.request.user))


class PlayerBattle(PlayerBattleMixin, APIView):
    """Show the running battle of a session to its players: the order, whose turn it is and what happened."""

    def get(self, request, session_id):
        """Return the battle as players see it, or nothing when the session does not fight."""
        if not self.battle:
            return Response(None)
        return Response(utils.battle_for_players(self.battle, request.user))


class PlayerBattleAttack(PlayerBattleMixin, APIView):
    """Let a player roll the attack of the own character when it is its turn."""

    def post(self, request, session_id):
        """Roll the attack with the skill and the weapon from the player's own sheet."""
        serializer = PlayerAttackSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data, own = serializer.validated_data, self.own
        if self.battle.pending:
            raise ValidationError(TURN_OPEN)
        if self.battle.current_id != own.pk:
            raise PermissionDenied("Du bist nicht dran.")
        if data["defender"].battle_id != self.battle.pk or data["defender"].life_points <= 0:
            raise ValidationError("Dieses Ziel kämpft nicht mehr in diesem Kampf.")
        value = utils.attack_value(own.player_character, data["skill"])
        dice, bonus = utils.weapon_damage(own.player_character, data["weapon"])
        utils.attack(self.battle, own, data["defender"], value, dice, bonus)
        return self.answer()


class PlayerBattleAction(PlayerBattleMixin, APIView):
    """Let a player do something else than an attack when it is the turn of the own character."""

    def post(self, request, session_id):
        """Note what the character does; with a roll, the check goes against a skill of the own sheet."""
        serializer = PlayerActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data, own = serializer.validated_data, self.own
        if self.battle.pending:
            raise ValidationError(TURN_OPEN)
        if self.battle.current_id != own.pk:
            raise PermissionDenied("Du bist nicht dran.")
        value = utils.attack_value(own.player_character, data["skill"]) if data["rolls"] else None
        utils.act(self.battle, own, data["label"], value)
        return self.answer()


class PlayerBattleParry(PlayerBattleMixin, APIView):
    """Let a player decide whether the own character parries the hit that waits."""

    def post(self, request, session_id):
        """Roll the parry with a skill from the player's own sheet, or take the hit."""
        serializer = PlayerParrySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data, own = serializer.validated_data, self.own
        if utils.stage_of(self.battle) != utils.PARRY or self.battle.pending["defender"] != own.pk:
            raise ValidationError(NOTHING_WAITS)
        value = utils.attack_value(own.player_character, data["skill"]) if data["parry"] else None
        utils.resolve(self.battle, value)
        return self.answer()


class PlayerBattleClose(PlayerBattleMixin, APIView):
    """Let a player close the turn of the own character, so its roll counts and the next one is on."""

    def post(self, request, session_id):
        """Close the open exchange when the own character is on turn and rolled it."""
        own = self.own
        if utils.stage_of(self.battle) != utils.CLOSE:
            raise ValidationError(NOTHING_OPEN)
        if self.battle.current_id != own.pk or self.battle.pending["attacker"] != own.pk:
            raise PermissionDenied(NOT_YOUR_TURN)
        utils.close_turn(self.battle)
        return self.answer()
