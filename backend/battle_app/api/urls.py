"""URL patterns for battle endpoints."""

from django.urls import path

from . import views

urlpatterns = [
    path("battles/", views.BattleList.as_view(), name="battle-list"),
    path("battles/<int:pk>/", views.BattleDetail.as_view(), name="battle-detail"),
    path("battles/<int:battle_id>/combatants/", views.CombatantList.as_view(), name="combatant-list"),
    path("combatants/<int:pk>/", views.CombatantDetail.as_view(), name="combatant-detail"),
    path("battles/<int:battle_id>/start/", views.BattleStart.as_view(), name="battle-start"),
    path("battles/<int:battle_id>/next/", views.BattleNext.as_view(), name="battle-next"),
    path("battles/<int:battle_id>/attack/", views.BattleAttack.as_view(), name="battle-attack"),
    path("battles/<int:battle_id>/parry/", views.BattleParry.as_view(), name="battle-parry"),
    path("battles/<int:battle_id>/close/", views.BattleClose.as_view(), name="battle-close"),
    path("battles/<int:battle_id>/discard/", views.BattleDiscard.as_view(), name="battle-discard"),
    path("battles/<int:battle_id>/finish/", views.BattleFinish.as_view(), name="battle-finish"),
    path("sessions/<int:session_id>/battle/", views.PlayerBattle.as_view(), name="player-battle"),
    path("sessions/<int:session_id>/battle/attack/", views.PlayerBattleAttack.as_view(), name="player-battle-attack"),
    path("sessions/<int:session_id>/battle/parry/", views.PlayerBattleParry.as_view(), name="player-battle-parry"),
]
