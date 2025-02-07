FROM public.ecr.aws/docker/library/python:3.10-slim-bullseye AS django

ENV PIP_DISABLE_PIP_VERSION_CHECK 1
ENV PYTHONUNBUFFERED 1
ARG PYTHONDONTWRITEBYTECODE

WORKDIR /code

RUN apt-get update -y && \
    apt-get install -y --no-install-recommends build-essential curl libpq-dev netcat libssl-dev libffi-dev && \
    apt-get clean

RUN pip install --upgrade pip

COPY ./django/requirements.txt .
RUN pip install -r requirements.txt

COPY ./django/ .


FROM django AS django_with_entrypoint

COPY ./docker/django/entrypoint.sh /home
RUN chmod +x /home/entrypoint.sh
ENTRYPOINT ["/bin/bash", "/home/entrypoint.sh"]