from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from tasks.models import Task

User = get_user_model()

USERNAME = "manytasks"
PASSWORD = "manytasks1"
TASK_COUNT = 100


class Command(BaseCommand):
    help = "Create the manytasks user and 100 seed tasks for pagination testing."

    def handle(self, *args, **options):
        user, created = User.objects.get_or_create(username=USERNAME)
        if created:
            user.set_password(PASSWORD)
            user.save()
            self.stdout.write(self.style.SUCCESS(f"Created user {USERNAME}"))
        else:
            self.stdout.write(f"User {USERNAME} already exists")

        existing = set(Task.objects.filter(assignee=user).values_list("title", flat=True))
        to_create = [
            Task(
                title=f"seed{i}",
                description=f"seed{i}",
                status=Task.Status.NEW,
                assignee=user,
            )
            for i in range(1, TASK_COUNT + 1)
            if f"seed{i}" not in existing
        ]
        if to_create:
            Task.objects.bulk_create(to_create)

        total = Task.objects.filter(assignee=user).count()
        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded {len(to_create)} tasks. {USERNAME} now has {total} tasks. "
                f"Password: {PASSWORD}"
            )
        )
