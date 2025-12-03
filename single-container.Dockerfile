# Single container approach for Render.com
FROM python:3.9-slim

# Install Node.js for building frontend
RUN apt-get update && apt-get install -y \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy and install Python dependencies first
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend code
COPY backend/ ./backend/

# Copy frontend and build it
COPY frontend/ ./frontend/
WORKDIR /app/frontend
RUN npm install && npm run build

# Go back to root
WORKDIR /app

# Create a startup script
RUN echo '#!/bin/bash\n\
# Start both frontend and backend\n\
cd /app/frontend && npm start & \n\
cd /app/backend && python app.py' > /app/start.sh

RUN chmod +x /app/start.sh

EXPOSE 3000 5000

CMD ["/app/start.sh"]
