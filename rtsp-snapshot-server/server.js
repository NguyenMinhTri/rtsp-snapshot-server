const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS - allow all origins for camera viewing
app.use(cors());

// Snapshot cache directory
const SNAPSHOT_DIR = path.join(__dirname, 'snapshots');
if (!fs.existsSync(SNAPSHOT_DIR)) {
    fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
}

// Camera snapshot cache
// Key: camera URL hash, Value: { path, timestamp, capturing }
const cameraCache = new Map();

// Config
const SNAPSHOT_INTERVAL_MS = 10000; // 10 seconds
const SNAPSHOT_TIMEOUT_MS = 8000;   // 8 seconds max for ffmpeg
const MAX_CACHE_AGE_MS = 30000;     // 30 seconds before forced refresh

/**
 * Generate a simple hash for camera URL (for filename)
 */
function hashUrl(url) {
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
        const char = url.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
}

/**
 * Capture snapshot from RTSP using ffmpeg
 * Returns Promise<string> with snapshot file path
 */
function captureSnapshot(rtspUrl, outputPath) {
    return new Promise((resolve, reject) => {
        const args = [
            '-y',                           // Overwrite output
            '-rtsp_transport', 'tcp',       // Use TCP for stability
            '-i', rtspUrl,                  // Input RTSP URL
            '-frames:v', '1',               // Capture 1 frame only
            '-q:v', '3',                    // Quality (2-5, lower = better)
            '-f', 'image2',                 // Output format
            outputPath                      // Output file
        ];

        const ffmpeg = spawn('ffmpeg', args, {
            timeout: SNAPSHOT_TIMEOUT_MS
        });

        let stderr = '';

        ffmpeg.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        ffmpeg.on('close', (code) => {
            if (code === 0 && fs.existsSync(outputPath)) {
                resolve(outputPath);
            } else {
                reject(new Error(`FFmpeg failed with code ${code}: ${stderr.slice(-200)}`));
            }
        });

        ffmpeg.on('error', (err) => {
            reject(err);
        });

        // Timeout failsafe
        setTimeout(() => {
            ffmpeg.kill('SIGKILL');
            reject(new Error('FFmpeg timeout'));
        }, SNAPSHOT_TIMEOUT_MS);
    });
}

/**
 * Get or create snapshot for a camera
 * Implements caching and sharing across multiple clients
 */
async function getSnapshot(rtspUrl) {
    const urlHash = hashUrl(rtspUrl);
    const snapshotPath = path.join(SNAPSHOT_DIR, `${urlHash}.jpg`);

    let cacheEntry = cameraCache.get(urlHash);
    const now = Date.now();

    // Check if we have a valid cached snapshot
    if (cacheEntry) {
        const age = now - cacheEntry.timestamp;

        // If fresh enough, return cached
        if (age < SNAPSHOT_INTERVAL_MS && fs.existsSync(cacheEntry.path)) {
            return {
                path: cacheEntry.path,
                age: age,
                nextRefresh: SNAPSHOT_INTERVAL_MS - age
            };
        }

        // If capture is in progress, wait and return existing
        if (cacheEntry.capturing) {
            if (fs.existsSync(cacheEntry.path)) {
                return {
                    path: cacheEntry.path,
                    age: age,
                    nextRefresh: SNAPSHOT_INTERVAL_MS - (age % SNAPSHOT_INTERVAL_MS)
                };
            }
            // Wait a bit for capture to complete
            await new Promise(resolve => setTimeout(resolve, 500));
            return getSnapshot(rtspUrl); // Retry
        }
    }

    // Need to capture new snapshot
    cameraCache.set(urlHash, {
        path: snapshotPath,
        timestamp: cacheEntry?.timestamp || 0,
        capturing: true
    });

    try {
        await captureSnapshot(rtspUrl, snapshotPath);

        cameraCache.set(urlHash, {
            path: snapshotPath,
            timestamp: Date.now(),
            capturing: false
        });

        return {
            path: snapshotPath,
            age: 0,
            nextRefresh: SNAPSHOT_INTERVAL_MS
        };
    } catch (error) {
        console.error(`Snapshot error for ${rtspUrl.substring(0, 50)}...:`, error.message);

        cameraCache.set(urlHash, {
            path: snapshotPath,
            timestamp: cacheEntry?.timestamp || 0,
            capturing: false
        });

        // If we have old snapshot, return it
        if (cacheEntry && fs.existsSync(cacheEntry.path)) {
            return {
                path: cacheEntry.path,
                age: now - cacheEntry.timestamp,
                nextRefresh: SNAPSHOT_INTERVAL_MS,
                stale: true
            };
        }

        throw error;
    }
}

