"""Tag everything that already hangs on a scene with the chapter of that scene.

Worlds written before the chapter tags existed get their tags here, so nothing has to be loaded again.
"""

from django.db import migrations


def fill_chapter_tags(apps, schema_editor):
    """Copy the place, NPCs, quests, events and knowledge of every scene into the lists of its chapter."""
    Scene = apps.get_model("world_app", "Scene")
    for scene in Scene.objects.select_related("chapter"):
        chapter = scene.chapter
        if scene.location_id:
            chapter.locations.add(scene.location_id)
        chapter.npcs.add(*scene.npcs.all())
        chapter.quests.add(*scene.quests.all())
        chapter.events.add(*scene.events.all())
        chapter.trivia.add(*scene.trivia.all())


class Migration(migrations.Migration):
    dependencies = [("world_app", "0010_chapter_tags")]

    operations = [migrations.RunPython(fill_chapter_tags, migrations.RunPython.noop)]
