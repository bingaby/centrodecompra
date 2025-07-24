{
  "hosting": {
    "public": "dist",
    "cleanUrls": true,
    "trailingSlash": false,
    "rewrites": [
      {
        "source": "/favicon.ico",
        "destination": "/logos/favicon-32x32.png"
      }
    ],
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ]
  }
}
