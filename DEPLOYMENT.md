# GCP Cloud Run Deployment Guide

This guide explains how to deploy the db-agent application to Google Cloud Run.

## Prerequisites

1. **Google Cloud Account**: You need an active GCP account with billing enabled
2. **gcloud CLI**: Install the Google Cloud CLI from [here](https://cloud.google.com/sdk/docs/install)
3. **Docker**: Ensure Docker is installed locally (for local testing only)
4. **GCP Project**: Create or select a GCP project

## Initial Setup

### 1. Install and Configure gcloud CLI

```bash
# Install gcloud CLI (if not already installed)
# Follow instructions at: https://cloud.google.com/sdk/docs/install

# Initialize gcloud
gcloud init

# Set your project
gcloud config set project YOUR_PROJECT_ID

# Authenticate
gcloud auth login
```

### 2. Enable Required APIs

The deployment script will automatically enable these, but you can do it manually:

```bash
gcloud services enable \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    artifactregistry.googleapis.com
```

## Deployment

### Quick Deployment

Simply run the deployment script:

```bash
./deploy.sh
```

The script will:
- Enable required GCP APIs
- Create an Artifact Registry repository
- Build your Docker image using Cloud Build
- Deploy to Cloud Run
- Output the service URL

### Custom Deployment Options

You can customize the deployment with environment variables:

```bash
# Deploy with custom service name and region
SERVICE_NAME=my-db-agent REGION=us-east1 ./deploy.sh

# Deploy to a different region
REGION=europe-west1 ./deploy.sh
```

### Manual Deployment Steps

If you prefer to deploy manually:

#### Step 1: Create Artifact Registry Repository

```bash
gcloud artifacts repositories create db-agent \
    --repository-format=docker \
    --location=us-central1 \
    --description="Docker repository for db-agent"
```

#### Step 2: Build and Push Docker Image

```bash
# Build the image
gcloud builds submit --tag us-central1-docker.pkg.dev/YOUR_PROJECT_ID/db-agent/db-agent:latest

# Or use Cloud Build with the config file
gcloud builds submit --config=cloudbuild.yaml
```

#### Step 3: Deploy to Cloud Run

```bash
gcloud run deploy db-agent \
    --image us-central1-docker.pkg.dev/YOUR_PROJECT_ID/db-agent/db-agent:latest \
    --region us-central1 \
    --platform managed \
    --allow-unauthenticated
```

## Environment Variables

### Setting Environment Variables

Your application requires certain environment variables. Set them using:

```bash
gcloud run services update db-agent \
    --region us-central1 \
    --set-env-vars "AI_MODEL=your-model,MONGODB_URI=your-mongodb-uri,ANTHROPIC_API_KEY=your-key"
```

### Required Environment Variables

Based on your application, you'll likely need:

- `AI_MODEL`: The AI model to use
- `PORT`: Port number (Cloud Run sets this automatically)
- `MONGODB_URI`: MongoDB connection string
- `ANTHROPIC_API_KEY`: Anthropic API key (if using Anthropic)
- `GOOGLE_API_KEY`: Google API key (if using Google AI)
- `NATS_URL`: NATS server URL (if using NATS)
- `DD_API_KEY`: Datadog API key (if using Datadog)
- `DD_SERVICE`: Datadog service name
- `DD_ENV`: Datadog environment

### Setting Secrets

For sensitive data, use Secret Manager:

```bash
# Create a secret
echo -n "your-secret-value" | gcloud secrets create mongodb-uri --data-file=-

# Grant Cloud Run access to the secret
gcloud secrets add-iam-policy-binding mongodb-uri \
    --member=serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com \
    --role=roles/secretmanager.secretAccessor

# Update Cloud Run to use the secret
gcloud run services update db-agent \
    --region us-central1 \
    --update-secrets=MONGODB_URI=mongodb-uri:latest
```

## Managing Your Deployment

### View Service Details

```bash
gcloud run services describe db-agent --region us-central1
```

### View Logs

```bash
# Stream logs
gcloud run services logs tail db-agent --region us-central1

# Read recent logs
gcloud run services logs read db-agent --region us-central1
```

### Update the Service

To deploy updates, simply run the deployment script again:

```bash
./deploy.sh
```

### Configure Autoscaling

```bash
gcloud run services update db-agent \
    --region us-central1 \
    --min-instances 0 \
    --max-instances 10
```

### Set Memory and CPU

```bash
gcloud run services update db-agent \
    --region us-central1 \
    --memory 512Mi \
    --cpu 1
```

### Configure Timeout

```bash
gcloud run services update db-agent \
    --region us-central1 \
    --timeout 300
```

## Authentication

### Allow Unauthenticated Access

```bash
gcloud run services add-iam-policy-binding db-agent \
    --region us-central1 \
    --member="allUsers" \
    --role="roles/run.invoker"
```

### Require Authentication

```bash
gcloud run services remove-iam-policy-binding db-agent \
    --region us-central1 \
    --member="allUsers" \
    --role="roles/run.invoker"
```

## Custom Domain

### Map a Custom Domain

```bash
gcloud run domain-mappings create \
    --service db-agent \
    --domain your-domain.com \
    --region us-central1
```

## Monitoring

### View Metrics in Console

Visit: https://console.cloud.google.com/run/detail/REGION/SERVICE_NAME/metrics

### Set Up Alerts

You can set up alerts in the GCP Console under Monitoring > Alerting.

## Cost Optimization

Cloud Run charges based on:
- CPU and memory usage
- Number of requests
- Networking

To optimize costs:
1. Set appropriate min/max instances (set min to 0 if traffic is sporadic)
2. Right-size memory and CPU allocations
3. Use request-based autoscaling
4. Monitor and optimize cold starts

## Troubleshooting

### Check Build Logs

```bash
gcloud builds list --limit 5
gcloud builds log BUILD_ID
```

### Check Service Status

```bash
gcloud run services describe db-agent --region us-central1
```

### Common Issues

1. **Port Binding**: Cloud Run sets the `PORT` environment variable. Your app listens on the PORT from env (default 3000), which Cloud Run will map correctly.

2. **Memory Limits**: If your app crashes, try increasing memory:
   ```bash
   gcloud run services update db-agent --memory 1Gi --region us-central1
   ```

3. **Environment Variables**: Ensure all required env vars are set.

4. **Secrets**: Make sure the service account has access to secrets.

## Cleanup

To delete the service:

```bash
gcloud run services delete db-agent --region us-central1
```

To delete the Artifact Registry repository:

```bash
gcloud artifacts repositories delete db-agent --location us-central1
```

## Additional Resources

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud Build Documentation](https://cloud.google.com/build/docs)
- [Artifact Registry Documentation](https://cloud.google.com/artifact-registry/docs)
- [Secret Manager Documentation](https://cloud.google.com/secret-manager/docs)
