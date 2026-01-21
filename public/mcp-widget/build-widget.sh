#!/bin/bash

# Build script to copy widget files from chatgpt-widget to public/mcp-widget

WIDGET_SRC="../../../chatgpt-widget/dist"
WIDGET_DEST="."

if [ ! -d "$WIDGET_SRC" ]; then
  echo "Widget source not found. Building widget first..."
  cd ../../../chatgpt-widget
  npm run build
  cd -
fi

if [ -f "$WIDGET_SRC/widget.js" ]; then
  cp "$WIDGET_SRC/widget.js" "$WIDGET_DEST/"
  echo "Copied widget.js"
fi

if [ -f "$WIDGET_SRC/widget.css" ]; then
  cp "$WIDGET_SRC/widget.css" "$WIDGET_DEST/"
  echo "Copied widget.css"
fi

echo "Widget files copied to public/mcp-widget/"
