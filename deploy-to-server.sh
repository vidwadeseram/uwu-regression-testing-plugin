#!/bin/bash

# Deploy uwu-regression-testing-plugin to uwu-my-opencode server
set -e

SERVER="149.28.143.214"
USER="root"
REMOTE_DIR="/root/uwu-my-opencode"
PLUGIN_NAME="uwu-regression-testing-plugin"
PLUGIN_SOURCE_DIR="$(pwd)"
PLUGIN_REMOTE_DIR="$REMOTE_DIR/plugins/$PLUGIN_NAME"

# Get password from environment variable or prompt
if [ -z "$UWU_SERVER_PASSWORD" ]; then
    echo "🔐 Enter server password for $USER@$SERVER:"
    read -s PASSWORD
    echo
else
    PASSWORD="$UWU_SERVER_PASSWORD"
fi

echo "🚀 Deploying $PLUGIN_NAME to server..."

run_remote() {
    sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no "$USER@$SERVER" "$1"
}

# Step 1: Create plugin directory on server
echo "📦 Step 1: Creating plugin directory on server..."
run_remote "mkdir -p $PLUGIN_REMOTE_DIR"

# Step 2: Copy plugin files to server
echo "📦 Step 2: Copying plugin files to server..."
# Create tar archive of plugin
tar -czf /tmp/$PLUGIN_NAME.tar.gz \
  --exclude='node_modules' \
  --exclude='dist' \
  --exclude='.git' \
  --exclude='.github' \
  .

# Upload to server
sshpass -p "$PASSWORD" scp -o StrictHostKeyChecking=no \
  /tmp/$PLUGIN_NAME.tar.gz \
  "$USER@$SERVER:/tmp/$PLUGIN_NAME.tar.gz"

# Extract on server
run_remote "tar -xzf /tmp/$PLUGIN_NAME.tar.gz -C $PLUGIN_REMOTE_DIR --strip-components=1"
run_remote "rm /tmp/$PLUGIN_NAME.tar.gz"

# Step 3: Install dependencies and build plugin
echo "📦 Step 3: Installing dependencies and building plugin..."
run_remote "cd $PLUGIN_REMOTE_DIR && bun install && bun run build"

# Step 4: Create plugin-injection directory and update .opencode configuration
echo "📦 Step 4: Creating plugin injection configuration..."
run_remote "mkdir -p $REMOTE_DIR/plugin-injection"
run_remote "cat > $REMOTE_DIR/plugin-injection/opencode-with-regression-testing.json << 'EOF'
{
  \"plugin\": [
    \"oh-my-opencode\",
    {
      \"name\": \"external-plugin-loader\",
      \"config\": {
        \"enabled\": true,
        \"autoInstall\": true,
        \"autoUpdate\": false,
        \"pluginDir\": \"plugins\",
        \"plugins\": [
          {
            \"type\": \"local\",
            \"source\": \"$PLUGIN_REMOTE_DIR\",
            \"enabled\": true,
            \"name\": \"$PLUGIN_NAME\"
          }
        ]
      }
    }
  ],
  \"agents\": {
    \"sisyphus\": {
      \"model\": \"claude-3-5-sonnet-20241022\",
      \"temperature\": 0.7
    }
  },
  \"categories\": {
    \"visual-engineering\": {
      \"model\": \"gpt-4o\",
      \"temperature\": 0.3
    }
  }
}
EOF"

# Step 5: Update existing workspaces
echo "📦 Step 5: Updating existing workspaces..."
run_remote "for workspace in $REMOTE_DIR/workspaces/*/; do
  if [ -d \"\$workspace\" ]; then
    cp $REMOTE_DIR/plugin-injection/opencode-with-regression-testing.json \"\$workspace/.opencode\"
    echo \"Updated: \$workspace\"
  fi
done"

# Step 6: Create test workspace
echo "📦 Step 6: Creating test workspace..."
run_remote "mkdir -p $REMOTE_DIR/workspaces/regression-testing"
run_remote "cp $REMOTE_DIR/plugin-injection/opencode-with-regression-testing.json $REMOTE_DIR/workspaces/regression-testing/.opencode"

# Step 7: Create test script
echo "📦 Step 7: Creating test script..."
run_remote "cat > $REMOTE_DIR/test-regression-plugin.sh << 'EOF'
#!/bin/bash
echo \"Testing regression testing plugin...\"
cd $REMOTE_DIR/workspaces/regression-testing

# Check if plugin is loaded
echo \"Checking plugin installation...\"
if [ -d \"$PLUGIN_REMOTE_DIR\" ]; then
    echo \"✅ Plugin directory exists\"
    if [ -f \"$PLUGIN_REMOTE_DIR/dist/index.js\" ]; then
        echo \"✅ Plugin built successfully\"
    else
        echo \"❌ Plugin not built\"
    fi
else
    echo \"❌ Plugin directory missing\"
fi

# Check .opencode file
if [ -f .opencode ]; then
    echo \"✅ .opencode file exists\"
    if grep -q \"$PLUGIN_NAME\" .opencode; then
        echo \"✅ Plugin configured in .opencode\"
    else
        echo \"❌ Plugin not in .opencode\"
    fi
else
    echo \"❌ .opencode file missing\"
fi

echo \"Test complete!\"
EOF"

run_remote "chmod +x $REMOTE_DIR/test-regression-plugin.sh"

echo "✅ Deployment complete!"
echo ""
echo "🔧 To test:"
echo "1. SSH to server: ssh root@149.28.143.214"
echo "2. Run test: $REMOTE_DIR/test-regression-plugin.sh"
echo "3. Access workspace: https://code.vidwadeseram.com/"
echo ""
echo "📁 Plugin location: $PLUGIN_REMOTE_DIR"
echo "📁 Test workspace: $REMOTE_DIR/workspaces/regression-testing/"
echo ""
echo "🔄 To restart uwu-daemon for changes to take effect:"
echo "   systemctl restart uwu-daemon@root"