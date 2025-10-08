# Secure Secrets Management with SOPS + age

**A vendor-free, offline-capable solution for encrypting secrets in Git repositories**

## Why SOPS + age?

- ✅ **No vendor lock-in**: Works completely offline, no cloud services required
- ✅ **Modern & secure**: Uses AES256-GCM encryption with age's simple key format
- ✅ **Git-friendly**: Encrypts only values, leaves keys visible for easy diffs
- ✅ **Team-ready**: Multiple recipients supported, easy to add/remove team members
- ✅ **Format-flexible**: Supports YAML, JSON, ENV, INI, and binary files
- ✅ **Tool integration**: Works with Terraform, Kubernetes, CI/CD pipelines

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Initial Setup](#initial-setup)
- [Daily Usage](#daily-usage)
- [Team Management](#team-management)
- [Best Practices](#best-practices)
- [Common Workflows](#common-workflows)
- [Troubleshooting](#troubleshooting)
- [Migration Guide](#migration-guide)

---

## Prerequisites

- Git repository initialized
- macOS, Linux, or Windows with WSL

---

## Installation

### macOS

```bash
brew install sops age
```

### Linux (Ubuntu/Debian)

```bash
# Install age
AGE_VERSION="1.1.1"
curl -LO "https://github.com/FiloSottile/age/releases/download/v${AGE_VERSION}/age-v${AGE_VERSION}-linux-amd64.tar.gz"
tar xzf age-v${AGE_VERSION}-linux-amd64.tar.gz
sudo install age/age age/age-keygen /usr/local/bin/

# Install SOPS
SOPS_VERSION="3.8.1"
curl -LO "https://github.com/getsops/sops/releases/download/v${SOPS_VERSION}/sops-v${SOPS_VERSION}.linux.amd64"
sudo install sops-v${SOPS_VERSION}.linux.amd64 /usr/local/bin/sops
```

### Windows (WSL)

Follow the Linux instructions above in your WSL terminal.

### Verify Installation

```bash
age --version
sops --version
```

---

## Initial Setup

### 1. Generate Your age Key

```bash
# Create the SOPS age directory
mkdir -p ~/.config/sops/age

# Generate your key (keep this safe!)
age-keygen -o ~/.config/sops/age/keys.txt

# View your public key
grep "public key:" ~/.config/sops/age/keys.txt
```

**Expected output:**
```
# created: 2025-09-29T10:30:45-07:00
# public key: age1ht3tfqlfrwdwx0z0ynwplcr6qxcxfaqycuprpmy89nr83ltx74tqdpszlw
AGE-SECRET-KEY-1XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

⚠️ **CRITICAL**: Back up `~/.config/sops/age/keys.txt` securely! If you lose this file, you cannot decrypt your secrets.

### 2. Configure SOPS for Your Repository

```bash
cd /path/to/your/project

# Get your public key
export MY_AGE_PUBLIC_KEY=$(grep "public key:" ~/.config/sops/age/keys.txt | awk '{print $4}')

# Create SOPS configuration
cat > .sops.yaml <<EOF
creation_rules:
  # Encrypt all .env files
  - path_regex: \.env$
    age: ${MY_AGE_PUBLIC_KEY}
  
  # Encrypt everything in secrets/ directory
  - path_regex: secrets/.*
    age: ${MY_AGE_PUBLIC_KEY}
  
  # Encrypt specific YAML/JSON files, only encrypting the data/stringData fields
  - path_regex: '.*\.enc\.(yaml|json)$'
    encrypted_regex: '^(data|stringData|password|secret|key|token)$'
    age: ${MY_AGE_PUBLIC_KEY}
EOF

# Commit the config (this is safe - it only contains public keys)
git add .sops.yaml
git commit -m "Add SOPS configuration"
```

### 3. Configure Git Diff (Optional but Recommended)

This allows you to see decrypted diffs when running `git diff`:

```bash
# Add to your repository's .gitconfig
git config diff.sopsdiffer.textconv "sops decrypt"

# Create .gitattributes for encrypted files
cat > .gitattributes <<EOF
*.env.enc diff=sopsdiffer
secrets/** diff=sopsdiffer
*.enc.yaml diff=sopsdiffer
*.enc.json diff=sopsdiffer
EOF

git add .gitattributes
git commit -m "Configure git diff for encrypted files"
```

---

## Daily Usage

### Encrypting a New File

```bash
# Method 1: Encrypt and save to new file
sops encrypt .env > .env.enc
git add .env.enc
git commit -m "Add encrypted environment variables"

# Method 2: Encrypt in-place (overwrites original)
sops encrypt --in-place secrets/database.yaml

# Method 3: Create and edit in one step
sops secrets/api-keys.enc.json
# Opens your $EDITOR with a blank file, encrypts on save
```

### Editing Encrypted Files

```bash
# Edit directly (decrypts, opens editor, re-encrypts on save)
sops secrets/database.enc.yaml

# Your $EDITOR will open with decrypted content
# Make your changes and save - SOPS handles encryption automatically
```

### Decrypting Files

```bash
# Decrypt to stdout
sops decrypt .env.enc

# Decrypt to file
sops decrypt .env.enc > .env

# Decrypt and use in command (recommended - secrets never touch disk)
sops exec-file .env.enc 'env $(cat {}) npm run dev'
```

### Using Encrypted Secrets in Applications

#### Node.js Example

```bash
# Install dotenv
npm install dotenv

# Run your app with decrypted env
sops exec-env .env.enc 'node app.js'
```

#### Docker Example

```bash
# Decrypt env file and pass to docker
sops exec-file .env.enc 'docker run --env-file {} myapp'
```

#### Shell Script Example

```bash
#!/bin/bash
# Load encrypted environment variables
eval "$(sops decrypt --output-type dotenv .env.enc)"

# Now use your secrets
echo "Connecting to ${DATABASE_URL}"
```

#### Python Example

```python
# decrypt_secrets.py
import subprocess
import json

def load_secrets(file_path):
    """Load and decrypt SOPS encrypted JSON file"""
    result = subprocess.run(
        ['sops', 'decrypt', file_path],
        capture_output=True,
        text=True,
        check=True
    )
    return json.loads(result.stdout)

# Usage
secrets = load_secrets('secrets/config.enc.json')
db_password = secrets['database']['password']
```

---

## Team Management

### Adding a New Team Member

#### Step 1: New Member Generates Their Key

New team member runs:

```bash
mkdir -p ~/.config/sops/age
age-keygen -o ~/.config/sops/age/keys.txt

# Share their PUBLIC key with the team
grep "public key:" ~/.config/sops/age/keys.txt
```

They should share something like:
```
age1qe5lxzzeppw5k79vxn3872272sgy224g2nzqlzy3uljs84say3yqgvd0sw
```

#### Step 2: Update Repository Configuration

Repository maintainer runs:

```bash
# Edit .sops.yaml to add new public key
cat > .sops.yaml <<EOF
creation_rules:
  - path_regex: \.env$
    age: >-
      age1existing_key_1,
      age1existing_key_2,
      age1new_team_member_key
EOF

git add .sops.yaml
git commit -m "Add new team member to SOPS recipients"
```

#### Step 3: Re-encrypt All Secrets

```bash
# Update a single file
sops updatekeys .env.enc

# Or update all encrypted files at once
find . -type f \( -name "*.enc.*" -o -name "*.env.enc" \) | while read file; do
  echo "Updating $file..."
  sops updatekeys "$file"
done

# Commit updated files
git add .
git commit -m "Re-encrypt secrets for new team member"
git push
```

#### Step 4: New Member Tests Access

```bash
# Clone repository
git clone <repo-url>
cd <repo>

# Test decryption
sops decrypt .env.enc
```

### Removing a Team Member

```bash
# 1. Remove their public key from .sops.yaml
# Edit the file and delete their age key from the list

# 2. Re-encrypt all secrets (same as adding)
find . -type f \( -name "*.enc.*" -o -name "*.env.enc" \) | while read file; do
  echo "Re-encrypting $file..."
  sops updatekeys "$file"
done

# 3. Commit and push
git add .
git commit -m "Revoke access for departed team member"
git push
```

⚠️ **Important**: The removed member can still access old commits. Consider rotating actual secret values (passwords, API keys) after removing someone.

### Managing Team Keys

Create a team keys file for easy management:

```bash
# Create team-keys.txt (commit this file)
cat > team-keys.txt <<EOF
# Alice (alice@company.com)
age1ht3tfqlfrwdwx0z0ynwplcr6qxcxfaqycuprpmy89nr83ltx74tqdpszlw
# Bob (bob@company.com)
age1qe5lxzzeppw5k79vxn3872272sgy224g2nzqlzy3uljs84say3yqgvd0sw
# Charlie (charlie@company.com)
age1s3cqcks5genc6ru8chl0hkkd04zmxvczsvdxq99ekffe4gmvjpzsedk23c
EOF

# Reference in .sops.yaml
cat > .sops.yaml <<EOF
creation_rules:
  - path_regex: \.env$
    age: $(cat team-keys.txt | grep -v '^#' | grep -v '^$' | tr '\n' ',' | sed 's/,$//')
EOF
```

---

## Best Practices

### 1. Never Commit Plaintext Secrets

```bash
# Add to .gitignore
cat >> .gitignore <<EOF

# Unencrypted secrets
.env
.env.local
secrets/*.yaml
secrets/*.json
!secrets/*.enc.*

# Age private keys
*.age.key
keys.txt
EOF
```

### 2. Backup Your Private Key

Your age private key (`~/.config/sops/age/keys.txt`) is irreplaceable:

```bash
# Backup to secure location (use password manager or encrypted USB)
# Option 1: Copy to password manager
cat ~/.config/sops/age/keys.txt
# Save in 1Password, Bitwarden, etc.

# Option 2: Encrypted backup
tar czf - ~/.config/sops/age | age -p > sops-keys-backup.tar.gz.age
# Store sops-keys-backup.tar.gz.age somewhere safe

# Restore from backup:
age -d sops-keys-backup.tar.gz.age | tar xzf - -C ~
```

### 3. Use Separate Keys Per Environment

```yaml
# .sops.yaml
creation_rules:
  # Development secrets
  - path_regex: secrets/dev/.*
    age: age1dev_team_key_1,age1dev_team_key_2
  
  # Production secrets (limited access)
  - path_regex: secrets/prod/.*
    age: age1ops_lead_key,age1cto_key
  
  # Shared secrets
  - path_regex: secrets/shared/.*
    age: age1dev_key,age1ops_key,age1qa_key
```

### 4. Audit Trail

Keep track of who has access:

```bash
# Document in SECRETS_ACCESS.md
cat > SECRETS_ACCESS.md <<EOF
# Secrets Access Control

## Current Key Holders

| Name    | Email              | Public Key | Environments | Added    |
|---------|-------------------|------------|--------------|----------|
| Alice   | alice@company.com | age1ht3... | dev, prod    | 2025-01-15 |
| Bob     | bob@company.com   | age1qe5... | dev          | 2025-02-20 |

## Access Changes

- 2025-02-20: Added Bob (dev access only)
- 2025-01-15: Added Alice (full access)
EOF
```

### 5. Rotate Secrets Regularly

```bash
# Create rotation reminder script
cat > scripts/rotate-secrets.sh <<'EOF'
#!/bin/bash
echo "🔄 Secrets Rotation Checklist"
echo "================================"
echo "Last rotation: $(git log --grep="Rotate secrets" --format="%ai" -1 | cut -d' ' -f1)"
echo ""
echo "Secrets to rotate:"
echo "  [ ] Database passwords"
echo "  [ ] API keys"
echo "  [ ] JWT secrets"
echo "  [ ] Service account tokens"
echo ""
echo "After rotating:"
echo "  1. Update plaintext values"
echo "  2. Re-encrypt: sops encrypt .env > .env.enc"
echo "  3. Test applications still work"
echo "  4. Commit: git commit -m 'Rotate secrets'"
EOF
chmod +x scripts/rotate-secrets.sh
```

### 6. Use .env.example for Documentation

```bash
# Create template showing structure without secrets
cat > .env.example <<EOF
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# API Keys
STRIPE_SECRET_KEY=sk_test_...
SENDGRID_API_KEY=SG....

# JWT
JWT_SECRET=your-secret-here
EOF

git add .env.example
git commit -m "Add environment template"
```

---

## Common Workflows

### Local Development Setup

```bash
# scripts/setup-dev.sh
#!/bin/bash
set -e

echo "🔧 Setting up local development environment..."

# Check for age key
if [ ! -f ~/.config/sops/age/keys.txt ]; then
  echo "❌ No age key found. Generating new key..."
  mkdir -p ~/.config/sops/age
  age-keygen -o ~/.config/sops/age/keys.txt
  echo "✅ Generated age key. Please share this public key with your team:"
  grep "public key:" ~/.config/sops/age/keys.txt
  echo ""
  echo "After sharing, wait for maintainer to add you and re-encrypt secrets."
  exit 1
fi

# Decrypt environment file
if [ -f .env.enc ]; then
  echo "🔓 Decrypting environment variables..."
  sops decrypt .env.enc > .env
  echo "✅ Environment ready"
else
  echo "⚠️  No .env.enc found. Using .env.example..."
  cp .env.example .env
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

echo "✅ Setup complete! Run 'npm run dev' to start."
```

### CI/CD Integration

#### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install SOPS
        run: |
          curl -LO https://github.com/getsops/sops/releases/download/v3.8.1/sops-v3.8.1.linux.amd64
          sudo install sops-v3.8.1.linux.amd64 /usr/local/bin/sops
      
      - name: Install age
        run: |
          curl -LO https://github.com/FiloSottile/age/releases/download/v1.1.1/age-v1.1.1-linux-amd64.tar.gz
          tar xzf age-v1.1.1-linux-amd64.tar.gz
          sudo install age/age age/age-keygen /usr/local/bin/
      
      - name: Setup age key
        run: |
          mkdir -p ~/.config/sops/age
          echo "${{ secrets.SOPS_AGE_KEY }}" > ~/.config/sops/age/keys.txt
      
      - name: Decrypt secrets
        run: |
          sops decrypt .env.enc > .env
      
      - name: Deploy
        run: |
          # Your deployment commands here
          npm run deploy
```

Store your private age key in GitHub Secrets as `SOPS_AGE_KEY`.

#### GitLab CI

```yaml
# .gitlab-ci.yml
deploy:
  image: ubuntu:latest
  before_script:
    - apt-get update && apt-get install -y curl
    - curl -LO https://github.com/getsops/sops/releases/download/v3.8.1/sops-v3.8.1.linux.amd64
    - install sops-v3.8.1.linux.amd64 /usr/local/bin/sops
    - curl -LO https://github.com/FiloSottile/age/releases/download/v1.1.1/age-v1.1.1-linux-amd64.tar.gz
    - tar xzf age-v1.1.1-linux-amd64.tar.gz && install age/age /usr/local/bin/
    - mkdir -p ~/.config/sops/age
    - echo "$SOPS_AGE_KEY" > ~/.config/sops/age/keys.txt
  script:
    - sops decrypt .env.enc > .env
    - npm run deploy
  only:
    - main
```

Store your private age key in GitLab CI/CD Variables as `SOPS_AGE_KEY`.

### Terraform Integration

```hcl
# main.tf
terraform {
  required_providers {
    sops = {
      source  = "carlpett/sops"
      version = "~> 1.0"
    }
  }
}

provider "sops" {}

# Load encrypted secrets
data "sops_file" "secrets" {
  source_file = "secrets/terraform.enc.json"
}

# Use secrets in resources
resource "aws_db_instance" "main" {
  username = data.sops_file.secrets.data["db_username"]
  password = data.sops_file.secrets.data["db_password"]
  # ... other config
}

output "db_host" {
  value     = aws_db_instance.main.endpoint
  sensitive = true
}
```

---

## Troubleshooting

### Problem: "no key could be found to decrypt the data key"

**Cause**: Your age key doesn't match any recipient in the encrypted file.

**Solution**:
```bash
# Check which keys can decrypt this file
sops --decrypt .env.enc 2>&1 | grep "Recovery failed"

# Verify your public key
grep "public key:" ~/.config/sops/age/keys.txt

# Ask maintainer to add your key and re-encrypt
```

### Problem: "failed to get the data key required to decrypt the SOPS file"

**Cause**: The file was encrypted but you don't have access.

**Solution**:
```bash
# Make sure SOPS can find your key
export SOPS_AGE_KEY_FILE=~/.config/sops/age/keys.txt

# Or set it permanently
echo 'export SOPS_AGE_KEY_FILE=~/.config/sops/age/keys.txt' >> ~/.bashrc
```

### Problem: Encryption is slow

**Cause**: Large files or many recipients.

**Solution**:
```bash
# Encrypt only specific fields instead of entire file
# In .sops.yaml:
creation_rules:
  - path_regex: large-file\.yaml$
    encrypted_regex: '^(password|secret|key|token)$'
    age: your_key
```

### Problem: Git shows encrypted file as changed but nothing changed

**Cause**: SOPS metadata updates (timestamps, etc.).

**Solution**:
```bash
# Check actual content diff
git diff --word-diff .env.enc

# If only metadata changed, you can:
# Option 1: Commit it (safe, just metadata)
# Option 2: Discard if no real changes
git checkout -- .env.enc
```

### Problem: Editor shows garbage when opening encrypted file

**Cause**: Opened encrypted file directly instead of using SOPS.

**Solution**:
```bash
# Always use SOPS to edit
sops .env.enc

# Set EDITOR if needed
export EDITOR=vim  # or nano, code, etc.
sops .env.enc
```

### Problem: Team member can't decrypt after being added

**Checklist**:
```bash
# 1. Verify they're in .sops.yaml
cat .sops.yaml

# 2. Verify secrets were re-encrypted
git log --oneline | grep -i "re-encrypt"

# 3. Verify they pulled latest
git pull

# 4. Verify their key file location
ls -la ~/.config/sops/age/keys.txt

# 5. Try explicit key file path
SOPS_AGE_KEY_FILE=~/.config/sops/age/keys.txt sops decrypt .env.enc
```

---

## Migration Guide

### From Plaintext .env Files

```bash
# 1. Backup current .env
cp .env .env.backup

# 2. Encrypt
sops encrypt .env > .env.enc

# 3. Update .gitignore
echo ".env" >> .gitignore
echo ".env.backup" >> .gitignore

# 4. Remove plaintext from git history (optional but recommended)
git rm --cached .env
git commit -m "Remove plaintext .env file"

# 5. Add encrypted version
git add .env.enc
git commit -m "Add encrypted .env file"
```

### From git-crypt

```bash
# 1. Unlock git-crypt repo
git-crypt unlock

# 2. Files are now plaintext in working directory
# Encrypt each with SOPS
find . -name "*.secret" | while read file; do
  output="${file}.enc"
  sops encrypt "$file" > "$output"
  echo "Encrypted $file -> $output"
done

# 3. Update .gitattributes to remove git-crypt filters
# Remove lines like: *.secret filter=git-crypt diff=git-crypt

# 4. Commit SOPS versions
git add .
git commit -m "Migrate from git-crypt to SOPS"
```

### From AWS Secrets Manager / Vault

```bash
# 1. Export secrets from AWS/Vault
# Example for AWS:
aws secretsmanager get-secret-value \
  --secret-id my-app/prod \
  --query SecretString \
  --output text > secrets.json

# 2. Encrypt with SOPS
sops encrypt secrets.json > secrets.enc.json

# 3. Clean up plaintext
shred -u secrets.json  # Secure delete

# 4. Commit
git add secrets.enc.json
git commit -m "Migrate secrets from AWS to SOPS"
```

---

## Security Considerations

### What SOPS Does NOT Protect

- **File names**: Use generic names or store in a `secrets/` directory
- **Commit messages**: Don't include secret values
- **Git history**: Removed team members can still access old commits
- **File metadata**: File size and structure are visible

### What You Should Do

1. **Rotate secrets** when team members leave
2. **Use separate keys** for different environments
3. **Audit access** regularly
4. **Backup your keys** securely
5. **Review changes** to encrypted files before committing

### Threat Model

SOPS + age protects against:
- ✅ Secrets leaked in public repositories
- ✅ Unauthorized access to private repositories
- ✅ Accidental exposure in logs/backups
- ✅ Shared credentials (everyone has their own key)

SOPS + age does NOT protect against:
- ❌ Compromised developer machines with valid keys
- ❌ Malicious team members with legitimate access
- ❌ Physical access to unlocked computers
- ❌ Secrets in application memory at runtime

---

## Additional Resources

- [SOPS GitHub Repository](https://github.com/getsops/sops)
- [age GitHub Repository](https://github.com/FiloSottile/age)
- [SOPS Official Documentation](https://getsops.io/docs/)
- [age Specification](https://age-encryption.org/)

---

## Quick Reference

### Essential Commands

```bash
# Encrypt
sops encrypt file.yaml > file.enc.yaml

# Decrypt
sops decrypt file.enc.yaml

# Edit
sops file.enc.yaml

# Update recipients
sops updatekeys file.enc.yaml

# Execute with decrypted env
sops exec-env .env.enc 'your-command'

# Execute with decrypted file
sops exec-file .env.enc 'command-with-file {}'
```

### File Naming Conventions

- `.env.enc` - Encrypted environment files
- `secrets/*.enc.yaml` - Encrypted YAML configs
- `secrets/*.enc.json` - Encrypted JSON configs
- `team-keys.txt` - Team public keys (safe to commit)

---

## Support

For issues specific to this setup:
1. Check [Troubleshooting](#troubleshooting) section
2. Review [SOPS documentation](https://getsops.io/docs/)
3. Open an issue in your team's repository

For SOPS/age bugs:
- SOPS: https://github.com/getsops/sops/issues
- age: https://github.com/FiloSottile/age/issues

---

**License**: This documentation is provided as-is for use with SOPS and age.