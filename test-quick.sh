#!/bin/bash
# Quick test script - run and exit after 2 seconds

timeout 2s npx tsx src/cli.ts docs/answers.md 2>&1 || true
