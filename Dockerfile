# Use a slim, Debian-based image for better compatibility with compiled packages
FROM python:3.12-slim

# Set the working directory inside the container
WORKDIR /app


RUN pip install uv


COPY pyproject.toml .

# Install dependencies using uv.
# --system installs to the global environment, which is standard for containers.
# -e . tells uv to install the project defined in pyproject.toml.
RUN uv pip install --system -e .

COPY . .

EXPOSE 8000


CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]