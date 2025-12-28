#!/bin/bash

# GCP Cloud Run Deployment Script for db-agent
# This script automates the deployment process to Google Cloud Run

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SERVICE_NAME="${SERVICE_NAME:-db-agent}"
REGION="${REGION:-us-central1}"
REPOSITORY="${REPOSITORY:-db-agent}"

echo -e "${GREEN}Starting deployment to GCP Cloud Run...${NC}\n"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: gcloud CLI is not installed.${NC}"
    echo "Please install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Get project ID
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}Error: No GCP project is set.${NC}"
    echo "Run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo -e "${YELLOW}Project ID:${NC} $PROJECT_ID"
echo -e "${YELLOW}Service Name:${NC} $SERVICE_NAME"
echo -e "${YELLOW}Region:${NC} $REGION"
echo -e "${YELLOW}Repository:${NC} $REPOSITORY\n"

# Enable required APIs
echo -e "${GREEN}Enabling required GCP APIs...${NC}"
gcloud services enable \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    artifactregistry.googleapis.com

# Create Artifact Registry repository if it doesn't exist
echo -e "\n${GREEN}Creating Artifact Registry repository...${NC}"
if ! gcloud artifacts repositories describe $REPOSITORY --location=$REGION &>/dev/null; then
    gcloud artifacts repositories create $REPOSITORY \
        --repository-format=docker \
        --location=$REGION \
        --description="Docker repository for $SERVICE_NAME"
    echo -e "${GREEN}Repository created successfully.${NC}"
else
    echo -e "${YELLOW}Repository already exists.${NC}"
fi

# Build and deploy using Cloud Build
echo -e "\n${GREEN}Building and deploying with Cloud Build...${NC}"
gcloud builds submit \
    --config=cloudbuild.yaml \
    --substitutions=_SERVICE_NAME=$SERVICE_NAME,_REGION=$REGION,_REPOSITORY=$REPOSITORY

# Get the service URL
echo -e "\n${GREEN}Deployment complete!${NC}"
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(status.url)')
echo -e "${GREEN}Service URL:${NC} $SERVICE_URL"

# Show logs command
echo -e "\n${YELLOW}To view logs, run:${NC}"
echo "gcloud run services logs read $SERVICE_NAME --region=$REGION"

echo -e "\n${YELLOW}To set environment variables, run:${NC}"
echo "gcloud run services update $SERVICE_NAME --region=$REGION --set-env-vars KEY=VALUE"

echo -e "\n${GREEN}Deployment successful! ${NC}"
