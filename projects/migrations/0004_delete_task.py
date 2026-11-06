from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("projects", "0003_project_task_assignee_projects"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.DeleteModel(name="Task"),
            ],
            database_operations=[],
        ),
    ]
