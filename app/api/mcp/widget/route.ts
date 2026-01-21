import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const widgetPath = path.join(process.cwd(), 'public', 'mcp-widget');
    
    let widgetJS = '';
    let widgetCSS = '';
    
    const jsPath = path.join(widgetPath, 'widget.js');
    const cssPath = path.join(widgetPath, 'widget.css');
    
    if (fs.existsSync(jsPath)) {
      widgetJS = fs.readFileSync(jsPath, 'utf-8');
    }
    
    if (fs.existsSync(cssPath)) {
      widgetCSS = fs.readFileSync(cssPath, 'utf-8');
    }

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${widgetCSS}</style>
</head>
<body>
  <div id="root"></div>
  <script type="module">${widgetJS}</script>
</body>
</html>
    `.trim();

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html+skybridge',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Error serving widget:', error);
    return NextResponse.json(
      { error: 'Failed to load widget' },
      { status: 500 }
    );
  }
}
