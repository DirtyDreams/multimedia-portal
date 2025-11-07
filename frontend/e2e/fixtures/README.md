# Test Fixtures

This directory contains test fixtures for E2E tests.

## Required Files

For gallery upload tests to work, you need to provide test media files:

- `test-image.jpg` - Test image file (800x600 or similar, any image format)
- `test-document.pdf` - Test PDF document (optional)
- `test-video.mp4` - Test video file (optional)

## Creating Test Image

You can create a test image using ImageMagick:

```bash
convert -size 800x600 xc:blue -pointsize 48 -fill white -gravity center -annotate +0+0 "Test Image" test-image.jpg
```

Or simply copy any image file you have:

```bash
cp /path/to/your/image.jpg test-image.jpg
```

## Note

Tests that require these files will be skipped automatically if they don't exist.
