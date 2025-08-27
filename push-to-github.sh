#!/bin/bash

# Script to push ZheroHero to GitHub
# Run this script after creating the repository on GitHub

echo "🚀 Pushing ZheroHero to GitHub..."
echo ""

# Add remote
echo "Adding GitHub remote..."
git remote add origin https://github.com/federicocesconi/zherohero-ai.git

# Push to main branch
echo "Pushing commits to main branch..."
git push -u origin main

echo ""
echo "✅ Successfully pushed to GitHub!"
echo "🌐 Repository: https://github.com/federicocesconi/zherohero-ai"
echo ""
echo "📊 Pushed:"
echo "  - 3 commits"
echo "  - 76 files"
echo "  - Complete Next.js application"
echo "  - Working production build"