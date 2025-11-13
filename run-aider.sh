#!/bin/bash
export OPENAI_API_KEY=${OPENAI_API_KEY:-$(grep "^OPENAI_API_KEY" .env 2>/dev/null | cut -d'=' -f2)}
aider --model gpt-4o --yes "$@"
