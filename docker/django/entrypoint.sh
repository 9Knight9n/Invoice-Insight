#!/bin/sh

echo 'Waiting for postgres...'

while ! nc -z $POSTGRES_HOST $POSTGRES_PORT; do
    echo "Waiting for PostgreSQL to start... Host: $POSTGRES_HOST, Port: $POSTGRES_PORT"
    sleep 0.1
done

echo 'PostgreSQL started'

echo 'Running migrations...'
python manage.py makemigrations
python manage.py makemigrations authentication
python manage.py makemigrations invoices
python manage.py migrate

# Add this block after PostgreSQL check
echo 'Waiting for Redis...'
while ! nc -z redis 6379; do
    echo "Waiting for Redis to start... Host: redis, Port: 6379"
    sleep 0.1
done
echo 'Redis started'

echo 'Checking for admin account...'
cat <<EOF | python manage.py shell
from django.contrib.auth import get_user_model

User = get_user_model()  # get the currently active user model,

User.objects.filter(username='admin').exists() or \
    User.objects.create_superuser('admin', 'admin@example.com', 'admin')
EOF


#echo 'Collecting static files...'
#python manage.py collectstatic --no-input

exec "$@"