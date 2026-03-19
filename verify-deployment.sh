#!/bin/bash

# Verification script for uwu-regression-testing-plugin deployment
set -e

SERVER="149.28.143.214"
USER="root"
REMOTE_DIR="/root/uwu-my-opencode"
PLUGIN_NAME="uwu-regression-testing-plugin"
PLUGIN_REMOTE_DIR="$REMOTE_DIR/plugins/$PLUGIN_NAME"

# Get password from environment variable or prompt
if [ -z "$UWU_SERVER_PASSWORD" ]; then
    echo "🔐 Enter server password for $USER@$SERVER:"
    read -s PASSWORD
    echo
else
    PASSWORD="$UWU_SERVER_PASSWORD"
fi

echo "🔍 Verifying $PLUGIN_NAME deployment on server..."

run_remote() {
    sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no "$USER@$SERVER" "$1"
}

echo ""
echo "1. 📋 Checking plugin installation..."
if run_remote "[ -d '$PLUGIN_REMOTE_DIR' ] && echo '✅ Plugin directory exists' || echo '❌ Plugin directory missing'"; then
    echo "   Directory check passed"
else
    echo "   Directory check failed"
fi

echo ""
echo "2. 📋 Checking plugin build..."
if run_remote "[ -f '$PLUGIN_REMOTE_DIR/dist/index.js' ] && echo '✅ Plugin built successfully' || echo '❌ Plugin not built'"; then
    echo "   Build check passed"
else
    echo "   Build check failed"
fi

echo ""
echo "3. 📋 Checking .opencode configuration..."
if run_remote "[ -f '$REMOTE_DIR/plugin-injection/opencode-with-regression-testing.json' ] && echo '✅ .opencode configuration exists' || echo '❌ .opencode configuration missing'"; then
    echo "   Configuration check passed"
else
    echo "   Configuration check failed"
fi

echo ""
echo "4. 📋 Checking test workspace..."
if run_remote "[ -d '$REMOTE_DIR/workspaces/regression-testing' ] && echo '✅ Test workspace exists' || echo '❌ Test workspace missing'"; then
    echo "   Workspace check passed"
else
    echo "   Workspace check failed"
fi

echo ""
echo "5. 📋 Checking test workspace .opencode file..."
if run_remote "[ -f '$REMOTE_DIR/workspaces/regression-testing/.opencode' ] && echo '✅ Test workspace .opencode exists' || echo '❌ Test workspace .opencode missing'"; then
    if run_remote "grep -q '$PLUGIN_NAME' '$REMOTE_DIR/workspaces/regression-testing/.opencode' && echo '✅ Plugin configured in .opencode' || echo '❌ Plugin not in .opencode'"; then
        echo "   .opencode check passed"
    else
        echo "   .opencode check failed"
    fi
else
    echo "   .opencode file missing"
fi

echo ""
echo "6. 📋 Checking test script..."
if run_remote "[ -f '$REMOTE_DIR/test-regression-plugin.sh' ] && echo '✅ Test script exists' || echo '❌ Test script missing'"; then
    if run_remote "[ -x '$REMOTE_DIR/test-regression-plugin.sh' ] && echo '✅ Test script is executable' || echo '❌ Test script not executable'"; then
        echo "   Test script check passed"
    else
        echo "   Test script check failed"
    fi
else
    echo "   Test script missing"
fi

echo ""
echo "✅ Verification complete!"
echo ""
echo "🔧 To run the test script on server:"
echo "   ssh $USER@$SERVER"
echo "   $REMOTE_DIR/test-regression-plugin.sh"
echo ""
echo "🌐 To access the workspace:"
echo "   https://code.vidwadeseram.com/"