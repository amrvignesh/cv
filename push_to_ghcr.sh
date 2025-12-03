#!/bin/bash

# Script to build and push Docker images to GitHub Container Registry
# Usage: ./push_to_ghcr.sh <github_token>

if [ -z "$1" ]; then
    echo "Error: GitHub Personal Access Token is required"
    echo "Usage: $0 <github_token>"
    echo "Create a PAT at: https://github.com/settings/tokens"
    echo "Required permissions: write:packages, read:packages"
    exit 1
fi

GITHUB_TOKEN="$1"
USERNAME="amrvignesh"
REPO="cv"

echo "Logging into GitHub Container Registry..."
echo "$GITHUB_TOKEN" | docker login ghcr.io -u "$USERNAME" --password-stdin

if [ $? -ne 0 ]; then
    echo "Failed to login to GHCR"
    exit 1
fi

echo "Tagging images for GHCR..."

# Tag backend image
docker tag cv-backend ghcr.io/$USERNAME/$REPO-backend:latest

# Tag frontend image
docker tag cv-frontend ghcr.io/$USERNAME/$REPO-frontend:latest

echo "Pushing images to GHCR..."

# Push backend
echo "Pushing backend image..."
docker push ghcr.io/$USERNAME/$REPO-backend:latest

if [ $? -ne 0 ]; then
    echo "Failed to push backend image"
    exit 1
fi

# Push frontend
echo "Pushing frontend image..."
docker push ghcr.io/$USERNAME/$REPO-frontend:latest

if [ $? -ne 0 ]; then
    echo "Failed to push frontend image"
    exit 1
fi

echo "✅ Successfully pushed images to GitHub Container Registry!"
echo "Backend: ghcr.io/$USERNAME/$REPO-backend:latest"
echo "Frontend: ghcr.io/$USERNAME/$REPO-frontend:latest"