/**
 * Decode special characters in RTSP URL
 * Some URLs have special chars encoded as words to pass through query strings
 */
function decodeRtspUrl(url) {
    return url
        .replaceAll("question", "?")
        .replaceAll("equal", "=")
        .replaceAll("ampersand", "&");
}

// ============ API Routes ============

/**
 * GET /snapshot
 * Query params:
 *   - url: RTSP URL (required)
 * Returns: JPEG image with cache headers
 */
app.get('/snapshot', async (req, res) => {
    let rtspUrl = req.query.url;

    if (!rtspUrl) {
        return res.status(400).json({ error: 'Missing url parameter' });
    }

    // Decode special characters
    rtspUrl = decodeRtspUrl(rtspUrl);

    try {
        const result = await getSnapshot(rtspUrl);

        // Set cache headers
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('X-Snapshot-Age', result.age);
        res.setHeader('X-Next-Refresh', result.nextRefresh);
        if (result.stale) {
            res.setHeader('X-Snapshot-Stale', 'true');
        }

        // Stream the file
        const stream = fs.createReadStream(result.path);
        stream.pipe(res);
    } catch (error) {
        console.error('Snapshot API error:', error.message);
        res.status(500).json({
            error: 'Failed to capture snapshot',
            message: error.message
        });
    }
});

/**
 * GET /info
 * Query params:
 *   - url: RTSP URL (required)
 * Returns: JSON with snapshot info (age, next refresh)
 */
app.get('/info', async (req, res) => {
    const rtspUrl = req.query.url;

    if (!rtspUrl) {
        return res.status(400).json({ error: 'Missing url parameter' });
    }

    const urlHash = hashUrl(rtspUrl);
    const cacheEntry = cameraCache.get(urlHash);

    if (cacheEntry && fs.existsSync(cacheEntry.path)) {
        const age = Date.now() - cacheEntry.timestamp;
        res.json({
            cached: true,
            age: age,
            nextRefresh: Math.max(0, SNAPSHOT_INTERVAL_MS - age),
            interval: SNAPSHOT_INTERVAL_MS
        });
    } else {
        res.json({
            cached: false,
            nextRefresh: 0,
            interval: SNAPSHOT_INTERVAL_MS
        });
    }
});

/**
 * GET /health
 * Health check for Render.com
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        cameras: cameraCache.size
    });
});

/**
 * GET /
 * Root endpoint with API info
 */
app.get('/', (req, res) => {
    res.json({
        name: 'RTSP Snapshot Server',
        version: '1.0.0',
        endpoints: {
            '/snapshot?url=RTSP_URL': 'Get JPEG snapshot',
            '/info?url=RTSP_URL': 'Get snapshot info',
            '/health': 'Health check'
        },
        config: {
            interval: `${SNAPSHOT_INTERVAL_MS / 1000}s`,
            timeout: `${SNAPSHOT_TIMEOUT_MS / 1000}s`
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 RTSP Snapshot Server running on port ${PORT}`);
    console.log(`📸 Snapshot interval: ${SNAPSHOT_INTERVAL_MS / 1000}s`);
});
