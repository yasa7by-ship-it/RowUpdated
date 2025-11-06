#!/bin/bash
# Start API Server Script for Linux/Mac

echo "🚀 Starting ROWDB API Server..."
echo ""

cd api-server

if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found!"
    echo "   Please create .env file from env.example"
    echo ""
fi

if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

echo "🚀 Starting server on http://localhost:3001"
echo ""
npm start





