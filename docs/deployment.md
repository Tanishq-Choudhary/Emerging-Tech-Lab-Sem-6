# CodeAtlas Deployment Guide

This document covers running the CodeAtlas platform locally for development and deploying it to Kubernetes.

## Local Development (Docker Compose)

The easiest way to run the entire stack locally is using Docker Compose. The `dev` configuration mounts your local source code into the containers for hot reloading.

```bash
cd infra/docker
docker-compose -f docker-compose.dev.yml up --build
```

Services exposed:
- API Gateway: `http://localhost:3000`
- PostgreSQL: `localhost:5432`

## Production Build

To test the production container images:

```bash
cd infra/docker
docker-compose up --build
```

## Kubernetes Deployment

The project includes base Kubernetes manifests designed to be deployed into a single namespace.

### Prerequisites
- A running Kubernetes cluster (Minikube, kind, or managed cloud like GKE/EKS)
- `kubectl` configured
- Platform images built and available to the cluster (or pushed to a registry)

### Deployment Steps

1. Create the namespace:
```bash
kubectl apply -f infra/kubernetes/base/namespace.yml
```

2. Create a secret for the database password:
```bash
kubectl create secret generic codeatlas-secrets \
  --namespace=codeatlas \
  --from-literal=pg-password="your-secure-password"
```

3. Apply the config map and persistent volumes:
```bash
kubectl apply -f infra/kubernetes/base/configmap.yml
kubectl apply -f infra/kubernetes/base/postgres.pvc.yml
```

4. Deploy the services:
```bash
kubectl apply -f infra/kubernetes/base/postgres.deployment.yml
kubectl apply -f infra/kubernetes/base/postgres.service.yml
kubectl apply -f infra/kubernetes/base/api-gateway.deployment.yml
kubectl apply -f infra/kubernetes/base/api-gateway.service.yml
kubectl apply -f infra/kubernetes/base/ingestion.deployment.yml
kubectl apply -f infra/kubernetes/base/ingestion.service.yml
```

5. Verify pods are running:
```bash
kubectl get pods -n codeatlas
```
