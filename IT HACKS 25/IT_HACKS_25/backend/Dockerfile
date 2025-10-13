FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1

WORKDIR /app

# install build deps (kept minimal) and clean up
RUN apt-get update && apt-get install -y --no-install-recommends gcc build-essential && rm -rf /var/lib/apt/lists/*

# copy only requirements first to leverage build cache
COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# copy source
COPY . /app

EXPOSE 8000

# default dev command; docker-compose may override
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
