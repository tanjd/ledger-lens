# Self-Hosted GitHub Actions Runner on TrueNAS SCALE

This guide sets up a self-hosted GitHub Actions runner on your NAS so that after every release,
the new Docker images are automatically pulled and redeployed — no manual steps needed.

---

## How it works

The runner container makes an **outbound HTTPS connection (port 443) to GitHub** — GitHub never
connects inward to your NAS. This means:

- No ports to open on your NAS or router
- Works behind NAT with zero firewall changes
- NAS just needs normal internet access

The release workflow gains a `deploy` job that runs on this runner. It pulls the new images and
restarts the containers via `docker compose up -d`.

---

## Cost

Self-hosted runners are **free**. Jobs on them do not consume GitHub Actions minutes. Only
GitHub-hosted runners (`ubuntu-latest` etc.) count against your monthly quota.

---

## Using the runner for other projects

A runner registered to one repo is scoped to that repo only. Options:

- **Per-repo (recommended for home use):** Run one runner container per project with a different
  `REPO_URL` and `RUNNER_NAME`. They're just Docker containers — cheap to add more.
- **Org-level:** Register the runner to a GitHub organization so it's shared across all repos.
  Requires org admin access.

---

## Setup

### Step 1 — Create a GitHub Personal Access Token (PAT)

1. Go to **GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens**
2. Create a new token scoped to **this repo only**
3. Grant these permissions:
   - **Actions**: Read and Write
   - **Administration**: Read and Write (required to register/unregister the runner)
4. Copy the token value

### Step 2 — Add the PAT as a GitHub Actions secret

1. Go to **GitHub repo → Settings → Secrets and variables → Actions → New repository secret**
2. Name: `NAS_RUNNER_PAT`
3. Value: the PAT from Step 1

This lets the `deploy` job authenticate to Docker Hub (via the existing `DOCKER_USERNAME` secret)
without needing additional credentials on the runner itself.

### Step 3 — Add the runner service to your NAS `docker-compose.yml`

Add this service alongside `backend` and `frontend` in `/mnt/tank/ledger-lens/docker-compose.yml`:

```yaml
  runner:
    image: myoung34/github-runner:latest
    container_name: ledger-lens-runner
    restart: unless-stopped
    environment:
      ACCESS_TOKEN: <paste-your-PAT-here>        # never commit this to git
      REPO_URL: https://github.com/tanjd/ledger-lens
      RUNNER_NAME: nas-runner
      RUNNER_WORKDIR: /tmp/runner/work
      LABELS: nas
      EPHEMERAL: "false"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - /tmp/runner:/tmp/runner
```

> **Security:** `ACCESS_TOKEN` is set directly in the compose file on the NAS, which lives in
> `/mnt/tank/` and is not tracked by git. Never paste the PAT into a file that gets committed.

Start the runner:

```bash
docker compose -f /mnt/tank/ledger-lens/docker-compose.yml up -d runner
```

### Step 4 — Verify registration

Go to **GitHub repo → Settings → Actions → Runners**. You should see `nas-runner` with an **Idle**
status within ~30 seconds of starting the container.

### Step 5 — Add the `deploy` job to `release.yml`

Add this job after the existing `docker` job in `.github/workflows/release.yml`:

```yaml
  deploy:
    name: Deploy to NAS
    runs-on: [self-hosted, nas]
    needs: docker
    if: needs.release.outputs.released == 'true'
    timeout-minutes: 10

    steps:
      - name: Pull latest images
        run: |
          docker pull ${{ secrets.DOCKER_USERNAME }}/ledger-lens:latest
          docker pull ${{ secrets.DOCKER_USERNAME }}/ledger-lens-backend:latest

      - name: Redeploy via Compose
        run: |
          docker compose -f /mnt/tank/ledger-lens/docker-compose.yml up -d --no-build backend frontend
```

- `runs-on: [self-hosted, nas]` — targets the runner by its `LABELS: nas` label
- `--no-build` — prevents compose from trying to build images locally

---

## End-to-end flow

```
git push → CI → build-check → release (semver tag) → docker (push to Hub)
                                                              ↓
                                                   deploy (runs on NAS runner)
                                                   docker pull :latest
                                                   docker compose up -d
                                                              ↓
                                                   NAS containers restarted ✓
```

---

## Verification after setup

1. Confirm runner shows **Idle** in GitHub → Settings → Actions → Runners
2. Merge a commit that triggers a release
3. Watch the Actions tab — `deploy` job appears and runs after `docker` finishes
4. On the NAS: `docker ps` — containers show a recent restart time
5. `docker inspect ledger-lens-frontend | grep Image` — digest matches the newly pushed tag

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Runner shows Offline | Container stopped or PAT expired | `docker compose up -d runner`; rotate PAT if expired |
| `deploy` job never starts | Runner not picked up | Check runner label matches `runs-on` in workflow (`nas`) |
| `permission denied` on Docker socket | Socket not mounted | Confirm `/var/run/docker.sock:/var/run/docker.sock` in volumes |
| PAT expired (runners deregister) | Fine-grained PATs expire | Set expiry to max (1 year) or use classic PAT with `repo` + `admin:org` scopes |
| `compose` command not found | Old Docker install | Use `docker compose` (v2 plugin) not `docker-compose` (v1) |
