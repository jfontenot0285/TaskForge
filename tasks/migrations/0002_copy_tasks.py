from django.db import migrations


OLD_TASK = "projects_task"
NEW_TASK = "tasks_task"
OLD_M2M = "projects_task_projects"
NEW_M2M = "tasks_task_projects"


def copy_task_collections(apps, schema_editor):
    db = schema_editor.connection.database

    old_tasks = list(db[OLD_TASK].find())
    if old_tasks:
        db[NEW_TASK].insert_many(old_tasks)

    old_links = list(db[OLD_M2M].find())
    if old_links:
        db[NEW_M2M].insert_many(old_links)

    db.drop_collection(OLD_TASK)
    db.drop_collection(OLD_M2M)


class Migration(migrations.Migration):

    dependencies = [
        ("tasks", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(copy_task_collections, migrations.RunPython.noop),
    ]
